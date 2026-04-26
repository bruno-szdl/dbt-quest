import type { ParsedCommand, SelectorGroup, SelectorTerm } from './commandParser'
import { materializeModels, plan, previewModel, type ModelOutcome } from './executor'
import { parseTests, runTests, type TestOutcome } from './tests'
import { type CompiledModel, getFileStem } from './compiler'
import { registerCsv } from './duckdb'
import { collectSnapshots, runSnapshot, type SnapshotOutcome } from './snapshots'
import { errorMessage } from './errors'

export interface TerminalLine {
  text: string
  color?: 'green' | 'red' | 'yellow' | 'gray'
}

export interface RunnerState {
  files: Record<string, string>
  ranModels: Set<string>
  shownModels: Set<string>
  testResults: Record<string, 'pass' | 'fail' | 'untested'>
  modelColumns: Record<string, string[]>
  loadedSeeds: Set<string>
  buildSucceeded: boolean
  snapshotRunCounts: Record<string, number>
  snapshotClosedRows: Record<string, number>
}

export interface ExecutionResult {
  lines: TerminalLine[]
  updatedState: Partial<RunnerState>
}

// ── selector resolution ───────────────────────────────────────────────────────

function buildDownstream(models: CompiledModel[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const m of models) {
    for (const r of m.refs) {
      if (!map.has(r)) map.set(r, new Set())
      map.get(r)!.add(m.name)
    }
  }
  return map
}

function expandUpstream(name: string, byName: Map<string, CompiledModel>, out: Set<string>): void {
  for (const r of byName.get(name)?.refs ?? [])
    if (!out.has(r)) { out.add(r); expandUpstream(r, byName, out) }
}

function expandDownstream(name: string, downstream: Map<string, Set<string>>, out: Set<string>): void {
  for (const d of downstream.get(name) ?? [])
    if (!out.has(d)) { out.add(d); expandDownstream(d, downstream, out) }
}

function resolveTerm(term: SelectorTerm, models: CompiledModel[]): Set<string> {
  switch (term.method) {
    case 'fqn':
      return new Set(models.filter(m => m.name === term.value).map(m => m.name))
    case 'tag':
      return new Set(models.filter(m => m.tags.includes(term.value)).map(m => m.name))
    case 'path': {
      const prefix = term.value.endsWith('/') ? term.value : `${term.value}/`
      return new Set(models.filter(m => m.path === term.value || m.path.startsWith(prefix)).map(m => m.name))
    }
  }
}

function expandGraphOps(
  base: Set<string>,
  term: SelectorTerm,
  byName: Map<string, CompiledModel>,
  downstream: Map<string, Set<string>>,
): Set<string> {
  if (!term.upstream && !term.downstream) return base
  const out = new Set(base)
  for (const name of base) {
    if (term.upstream) expandUpstream(name, byName, out)
    if (term.downstream) expandDownstream(name, downstream, out)
  }
  return out
}

function resolveGroup(
  group: SelectorGroup,
  models: CompiledModel[],
  byName: Map<string, CompiledModel>,
  downstream: Map<string, Set<string>>,
): Set<string> {
  if (group.terms.length === 0) return new Set()
  const sets = group.terms.map(term =>
    expandGraphOps(resolveTerm(term, models), term, byName, downstream)
  )
  // Intersection: keep only names present in every set.
  return sets.reduce((acc, s) => new Set([...acc].filter(x => s.has(x))))
}

function applySelectors(
  sorted: CompiledModel[],
  select: SelectorGroup[],
  exclude: SelectorGroup[],
): CompiledModel[] {
  const byName = new Map(sorted.map(m => [m.name, m]))
  const downstream = buildDownstream(sorted)

  let included: Set<string>
  if (select.length === 0) {
    included = new Set(sorted.map(m => m.name))
  } else {
    included = new Set()
    for (const g of select)
      for (const n of resolveGroup(g, sorted, byName, downstream)) included.add(n)
  }

  for (const g of exclude)
    for (const n of resolveGroup(g, sorted, byName, downstream)) included.delete(n)

  return sorted.filter(m => included.has(m.name))
}

// ── output formatting ────────────────────────────────────────────────────────

function dots(prefix: string, suffix: string, width = 68): string {
  return '.'.repeat(Math.max(3, width - prefix.length - suffix.length))
}

function countUniqueSources(models: CompiledModel[]): number {
  const set = new Set<string>()
  for (const m of models) for (const s of m.sources) set.add(`${s.source}.${s.table}`)
  return set.size
}

function formatModelLine(i: number, total: number, o: ModelOutcome): TerminalLine {
  const mat = o.materialization
  if (o.skipped) {
    const prefix = `${i + 1} of ${total} SKIP inlined ${mat} ${o.name} `
    const suffix = `[SKIP]`
    return { text: `${prefix}${dots(prefix, suffix)} ${suffix}`, color: 'gray' }
  }
  const prefix = `${i + 1} of ${total} ${o.passed ? 'OK' : 'ERROR'} ${o.passed ? `created ${mat}` : 'failed     '} ${o.name} `
  const suffix = `[${o.passed ? `OK in ${o.elapsed.toFixed(2)}s` : 'ERROR'}]`
  return {
    text: `${prefix}${dots(prefix, suffix)} ${suffix}`,
    color: o.passed ? 'green' : 'red',
  }
}

function formatTestLine(i: number, total: number, t: TestOutcome): TerminalLine {
  const label = `${t.kind}_${t.model}_${t.column}`
  const prefix = `${i + 1} of ${total} ${t.passed ? 'PASS' : 'FAIL'} ${label} `
  const suffix = t.passed ? '[PASS]' : `[FAIL — ${t.failingRows} row${t.failingRows !== 1 ? 's' : ''}]`
  return { text: `${prefix}${dots(prefix, suffix)} ${suffix}`, color: t.passed ? 'green' : 'red' }
}

function renderTable(columns: string[], rows: unknown[][]): TerminalLine[] {
  const stringRows = rows.map((r) => r.map((v) => (v === null || v === undefined ? 'NULL' : String(v))))
  const widths = columns.map((c, i) =>
    Math.max(c.length, ...stringRows.map((r) => r[i]?.length ?? 0)),
  )
  const fmt = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i])).join('  ')
  const out: TerminalLine[] = []
  out.push({ text: fmt(columns), color: 'gray' })
  out.push({ text: widths.map((w) => '─'.repeat(w)).join('  '), color: 'gray' })
  for (const r of stringRows) out.push({ text: fmt(r) })
  return out
}

// ── main dispatcher ──────────────────────────────────────────────────────────

export async function execute(
  command: ParsedCommand,
  state: RunnerState,
): Promise<ExecutionResult> {
  const lines: TerminalLine[] = []
  const newRan = new Set(state.ranModels)
  const newTestResults: Record<string, 'pass' | 'fail' | 'untested'> = { ...state.testResults }
  const newColumns: Record<string, string[]> = { ...state.modelColumns }
  const newSeeds = new Set(state.loadedSeeds)

  const { sorted } = plan(state.files)
  const selected = applySelectors(sorted, command.select, command.exclude)

  lines.push({ text: '' })
  lines.push({ text: 'Running with dbt-quest (DuckDB-Wasm)', color: 'gray' })

  if (command.type === 'snapshot') {
    const snapshots = collectSnapshots(state.files)
    const newCounts = { ...state.snapshotRunCounts }
    const newClosed = { ...state.snapshotClosedRows }
    lines.push({
      text: `Found ${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}`,
      color: 'gray',
    })
    lines.push({ text: '' })
    if (snapshots.length === 0) {
      lines.push({ text: 'Nothing to snapshot.', color: 'yellow' })
      lines.push({ text: '' })
      return { lines, updatedState: {} }
    }
    const outcomes: SnapshotOutcome[] = []
    for (const snap of snapshots) {
      const out = await runSnapshot(snap)
      outcomes.push(out)
      if (out.passed) {
        newRan.add(out.name)
        newCounts[out.name] = (newCounts[out.name] ?? 0) + 1
        newClosed[out.name] = (newClosed[out.name] ?? 0) + out.closed
      }
    }
    outcomes.forEach((o, i) => {
      const prefix = `${i + 1} of ${outcomes.length} ${o.passed ? 'OK' : 'ERROR'} snapshot ${o.name} `
      const suffix = o.passed
        ? `[${o.inserted} new, ${o.closed} closed, ${o.elapsed.toFixed(2)}s]`
        : '[ERROR]'
      lines.push({
        text: `${prefix}${dots(prefix, suffix)} ${suffix}`,
        color: o.passed ? 'green' : 'red',
      })
      if (!o.passed && o.error) {
        lines.push({ text: `  Error: ${o.error}`, color: 'red' })
      }
    })
    const okCount = outcomes.filter((o) => o.passed).length
    const failCount = outcomes.length - okCount
    lines.push({ text: '' })
    lines.push({
      text: failCount === 0
        ? `Completed successfully. ${okCount} snapshot${okCount !== 1 ? 's' : ''} captured.`
        : `Done. PASS=${okCount} ERROR=${failCount}`,
      color: failCount === 0 ? 'green' : 'red',
    })
    lines.push({ text: '' })
    return {
      lines,
      updatedState: {
        ranModels: newRan,
        snapshotRunCounts: newCounts,
        snapshotClosedRows: newClosed,
      },
    }
  }

  if (command.type === 'seed') {
    const seedFiles = Object.entries(state.files).filter(
      ([p]) => p.startsWith('seeds/') && p.endsWith('.csv'),
    )
    lines.push({
      text: `Found ${seedFiles.length} seed file${seedFiles.length !== 1 ? 's' : ''}`,
      color: 'gray',
    })
    lines.push({ text: '' })
    if (seedFiles.length === 0) {
      lines.push({ text: 'Nothing to seed.', color: 'yellow' })
      lines.push({ text: '' })
      return { lines, updatedState: {} }
    }
    let okCount = 0
    let failCount = 0
    for (const [path, content] of seedFiles) {
      const name = getFileStem(path, '.csv')
      try {
        await registerCsv(name, content.trim())
        newSeeds.add(name)
        okCount++
        lines.push({ text: `OK loaded seed ${name}`, color: 'green' })
      } catch (e) {
        failCount++
        lines.push({
          text: `ERROR loading ${name}: ${errorMessage(e)}`,
          color: 'red',
        })
      }
    }
    lines.push({ text: '' })
    lines.push({
      text: failCount === 0
        ? `Completed successfully. ${okCount} seed${okCount !== 1 ? 's' : ''} loaded.`
        : `Done. PASS=${okCount} ERROR=${failCount}`,
      color: failCount === 0 ? 'green' : 'red',
    })
    lines.push({ text: '' })
    return { lines, updatedState: { loadedSeeds: newSeeds } }
  }

  if (command.type === 'compile') {
    lines.push({ text: `Found ${selected.length} model${selected.length !== 1 ? 's' : ''}`, color: 'gray' })
    lines.push({ text: '' })
    if (selected.length === 0) {
      lines.push({ text: 'Nothing selected.', color: 'yellow' })
      lines.push({ text: '' })
    } else {
      for (const model of selected) {
        lines.push({ text: `Compiled model: ${model.name}`, color: 'green' })
        lines.push({ text: `  Path: ${model.path}`, color: 'gray' })
        lines.push({ text: '' })
        for (const line of model.sql.split('\n')) lines.push({ text: `  ${line}`, color: 'gray' })
        lines.push({ text: '' })
      }
    }
    return { lines, updatedState: {} }
  }

  if (command.type === 'show') {
    if (selected.length !== 1) {
      lines.push({
        text: 'dbt show requires exactly one --select target, e.g. dbt show --select stg_users',
        color: 'red',
      })
      lines.push({ text: '' })
      return { lines, updatedState: {} }
    }
    const target = selected[0]
    if (!newRan.has(target.name)) {
      lines.push({
        text: `Model "${target.name}" hasn't been run yet. Run 'dbt run' first.`,
        color: 'yellow',
      })
      lines.push({ text: '' })
      return { lines, updatedState: {} }
    }
    try {
      const res = await previewModel(target.name, 20)
      lines.push({ text: `Preview of "${target.name}" (${res.rowCount} row${res.rowCount !== 1 ? 's' : ''}):`, color: 'gray' })
      lines.push({ text: '' })
      if (res.rowCount === 0) {
        lines.push({ text: '(no rows)', color: 'yellow' })
      } else {
        lines.push(...renderTable(res.columns, res.rows))
      }
      lines.push({ text: '' })
    } catch (e) {
      lines.push({ text: errorMessage(e), color: 'red' })
      lines.push({ text: '' })
    }
    return { lines, updatedState: {} }
  }

  const wantRun = command.type === 'run' || command.type === 'build'
  const wantTest = command.type === 'test' || command.type === 'build'
  let runFailed = false
  let testFailed = false

  if (wantRun) {
    const srcCount = countUniqueSources(selected)
    lines.push({
      text: `Found ${selected.length} model${selected.length !== 1 ? 's' : ''}, ${srcCount} source${srcCount !== 1 ? 's' : ''}`,
      color: 'gray',
    })
    lines.push({ text: '' })

    if (selected.length === 0) {
      lines.push({ text: 'Nothing selected.', color: 'yellow' })
      lines.push({ text: '' })
    } else {
      const outcomes = await materializeModels(selected)
      if (outcomes.some((o) => o.materialization === 'incremental')) {
        lines.push({
          text: '(dbt-quest simulates incremental models as full rebuilds.)',
          color: 'gray',
        })
      }
      let totalTime = 0
      outcomes.forEach((o, i) => {
        lines.push(formatModelLine(i, outcomes.length, o))
        if (o.passed && o.materialization === 'incremental' && o.incrementalAppendedRows !== undefined) {
          // Diagnostic: how many rows the user's `is_incremental()` filter would
          // have appended on this run. The table is still full-rebuilt — this is
          // a teaching aid so the WHERE clause feels real.
          const n = o.incrementalAppendedRows
          lines.push({
            text: `  → incremental filter would append ${n} new row${n === 1 ? '' : 's'} (full rebuild applied).`,
            color: 'gray',
          })
        }
        if (o.passed && o.inlinedEphemerals && o.inlinedEphemerals.length) {
          // Surface the CTE inlining so the "ephemeral" wow lands: the model
          // ran with the upstream's SQL embedded as a CTE, no warehouse object.
          const list = o.inlinedEphemerals.map((n) => `"${n}"`).join(', ')
          const word = o.inlinedEphemerals.length === 1 ? 'ephemeral' : 'ephemerals'
          lines.push({
            text: `  → inlined ${word} ${list} as CTE${o.inlinedEphemerals.length === 1 ? '' : 's'} in the compiled SQL.`,
            color: 'gray',
          })
        }
        if (o.passed && !o.skipped) {
          newRan.add(o.name)
          newColumns[o.name] = o.columns
        } else if (!o.passed) {
          lines.push({ text: '', })
          lines.push({ text: `  Compiled SQL:`, color: 'gray' })
          for (const s of o.compiledSql.split('\n')) lines.push({ text: `    ${s}`, color: 'gray' })
          lines.push({ text: `  Error: ${o.error}`, color: 'red' })
        }
        totalTime += o.elapsed
      })
      const passed = outcomes.filter((o) => o.passed).length
      const failed = outcomes.length - passed
      if (failed > 0) runFailed = true
      lines.push({ text: '' })
      lines.push({
        text: `Finished running ${outcomes.length} model${outcomes.length !== 1 ? 's' : ''} in ${totalTime.toFixed(2)}s.`,
        color: 'gray',
      })
      lines.push({
        text: failed === 0 ? 'Completed successfully.' : `Done. PASS=${passed} ERROR=${failed}`,
        color: failed === 0 ? 'green' : 'red',
      })
      lines.push({ text: '' })
    }
  }

  if (wantTest) {
    const modelNames = new Set(selected.map((m) => m.name))
    const tests = parseTests(state.files, modelNames)
    lines.push({
      text: `Found ${tests.length} test${tests.length !== 1 ? 's' : ''}`,
      color: 'gray',
    })
    lines.push({ text: '' })

    if (tests.length === 0) {
      lines.push({ text: 'Nothing to test.', color: 'yellow' })
      lines.push({ text: '' })
    } else {
      const outcomes = await runTests(tests)
      outcomes.forEach((t, i) => {
        lines.push(formatTestLine(i, outcomes.length, t))
        if (t.error) lines.push({ text: `  Error: ${t.error}`, color: 'red' })
      })
      // Aggregate per-model test status: fail if any test fails, else pass.
      for (const t of outcomes) {
        const prev = newTestResults[t.model]
        if (prev === 'fail') continue
        newTestResults[t.model] = t.passed ? 'pass' : 'fail'
      }
      const passed = outcomes.filter((t) => t.passed).length
      const failed = outcomes.length - passed
      if (failed > 0) testFailed = true
      lines.push({ text: '' })
      lines.push({
        text: `Finished running ${outcomes.length} test${outcomes.length !== 1 ? 's' : ''}.`,
        color: 'gray',
      })
      lines.push({
        text: failed === 0 ? 'All tests passed.' : `Done. PASS=${passed} FAIL=${failed}`,
        color: failed === 0 ? 'green' : 'red',
      })
      lines.push({ text: '' })
    }
  }

  const updatedState: Partial<RunnerState> = {
    ranModels: newRan,
    testResults: newTestResults,
    modelColumns: newColumns,
  }
  if (command.type === 'build' && !runFailed && !testFailed) {
    updatedState.buildSucceeded = true
  }
  return { lines, updatedState }
}
