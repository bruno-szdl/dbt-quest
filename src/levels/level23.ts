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
  chapter: 7,
  title: 'Build a final mart',
  description: `Staging cleans raw data. Marts are the final, business-facing models that dashboards read. A good mart is shaped for analysis: descriptive names, one row per entity, only the columns people need.

Create models/dim_customers.sql that joins stg_customers and stg_orders into one row per customer with columns customer_id, customer_name, country, orders_count, lifetime_value. Then run dbt run.`,
  hint: "Use `count(o.order_id) as orders_count` and `coalesce(sum(o.amount), 0) as lifetime_value`. Left join stg_orders so customers with no orders still appear. Group by customer_id, customer_name, country.",
  story: {
    messages: [
      {
        from: 'yuki',
        time: '11:02',
        body: `heyyy i'm building Sofie's Q2 retention deck and i keep joining stg_customers + stg_orders by hand in like three different notebooks 😩 can we make a real customer table i can just point at?

one row per customer. name, country, total orders, total spend. that's it. flat whites for life 🙏`,
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
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: 'Create models/dim_customers.sql with orders_count and lifetime_value, then run dbt run.',
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
        { id: 'dim_customers', label: 'dim_customers', layer: 'mart' },
      ],
      edges: [
        { source: 'stg_customers', target: 'dim_customers' },
        { source: 'stg_orders', target: 'dim_customers' },
      ],
    },
  },
  validate: (state) => {
    if (!hasModel(state, 'dim_customers'))
      return { passed: false, reason: 'Create models/dim_customers.sql.' }
    if (!modelRefs(state, 'dim_customers', 'stg_customers') || !modelRefs(state, 'dim_customers', 'stg_orders'))
      return { passed: false, reason: 'dim_customers should ref() both stg_customers and stg_orders.' }
    if (!modelRan(state, 'dim_customers'))
      return { passed: false, reason: 'Run dbt run to build dim_customers.' }
    if (!outputColumnsInclude(state, 'dim_customers', ['customer_id', 'customer_name', 'orders_count', 'lifetime_value']))
      return { passed: false, reason: 'Include customer_id, customer_name, orders_count, and lifetime_value.' }
    return { passed: true }
  },
  badge: { id: 'mart-maker', name: 'Mart Maker', emoji: '🏛️' },
  quiz: {
    question: 'What is the primary job of a mart model?',
    options: [
      'To clean up raw column types and names',
      'To present business-ready data for analytics and reporting',
      'To store a replica of the raw tables for auditing',
      'To define generic tests shared across the project',
    ],
    correctIndex: 1,
    explanation: 'Marts are the final outputs — what dashboards query. They are shaped for how the business thinks (dim_customers, fct_orders), not for how the raw data arrived.',
  },
  docs: [
    { label: 'How we structure — marts', url: 'https://docs.getdbt.com/best-practices/how-we-structure/4-marts' },
  ],
}

export default level23
