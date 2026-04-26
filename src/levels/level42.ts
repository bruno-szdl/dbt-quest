import type { Level } from '../engine/types'
import { buildSucceeded, modelMaterialization, outputColumnsInclude } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,,2024-02-02,BR
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

const level42: Level = {
  id: 42,
  chapter: 12,
  title: 'Fix the broken project',
  description: `The marts team needs the customer dimension shipped today. The previous engineer left a half-finished pipeline before going on leave — it's almost there, but something's broken at every level.

Your task: get \`dbt build\` green and ship dim_customers as a real, queryable table.

There are five things wrong. Run \`dbt build\`, read the error from top to bottom, fix one thing, run again, repeat. The last bug won't show up as an error — it's an architecture mistake the validator catches once the build is green.

Everything you've learned in the course is in scope: sources, refs, tests, materializations, basic SQL fluency. Read the dbt errors carefully — they almost always tell you what's wrong.`,
  hint: `There are five bugs. Categories, no spoilers:
  • One staging model reads from the wrong place (where's the source() call?).
  • One staging model lets through a row that breaks not_null (think: WHERE clause).
  • One intermediate model has a typo in ref().
  • One intermediate model has a typo in a column name (read the DuckDB error closely).
  • dim_customers is configured wrong for what a mart should be.`,
  story: {
    messages: [
      {
        from: 'sofie',
        time: '22:41',
        body: `Board's at 9am tomorrow. Marcus's old dim_customers won't build. I tried to trace it and gave up. Whatever it takes — please make it green by morning. I'm in the office if you need me.`,
      },
      {
        from: 'priya',
        time: '22:53',
        body: `five bugs by my count. dbt's errors are usually right — read top to bottom, fix one, rerun. you've seen all of these before. you've got this.`,
      },
    ],
  },
  initialFiles: {
    'models/sources.yml': `version: 2

sources:
  - name: raw
    tables:
      - name: customers
      - name: orders
`,
    'models/schema.yml': `version: 2

models:
  - name: stg_customers
    columns:
      - name: customer_id
        tests:
          - not_null
          - unique
      - name: email
        tests:
          - not_null

  - name: stg_orders
    columns:
      - name: order_id
        tests:
          - not_null
          - unique
      - name: customer_id
        tests:
          - not_null

  - name: int_customer_orders
    columns:
      - name: customer_id
        tests:
          - not_null
          - unique
`,
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    country
from {{ source('raw', 'customers') }}`,
    'models/stg_orders.sql': `select
    id         as order_id,
    customer_id,
    amount,
    status
from raw_orders`,
    'models/int_customer_orders.sql': `select
    customer_id,
    count(*)                as orders_count,
    coalesce(sum(amout), 0) as lifetime_value
from {{ ref('stg_order') }}
group by customer_id`,
    'models/dim_customers.sql': `{{ config(materialized='ephemeral') }}

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
    'raw.customers': RAW_CUSTOMERS,
    'raw.orders': RAW_ORDERS,
  },
  requiredSteps: ['files', 'run', 'test'],
  goal: {
    description: 'Find the five bugs, get `dbt build` green, and ship dim_customers as a table.',
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
        { id: 'int_customer_orders', label: 'int_customer_orders', layer: 'intermediate' },
        { id: 'dim_customers', label: 'dim_customers', layer: 'mart' },
      ],
      edges: [
        { source: 'stg_customers', target: 'dim_customers' },
        { source: 'stg_orders', target: 'int_customer_orders' },
        { source: 'int_customer_orders', target: 'dim_customers' },
      ],
    },
  },
  validate: (state) => {
    if (!buildSucceeded(state))
      return {
        passed: false,
        reason: 'Run `dbt build` and read the error from the terminal. Fix the failing model or test, then run again.',
      }
    if (!modelMaterialization(state, 'dim_customers', 'table'))
      return {
        passed: false,
        reason: 'dbt build is green, but dim_customers is configured as ephemeral — marts need to be real warehouse objects (materialized: table) so dashboards can query them.',
      }
    if (!outputColumnsInclude(state, 'dim_customers', ['customer_id', 'customer_name', 'orders_count', 'lifetime_value']))
      return {
        passed: false,
        reason: 'dim_customers is missing one of customer_id, customer_name, orders_count, lifetime_value.',
      }
    return { passed: true }
  },
  badge: {
    id: 'dbt-graduate',
    name: 'dbt Graduate',
    emoji: '🎓',
    caption: 'Board deck shipped at 6am',
  },
  quiz: {
    question: 'When `dbt build` finishes green, does that mean your project is correct?',
    options: [
      'Yes — green means production-ready',
      'Mostly — green proves SQL compiles and declared tests pass, but architectural choices (materialization, descriptions, layering) are not enforced',
      'Only if every model has both not_null and unique tests',
      'Only if there are no warnings printed in the terminal',
    ],
    correctIndex: 1,
    explanation: '`dbt build` is necessary but not sufficient. It guarantees that your SQL compiles and your declared tests pass — that\'s a real safety net. But it can\'t tell you that a mart should have been a table instead of an ephemeral, or that a column without a description will confuse your next teammate. Architectural decisions still need a human eye on them.',
  },
  docs: [
    { label: 'About `dbt build`', url: 'https://docs.getdbt.com/reference/commands/build' },
    { label: 'Materializations', url: 'https://docs.getdbt.com/docs/build/materializations' },
  ],
}

export default level42
