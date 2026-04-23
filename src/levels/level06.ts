import type { Level } from '../engine/types'
import { modelRefs, modelRan } from '../engine/validators'

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

const level06: Level = {
  id: 6,
  chapter: 2,
  title: 'Joining models',
  description: `So far, customers and orders live in separate models. But the analytics team needs a combined view: which customers placed which orders?

In dbt, you can JOIN models together using ref() for both tables. The DAG will show both dependencies as arrows pointing into the new model.

The customer_orders model already references stg_customers. Your task: add a JOIN to stg_orders using {{ ref('stg_orders') }}, connecting the two on customer_id. Then run dbt run.`,
  hint: "After the FROM clause, add:\njoin {{ ref('stg_orders') }} as o\n    on c.customer_id = o.customer_id\nAlso add o.order_id, o.amount, o.status to the SELECT list.",
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
    'models/customer_orders.sql': `-- Task: Add a join to stg_orders using {{ ref('stg_orders') }}.
-- Match customers and orders on customer_id.

select
    c.customer_id,
    c.customer_name,
    c.country
from {{ ref('stg_customers') }} as c`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Add a JOIN to {{ ref('stg_orders') }} in customer_orders, then run dbt run.",
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
    if (!modelRefs(state, 'customer_orders', 'stg_customers'))
      return { passed: false, reason: "Use {{ ref('stg_customers') }} in customer_orders.sql." }
    if (!modelRefs(state, 'customer_orders', 'stg_orders'))
      return { passed: false, reason: "Add a JOIN to {{ ref('stg_orders') }} in customer_orders.sql." }
    if (!modelRan(state, 'customer_orders'))
      return { passed: false, reason: 'Run dbt run to build the model.' }
    return { passed: true }
  },
  badge: { id: 'first-join', name: 'First Join', emoji: '🤝' },
}

export default level06
