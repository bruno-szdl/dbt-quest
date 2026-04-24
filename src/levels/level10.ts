import type { Level } from '../engine/types'
import { modelRan, testPassed } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const level10: Level = {
  id: 9,
  chapter: 4,
  title: 'Create your first test',
  description: `You know how to run pre-configured tests. Now it's time to write your own.

Tests are defined in YAML files under the model and column they apply to. A common dbt convention is to keep one YAML file per model, sitting next to the .sql file. Here's the structure:

  models:
    - name: my_model
      columns:
        - name: my_column
          tests:
            - not_null
            - unique

stg_customers.yml already has tests configured. The stg_orders model also needs data quality checks — specifically, every order_id should be unique and not null.

Your task: open stg_orders.yml and add not_null and unique tests for the order_id column. Then run dbt run and dbt test.`,
  hint: 'In stg_orders.yml, replace the TODO comment with:\n        tests:\n          - not_null\n          - unique',
  initialFiles: {
    'models/stg_orders.yml': `version: 2

models:
  - name: stg_orders
    columns:
      - name: order_id
        # TODO: Add not_null and unique tests here
`,
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
`,
    'models/stg_orders.sql': `select
    id         as order_id,
    customer_id,
    amount,
    status,
    created_at
from raw_orders`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run', 'test'],
  goal: {
    description: 'Add not_null and unique tests to stg_orders.yml, then run dbt run and dbt test.',
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
      ],
      edges: [],
    },
  },
  validate: (state) => {
    const yml = state.files['models/stg_orders.yml'] ?? ''
    if (!yml.includes('stg_orders'))
      return { passed: false, reason: 'Keep the stg_orders model entry in stg_orders.yml.' }
    if (!yml.includes('not_null'))
      return { passed: false, reason: 'Add a not_null test for stg_orders.order_id.' }
    if (!yml.includes('unique'))
      return { passed: false, reason: 'Add a unique test for stg_orders.order_id.' }
    if (!modelRan(state, 'stg_orders'))
      return { passed: false, reason: 'Run dbt run to build stg_orders.' }
    if (!testPassed(state, 'stg_orders'))
      return { passed: false, reason: 'Run dbt test to validate your tests.' }
    return { passed: true }
  },
  badge: { id: 'test-author', name: 'Test Author', emoji: '🧪' },
  quiz: {
    question: 'Where do you define column-level tests for a dbt model?',
    options: [
      'Directly inside the .sql model file using comments',
      'In a YAML file (schema.yml) alongside the model',
      'In a dedicated tests/ directory as Python files',
      'Only in dbt_project.yml at the project root',
    ],
    correctIndex: 1,
    explanation: "Tests are declared in YAML files (typically schema.yml) in the same directory as your models. Each model can have a 'columns' section where you list tests like not_null and unique per column.",
  },
}

export default level10
