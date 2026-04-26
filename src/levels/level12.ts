import type { Level } from '../engine/types'
import { modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level12: Level = {
  id: 12,
  chapter: 4,
  title: 'Run generic tests',
  description: `dbt ships with a handful of generic tests you can apply to any column. The two you will use constantly are:

  • not_null — fails if any row has NULL in that column.
  • unique — fails if any value appears more than once.

Tests are declared in YAML files that live next to your models. schema.yml for stg_customers already declares not_null and unique on customer_id, and not_null on email.

Your task: run \`dbt run\` to build the model, then run \`dbt test\` to execute those checks. Watch the terminal — each test either passes or fails.`,
  hint: 'Run `dbt run` first, then `dbt test`.',
  story: {
    messages: [
      {
        from: 'priya',
        body: `schema.yml already declares not_null + unique on customer_id and not_null on email. build the model, then \`dbt test\`. watch what fires red — that's how we'll catch the carol thing next time.`,
      },
    ],
  },
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
  requiredSteps: ['run', 'test'],
  goal: {
    description: 'Run dbt run then dbt test to execute the declared checks.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run first.' }
    if (Object.keys(state.testResults).length === 0)
      return { passed: false, reason: 'Run dbt test to execute the declared checks.' }
    return { passed: true }
  },
  badge: { id: 'quality-check', name: 'Quality Check', emoji: '✅' },
  quiz: {
    question: 'Which generic dbt test asserts that a column never contains NULL?',
    options: [
      'unique',
      'not_null',
      'accepted_values',
      'relationships',
    ],
    correctIndex: 1,
    explanation: '`not_null` fails if any row has NULL in the target column. `unique` checks for duplicates, `accepted_values` validates a fixed list, and `relationships` checks referential integrity.',
  },
  docs: [
    { label: 'Generic data tests', url: 'https://docs.getdbt.com/docs/build/data-tests#generic-data-tests' },
  ],
}

export default level12
