# dbt Quest

An interactive browser-based game that teaches [dbt (data build tool)](https://www.getdbt.com/) through progressive levels — inspired by [Learn Git Branching](https://learngitbranching.js.org/).

Each level presents a target DAG that you need to reach by editing dbt files and running commands in a simulated terminal. No backend, no login — everything runs in the browser.

## Features

- Visual DAG viewer powered by React Flow
- Monaco-based code editor with dbt SQL/YAML support
- Real SQL execution in the browser via DuckDB-WASM
- Fake-but-realistic dbt terminal
- 44 progressive levels covering core dbt concepts
- Shareable completion badges
- Progress saved in localStorage

## What you'll learn

dbt Quest is a focused on-ramp, not a complete reference. Here's what's in scope vs. what's intentionally left to the real dbt:

| Concept | dbt Quest | Real dbt |
|---|---|---|
| `ref()`, `source()`, lineage | ✅ Hands-on | ✅ |
| Materializations: view, table | ✅ | ✅ |
| Materializations: incremental, ephemeral | ✅ | ✅ |
| Materializations: materialized_view | — | ✅ |
| Generic tests: `not_null`, `unique`, `accepted_values`, `relationships` | ✅ | ✅ |
| Singular tests / custom data tests | — | ✅ |
| Source freshness checks | — | ✅ |
| Snapshots (timestamp + check strategies) | ✅ | ✅ |
| Seeds | ✅ | ✅ |
| Project structure (staging / intermediate / marts) | ✅ | ✅ |
| Selectors: graph operators, tags, paths, set ops | ✅ | ✅ |
| Documentation: model & column descriptions | ✅ | ✅ |
| Jinja templating | Mocked | ✅ executed |
| Macros, packages, `dbt deps`, dbt-utils | — | ✅ |
| dbt Mesh: contracts, access, versions, groups | — | ✅ |
| Semantic layer / metrics / exposures | — | ✅ |
| Hooks (`on-run-start`, `pre-hook`, `post-hook`) | — | ✅ |
| Profile / `dbt_project.yml` configuration | Abstracted | ✅ |

After finishing dbt Quest you'll be ready to set up a real dbt project against DuckDB / Postgres / BigQuery / Snowflake and explore the larger ecosystem.

## Tech Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- Monaco Editor (`@monaco-editor/react`)
- React Flow (`reactflow`) + Dagre layout
- DuckDB-WASM (`@duckdb/duckdb-wasm`) for in-browser SQL
- Zustand (state management)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/` — ready to deploy on Vercel, Netlify, or any static host.

## Deploying to Vercel

Import the repo on [vercel.com](https://vercel.com). Vercel auto-detects Vite:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

No extra configuration needed.
