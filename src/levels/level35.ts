import type { Level } from '../engine/types'
import { manuallyMarked, modelRan } from '../engine/validators'

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15`

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level35: Level = {
  id: 35,
  chapter: 10,
  title: 'See how ephemeral is inlined',
  description: `If an ephemeral model is never created in the warehouse, where does its SQL actually end up?

Answer: it gets pasted into every downstream model, as a CTE at the top. You can see this by running \`dbt compile --select dim_customers_lite\` — dbt prints the final SQL that will actually run, with the ephemeral model inlined.

Your task: run \`dbt compile --select dim_customers_lite\` and read the compiled output in the terminal. You should see a CTE named "int_customer_orders" right before the SELECT — that's the ephemeral model, inlined. When it clicks, mark the lesson complete.`,
  hint: 'Run `dbt compile --select dim_customers_lite` and scroll the terminal output.',
  story: {
    messages: [
      {
        from: 'priya',
        body: `wanna show you what's actually running. \`dbt compile --select dim_customers_lite\` — you'll see the int model pasted in as a CTE. that's the trade-off of ephemeral.`,
      },
    ],
  },
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
    'models/int_customer_orders.sql': `{{ config(materialized='ephemeral') }}
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
  preRanModels: ['stg_customers', 'stg_orders', 'dim_customers_lite'],
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Run `dbt compile --select dim_customers_lite`, read the inlined CTE, then mark complete.',
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
    if (!modelRan(state, 'dim_customers_lite'))
      return { passed: false, reason: 'dim_customers_lite should already be built. Try resetting the level.' }
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Run `dbt compile` on dim_customers_lite, then mark complete.' }
    return { passed: true }
  },
  badge: { id: 'inlined', name: 'Inlined', emoji: '📎' },
  quiz: {
    question: "What is the trade-off of using ephemeral models heavily?",
    options: [
      'They require a special database permission to run',
      'Their SQL is recomputed inline every time a downstream model runs — shared logic is not cached',
      'They always build slower than regular views',
      'They can only reference seeds, not other models',
    ],
    correctIndex: 1,
    explanation: "Because ephemerals are inlined as CTEs, the same logic is re-executed inside every downstream model. If many models share a heavy ephemeral, making it a view or table is usually better so the work happens once.",
  },
  docs: [
    { label: 'Materializations — ephemeral', url: 'https://docs.getdbt.com/docs/build/materializations#ephemeral' },
  ],
}

export default level35
