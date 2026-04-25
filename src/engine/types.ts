import type { NodeLayer } from './dagBuilder'

export interface GameState {
  files: Record<string, string>
  ranModels: Set<string>
  testResults: Record<string, 'pass' | 'fail' | 'untested'>
  shownModels: Set<string>
  /** Columns observed the last time each model was successfully run. */
  modelColumns: Record<string, string[]>
  /** Seeds that have been loaded via `dbt seed` in the current level. */
  loadedSeeds: Set<string>
  /** True if `dbt build` has completed without failures in the current level. */
  buildSucceeded: boolean
  /** How many times each snapshot has been run in the current level. */
  snapshotRunCounts: Record<string, number>
  /** Cumulative count of rows closed out by each snapshot — proves history was captured. */
  snapshotClosedRows: Record<string, number>
  /** Level ids the learner has intentionally marked as complete. */
  manuallyMarkedComplete: Set<number>
  /** The current level id, used by manual-completion validators. */
  currentLevelId: number
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
  /** Models to silently materialize when the level loads, so the player can start from an already-run state. */
  preRanModels?: string[]
  goal: {
    description: string
    dagShape?: GoalDagShape
  }
  /** Which checklist items to show. Defaults to ['files', 'run', 'test'] when omitted. */
  requiredSteps?: ('files' | 'run' | 'test')[]
  /** If true, the learner must press a "Mark complete" button to finish the lesson. */
  manualCompletion?: boolean
  validate: (state: GameState) => { passed: boolean; reason?: string }
  badge?: { id: string; name: string; emoji: string }
  quiz?: {
    question: string
    options: [string, string, string, string]
    correctIndex: number
    explanation: string
  }
  /** Links to the official dbt docs that cover this level's topic. */
  docs?: { label: string; url: string }[]
}
