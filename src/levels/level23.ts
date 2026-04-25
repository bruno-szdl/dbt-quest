import type { Level } from '../engine/types'
import { hasModel, modelRan, modelRefs, outputColumnsInclude } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const level23: Level = {
  id: 23,
  chapter: 6,
  title: 'Create an intermediate model',
  description: `Two different marts need per-customer order stats: the customer dimension wants lifetime totals, and a churn report will eventually need the same rollup. That's the signal to promote the logic into an intermediate model both marts can share.

Your task: create models/int_customer_orders.sql. It should ref() stg_orders, group by customer_id, and expose:
  • customer_id
  • orders_count
  • lifetime_value (sum of amount)

Then run dbt run and confirm the mart in dim_customers_lite joins cleanly to it.`,
  hint: "select customer_id, count(*) as orders_count, coalesce(sum(amount), 0) as lifetime_value from {{ ref('stg_orders') }} group by customer_id",
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
    'models/dim_customers_lite.sql': `-- Consumes the intermediate model you are about to create.
select
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
    description: 'Create int_customer_orders and run dbt run.',
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
    if (!hasModel(state, 'int_customer_orders'))
      return { passed: false, reason: 'Create models/int_customer_orders.sql.' }
    if (!modelRefs(state, 'int_customer_orders', 'stg_orders'))
      return { passed: false, reason: "int_customer_orders should ref({'stg_orders'})." }
    if (!modelRan(state, 'int_customer_orders'))
      return { passed: false, reason: 'Run dbt run to build int_customer_orders.' }
    if (!outputColumnsInclude(state, 'int_customer_orders', ['customer_id', 'orders_count', 'lifetime_value']))
      return { passed: false, reason: 'Output customer_id, orders_count, and lifetime_value.' }
    if (!modelRan(state, 'dim_customers_lite'))
      return { passed: false, reason: 'dim_customers_lite did not build — check the intermediate model.' }
    return { passed: true }
  },
  badge: { id: 'middle-layer', name: 'Middle Layer', emoji: '🧩' },
  quiz: {
    question: 'When should you reach for an intermediate model instead of inlining the logic in a mart?',
    options: [
      'Never — intermediate models add needless complexity',
      'Whenever the same transformation is needed by more than one downstream model',
      'Only when the mart exceeds 1000 lines of SQL',
      'Only when the upstream model is a seed',
    ],
    correctIndex: 1,
    explanation: 'Intermediate models pay for themselves when logic is shared. If two marts would otherwise reimplement the same joins or aggregations, promoting that logic to an int_ model removes the duplication.',
  },
  docs: [
    { label: 'How we structure — intermediate', url: 'https://docs.getdbt.com/best-practices/how-we-structure/3-intermediate' },
  ],
}

export default level23
