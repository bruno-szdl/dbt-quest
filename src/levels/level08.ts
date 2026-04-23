import type { Level } from '../engine/types'
import { modelRan, testPassed } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const level08: Level = {
  id: 8,
  chapter: 4,
  title: 'Run built-in tests',
  description: `Transforming data is only half the job — you also need to validate it. dbt has built-in tests that can automatically check your data quality.

The two most common tests are:
  - not_null: fails if any value in a column is NULL.
  - unique: fails if any value appears more than once.

Tests are declared in schema.yml. They have already been configured for stg_customers in this level.

Your task: first run dbt run to build the model, then run dbt test to check the data quality. Watch the test results appear in the terminal.`,
  hint: 'Run `dbt run` first to build the model, then run `dbt test` to execute the data quality checks.',
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/stg_customers.yml': `version: 2

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
    description: 'Run dbt run to build stg_customers, then run dbt test to pass the data quality checks.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to build stg_customers first.' }
    if (!testPassed(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt test to check the data quality.' }
    return { passed: true }
  },
  badge: { id: 'quality-check', name: 'Quality Check', emoji: '✅' },
}

export default level08
