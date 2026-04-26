import type { Level } from '../engine/types'
import { modelRefs, modelRan, outputColumnsInclude } from '../engine/validators'

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

const level08: Level = {
  id: 8,
  chapter: 2,
  title: 'Join models using ref()',
  description: `Models can be joined just like regular tables. A common pattern is to join two cleaned staging models into a wider dataset for analysis.

It's almost always better to join transformed models (via ref()) than to join raw tables directly. Staging does the cleanup once and downstream models inherit it.

The customer_orders model already refs stg_customers. Your task: add a JOIN to \`{{ ref('stg_orders') }}\` matching on customer_id, and include order_id and amount in the SELECT. Then run dbt run.`,
  hint: "After the FROM clause, add:\n  join {{ ref('stg_orders') }} as o\n    on c.customer_id = o.customer_id\nand add o.order_id, o.amount to the SELECT list.",
  story: {
    messages: [
      {
        from: 'yuki',
        body: `omg can we have customer + their orders in one place? i'm about to do the join manually in a notebook and i'll cry 😭`,
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
    'models/customer_orders.sql': `-- Task: add a join to {{ ref('stg_orders') }}
-- matching orders to customers on customer_id.

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
    description: "Join {{ ref('stg_orders') }} into customer_orders and run dbt run.",
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
    if (!outputColumnsInclude(state, 'customer_orders', ['customer_id', 'order_id']))
      return { passed: false, reason: 'Include both customer_id and order_id in the output.' }
    return { passed: true }
  },
  badge: { id: 'first-join', name: 'First Join', emoji: '🤝' },
  quiz: {
    question: 'When two models are joined via ref(), what does dbt guarantee?',
    options: [
      'Both models are rebuilt in parallel',
      'Each upstream model exists and is up to date before the joined model runs',
      'A database index is created for the join key',
      'Rows are deduplicated automatically',
    ],
    correctIndex: 1,
    explanation: 'dbt walks the DAG in topological order. Any model referenced via ref() is guaranteed to be built before the model that depends on it.',
  },
  docs: [
    { label: 'About `ref` function', url: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref' },
  ],
}

export default level08
