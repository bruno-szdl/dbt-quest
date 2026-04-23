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

const level05: Level = {
  id: 5,
  chapter: 2,
  title: 'Using ref()',
  description: `When a model depends on another model, you should reference it using {{ ref('model_name') }} instead of the table name directly.

Using ref() does two important things:
  1. It tells dbt about the dependency, so models are built in the right order.
  2. It makes the dependency visible in the DAG (the lineage graph on the right).

The customer_orders model currently references stg_orders as a bare table name. Your task: replace it with {{ ref('stg_orders') }}, then run dbt run and watch the DAG update.`,
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
    description: "Replace `from stg_orders` with `from {{ ref('stg_orders') }}`, then run dbt run.",
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
}

export default level05
