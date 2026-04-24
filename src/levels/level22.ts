import type { Level } from '../engine/types'
import { manuallyMarked } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR`

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25`

const level22: Level = {
  id: 22,
  chapter: 6,
  title: 'Understand staging, intermediate, and marts',
  description: `Most production dbt projects organise models into three layers. The naming is convention, not enforcement, but it's worth learning because nearly every team uses it.

Staging (stg_*)
  • One staging model per source table.
  • Cleans types, renames columns, applies light transformations.
  • Thin — rarely joins other models.

Intermediate (int_*)
  • Reusable building blocks between staging and marts.
  • Joins or reshapes staging models to compute something shared.
  • Often materialized as views or ephemeral.

Marts (dim_*, fct_*, or domain-named)
  • The final business-facing models.
  • Shape data the way stakeholders think about it.
  • Usually materialized as tables for fast reads.

Rule of thumb: if a transformation is reused by more than one mart, pull it into an intermediate model. Otherwise keep it inline.

Open each file in the explorer and trace a row of customer data from raw → stg_ → int_ → dim_. When it clicks, mark the lesson complete.`,
  hint: 'Open each .sql file and follow how one customer flows through the layers.',
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    country
from raw_customers`,
    'models/stg_orders.sql': `select
    id         as order_id,
    customer_id,
    amount,
    status
from raw_orders`,
    'models/int_customer_orders.sql': `-- Intermediate: reusable rollup of orders per customer.
select
    customer_id,
    count(*)                 as orders_count,
    coalesce(sum(amount), 0) as lifetime_value
from {{ ref('stg_orders') }}
group by customer_id`,
    'models/dim_customers.sql': `-- Mart: business-facing customer dimension.
select
    c.customer_id,
    c.customer_name,
    c.country,
    coalesce(o.orders_count, 0)  as orders_count,
    coalesce(o.lifetime_value, 0) as lifetime_value
from {{ ref('stg_customers') }} as c
left join {{ ref('int_customer_orders') }} as o
    on c.customer_id = o.customer_id`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  preRanModels: ['stg_customers', 'stg_orders', 'int_customer_orders', 'dim_customers'],
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Trace data through stg_ → int_ → dim_, then mark complete.',
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
        { id: 'int_customer_orders', label: 'int_customer_orders', layer: 'intermediate' },
        { id: 'dim_customers', label: 'dim_customers', layer: 'mart' },
      ],
      edges: [
        { source: 'stg_orders', target: 'int_customer_orders' },
        { source: 'stg_customers', target: 'dim_customers' },
        { source: 'int_customer_orders', target: 'dim_customers' },
      ],
    },
  },
  validate: (state) => {
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Trace the layers, then mark complete.' }
    return { passed: true }
  },
  badge: { id: 'layer-cake', name: 'Layer Cake', emoji: '🎂' },
  quiz: {
    question: 'Which layer is the right home for "reusable join logic shared by two marts"?',
    options: [
      'staging',
      'intermediate',
      'marts',
      'seeds',
    ],
    correctIndex: 1,
    explanation: 'Intermediate is precisely for reusable transformations that sit between staging and marts. Pulling shared logic here keeps the marts focused on presentation and prevents duplication.',
  },
}

export default level22
