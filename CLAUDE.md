# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server at localhost:5173
npm run build    # TypeScript check + production build → dist/
npm run lint     # ESLint validation
npm run preview  # Preview production build locally
```

There are no automated tests — level completion is validated via `validate()` functions in each level definition.

## Architecture

**dbt-quest** is a browser-based interactive game for learning dbt, inspired by Learn Git Branching. It runs entirely in-browser with no backend: SQL executes in DuckDB WASM, the editor is Monaco, and the DAG is rendered with React Flow.

### Stack

- **React 19 + TypeScript** (strict mode) — UI
- **Zustand** — all game/UI state in `src/store/gameStore.ts`
- **Vite + Tailwind CSS 4** — build and styling
- **DuckDB WASM** — in-browser SQL execution
- **Monaco Editor** — code editing with file tabs
- **React Flow + Dagre** — DAG visualization

### Key directories

```
src/
├── engine/          # dbt simulation: compile SQL, build DAG, execute against DuckDB, run CLI commands
├── levels/          # Level definitions (level01.ts–level10.ts) + module groupings (index.ts)
├── components/      # React UI panels (Editor, TerminalPanel, DagPanel, LevelPanel, etc.)
├── store/
│   └── gameStore.ts # Zustand store: files, ranModels, testResults, completedLevels, theme
└── index.css        # CSS variable theming (dark default, light variant)
```

### Engine pipeline

1. **`compiler.ts`** — extracts `ref()`, `source()`, `config()` from SQL Jinja-like syntax
2. **`dagBuilder.ts`** — builds node/edge graph; infers layer (staging/intermediate/mart) from naming; reads `schema.yml` for sources
3. **`executor.ts`** — compiles and runs SQL in DuckDB; handles VIEW vs TABLE materialization
4. **`runner.ts`** — parses dbt CLI commands (`dbt run`, `dbt test`, `dbt show`) and resolves selectors (`+model`, `model+`)
5. **`validators.ts`** — helpers used by each level's `validate()` to check completion

### Level structure

Each level file exports an object with:
- `initialFiles` — starting SQL/YAML file contents
- `seeds` — CSV data for `source()` calls loaded into DuckDB
- `goal.description` + optional `goal.dagShape` — target DAG shape for completion
- `validate(state)` — checks whether the player has completed the level
- `badge` — emoji awarded on completion

To add a new level: create `src/levels/levelNN.ts` and register it in `src/levels/index.ts`.

#### Adding levels beyond the current maximum — "last level" rule

`getLastLevelId()` (in `src/levels/index.ts`) returns `max(level.id)` across all registered levels. This is the **single source of truth** for detecting the final level. Everything that gates the course-complete modal flows through it:

- `gameStore.ts` — triggers `showCourseComplete` when `currentLevelId === getLastLevelId()` after a level is passed.
- `LevelCompleteModal.tsx`, `LevelQuizModal.tsx`, `LevelPanel.tsx` — all use `getLastLevelId()` to decide whether to show "Next level →" or the course-complete path.

When you add a new level (say level 43), `getLastLevelId()` automatically returns 43 — no other change is needed. The `CourseCompleteModal` (the full-screen celebration window with the 🎓 animation) will only fire on the new last level.

**Important:** do not guard "is this the last level?" with `levels.length` — level IDs are 1-indexed and `levels.length === max(id)` only holds by coincidence while IDs are a gapless 1..N sequence. Always use `getLastLevelId()`.

### Theming

CSS variables defined in `index.css` drive all colors. Theme (dark/light) is persisted to `localStorage` and applied via `document.documentElement.dataset.theme`. Components use CSS vars rather than hardcoded colors.

### State shape

`gameStore.ts` holds: `files` (record of filename → content), `ranModels`, `testResults`, `terminalHistory`, `currentLevelId`, `completedLevels`, `unlockedBadges`, `bottomTab`, `showLevelIntro`, and `isDarkTheme`.
