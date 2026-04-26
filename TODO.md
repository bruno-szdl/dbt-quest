# dbt-quest — TODO

Findings from the project review (2026-04-26). Items are grouped by severity. Use this as the working punch-list.

Full review with rationale and file/line citations: `~/.claude/plans/review-all-the-project-parsed-rabin.md`.

---

## 🔴 Critical

- [x] **F1** — Add `eslint.config.js` (flat config, ESLint 9 + typescript-eslint + react-hooks). `npm run lint` currently errors out. _Fixed: flat config added; one set-state-in-effect bug in `LevelPanel.tsx` surfaced and fixed._
- [x] **F2** — Fix unhandled promise / stale closure in `src/App.tsx:22-27`. _Fixed: `.catch` attached, `loadLevel` added to deps; `loadLevel` already handles DuckDB errors internally and surfaces them in the terminal._
- [x] **F3** — Add a top-level React `<ErrorBoundary>` around `App`. _Fixed: `src/components/ErrorBoundary.tsx` with reload + reset-progress fallback, wrapped in `main.tsx`._
- [x] **F4** — Modal a11y: focus trap + autofocus + return-focus-on-close + Esc handler. _Fixed: `src/hooks/useModalA11y.ts` applied to all 5 modals; added `role="dialog"` / `aria-modal` / `aria-labelledby`._
- [x] **P1** — Module 8 (Selectors, levels 26–33) is overloaded. _Fixed: split into Module 8 "Selectors: graph operators" (26–29, badge "Trace Walker") and Module 9 "Selectors: tags and sets" (30–33, keeps "Surgeon's Touch"). Subsequent module IDs and level chapter fields shifted accordingly; `BEATS` map in WelcomeModal updated._
- [x] **D1** — Level 12 quiz explanation. _Reworked after D7 landed: caveat about engine limitations removed; explanation now describes all four tests as straightforwardly available._

---

## 🟠 Important

### Frontend
- [x] **F5** — Don't remount Monaco on theme toggle. _Fixed: dropped `theme` from the `key` so the `theme` prop drives the change._
- [x] **F6** — Theme-aware DAG colors. _Fixed: `LAYER_PALETTE_DARK` / `LAYER_PALETTE_LIGHT` + `layerColor()` helpers; threaded `isDark` through `ModelNode`, `GhostGoal`, MiniMap, and edges._
- [x] **F7** — Centralize localStorage. _Fixed: new `src/store/safeStorage.ts`, used in `gameStore.ts`, `main.tsx`, `ErrorBoundary.tsx`._
- [x] **F8** — Migrated typography to rem; replaced `zoom: 1.1` with `html { font-size: 110% }` on desktop, `100%` on mobile. ~75 inline `fontSize: 'XXpx'` literals across 17 components converted to rem; `StoryThread` switched to rem font-size constants (avatar dimensions stay px); Monaco editor's own `fontSize` option bumped from 13 → 14 to match the new effective scale. Spacing/padding/borders deliberately kept in px.
- [x] **F9** — Validate persisted store shape before merge. _Fixed: `numberArray()` guard in the `merge` callback rejects non-numeric values and non-arrays._
- [x] **F11** — Apply safe-area-inset-left/right in MobileLayout. _Fixed: outer container respects all four insets._
- [x] **F12** — Replace `path.split('/').pop()!` non-null assertions. _Fixed: 6 call sites now use new `basename`, `getModelName`, and `getFileStem` helpers in `engine/compiler.ts`._

### dbt content
- [x] **D2** — _Dropped: original review was wrong — `dbt build` does skip the entire downstream subtree of a failing test. Level 15 wording is correct as-is._
- [x] **D3** — Incremental diagnostic count. _Implemented (Option B): `compiler.ts` now captures the `{% if is_incremental() %}` body as `incrementalFilter` on `CompiledModel` (without double-collecting refs/sources). On a re-run of an incremental model, `executor.ts` evaluates `SELECT COUNT(*) FROM (<sql>) AS _diag <filter>` against the prior table snapshot and stamps `incrementalAppendedRows` on the outcome. `runner.ts` surfaces the count as a follow-up terminal line: "→ incremental filter would append N new rows (full rebuild applied)". The table is still full-rebuilt, so existing levels and validators are unaffected._
- [x] **D4** — _Dropped: dbt-quest deliberately preserves the simulation illusion; calling out the Jinja shortcut would break it. The level already provides correct code._
- [x] **D5** — _Dropped: out of scope for the current curriculum._
- [x] **D6** — _Dropped: `CourseCompleteModal.tsx` already lists dbt-utils, dbt-expectations, semantic layer, packages, and docs/hub/community links._
- [x] **D7** — Extend engine with `accepted_values` and `relationships`. _Implemented in `src/engine/tests.ts`: `TestKind` extended; the parser now handles multi-line YAML configs (`values:` inline list and block list, `to: ref('…')` + `field: …`); `testSql` builds the matching DuckDB queries. `testDefinitionsInclude` now accepts the wider kind union so future levels can validate any of the four._

### Pedagogy
- [x] **P2** — Quiz as gate. _Fixed: added `quizGates` flag to Level type, `correctlyAnsweredQuizzes` field on engine GameState, `quizCorrect()` validator, `openLevelQuiz` store action. `markQuizCorrect` now triggers `checkLevel`. LevelPanel renders a "Take quiz to complete →" button for `quizGates` levels. LevelQuizModal detects gate mode (via flag) and routes Continue → openLevelComplete instead of advancing to next level. dismissLevelCompleteModal suppresses the post-completion quiz when the user already answered correctly. Applied to levels 17 (Documentation reflection) and 24 (project structure layers)._
- [x] **P3** — Story callbacks across selectors module. _Fixed: added Yuki "6am refresh" thread to levels 26, 27, 28, 29 (filled gaps; 30/31/32 already had Yuki). Marcus referenced in 26 as antagonist of "rebuild everything" habit._
- [x] **P4** — Snapshot consumer in module 12. _Fixed: added `preRanSnapshots` engine feature so a level can boot with a snapshot already captured. Old reflective-only level 41 ("when to use snapshots") replaced with a hands-on level (now 43): build `dim_customers_active` that ref()s `snap_customers` and filters `dbt_valid_to IS NULL`. The "when to snapshot" content survives as flavor in the description._
- [x] **P5** — Folded level 22. _Fixed: source-vs-seed comparison content merged into level 21 ("Reference the seed"). Level 22 deleted; everything from original level 23+ renumbered._
- [x] **P6** — Earlier "green build ≠ correct" reinforcement. _Fixed: new level 16 "When green is wrong" inserted at the end of module 4. Pre-built model has all tests passing but a `WHERE status = 'pending'` typo where it should be `'completed'`. User has to read the data, find the bug, fix it. Validator regex-checks the filter went from 'pending' to 'completed'. Sets up level 44's "green ≠ correct" lesson with prior memory._
- [x] **P7** — Tightened quiz wording on levels 11, 17, 29. _Level 11 option 4 replaced "two customers with same id" (duplicate of option 2) with a mutable-status distractor. Level 17 option 3 swapped TODO note for an internal-refactor reference (different anti-pattern from option 4's time-bound note). Level 29 option 3 swapped the nonsensical "skip the model" with a near-miss describing `model+` so the user has to distinguish `+model+` from `model+`. Explanations updated to reflect the new distractors._
- [x] **P8** — Split levels 36 and 39 (now 36/37 and 40/41). _Fixed: original level 36 now just sets `materialized='incremental'` + `incremental_strategy='append'` (manualCompletion dropped; structural validators are enough). New level 37 "Add the is_incremental() filter" adds the `{% if is_incremental() %}` block + `{{ this }}` reference. Original level 39 ("Configure and run a snapshot") now level 40, focused on configure+run. New level 41 "Inspect what dbt added" — user runs `dbt show --select snap_customers` to observe SCD-2 columns; new `modelShown` validator added. Total levels: 42 → 44._

---

## 🟡 Polish

- [x] **F13** — ARIA on dropdown, popover, tab bar, terminal input. _Fixed: `aria-haspopup`/`aria-expanded`/`aria-label` on Header level chooser and badge button; `role="listbox"` and `role="dialog"` on their popovers; `role="tablist"`/`role="tab"`/`aria-selected` on MobileLayout tab bar; `aria-label` on terminal input._
- [x] **F14** — Color contrast. _Fixed: bumped `--color-muted` from `#484f58` to `#6e7681` (dark) and from `#8c959f` to `#656c76` (light) — now passes WCAG AA against the base background. Comment explains the constraint._
- [x] **F15** — Color-blind cue on pass/fail. _Fixed: DAG node status indicator now shows ✓ / ✗ glyphs in addition to color, with `aria-label` describing the state._
- [x] **F16** — _Dropped: noisy refactor with no user-visible impact._
- [x] **F17** — _Dropped: same as F16._
- [x] **F19** — Standardize error normalization. _Fixed: new `src/engine/errors.ts` exports `errorMessage(e)`; the 8 inline `e instanceof Error ? e.message : String(e)` sites now call it._
- [x] **F20** — Keyboard support + `aria-label` on resize handles. _Fixed: both vertical separators in `App.tsx` get `role="separator"`, `aria-orientation`, `aria-valuenow/min/max`, `tabIndex={0}`, and Arrow-key handlers (Shift = bigger step)._
- [x] **P9** — Marcus callbacks across modules 6-9. _Fixed: module 6 already covered by level 18 (sources). Added one-line callbacks to level 24 ("40 .sql files flat in models/"), level 26 ("marcus's habit of running dbt run against everything"), and level 30 ("marcus's schedule was a list of model names in a wiki"). Sets up level 42 as inheriting Marcus's last project rather than out of nowhere._
- [x] **P10** — _Dropped per user: not needed. Most learners arriving here have basic SQL._
- [x] **P11** — Strengthened "wow" moments. _Ephemeral: executor now tags each downstream model with the list of `inlinedEphemerals` it absorbed. runner.ts emits a follow-up gray line `→ inlined ephemeral "X" as CTE in the compiled SQL.` after `dbt run` builds a downstream consumer — visible from level 34 onward. Incremental: level 37's seed moved from engine `seeds:{}` config to `seeds/raw_events.csv` so the user can edit it via the file explorer. The level's description now ends with a "Tip — see a non-zero count" walkthrough: edit the CSV, `dbt seed`, `dbt run`. The diagnostic from D3 then prints a real `would append N new rows` value._
- [x] **D8** — README now has a "What you'll learn" section with a covered/not-covered table; also fixed stale stack notes (React 18 → 19, added DuckDB-WASM and Tailwind 4).
