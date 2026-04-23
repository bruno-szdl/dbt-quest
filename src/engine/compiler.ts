export type Materialization = 'view' | 'table'

export interface CompiledModel {
  name: string
  path: string
  sql: string
  materialization: Materialization
  refs: string[]
  sources: Array<{ source: string; table: string }>
}

const REF_RE = /\{\{\s*ref\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g
const SOURCE_RE = /\{\{\s*source\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g
const CONFIG_RE = /\{\{\s*config\s*\(([^)]*)\)\s*\}\}/g
const MATERIALIZED_RE = /materialized\s*=\s*['"](\w+)['"]/

/** Name that a dbt source("s","t") maps to in DuckDB. */
export function sourceViewName(source: string, table: string): string {
  return `${source}__${table}`
}

export function compileModel(name: string, path: string, raw: string): CompiledModel {
  const refs: string[] = []
  const sources: Array<{ source: string; table: string }> = []
  let materialization: Materialization = 'view'

  // Extract config(), then strip all config calls.
  raw.replace(CONFIG_RE, (_m, inner) => {
    const mat = MATERIALIZED_RE.exec(inner)
    if (mat && (mat[1] === 'view' || mat[1] === 'table')) {
      materialization = mat[1]
    }
    return ''
  })
  let sql = raw.replace(CONFIG_RE, '')

  // Substitute ref() with a quoted identifier matching the model's view/table name.
  sql = sql.replace(REF_RE, (_m, modelName: string) => {
    refs.push(modelName)
    return `"${modelName}"`
  })

  // Substitute source() with the view/table registered from seeds.
  sql = sql.replace(SOURCE_RE, (_m, src: string, tbl: string) => {
    sources.push({ source: src, table: tbl })
    return `"${sourceViewName(src, tbl)}"`
  })

  return { name, path, sql: sql.trim(), materialization, refs, sources }
}

export function getModelName(path: string): string {
  return path.split('/').pop()!.replace(/\.sql$/, '')
}

export function collectModels(
  files: Record<string, string>,
): CompiledModel[] {
  return Object.entries(files)
    .filter(([p]) => p.startsWith('models/') && p.endsWith('.sql'))
    .map(([path, content]) => compileModel(getModelName(path), path, content))
}
