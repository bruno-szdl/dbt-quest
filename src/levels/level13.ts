import type { Level } from '../engine/types'
import { allTestsPass, modelRan, testDefinitionsInclude } from '../engine/validators'

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const level13: Level = {
  id: 13,
  chapter: 4,
  title: 'Add generic tests to a model',
  description: `Tests have to be declared before dbt will run them. You add them inside a YAML file — either schema.yml shared by the whole folder, or a per-model file like stg_orders.yml.

The shape is always the same:

  models:
    - name: my_model
      columns:
        - name: my_column
          tests:
            - not_null
            - unique

Your task: open models/stg_orders.yml and add \`not_null\` and \`unique\` tests on \`order_id\`. Then run dbt run and dbt test and confirm both tests pass.`,
  hint: 'In stg_orders.yml, replace the TODO with:\n        tests:\n          - not_null\n          - unique',
  initialFiles: {
    'models/stg_orders.sql': `select
    id         as order_id,
    customer_id,
    amount,
    status,
    created_at
from raw_orders`,
    'models/stg_orders.yml': `version: 2

models:
  - name: stg_orders
    columns:
      - name: order_id
        # TODO: add not_null and unique tests here
`,
  },
  seeds: {
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run', 'test'],
  goal: {
    description: 'Add not_null and unique tests for order_id, then run dbt test.',
    dagShape: {
      nodes: [{ id: 'stg_orders', label: 'stg_orders', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!testDefinitionsInclude(state, 'stg_orders', ['not_null', 'unique']))
      return { passed: false, reason: 'Declare not_null and unique tests on stg_orders.order_id.' }
    if (!modelRan(state, 'stg_orders'))
      return { passed: false, reason: 'Run dbt run to build stg_orders.' }
    if (!allTestsPass(state, 'stg_orders'))
      return { passed: false, reason: 'Run dbt test and make sure all tests pass.' }
    return { passed: true }
  },
  badge: { id: 'test-author', name: 'Test Author', emoji: '🧪' },
  quiz: {
    question: 'Where do you declare column-level tests for a dbt model?',
    options: [
      'Inside the .sql model file as comments',
      'In a YAML file next to the model (e.g. schema.yml)',
      'In a Python file under tests/',
      'Only in dbt_project.yml',
    ],
    correctIndex: 1,
    explanation: 'Tests live in YAML files (commonly schema.yml) alongside the models they describe. Each model lists its columns and attaches tests to each column.',
  },
  docs: [
    { label: 'Generic data tests', url: 'https://docs.getdbt.com/docs/build/data-tests#generic-data-tests' },
    { label: 'Data test properties', url: 'https://docs.getdbt.com/reference/resource-properties/data-tests' },
  ],
}

export default level13
