import type { NodeLayer } from './dagBuilder'

export interface GameState {
  files: Record<string, string>
  ranModels: Set<string>
  testResults: Record<string, 'pass' | 'fail' | 'untested'>
}

export interface GoalDagShape {
  nodes: Array<{ id: string; label: string; layer: NodeLayer }>
  edges: Array<{ source: string; target: string }>
}

/**
 * CSV blobs keyed by the source/table name they represent.
 *
 * - `source.table` form (e.g. `raw.users`) seeds a DuckDB table named
 *   `raw__users`, matching how source() compiles.
 * - A bare name (e.g. `my_seed`) seeds a DuckDB table named `my_seed`.
 */
export type Seeds = Record<string, string>

export interface Level {
  id: number
  chapter: number
  title: string
  description: string
  hint?: string
  initialFiles: Record<string, string>
  seeds?: Seeds
  goal: {
    description: string
    dagShape?: GoalDagShape
  }
  /** Which checklist items to show. Defaults to ['files', 'run', 'test'] when omitted. */
  requiredSteps?: ('files' | 'run' | 'test')[]
  validate: (state: GameState) => { passed: boolean; reason?: string }
  badge?: { id: string; name: string; emoji: string }
}
