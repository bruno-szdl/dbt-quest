# CI / Tests / Contributing Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vitest unit test suite for the game engine, a GitHub Actions CI pipeline, and a CONTRIBUTING.md that onboards new contributors.

**Architecture:** Pure-function engine modules (commandParser, dagBuilder, validators) are tested with Vitest in Node environment — no DOM needed. CI runs lint → build → test on every push. CONTRIBUTING.md documents the branch workflow, how to run things locally, and how to add levels.

**Tech Stack:** Vitest 3.x, GitHub Actions (ubuntu-latest, Node 22), npm scripts

---

### Task 1: Install Vitest and configure it

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

Expected output: Vitest added to `devDependencies` in `package.json`.

- [ ] **Step 2: Add test script to `package.json`**

In `package.json`, add `"test": "vitest run"` to the `"scripts"` block:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Verify Vitest runs without errors**

```bash
npm run test
```

Expected: "No test files found" (or similar — no failures, no crash).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add Vitest for unit testing"
```

---

### Task 2: Write commandParser unit tests

**Files:**
- Create: `src/engine/__tests__/commandParser.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { describe, expect, it } from 'vitest'
import { parseCommand } from '../commandParser'

describe('parseCommand', () => {
  it('parses dbt run', () => {
    const result = parseCommand('dbt run')
    expect(result).toEqual({
      ok: true,
      command: { type: 'run', select: [], exclude: [], raw: 'dbt run' },
    })
  })

  it('parses dbt test', () => {
    const result = parseCommand('dbt test')
    expect(result).toEqual({
      ok: true,
      command: { type: 'test', select: [], exclude: [], raw: 'dbt test' },
    })
  })

  it('parses dbt build', () => {
    const result = parseCommand('dbt build')
    expect(result).toEqual({
      ok: true,
      command: { type: 'build', select: [], exclude: [], raw: 'dbt build' },
    })
  })

  it('parses --select with a single model', () => {
    const result = parseCommand('dbt run --select stg_orders')
    expect(result).toEqual({
      ok: true,
      command: {
        type: 'run',
        select: [{ name: 'stg_orders', upstream: false, downstream: false }],
        exclude: [],
        raw: 'dbt run --select stg_orders',
      },
    })
  })

  it('parses -s shorthand for --select', () => {
    const result = parseCommand('dbt run -s stg_orders')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.command.select[0].name).toBe('stg_orders')
  })

  it('parses downstream selector model+', () => {
    const result = parseCommand('dbt run --select stg_orders+')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.command.select[0]).toEqual({ name: 'stg_orders', upstream: false, downstream: true })
  })

  it('parses upstream selector +model', () => {
    const result = parseCommand('dbt run --select +stg_orders')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.command.select[0]).toEqual({ name: 'stg_orders', upstream: true, downstream: false })
  })

  it('parses --exclude', () => {
    const result = parseCommand('dbt run --exclude stg_orders')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.command.exclude[0]).toEqual({ name: 'stg_orders', upstream: false, downstream: false })
  })

  it('returns error for empty input', () => {
    expect(parseCommand('')).toEqual({ ok: false, error: 'Empty command' })
  })

  it('returns error for whitespace-only input', () => {
    expect(parseCommand('   ')).toEqual({ ok: false, error: 'Empty command' })
  })

  it('returns error when command does not start with dbt', () => {
    const result = parseCommand('npm install')
    expect(result.ok).toBe(false)
  })

  it('returns error for unknown subcommand', () => {
    const result = parseCommand('dbt deploy')
    expect(result.ok).toBe(false)
  })

  it('returns error for --select without a value', () => {
    const result = parseCommand('dbt run --select')
    expect(result.ok).toBe(false)
  })

  it('returns error for --exclude without a value', () => {
    const result = parseCommand('dbt run --exclude')
    expect(result.ok).toBe(false)
  })

  it('returns error for unknown flag', () => {
    const result = parseCommand('dbt run --unknown-flag')
    expect(result.ok).toBe(false)
  })

  it('parses multiple selectors', () => {
    const result = parseCommand('dbt run --select stg_orders stg_customers')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.command.select).toHaveLength(2)
    expect(result.command.select[0].name).toBe('stg_orders')
    expect(result.command.select[1].name).toBe('stg_customers')
  })
})
```

- [ ] **Step 2: Run the tests and verify they all pass**

```bash
npm run test
```

Expected: All 15 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/engine/__tests__/commandParser.test.ts
git commit -m "test: add commandParser unit tests"
```

---

### Task 3: Write dagBuilder unit tests

**Files:**
- Create: `src/engine/__tests__/dagBuilder.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { describe, expect, it } from 'vitest'
import { buildDag } from '../dagBuilder'

describe('buildDag', () => {
  it('returns empty dag for empty files', () => {
    expect(buildDag({})).toEqual({ nodes: [], edges: [] })
  })

  it('creates a model node from a SQL file in models/', () => {
    const { nodes } = buildDag({
      'models/stg_orders.sql': 'select id from raw_orders',
    })
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toMatchObject({ id: 'stg_orders', label: 'stg_orders', layer: 'staging', hasCycle: false })
  })

  it('ignores non-model files', () => {
    const { nodes } = buildDag({
      'seeds/raw_orders.csv': 'id,name',
      'dbt_project.yml': 'name: project',
    })
    expect(nodes).toHaveLength(0)
  })

  it('assigns staging layer to stg_ prefixed models', () => {
    const { nodes } = buildDag({ 'models/stg_customers.sql': 'select 1' })
    expect(nodes[0].layer).toBe('staging')
  })

  it('assigns intermediate layer to int_ prefixed models', () => {
    const { nodes } = buildDag({ 'models/int_orders.sql': 'select 1' })
    expect(nodes[0].layer).toBe('intermediate')
  })

  it('assigns mart layer to unprefixed models', () => {
    const { nodes } = buildDag({ 'models/orders.sql': 'select 1' })
    expect(nodes[0].layer).toBe('mart')
  })

  it('assigns staging layer from path when model is in a staging/ dir', () => {
    const { nodes } = buildDag({ 'models/staging/customers.sql': 'select 1' })
    expect(nodes[0].layer).toBe('staging')
  })

  it('creates an edge for a ref() call', () => {
    const { edges } = buildDag({
      'models/stg_orders.sql': 'select id from raw_orders',
      "models/orders.sql": "select * from {{ ref('stg_orders') }}",
    })
    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({ source: 'stg_orders', target: 'orders' })
  })

  it('does not create duplicate edges for repeated ref() calls', () => {
    const { edges } = buildDag({
      'models/stg_orders.sql': 'select 1',
      "models/orders.sql": "select * from {{ ref('stg_orders') }} join {{ ref('stg_orders') }} using (id)",
    })
    expect(edges).toHaveLength(1)
  })

  it('creates source nodes from source() calls', () => {
    const { nodes, edges } = buildDag({
      "models/stg_orders.sql": "select * from {{ source('raw', 'orders') }}",
    })
    const sourceNode = nodes.find((n) => n.id === 'raw.orders')
    expect(sourceNode).toBeDefined()
    expect(sourceNode?.layer).toBe('source')
    expect(edges).toHaveLength(1)
    expect(edges[0]).toMatchObject({ source: 'raw.orders', target: 'stg_orders' })
  })

  it('uses schema.yml declared sources', () => {
    const { nodes } = buildDag({
      'models/schema.yml': 'sources:\n  - name: raw\n    tables:\n      - name: orders\n',
      "models/stg_orders.sql": "select * from {{ source('raw', 'orders') }}",
    })
    const sourceNode = nodes.find((n) => n.id === 'raw.orders')
    expect(sourceNode).toBeDefined()
    expect(sourceNode?.layer).toBe('source')
  })

  it('detects cycles and sets hasCycle on involved nodes', () => {
    const { nodes } = buildDag({
      "models/a.sql": "select * from {{ ref('b') }}",
      "models/b.sql": "select * from {{ ref('a') }}",
    })
    const a = nodes.find((n) => n.id === 'a')
    const b = nodes.find((n) => n.id === 'b')
    expect(a?.hasCycle).toBe(true)
    expect(b?.hasCycle).toBe(true)
  })

  it('does not mark cycle-free nodes as hasCycle', () => {
    const { nodes } = buildDag({
      'models/stg_orders.sql': 'select 1',
      "models/orders.sql": "select * from {{ ref('stg_orders') }}",
    })
    expect(nodes.every((n) => !n.hasCycle)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests and verify they all pass**

```bash
npm run test
```

Expected: All tests pass. (The commandParser tests from Task 2 still pass too.)

- [ ] **Step 3: Commit**

```bash
git add src/engine/__tests__/dagBuilder.test.ts
git commit -m "test: add dagBuilder unit tests"
```

---

### Task 4: Write validators unit tests

**Files:**
- Create: `src/engine/__tests__/validators.test.ts`

- [ ] **Step 1: Create the test file**

The helper functions in `validators.ts` (`hasModel`, `modelRefs`, `modelRan`, `testPassed`, `sourceDefined`, `modelMaterialization`) are pure and accept a `GameState`. Test each one.

```typescript
import { describe, expect, it } from 'vitest'
import {
  hasModel,
  modelRefs,
  modelRan,
  testPassed,
  sourceDefined,
  modelMaterialization,
} from '../validators'
import type { GameState } from '../types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    files: {},
    ranModels: new Set<string>(),
    testResults: {},
    ...overrides,
  }
}

describe('hasModel', () => {
  it('returns true when a model SQL file exists', () => {
    const state = makeState({ files: { 'models/stg_orders.sql': 'select 1' } })
    expect(hasModel(state, 'stg_orders')).toBe(true)
  })

  it('returns true for nested model paths', () => {
    const state = makeState({ files: { 'models/staging/stg_orders.sql': 'select 1' } })
    expect(hasModel(state, 'stg_orders')).toBe(true)
  })

  it('returns false when the model file does not exist', () => {
    expect(hasModel(makeState(), 'stg_orders')).toBe(false)
  })

  it('returns false for non-model files', () => {
    const state = makeState({ files: { 'seeds/stg_orders.sql': 'select 1' } })
    expect(hasModel(state, 'stg_orders')).toBe(false)
  })
})

describe('modelRefs', () => {
  it('returns true when model contains ref() to the target', () => {
    const state = makeState({
      files: { "models/orders.sql": "select * from {{ ref('stg_orders') }}" },
    })
    expect(modelRefs(state, 'orders', 'stg_orders')).toBe(true)
  })

  it('returns false when model does not ref the target', () => {
    const state = makeState({ files: { 'models/orders.sql': 'select 1' } })
    expect(modelRefs(state, 'orders', 'stg_orders')).toBe(false)
  })

  it('returns false when the model file does not exist', () => {
    expect(modelRefs(makeState(), 'orders', 'stg_orders')).toBe(false)
  })
})

describe('modelRan', () => {
  it('returns true when model name is in ranModels', () => {
    const state = makeState({ ranModels: new Set(['stg_orders']) })
    expect(modelRan(state, 'stg_orders')).toBe(true)
  })

  it('returns false when model is not in ranModels', () => {
    expect(modelRan(makeState(), 'stg_orders')).toBe(false)
  })
})

describe('testPassed', () => {
  it('returns true when testResults[model] === "pass"', () => {
    const state = makeState({ testResults: { stg_orders: 'pass' } })
    expect(testPassed(state, 'stg_orders')).toBe(true)
  })

  it('returns false when testResults[model] === "fail"', () => {
    const state = makeState({ testResults: { stg_orders: 'fail' } })
    expect(testPassed(state, 'stg_orders')).toBe(false)
  })

  it('returns false when model has no test result', () => {
    expect(testPassed(makeState(), 'stg_orders')).toBe(false)
  })
})

describe('sourceDefined', () => {
  it('returns true when source and table names appear in a yml file', () => {
    const state = makeState({
      files: {
        'models/schema.yml': 'sources:\n  - name: raw\n    tables:\n      - name: orders\n',
      },
    })
    expect(sourceDefined(state, 'raw', 'orders')).toBe(true)
  })

  it('returns false when yml file does not contain source', () => {
    const state = makeState({ files: { 'models/schema.yml': 'version: 2\n' } })
    expect(sourceDefined(state, 'raw', 'orders')).toBe(false)
  })

  it('ignores non-yml files', () => {
    const state = makeState({
      files: { 'models/notes.txt': 'name: raw\nname: orders' },
    })
    expect(sourceDefined(state, 'raw', 'orders')).toBe(false)
  })
})

describe('modelMaterialization', () => {
  it('defaults to view when no config block is present', () => {
    const state = makeState({ files: { 'models/stg_orders.sql': 'select 1' } })
    expect(modelMaterialization(state, 'stg_orders', 'view')).toBe(true)
    expect(modelMaterialization(state, 'stg_orders', 'table')).toBe(false)
  })

  it('detects table materialization from config block', () => {
    const state = makeState({
      files: { "models/orders.sql": "{{ config(materialized='table') }}\nselect 1" },
    })
    expect(modelMaterialization(state, 'orders', 'table')).toBe(true)
    expect(modelMaterialization(state, 'orders', 'view')).toBe(false)
  })

  it('returns false when model file does not exist', () => {
    expect(modelMaterialization(makeState(), 'orders', 'view')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the tests and verify they all pass**

```bash
npm run test
```

Expected: All tests pass across all three test files.

- [ ] **Step 3: Commit**

```bash
git add src/engine/__tests__/validators.test.ts
git commit -m "test: add validators unit tests"
```

---

### Task 5: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow file**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build (includes type check)
        run: npm run build

      - name: Test
        run: npm run test
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow (lint, build, test)"
```

---

### Task 6: Write CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Write `CONTRIBUTING.md` at the root of the repo**

```markdown
# Contributing to dbt Quest

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- **Node.js 20+** — check with `node --version`
- **npm** — comes with Node

## Local setup

```bash
git clone <repo-url>
cd dbt-quest
npm ci
npm run dev
```

Open http://localhost:5173. The game loads immediately in the browser — no backend, no login.

## Running tests

```bash
npm run test        # Vitest unit tests (fast, pure functions)
npm run build       # TypeScript type check + Vite build
npm run lint        # ESLint
```

Run all three before opening a PR. The CI pipeline runs them automatically.

## Branch and PR workflow

1. Branch off `main`: `git checkout -b feature/my-change`
2. Make your changes, commit often
3. Open a PR targeting `main`
4. CI runs automatically; Vercel posts a preview URL in the PR

The `preview` branch is used internally for staging QA. You don't need to interact with it.

## Adding a new level

Levels are data, not code. Adding a level means adding one entry to the levels array — no engine changes needed.

**Step 1 — Create `src/levels/levelNN.ts`:**

```typescript
import type { Level } from '../engine/types'
import { hasModel, modelRan } from '../engine/validators'

const levelNN: Level = {
  id: NN,
  chapter: N,
  title: 'Your level title',
  description: `Multi-line description shown in the intro modal.
Explain the dbt concept being taught here.`,
  hint: 'Optional hint shown when the player clicks "Show Hint".',
  initialFiles: {
    'models/stg_example.sql': `select id from raw_example`,
  },
  seeds: {
    // Key format: 'source.table' or bare 'table_name'
    'raw_example': `id,name\n1,Alice\n2,Bob`,
  },
  requiredSteps: ['run'], // 'files' | 'run' | 'test' — controls the progress checklist
  goal: {
    description: 'One sentence describing what the player needs to do.',
    dagShape: {
      nodes: [{ id: 'stg_example', label: 'stg_example', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!hasModel(state, 'stg_example'))
      return { passed: false, reason: 'Create the stg_example model.' }
    if (!modelRan(state, 'stg_example'))
      return { passed: false, reason: 'Run the model with `dbt run`.' }
    return { passed: true }
  },
  badge: { id: 'my-badge', name: 'Badge Name', emoji: '🎯' },
}

export default levelNN
```

**Step 2 — Register it in `src/levels/index.ts`:**

Import and add your level to the `levels` array and the appropriate module's `levelIds`.

**Reference:** Look at `src/levels/level01.ts` for a complete example.

## Code style

- **TypeScript strict** — `tsconfig.app.json` has `strict: true`. No `any`.
- **No CSS-in-JS** — use Tailwind classes or `style` props that reference CSS variables (`var(--color-base)`, etc.).
- **Comments** — only when the *why* is non-obvious. No docstrings, no TODO comments in committed code.
- **Component names** — PascalCase. Hooks — `useX`. Everything else — camelCase.
- **No new dependencies** without discussion — the bundle size matters (DuckDB WASM is already large).
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md"
```
