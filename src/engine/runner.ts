import type { ParsedCommand, Selector } from './commandParser'
import { materializeModels, plan, previewModel, type ModelOutcome } from './executor'
import { parseTests, runTests, type TestOutcome } from './tests'
import type { CompiledModel } from './compiler'

export interface TerminalLine {
  text: string
  color?: 'green' | 'red' | 'yellow' | 'gray'
}

export interface RunnerState {
  files: Record<string, string>
  ranModels: Set<string>
  shownModels: Set<string>
  testResults: Record<string, 'pass' | 'fail' | 'untested'>
}

export interface ExecutionResult {
  lines: TerminalLine[]
  updatedState: Partial<RunnerState>
}

// ── selector resolution (operates on compiled models) ────────────────────────

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

function resolveSelector(
  sel: Selector,
  byName: Map<string, CompiledModel>,
  downstream: Map<string, Set<string>>,
): Set<string> {
  const out = new Set<string>()
  if (!byName.has(sel.name)) return out
  out.add(sel.name)
  if (sel.upstream) {
    const walk = (n: string) => {
      for (const r of byName.get(n)?.refs ?? []) {
        if (!out.has(r)) { out.add(r); walk(r) }
      }
    }
    walk(sel.name)
  }
  if (sel.downstream) {
    const walk = (n: string) => {
      for (const d of downstream.get(n) ?? []) {
        if (!out.has(d)) { out.add(d); walk(d) }
      }
    }
    walk(sel.name)
  }
  return out
}

function applySelectors(
  sorted: CompiledModel[],
  select: Selector[],
  exclude: Selector[],
): CompiledModel[] {
  const byName = new Map(sorted.map((m) => [m.name, m]))
  const downstream = buildDownstream(sorted)
  let selected: Set<string>
  if (select.length === 0) selected = new Set(sorted.map((m) => m.name))
  else {
    selected = new Set()
    for (const s of select) for (const n of resolveSelector(s, byName, downstream)) selected.add(n)
  }
  for (const s of exclude) for (const n of resolveSelector(s, byName, downstream)) selected.delete(n)
  return sorted.filter((m) => selected.has(m.name))
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

  const { sorted } = plan(state.files)
  const selected = applySelectors(sorted, command.select, command.exclude)

  lines.push({ text: '' })
  lines.push({ text: 'Running with dbt-quest (DuckDB-Wasm)', color: 'gray' })

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
      lines.push({ text: e instanceof Error ? e.message : String(e), color: 'red' })
      lines.push({ text: '' })
    }
    return { lines, updatedState: {} }
  }

  const wantRun = command.type === 'run' || command.type === 'build'
  const wantTest = command.type === 'test' || command.type === 'build'

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
      let totalTime = 0
      outcomes.forEach((o, i) => {
        lines.push(formatModelLine(i, outcomes.length, o))
        if (o.passed) {
          newRan.add(o.name)
        } else {
          lines.push({ text: '', })
          lines.push({ text: `  Compiled SQL:`, color: 'gray' })
          for (const s of o.compiledSql.split('\n')) lines.push({ text: `    ${s}`, color: 'gray' })
          lines.push({ text: `  Error: ${o.error}`, color: 'red' })
        }
        totalTime += o.elapsed
      })
      const passed = outcomes.filter((o) => o.passed).length
      const failed = outcomes.length - passed
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

  return {
    lines,
    updatedState: { ranModels: newRan, testResults: newTestResults },
  }
}
