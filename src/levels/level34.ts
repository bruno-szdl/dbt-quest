import type { Level } from '../engine/types'
import { modelMaterialization, modelRan } from '../engine/validators'

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level34: Level = {
  id: 34,
  chapter: 9,
  title: 'Configure an intermediate model as ephemeral',
  description: `Sometimes you want a reusable chunk of SQL without creating a new object in the warehouse. That's what ephemeral models are for.

An ephemeral model is never built as a view or table. Instead, every downstream model that ref()s it gets the ephemeral's SQL inlined as a CTE at compile time.

Why use it?
  • Intermediate logic that's only used by one or two downstream models.
  • Cuts down on warehouse clutter and storage.
  • Trade-off: if many models reuse the same ephemeral, it's recomputed every time.

Your task: change int_customer_orders to materialized='ephemeral', then run dbt run. Look at the Database Explorer afterwards — int_customer_orders should NOT appear there anymore, but dim_customers_lite should still build successfully.`,
  hint: "Add {{ config(materialized='ephemeral') }} as the first line of int_customer_orders.sql, then run dbt run.",
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    country
from raw_customers`,
    'models/stg_orders.sql': `select
    id         as order_id,
    customer_id,
    amount,
    status
from raw_orders`,
    'models/int_customer_orders.sql': `-- Task: make this model ephemeral.
-- Add {{ config(materialized='ephemeral') }} at the top, then run dbt run.

select
    customer_id,
    count(*)                  as orders_count,
    coalesce(sum(amount), 0)  as lifetime_value
from {{ ref('stg_orders') }}
group by customer_id`,
    'models/dim_customers_lite.sql': `select
    c.customer_id,
    c.customer_name,
    c.country,
    coalesce(o.orders_count, 0)   as orders_count,
    coalesce(o.lifetime_value, 0) as lifetime_value
from {{ ref('stg_customers') }} as c
left join {{ ref('int_customer_orders') }} as o
    on c.customer_id = o.customer_id`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Make int_customer_orders ephemeral and run dbt run.",
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
        { id: 'int_customer_orders', label: 'int_customer_orders', layer: 'intermediate' },
        { id: 'dim_customers_lite', label: 'dim_customers_lite', layer: 'mart' },
      ],
      edges: [
        { source: 'stg_orders', target: 'int_customer_orders' },
        { source: 'stg_customers', target: 'dim_customers_lite' },
        { source: 'int_customer_orders', target: 'dim_customers_lite' },
      ],
    },
  },
  validate: (state) => {
    if (!modelMaterialization(state, 'int_customer_orders', 'ephemeral'))
      return { passed: false, reason: "Add {{ config(materialized='ephemeral') }} to int_customer_orders.sql." }
    if (!modelRan(state, 'dim_customers_lite'))
      return { passed: false, reason: 'Run dbt run. dim_customers_lite should still build.' }
    return { passed: true }
  },
  badge: { id: 'ghost-model', name: 'Ghost Model', emoji: '👻' },
  quiz: {
    question: 'What does dbt do when a model is configured as ephemeral?',
    options: [
      'Builds it as a temporary table that expires after the run',
      'Skips materialization and inlines its SQL as a CTE into downstream models',
      'Refuses to run it unless another model ref()s it',
      'Creates a materialized view that refreshes on every query',
    ],
    correctIndex: 1,
    explanation: "Ephemeral models are never objects in the warehouse. dbt takes their compiled SQL and inlines it as a CTE into every downstream model that ref()s them.",
  },
  docs: [
    { label: 'Materializations — ephemeral', url: 'https://docs.getdbt.com/docs/build/materializations#ephemeral' },
  ],
}

export default level34
