export type Materialization = 'view' | 'table' | 'ephemeral' | 'incremental'

export interface CompiledModel {
  name: string
  path: string
  sql: string
  materialization: Materialization
  refs: string[]
  sources: Array<{ source: string; table: string }>
  tags: string[]
}

const REF_RE = /\{\{\s*ref\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g
const SOURCE_RE = /\{\{\s*source\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g
const CONFIG_RE = /\{\{\s*config\s*\(([\s\S]*?)\)\s*\}\}/g
const MATERIALIZED_RE = /materialized\s*=\s*['"](\w+)['"]/
const TAGS_RE = /\btags\s*=\s*(\[[^\]]*\]|['"][^'"]*['"])/
// Jinja control blocks like {% if is_incremental() %} ... {% endif %} are
// stripped entirely — dbt-quest doesn't execute Jinja, and leaving them in
// would make DuckDB fail to parse the SQL.
const JINJA_BLOCK_RE = /\{%[\s\S]*?%\}/g
// {{ this }} is only meaningful during incremental runs. Replace with the
// model's own name so simple self-references don't break.
const THIS_RE = /\{\{\s*this\s*\}\}/g

/** Name that a dbt source("s","t") maps to in DuckDB. */
export function sourceViewName(source: string, table: string): string {
  return `${source}__${table}`
}

function extractTagsFromConfig(inner: string): string[] {
  const m = TAGS_RE.exec(inner)
  if (!m) return []
  const raw = m[1].trim()
  if (raw.startsWith('['))
    return raw.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  return [raw.replace(/^['"]|['"]$/g, '')]
}

function extractTagsFromYamlBlock(block: string): string[] {
  const tags: string[] = []
  // Inline list: tags: [a, b]
  for (const m of block.matchAll(/\btags\s*:\s*\[([^\]]*)\]/g))
    tags.push(...m[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean))
  if (tags.length) return tags
  // Block list: tags:\n  - a\n  - b
  for (const m of block.matchAll(/\btags\s*:\s*\n((?:[ \t]+-[ \t]+\S[^\n]*\n?)+)/g))
    for (const line of m[1].split('\n')) {
      const item = /^[ \t]+-[ \t]+(\S+)/.exec(line)
      if (item) tags.push(item[1].replace(/^['"]|['"]$/g, ''))
    }
  return tags
}

function extractTagsFromYaml(content: string): Map<string, string[]> {
  const result = new Map<string, string[]>()
  const modelEntryRe = /^[ \t]{2}-[ \t]+name:[ \t]+(\S+)[ \t]*$/gm
  const entries: Array<{ name: string; start: number }> = []
  let m: RegExpExecArray | null
  while ((m = modelEntryRe.exec(content)) !== null)
    entries.push({ name: m[1], start: m.index })
  for (let i = 0; i < entries.length; i++) {
    const { name, start } = entries[i]
    const end = i + 1 < entries.length ? entries[i + 1].start : content.length
    const tags = extractTagsFromYamlBlock(content.slice(start, end))
    if (tags.length) result.set(name, tags)
  }
  return result
}

export function compileModel(name: string, path: string, raw: string): CompiledModel {
  const refs: string[] = []
  const sources: Array<{ source: string; table: string }> = []
  let materialization: Materialization = 'view'
  const tags: string[] = []

  // Strip line comments before any Jinja parsing so refs/sources inside
  // comments don't create false edges or get compiled into the SQL.
  raw = raw.replace(/--[^\n]*/g, '')

  // Extract config(), then strip all config calls.
  raw.replace(CONFIG_RE, (_m, inner) => {
    const mat = MATERIALIZED_RE.exec(inner)
    if (mat) {
      const v = mat[1]
      if (v === 'view' || v === 'table' || v === 'ephemeral' || v === 'incremental') {
        materialization = v
      }
    }
    tags.push(...extractTagsFromConfig(inner))
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

  // Strip Jinja control blocks ({% ... %}) and resolve {{ this }}.
  sql = sql.replace(JINJA_BLOCK_RE, '')
  sql = sql.replace(THIS_RE, `"${name}"`)

  return { name, path, sql: sql.trim(), materialization, refs, sources, tags }
}

export function getModelName(path: string): string {
  return path.split('/').pop()!.replace(/\.sql$/, '')
}

export function collectModels(files: Record<string, string>): CompiledModel[] {
  const models = Object.entries(files)
    .filter(([p]) => p.startsWith('models/') && p.endsWith('.sql'))
    .map(([path, content]) => compileModel(getModelName(path), path, content))

  // Merge tags declared in schema YAML files.
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith('models/') && (path.endsWith('.yml') || path.endsWith('.yaml'))) {
      for (const [modelName, yamlTags] of extractTagsFromYaml(content)) {
        const model = models.find(m => m.name === modelName)
        if (model)
          for (const t of yamlTags)
            if (!model.tags.includes(t)) model.tags.push(t)
      }
    }
  }

  return models
}
