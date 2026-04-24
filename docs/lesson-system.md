# Lesson system architecture

How the dbt-quest curriculum is structured in code. Mirrors the memory file Claude Code keeps for this project.

## Curriculum

31 levels live at `src/levels/level01.ts–level31.ts`, registered in `src/levels/index.ts`. The same file exports 9 `modules` (blocks):

1. First contact with dbt (L1–4)
2. Multiple models and dependencies (L5–8)
3. Materializations (L9–10)
4. Data quality and testing (L11–15)
5. Sources and seeds (L16–20)
6. Project structure (L21–23)
7. Ephemeral models (L24–25)
8. Incremental models (L26–28)
9. Snapshots (L29–31)

## Level interface (`src/engine/types.ts`)

- `id` — numeric, matches lesson order (1–31).
- `chapter` — block id the level belongs to.
- `title`, `description`, `hint`, `badge`, `quiz` — lesson content.
- `initialFiles` — starter files the learner sees on load.
- `seeds` — CSVs auto-registered into DuckDB on level load. Keys of form `"raw.customers"` register as DuckDB table `raw__customers` (to match `{{ source('raw', 'customers') }}`).
- `preRanModels` — models to silently materialize on load so the learner starts in a known state.
- `goal.description` and optional `goal.dagShape` — the "ghost" DAG overlay.
- `requiredSteps?: ('files' | 'run' | 'test')[]` — drives the Progress checklist. Empty array shows no steps; omit for the default set.
- `manualCompletion?: boolean` — surfaces a "Mark complete" button in the Progress panel. Used for concept lessons with no mechanical validation. Pair with `manuallyMarked(state)` in `validate()`.
- `validate(state) => { passed, reason? }` — the gate to completion.

## Engine capabilities

- `dbt seed` — loads every `seeds/*.csv` in state.files into DuckDB and records names in `loadedSeeds`.
- `dbt snapshot` — processes `snapshots/*.sql` files with strategy=timestamp. First run creates the SCD-2 table with `dbt_valid_from`/`dbt_valid_to`/`dbt_updated_at`. Subsequent runs close out rows whose `updated_at` advanced and insert new versions. Snapshot names enter `ranModels` so `dbt show --select` works on them.
- Ephemeral materialization is inlined as CTEs at `plan()` time (`inlineEphemeralCtes` in `executor.ts`). Ephemerals are never materialized and are NOT added to `ranModels`.
- Incremental materialization is simulated as a full table rebuild; terminal prints a note. Config (`strategy`, `unique_key`) is validated via regex on the SQL.
- `{% ... %}` Jinja blocks are stripped and `{{ this }}` is resolved to the model name before the SQL reaches DuckDB.
- Executor captures each model's output columns → `state.modelColumns` → `outputColumnsInclude` validator.
- `buildSucceeded` flag is set only when `dbt build` completes with no run/test failures.

## Validators (`src/engine/validators.ts`)

`hasModel`, `modelRefs`, `modelRan`, `testPassed`, `sourceDefined`, `modelMaterialization`, `outputColumnsInclude`, `lineageHasEdge`, `lineageHasSourceEdge`, `testDefinitionsInclude`, `allTestsPass`, `buildSucceeded`, `seedLoaded`, `manuallyMarked`, `snapshotRanAtLeast`.

## Engine quirk

`DROP VIEW IF EXISTS x` errors in DuckDB when `x` exists as a TABLE (and vice versa). `executor.ts` wraps both drops in try/catch so materialization switches mid-level do not fail.

## Adding a new level

1. Create `src/levels/levelNN.ts` exporting a `Level`.
2. Import it in `src/levels/index.ts` and push it onto `levels`.
3. Add its id to the appropriate module's `levelIds`.
4. For purely conceptual lessons, set `manualCompletion: true` and validate with `manuallyMarked(state)`.
