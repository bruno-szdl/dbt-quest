import type { Level } from '../engine/types'
import { allTestsPass, modelRan, modelRefs } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,country
1,Alice Martin,alice@example.com,US
2,Bob Chen,bob@example.com,CA
3,Carol Silva,carol@example.com,BR
4,Dave Kumar,dave@example.com,IN
5,Eve Müller,eve@example.com,DE`

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const level16: Level = {
  id: 16,
  chapter: 4,
  title: 'When green is wrong',
  description: `So far the lesson has been: write tests, run them, treat failures as truth. Now the harder lesson: tests passing does NOT mean the model is correct.

Tests check column-level invariants — "this is unique", "this is not null", "this is in the allowed set". They cannot check that the SQL is asking the right question. A model can build, all tests can pass, and the answer can still be wrong.

The pattern shows up constantly in real projects:
  • A WHERE clause that filters the wrong status.
  • A JOIN on the wrong key.
  • A SUM() over the wrong column.

dbt-quest sets up the classic version below. dim_customer_revenue is supposed to sum each customer's completed-order revenue. The previous engineer left a one-character bug in the JOIN's WHERE clause. Tests on customer_id are clean — and will stay clean — but the revenue numbers are obviously wrong once you look at them.

Your task: run \`dbt build\` and watch it pass. Then run \`dbt show --select dim_customer_revenue\` and read the lifetime_value column. Total revenue across all five customers should be in the hundreds, not under $30. Find the bug, fix it, rebuild. The lesson completes once the model rebuilds and the SQL no longer filters on \`'pending'\`.`,
  hint: "Open dim_customer_revenue.sql and look at the join condition. The status filter should match completed orders, not pending ones.",
  story: {
    messages: [
      {
        from: 'sofie',
        time: '14:20',
        body: `The revenue tile is showing $27 for the whole quarter. Last quarter we did $440. Yuki built it on tests-passing dim_customer_revenue. Something's wrong but I don't know what.`,
      },
      {
        from: 'priya',
        body: `\`dbt build\` is green though. classic — tests don't catch logic bugs. preview the model, look at the numbers, and you'll see it. one wrong word in the JOIN filter.`,
      },
    ],
  },
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
    status,
    created_at
from raw_orders`,
    'models/dim_customer_revenue.sql': `-- Sum each customer's completed-order revenue.
-- Tests pass. Numbers do not. Find the bug.

select
    c.customer_id,
    c.customer_name,
    coalesce(sum(o.amount), 0) as lifetime_value
from {{ ref('stg_customers') }} as c
left join {{ ref('stg_orders') }} as o
    on c.customer_id = o.customer_id
    and o.status = 'pending'
group by c.customer_id, c.customer_name`,
    'models/schema.yml': `version: 2

models:
  - name: dim_customer_revenue
    columns:
      - name: customer_id
        tests:
          - not_null
          - unique
`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run', 'test'],
  goal: {
    description: 'Run dbt build (it passes), preview the data, find the logic bug, fix it.',
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
        { id: 'dim_customer_revenue', label: 'dim_customer_revenue', layer: 'mart' },
      ],
      edges: [
        { source: 'stg_customers', target: 'dim_customer_revenue' },
        { source: 'stg_orders', target: 'dim_customer_revenue' },
      ],
    },
  },
  validate: (state) => {
    if (!modelRefs(state, 'dim_customer_revenue', 'stg_customers') || !modelRefs(state, 'dim_customer_revenue', 'stg_orders'))
      return { passed: false, reason: 'Keep both ref() calls in dim_customer_revenue.' }
    if (!modelRan(state, 'dim_customer_revenue'))
      return { passed: false, reason: 'Run dbt run (or dbt build) so the model rebuilds.' }
    if (!allTestsPass(state, 'dim_customer_revenue'))
      return { passed: false, reason: 'Tests should still pass after the fix — run dbt test (or dbt build).' }
    const sql = state.files['models/dim_customer_revenue.sql'] ?? ''
    if (/status\s*=\s*'pending'/.test(sql))
      return { passed: false, reason: "The status filter still says 'pending' — that's the bug. Real revenue is in completed orders." }
    if (!/status\s*=\s*'completed'/.test(sql))
      return { passed: false, reason: "Filter the join to status = 'completed' so completed orders are summed." }
    return { passed: true }
  },
  badge: {
    id: 'sharper-eyes',
    name: 'Sharper Eyes',
    emoji: '🔬',
    caption: 'Green is not the same as right',
  },
  quiz: {
    question: 'Your `dbt build` finishes green. What does that actually prove?',
    options: [
      'The model is production-ready and the answer is correct',
      'Every column-level test passed and the SQL compiled — but logic bugs in the SQL itself are invisible to dbt',
      'The data is fresh and uses the latest source rows',
      'Stakeholders have signed off on the numbers',
    ],
    correctIndex: 1,
    explanation: 'Tests catch column invariants (NULLs, duplicates, accepted values). They cannot catch a wrong filter, wrong join, or wrong aggregation. "Green build, wrong answer" is one of the most common shipping bugs in data work — preview the data, sanity-check the magnitudes, sense-check against what you know.',
  },
  docs: [
    { label: 'About data tests', url: 'https://docs.getdbt.com/docs/build/data-tests' },
  ],
}

export default level16
