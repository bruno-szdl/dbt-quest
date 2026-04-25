# Contributing to dbt Quest

Thanks for considering a contribution! This project is small, opinionated, and runs entirely in the browser. Most contributions will land in one of three places: a new **level**, a new **module**, or a new **engine validator**. This guide walks through each.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b + vite build
```

There's no automated test suite — correctness is checked by playing through the affected level(s) in the dev server. The TypeScript compiler is your safety net; treat a clean `npm run build` as the floor.

## Repository layout

```
src/
├── engine/            # dbt simulation: compile, build DAG, run SQL, handle CLI
│   ├── compiler.ts    # SQL/YAML parsing, ref()/source()/config()/tags
│   ├── runner.ts      # dbt CLI dispatcher (run/test/build/show/compile/seed/snapshot)
│   ├── executor.ts    # materialize models against DuckDB
│   ├── commandParser.ts  # parse selector syntax (+model, model+, tag:, comma, space)
│   ├── validators.ts  # helpers used by each level's validate()
│   └── types.ts       # Level, GameState, GoalDagShape
├── levels/
│   ├── level01.ts ... # one file per level (file number == level id == curriculum order)
│   ├── _selectorsFixture.ts  # shared fixture for the Selectors and tags module
│   └── index.ts       # imports each level + defines the modules array
├── components/        # UI panels (Editor, Terminal, DAG, LevelPanel, Header, Sidebar)
└── store/gameStore.ts # Zustand store: files, ranModels, completedLevels, theme, …
```

## Curriculum invariants

These keep the learner experience predictable. Please preserve them:

- **File number = level id = curriculum order.** `levelNN.ts` exports a `Level` with `id: NN`. The number is also the position in the curriculum the player sees. If you insert a level in the middle, renumber the trailing files.
- **`chapter:` on a level matches the `id:` of its module.** The `Ch X` badge in the UI is read straight from this field.
- **`modules[].levelIds` in `src/levels/index.ts` is the source of truth for ordering.** Keep it in ascending numeric order, no gaps.
- **Persisted progress is keyed by level id.** Renumbering existing levels invalidates anyone's saved progress, so do it deliberately and call it out in the PR.

## Adding a new level

1. **Pick the slot.** Decide which module the level belongs to and where in that module's `levelIds` it should sit. Pick the next available level number after the slot's predecessor.

2. **Renumber if you're inserting.** If the slot is in the middle of the curriculum, every later level needs to shift up by one. Rename the files, update the `id:` and `const levelNN` / `export default levelNN` inside each shifted file, and update `levelIds` in `index.ts`. (No engine reference uses the number outside these files, so this is purely mechanical.)

3. **Create `src/levels/levelNN.ts`** following the `Level` shape in `src/engine/types.ts`. The most useful fields:

   ```ts
   const levelNN: Level = {
     id: NN,
     chapter: M,                          // module id
     title: '...',
     description: `Multiline narrative...`,
     hint: 'Concrete one-liner.',
     initialFiles: { 'models/foo.sql': '...', 'models/schema.yml': '...' },
     seeds: { raw_customers: CSV_STRING }, // CSV blobs
     preRanModels: ['stg_foo'],            // optional: silently materialize on level load
     requiredSteps: ['files', 'run', 'test'], // checklist items shown to the player
     manualCompletion: true,               // optional: gate completion on a "Mark complete" click
     goal: {
       description: 'Run dbt run to build foo.',
       dagShape: { nodes: [...], edges: [...] }, // optional, for the Goal DAG preview
     },
     validate: (state) => {
       if (!modelRan(state, 'foo')) return { passed: false, reason: 'Run dbt run.' }
       return { passed: true }
     },
     badge: { id: 'unique-id', name: 'Display Name', emoji: '🏷️' },
     quiz: { question, options: [a, b, c, d], correctIndex, explanation },
     docs: [{ label: 'dbt docs page', url: '...' }],
   }
   export default levelNN
   ```

4. **Pick the right validator helpers.** Reuse what's in `src/engine/validators.ts` — `modelRan`, `modelRefs`, `outputColumnsInclude`, `testDefinitionsInclude`, `allTestsPass`, `sourceDefined`, `seedLoaded`, `manuallyMarked`, `snapshotRanAtLeast`, etc. Only write a new helper there if a check is reusable across levels.

5. **Register the level** in `src/levels/index.ts`: add the import, push into `levels[]`, and add the id to the right module's `levelIds` array.

6. **Play it.** `npm run dev`, walk through the level cold (with `localStorage` cleared for a faithful first-time experience), and verify the validator passes when you do the right thing and fails with a useful message when you don't.

## Adding a new module

A module is a thematic grouping of levels. Create one when adding a topic that doesn't fit any existing module.

1. Decide where the module sits in the curriculum and which levels belong to it.
2. Add an entry to `modules` in `src/levels/index.ts`. Use the next available `id`.
3. Renumber existing modules and bump `chapter:` on every level whose module id changed.
4. Renumber level files if curriculum order shifted (see "Curriculum invariants" above).

For modules with three or more levels that share fixtures, consider an underscore-prefixed helper (see `_selectorsFixture.ts`) to keep duplication down.

## Adding a new engine validator or feature

If a level needs a check that isn't in `src/engine/validators.ts`:

- **Prefer reusing the existing engine.** Most checks can be expressed with `state.files`, `state.ranModels`, `state.modelColumns`, `collectModels(state.files)` from `compiler.ts`, or `plan(state.files)` from `executor.ts`.
- **If you need a new helper**, add it to `validators.ts`, keep it pure (input: `GameState`, output: boolean or small object), and write a docstring describing the precondition.
- **If you need a new CLI flag or selector**, the parsing lives in `commandParser.ts` and the resolution in `runner.ts`. Selector grammar is documented inline.

## Style and conventions

- TypeScript strict mode is on. Avoid `any`.
- Theme colors come from CSS variables defined in `index.css` — don't hardcode hex codes in components.
- Match the terse comment style of the existing engine files: explain *why* something non-obvious exists, not *what* the code does.
- Don't add tests, mocks, or scaffolding "for the future". The project is small enough that ad-hoc verification in the browser is the workflow.

## Pull requests

- One feature or fix per PR. Smaller PRs land faster.
- The PR description should answer: *what changes for the player?* If the answer is "nothing visible", the change is probably an internal refactor — say so.
- Run `npm run build` locally before pushing. CI runs the same command.
- If you renumbered levels, mention that progress saved before this PR will be off by N levels — players may need to reset.

That's it. Open an issue first if you're not sure whether a change fits, especially anything that touches the engine or the curriculum order.
