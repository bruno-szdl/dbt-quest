import type { Level } from '../engine/types'
import { buildSucceeded } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level15: Level = {
  id: 15,
  chapter: 4,
  title: 'Use dbt build',
  description: `\`dbt run\` builds your models. \`dbt test\` runs your tests. \`dbt build\` does both in one pass, in dependency order, and stops a subtree from continuing if an upstream test fails.

In production this is usually what you want. A failing test on a staging model should prevent the downstream mart from being rebuilt with bad data.

Your task: run \`dbt build\`. You will see the models build, then the tests execute, as one combined workflow.`,
  hint: 'Type `dbt build` in the terminal.',
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/schema.yml': `version: 2

models:
  - name: stg_customers
    columns:
      - name: customer_id
        tests:
          - not_null
          - unique
      - name: email
        tests:
          - not_null
`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: [],
  goal: {
    description: 'Run `dbt build` and watch run + test execute together.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!buildSucceeded(state))
      return { passed: false, reason: 'Run `dbt build` and make sure it finishes without failures.' }
    return { passed: true }
  },
  badge: { id: 'build-boss', name: 'Build Boss', emoji: '🏗️' },
  quiz: {
    question: 'How does `dbt build` differ from running `dbt run` then `dbt test`?',
    options: [
      'It skips all tests',
      'It runs each model then its tests in dependency order, stopping downstream work on test failures',
      'It refreshes the warehouse credentials first',
      'It only runs models marked as incremental',
    ],
    correctIndex: 1,
    explanation: 'build interleaves models and tests in dependency order. When a test fails, downstream models that depend on the failing one are skipped — protecting the rest of the graph from bad data.',
  },
  docs: [
    { label: 'About `dbt build`', url: 'https://docs.getdbt.com/reference/commands/build' },
  ],
}

export default level15
