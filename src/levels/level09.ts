import type { Level } from '../engine/types'
import { modelMaterialization, modelRan } from '../engine/validators'

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

const level09: Level = {
  id: 9,
  chapter: 3,
  title: 'Change a model to table',
  description: `By default dbt materializes models as views. A view is cheap to build but runs the underlying query every time it is read. For models that are queried often or are expensive to compute, building them as a table is usually a better choice.

You change the materialization with a config() block at the top of the model file:

  {{ config(materialized='table') }}

The customer_orders mart is read frequently by the analytics team. Your task: add the config() line to customer_orders.sql and run dbt run. Then look at the Database Explorer — the model should now appear under Tables instead of Views.`,
  hint: "Add this as the first line of customer_orders.sql:\n\n{{ config(materialized='table') }}",
  story: {
    messages: [
      {
        from: 'yuki',
        body: `customer_orders is taking like 4s to refresh on the dashboard 🐢 fix pls? 🙏`,
      },
      {
        from: 'priya',
        body: `try \`materialized='table'\` on it. marcus made everything a view — fine when we had 50 rows, less fine now.`,
      },
    ],
  },
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
    description: "Add {{ config(materialized='table') }} to customer_orders.sql and run dbt run.",
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
      return { passed: false, reason: 'Run dbt run to materialize the model as a table.' }
    return { passed: true }
  },
  badge: { id: 'table-time', name: 'Table Time', emoji: '🗄️' },
  quiz: {
    question: "What is the practical difference between dbt's `view` and `table` materializations?",
    options: [
      'A view stores rows; a table is a saved query',
      'A table stores rows; a view is a saved query that re-runs on read',
      'They are identical apart from naming',
      'Tables only work on incremental models',
    ],
    correctIndex: 1,
    explanation: "A table persists the result rows, so reads are fast but must be rebuilt to reflect upstream changes. A view just stores the query definition — every read re-executes it against the latest upstream data.",
  },
  docs: [
    { label: 'Materializations', url: 'https://docs.getdbt.com/docs/build/materializations' },
  ],
}

export default level09
