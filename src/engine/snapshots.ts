import { sourceViewName } from './compiler'
import { exec, runQuery } from './duckdb'
import { errorMessage } from './errors'

export type SnapshotStrategy = 'timestamp' | 'check'

export interface SnapshotConfig {
  uniqueKey: string
  strategy: SnapshotStrategy
  /** Column used for timestamp strategy. */
  updatedAt?: string
  /** Columns used for check strategy. */
  checkCols?: string[]
  targetSchema?: string
}

export interface CompiledSnapshot {
  name: string
  path: string
  config: SnapshotConfig
  /** SELECT SQL with refs and sources substituted. */
  selectSql: string
  refs: string[]
  sources: Array<{ source: string; table: string }>
  error?: string
}

export interface SnapshotOutcome {
  name: string
  passed: boolean
  elapsed: number
  rowCount: number
  closed: number
  inserted: number
  error?: string
}

const SNAPSHOT_BLOCK_RE = /\{%\s*snapshot\s+([A-Za-z_][A-Za-z0-9_]*)\s*%\}([\s\S]*?)\{%\s*endsnapshot\s*%\}/
const CONFIG_BLOCK_RE = /\{\{\s*config\s*\(([\s\S]*?)\)\s*\}\}/
const REF_RE = /\{\{\s*ref\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g
const SOURCE_RE = /\{\{\s*source\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g

function extractString(inner: string, key: string): string | undefined {
  const re = new RegExp(`\\b${key}\\s*=\\s*['"]([^'"]+)['"]`)
  const m = re.exec(inner)
  return m?.[1]
}

function extractList(inner: string, key: string): string[] | undefined {
  const re = new RegExp(`\\b${key}\\s*=\\s*\\[([^\\]]*)\\]`)
  const m = re.exec(inner)
  if (!m) return undefined
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
}

export function compileSnapshot(path: string, raw: string): CompiledSnapshot | null {
  const outer = SNAPSHOT_BLOCK_RE.exec(raw)
  if (!outer) return null
  const name = outer[1]
  const body = outer[2]

  const cfg = CONFIG_BLOCK_RE.exec(body)
  const inner = cfg ? cfg[1] : ''
  const uniqueKey = extractString(inner, 'unique_key') ?? ''
  const strategyRaw = extractString(inner, 'strategy') ?? 'timestamp'
  const strategy: SnapshotStrategy = strategyRaw === 'check' ? 'check' : 'timestamp'
  const updatedAt = extractString(inner, 'updated_at')
  const checkCols = extractList(inner, 'check_cols')
  const targetSchema = extractString(inner, 'target_schema')

  let selectSql = cfg ? body.replace(CONFIG_BLOCK_RE, '') : body

  const refs: string[] = []
  const sources: Array<{ source: string; table: string }> = []
  selectSql = selectSql.replace(REF_RE, (_m, n) => { refs.push(n); return `"${n}"` })
  selectSql = selectSql.replace(SOURCE_RE, (_m, s, t) => {
    sources.push({ source: s, table: t })
    return `"${sourceViewName(s, t)}"`
  })

  let error: string | undefined
  if (!uniqueKey) error = `Snapshot ${name} is missing unique_key.`
  else if (strategy === 'timestamp' && !updatedAt) error = `Snapshot ${name} (timestamp strategy) needs updated_at.`
  else if (strategy === 'check' && (!checkCols || checkCols.length === 0))
    error = `Snapshot ${name} (check strategy) needs a non-empty check_cols list.`

  return {
    name,
    path,
    config: { uniqueKey, strategy, updatedAt, checkCols, targetSchema },
    selectSql: selectSql.trim(),
    refs,
    sources,
    error,
  }
}

export function collectSnapshots(files: Record<string, string>): CompiledSnapshot[] {
  const result: CompiledSnapshot[] = []
  for (const [path, content] of Object.entries(files)) {
    if (!path.startsWith('snapshots/') || !path.endsWith('.sql')) continue
    const snap = compileSnapshot(path, content)
    if (snap) result.push(snap)
  }
  return result
}

const STAGING_PREFIX = '__dbt_snapshot_stage__'

/**
 * Run a single snapshot. First run creates the target as an SCD-2 table with
 * dbt_valid_from/to + dbt_updated_at. Subsequent runs close out rows whose
 * tracked column(s) changed and insert new versions. Brand-new unique_keys are
 * inserted. Removed unique_keys are left as-is (standard SCD-2).
 */
export async function runSnapshot(snap: CompiledSnapshot): Promise<SnapshotOutcome> {
  const start = performance.now()
  const name = snap.name
  const { uniqueKey, strategy, updatedAt, checkCols } = snap.config

  if (snap.error) {
    return {
      name,
      passed: false,
      elapsed: 0,
      rowCount: 0,
      closed: 0,
      inserted: 0,
      error: snap.error,
    }
  }

  const staging = `${STAGING_PREFIX}${name}`
  try {
    // Build a staging view of the incoming rows, evaluated once per run.
    try { await exec(`DROP VIEW IF EXISTS "${staging}" CASCADE`) } catch { /* */ }
    try { await exec(`DROP TABLE IF EXISTS "${staging}" CASCADE`) } catch { /* */ }
    await exec(`CREATE TEMPORARY TABLE "${staging}" AS ${snap.selectSql}`)

    // Check whether the target snapshot table already exists.
    const exists = await runQuery(
      `SELECT count(*) FROM information_schema.tables
         WHERE table_schema = 'main' AND table_name = '${name}'`,
    )
    const tableExists = Number(exists.rows[0]?.[0] ?? 0) > 0

    if (!tableExists) {
      // First run: snapshot every incoming row.
      const updatedAtExpr = strategy === 'timestamp' && updatedAt
        ? `s."${updatedAt}"`
        : 'CURRENT_TIMESTAMP'
      await exec(
        `CREATE TABLE "${name}" AS
           SELECT s.*,
                  ${updatedAtExpr}       AS dbt_updated_at,
                  CURRENT_TIMESTAMP      AS dbt_valid_from,
                  CAST(NULL AS TIMESTAMP) AS dbt_valid_to
             FROM "${staging}" s`,
      )
      const rc = await runQuery(`SELECT COUNT(*) FROM "${name}"`)
      return {
        name,
        passed: true,
        elapsed: (performance.now() - start) / 1000,
        rowCount: Number(rc.rows[0]?.[0] ?? 0),
        closed: 0,
        inserted: Number(rc.rows[0]?.[0] ?? 0),
      }
    }

    // Subsequent run: close changed rows, insert new versions + brand-new keys.
    const changePredicate = buildChangePredicate(strategy, updatedAt, checkCols)

    // 1. Close rows whose tracked data has advanced.
    const closeRes = await runQuery(
      `SELECT count(*) FROM "${name}" c
         JOIN "${staging}" s ON s."${uniqueKey}" = c."${uniqueKey}"
        WHERE c.dbt_valid_to IS NULL AND ${changePredicate}`,
    )
    const toClose = Number(closeRes.rows[0]?.[0] ?? 0)
    if (toClose > 0) {
      await exec(
        `UPDATE "${name}"
            SET dbt_valid_to = CURRENT_TIMESTAMP
          WHERE dbt_valid_to IS NULL
            AND "${uniqueKey}" IN (
              SELECT s."${uniqueKey}" FROM "${staging}" s
                JOIN "${name}" c ON c."${uniqueKey}" = s."${uniqueKey}" AND c.dbt_valid_to IS NULL
               WHERE ${changePredicate}
            )`,
      )
    }

    // 2. Insert new versions for keys without an open row (new keys + the
    // ones we just closed).
    const updatedAtExpr = strategy === 'timestamp' && updatedAt
      ? `s."${updatedAt}"`
      : 'CURRENT_TIMESTAMP'
    const insertRes = await runQuery(
      `SELECT count(*) FROM "${staging}" s
        WHERE NOT EXISTS (
          SELECT 1 FROM "${name}" c
           WHERE c."${uniqueKey}" = s."${uniqueKey}"
             AND c.dbt_valid_to IS NULL
        )`,
    )
    const toInsert = Number(insertRes.rows[0]?.[0] ?? 0)
    if (toInsert > 0) {
      await exec(
        `INSERT INTO "${name}"
           SELECT s.*,
                  ${updatedAtExpr}       AS dbt_updated_at,
                  CURRENT_TIMESTAMP      AS dbt_valid_from,
                  CAST(NULL AS TIMESTAMP) AS dbt_valid_to
             FROM "${staging}" s
            WHERE NOT EXISTS (
              SELECT 1 FROM "${name}" c
               WHERE c."${uniqueKey}" = s."${uniqueKey}"
                 AND c.dbt_valid_to IS NULL
            )`,
      )
    }

    const rc = await runQuery(`SELECT COUNT(*) FROM "${name}"`)
    return {
      name,
      passed: true,
      elapsed: (performance.now() - start) / 1000,
      rowCount: Number(rc.rows[0]?.[0] ?? 0),
      closed: toClose,
      inserted: toInsert,
    }
  } catch (e) {
    return {
      name,
      passed: false,
      elapsed: (performance.now() - start) / 1000,
      rowCount: 0,
      closed: 0,
      inserted: 0,
      error: errorMessage(e),
    }
  } finally {
    try { await exec(`DROP TABLE IF EXISTS "${staging}" CASCADE`) } catch { /* */ }
  }
}

function buildChangePredicate(
  strategy: SnapshotStrategy,
  updatedAt?: string,
  checkCols?: string[],
): string {
  if (strategy === 'timestamp' && updatedAt) {
    return `s."${updatedAt}" > c."${updatedAt}"`
  }
  if (strategy === 'check' && checkCols && checkCols.length > 0) {
    // Any tracked column differs (NULL-safe).
    return checkCols
      .map((c) => `s."${c}" IS DISTINCT FROM c."${c}"`)
      .join(' OR ')
  }
  // Unknown config — treat everything as unchanged so nothing is closed.
  return '1=0'
}
