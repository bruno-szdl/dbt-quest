import type { Level } from '../engine/types'
import { modelRefs, modelRan } from '../engine/validators'

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const level06: Level = {
  id: 5,
  chapter: 2,
  title: 'Using ref()',
  description: `When a model depends on another model, you should reference it using {{ ref('model_name') }} instead of the table name directly.

Open the Lineage tab now. You'll see stg_orders and customer_orders as disconnected nodes — dbt has no idea one depends on the other.

ref() fixes this in two ways:
  1. dbt learns the dependency and builds models in the right order.
  2. The edge appears in the lineage, making the data flow explicit.

ref() also resolves to the correct location for each environment automatically. In dev it points to your personal schema, in prod to the production schema — you write the same SQL everywhere and dbt handles the rest.

Your task: replace \`from stg_orders\` with \`from {{ ref('stg_orders') }}\`, run dbt run, then check the Lineage tab again to see the edge appear.`,
  hint: "Change `from stg_orders` to `from {{ ref('stg_orders') }}`. The double curly braces are dbt's Jinja template syntax.",
  initialFiles: {
    'models/stg_orders.sql': `select
    id         as order_id,
    customer_id,
    amount,
    status,
    created_at
from raw_orders`,
    'models/customer_orders.sql': `-- Task: Replace the bare table name with {{ ref('stg_orders') }}
-- to declare the dependency between models.

select *
from stg_orders`,
  },
  seeds: {
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Replace `from stg_orders` with `from {{ ref('stg_orders') }}`, run dbt run, and watch the edge appear in the Lineage tab.",
    dagShape: {
      nodes: [
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
        { id: 'customer_orders', label: 'customer_orders', layer: 'mart' },
      ],
      edges: [{ source: 'stg_orders', target: 'customer_orders' }],
    },
  },
  validate: (state) => {
    if (!modelRefs(state, 'customer_orders', 'stg_orders'))
      return { passed: false, reason: "Replace `from stg_orders` with `from {{ ref('stg_orders') }}`." }
    if (!modelRan(state, 'customer_orders'))
      return { passed: false, reason: 'Run dbt run to build the model.' }
    return { passed: true }
  },
  badge: { id: 'first-ref', name: 'First ref()', emoji: '🔗' },
  quiz: {
    question: "What does {{ ref('model_name') }} do in a dbt model?",
    options: [
      'Imports a Jinja macro from the macros/ directory',
      'Runs a raw SQL query against the database',
      'References another dbt model and creates a DAG dependency',
      'Creates a database function named model_name',
    ],
    correctIndex: 2,
    explanation: "ref() tells dbt that this model depends on another. dbt uses this to build a DAG and ensures the referenced model is always built first, in the correct order.",
  },
}

export default level06
