import { exec, runQuery, type QueryResult } from './duckdb'
import { collectModels, type CompiledModel } from './compiler'

export interface ModelOutcome {
  name: string
  materialization: 'view' | 'table'
  passed: boolean
  elapsed: number
  rowCount: number
  error?: string
  compiledSql: string
}

export interface ExecutionPlan {
  all: CompiledModel[]
  sorted: CompiledModel[]
  byName: Map<string, CompiledModel>
}

export function plan(files: Record<string, string>): ExecutionPlan {
  const all = collectModels(files)
  const byName = new Map(all.map((m) => [m.name, m]))
  const visited = new Set<string>()
  const sorted: CompiledModel[] = []
  function visit(name: string) {
    if (visited.has(name)) return
    visited.add(name)
    const node = byName.get(name)
    if (!node) return
    for (const r of node.refs) visit(r)
    sorted.push(node)
  }
  for (const m of all) visit(m.name)
  return { all, sorted, byName }
}

/** Execute each model as a DuckDB view (or table). Order is given by caller. */
export async function materializeModels(models: CompiledModel[]): Promise<ModelOutcome[]> {
  const outcomes: ModelOutcome[] = []
  for (const m of models) {
    const start = performance.now()
    try {
      // IF EXISTS only protects against "not found" — DuckDB still errors if
      // the object exists but is the other kind (e.g. DROP TABLE on a view).
      // Try both and swallow the type-mismatch error.
      try { await exec(`DROP VIEW IF EXISTS "${m.name}" CASCADE`) } catch { /* not a view */ }
      try { await exec(`DROP TABLE IF EXISTS "${m.name}" CASCADE`) } catch { /* not a table */ }
      const keyword = m.materialization === 'table' ? 'TABLE' : 'VIEW'
      await exec(`CREATE ${keyword} "${m.name}" AS ${m.sql}`)
      const count = await runQuery(`SELECT COUNT(*) AS c FROM "${m.name}"`)
      const rowCount = Number(count.rows[0]?.[0] ?? 0)
      outcomes.push({
        name: m.name,
        materialization: m.materialization,
        passed: true,
        elapsed: (performance.now() - start) / 1000,
        rowCount,
        compiledSql: m.sql,
      })
    } catch (e) {
      outcomes.push({
        name: m.name,
        materialization: m.materialization,
        passed: false,
        elapsed: (performance.now() - start) / 1000,
        rowCount: 0,
        error: e instanceof Error ? e.message : String(e),
        compiledSql: m.sql,
      })
      // Stop on the first failure to mirror dbt's default behaviour.
      break
    }
  }
  return outcomes
}

export async function previewModel(name: string, limit = 20): Promise<QueryResult> {
  return runQuery(`SELECT * FROM "${name}" LIMIT ${limit}`)
}
