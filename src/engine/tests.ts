import { runQuery } from './duckdb'

export type TestKind = 'not_null' | 'unique'

export interface TestDef {
  id: string
  kind: TestKind
  model: string
  column: string
}

export interface TestOutcome extends TestDef {
  passed: boolean
  failingRows: number
  error?: string
}

/**
 * Parse `schema.yml` style test declarations. Only `not_null` and `unique` are
 * supported in V1. Returns one TestDef per (model, column, kind).
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

    for (const raw of content.split('\n')) {
      const s = raw.trimStart()
      if (!s || s.startsWith('#')) continue
      const indent = raw.length - s.length

      if (indent === 0) {
        inModels = s.startsWith('models:')
        modelName = ''
        columnName = ''
        modelIndent = -1
        columnIndent = -1
        continue
      }
      if (!inModels) continue

      const nameMatch = s.match(/^- name:\s+(\S+)/)
      if (nameMatch) {
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

      if (modelName && columnName && columnIndent !== -1 && indent > columnIndent) {
        const t = s.match(/^- (not_null|unique)\b/)
        if (t) {
          tests.push({
            id: `${t[1]}_${modelName}_${columnName}`,
            kind: t[1] as TestKind,
            model: modelName,
            column: columnName,
          })
        }
      }
    }
  }

  // De-duplicate.
  const seen = new Set<string>()
  return tests.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
}

function testSql(test: TestDef): string {
  const model = `"${test.model}"`
  const col = `"${test.column}"`
  if (test.kind === 'not_null') {
    return `SELECT COUNT(*) AS failing FROM ${model} WHERE ${col} IS NULL`
  }
  // unique
  return `SELECT COUNT(*) AS failing FROM (
            SELECT ${col} FROM ${model}
            WHERE ${col} IS NOT NULL
            GROUP BY ${col}
            HAVING COUNT(*) > 1
          )`
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
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }
  return out
}
