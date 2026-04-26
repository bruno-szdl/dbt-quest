import { runQuery } from './duckdb'
import { errorMessage } from './errors'

export type TestKind = 'not_null' | 'unique' | 'accepted_values' | 'relationships'

export interface TestDef {
  id: string
  kind: TestKind
  model: string
  column: string
  /** For accepted_values: the list of allowed string values. */
  values?: string[]
  /** For relationships: the target model name (the result of `ref(...)`). */
  to?: string
  /** For relationships: the column to look up in the target model. */
  field?: string
}

export interface TestOutcome extends TestDef {
  passed: boolean
  failingRows: number
  error?: string
}

/**
 * Parse `schema.yml` style test declarations. Supports the four most-used
 * generic tests: `not_null`, `unique`, `accepted_values`, and `relationships`.
 *
 * The parser is hand-rolled so it can stay in sync with the existing
 * indent-based YAML conventions used elsewhere in the engine. It tracks state
 * for multi-line test configs (accepted_values / relationships).
 */
export function parseTests(files: Record<string, string>, modelNames: Set<string>): TestDef[] {
  const tests: TestDef[] = []

  for (const [path, content] of Object.entries(files)) {
    if (!path.startsWith('models/')) continue
    if (!path.endsWith('.yml') && !path.endsWith('.yaml')) continue

    let inModels = false
    let modelName = ''
    let columnName = ''
    let modelIndent = -1
    let columnIndent = -1

    // State for a pending multi-line test config.
    type Pending = { kind: 'accepted_values' | 'relationships'; indent: number; partial: TestDef }
    let pending: Pending | null = null
    const flushPending = () => {
      if (!pending) return
      // Only emit if we collected the required params.
      if (pending.kind === 'accepted_values' && pending.partial.values?.length) {
        tests.push(pending.partial)
      } else if (pending.kind === 'relationships' && pending.partial.to && pending.partial.field) {
        tests.push(pending.partial)
      }
      pending = null
    }

    for (const raw of content.split('\n')) {
      const s = raw.trimStart()
      if (!s || s.startsWith('#')) continue
      const indent = raw.length - s.length

      if (indent === 0) {
        flushPending()
        inModels = s.startsWith('models:')
        modelName = ''
        columnName = ''
        modelIndent = -1
        columnIndent = -1
        continue
      }
      if (!inModels) continue

      // Close out a pending multi-line test once we leave its indent block.
      if (pending && indent <= pending.indent) flushPending()

      const nameMatch = s.match(/^- name:\s+(\S+)/)
      if (nameMatch) {
        flushPending()
        if (modelIndent === -1 || indent <= modelIndent) {
          modelName = modelNames.has(nameMatch[1]) ? nameMatch[1] : ''
          columnName = ''
          modelIndent = indent
          columnIndent = -1
        } else if (modelName) {
          columnName = nameMatch[1]
          columnIndent = indent
        }
        continue
      }

      const inColumnTests =
        modelName && columnName && columnIndent !== -1 && indent > columnIndent

      // Single-line tests: `- not_null` / `- unique`.
      if (inColumnTests) {
        const simple = s.match(/^- (not_null|unique)\b/)
        if (simple) {
          flushPending()
          tests.push({
            id: `${simple[1]}_${modelName}_${columnName}`,
            kind: simple[1] as TestKind,
            model: modelName,
            column: columnName,
          })
          continue
        }

        // Start of a multi-line `accepted_values:` block.
        const av = s.match(/^- accepted_values:\s*$/)
        if (av) {
          flushPending()
          pending = {
            kind: 'accepted_values',
            indent,
            partial: {
              id: `accepted_values_${modelName}_${columnName}`,
              kind: 'accepted_values',
              model: modelName,
              column: columnName,
              values: [],
            },
          }
          continue
        }

        // Start of a multi-line `relationships:` block.
        const rel = s.match(/^- relationships:\s*$/)
        if (rel) {
          flushPending()
          pending = {
            kind: 'relationships',
            indent,
            partial: {
              id: `relationships_${modelName}_${columnName}`,
              kind: 'relationships',
              model: modelName,
              column: columnName,
            },
          }
          continue
        }
      }

      // Inside an open multi-line test, harvest its parameters.
      if (pending && indent > pending.indent) {
        if (pending.kind === 'accepted_values') {
          // `values: [a, b, c]` (inline list).
          const inline = s.match(/^values:\s*\[([^\]]*)\]/)
          if (inline) {
            pending.partial.values = parseInlineList(inline[1])
            continue
          }
          // `- 'value'` underneath `values:` (block list item).
          const item = s.match(/^- (.*)$/)
          if (item && pending.partial.values) {
            pending.partial.values.push(stripQuotes(item[1].trim()))
            continue
          }
        } else if (pending.kind === 'relationships') {
          const to = s.match(/^to:\s*ref\(\s*['"]([^'"]+)['"]\s*\)/)
          if (to) {
            pending.partial.to = to[1]
            continue
          }
          const field = s.match(/^field:\s*(\S+)/)
          if (field) {
            pending.partial.field = stripQuotes(field[1])
            continue
          }
        }
      }
    }

    flushPending()
  }

  // De-duplicate by id (last write wins).
  const seen = new Map<string, TestDef>()
  for (const t of tests) seen.set(t.id, t)
  return [...seen.values()]
}

function parseInlineList(inner: string): string[] {
  return inner
    .split(',')
    .map((s) => stripQuotes(s.trim()))
    .filter((s) => s.length > 0)
}

function stripQuotes(s: string): string {
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1)
  }
  return s
}

function sqlLiteral(v: string): string {
  return `'${v.replace(/'/g, "''")}'`
}

function testSql(test: TestDef): string {
  const model = `"${test.model}"`
  const col = `"${test.column}"`
  switch (test.kind) {
    case 'not_null':
      return `SELECT COUNT(*) AS failing FROM ${model} WHERE ${col} IS NULL`
    case 'unique':
      return `SELECT COUNT(*) AS failing FROM (
                SELECT ${col} FROM ${model}
                WHERE ${col} IS NOT NULL
                GROUP BY ${col}
                HAVING COUNT(*) > 1
              )`
    case 'accepted_values': {
      const values = (test.values ?? []).map(sqlLiteral).join(', ')
      // No values declared → vacuously fail (the test config is incomplete).
      if (!values) return `SELECT 1 AS failing`
      return `SELECT COUNT(*) AS failing FROM ${model}
              WHERE ${col} IS NOT NULL AND ${col}::VARCHAR NOT IN (${values})`
    }
    case 'relationships': {
      const to = `"${test.to}"`
      const field = `"${test.field}"`
      return `SELECT COUNT(*) AS failing FROM ${model}
              WHERE ${col} IS NOT NULL
                AND ${col} NOT IN (SELECT ${field} FROM ${to} WHERE ${field} IS NOT NULL)`
    }
  }
}

export async function runTests(tests: TestDef[]): Promise<TestOutcome[]> {
  const out: TestOutcome[] = []
  for (const t of tests) {
    try {
      const res = await runQuery(testSql(t))
      const failing = Number(res.rows[0]?.[0] ?? 0)
      out.push({ ...t, passed: failing === 0, failingRows: failing })
    } catch (e) {
      out.push({
        ...t,
        passed: false,
        failingRows: 0,
        error: errorMessage(e),
      })
    }
  }
  return out
}
