import type { Level } from '../engine/types'
import { modelMaterialization, modelRan } from '../engine/validators'

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

const level08: Level = {
  id: 7,
  chapter: 3,
  title: 'Change materialization',
  description: `By default, dbt builds models as views — lightweight SQL wrappers that re-run the query every time someone reads them. For models that are queried frequently or are expensive to compute, building them as tables is more efficient.

You control this with the config() block at the top of a model file:

  {{ config(materialized='table') }}

The customer_orders model is used heavily by the analytics team. Your task: add the config block at the top of the file to materialize it as a table, then run dbt run.`,
  hint: "Add this as the very first line of customer_orders.sql:\n\n{{ config(materialized='table') }}",
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/stg_orders.sql': `select
    id         as order_id,
    customer_id,
    amount,
    status,
    created_at
from raw_orders`,
    'models/customer_orders.sql': `select
    c.customer_id,
    c.customer_name,
    c.country,
    o.order_id,
    o.amount,
    o.status
from {{ ref('stg_customers') }} as c
join {{ ref('stg_orders') }} as o
    on c.customer_id = o.customer_id`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Add {{ config(materialized='table') }} to customer_orders.sql, then run dbt run.",
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
        { id: 'customer_orders', label: 'customer_orders', layer: 'mart' },
      ],
      edges: [
        { source: 'stg_customers', target: 'customer_orders' },
        { source: 'stg_orders', target: 'customer_orders' },
      ],
    },
  },
  validate: (state) => {
    if (!modelMaterialization(state, 'customer_orders', 'table'))
      return { passed: false, reason: "Add {{ config(materialized='table') }} at the top of customer_orders.sql." }
    if (!modelRan(state, 'customer_orders'))
      return { passed: false, reason: 'Run dbt run to materialize it as a table.' }
    return { passed: true }
  },
  badge: { id: 'table-time', name: 'Table Time', emoji: '🗄️' },
  quiz: {
    question: "What is the key difference between dbt's 'view' and 'table' materializations?",
    options: [
      'A view stores results physically; a table re-runs the query each time',
      'A table stores results physically; a view re-runs the query each time',
      'They are identical — materialization only affects naming conventions',
      'Tables only work with models that use ref()',
    ],
    correctIndex: 1,
    explanation: "A 'view' is a saved query that runs on every SELECT — great for small data and always fresh. A 'table' physically stores the results, making reads much faster but requiring a rebuild to reflect upstream changes.",
  },
}

export default level08
