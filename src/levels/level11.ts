import type { Level } from '../engine/types'
import { manuallyMarked } from '../engine/validators'

// Intentionally contains issues: a NULL email (id=3) and a duplicate customer id (5 twice).
const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE
5,Eve Müller,eve+dup@example.com,2024-03-02,DE`

const level11: Level = {
  id: 11,
  chapter: 4,
  title: 'Find a data issue',
  description: `A model can run and still produce bad data. "It ran" only tells you the SQL was syntactically valid — not that the rows are correct.

The two most common data quality issues:
  • NULLs where a value should always exist (an id, an email).
  • Duplicates on a column that should be unique (a customer id).

Run \`dbt show --select stg_customers\` and look at the rows. Both problems are hiding in the result. Once you have spotted them, mark the lesson complete below.`,
  hint: 'Run `dbt show --select stg_customers` and scan the customer_id and email columns.',
  story: {
    messages: [
      {
        from: 'sofie',
        time: '16:52',
        body: `Quick one — last week's revenue shows 124k in Yuki's dashboard and 119k in mine. Same source. Series B prep is starting; I need to know which is wrong by EOD.`,
      },
      {
        from: 'priya',
        time: '16:58',
        body: `my bet's stg_customers — marcus dumped raw friday and there's a dirty row in there somewhere. preview it (\`dbt show --select stg_customers\`) and tell me what you see. don't fix anything yet, we'll write a test next.`,
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
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  preRanModels: ['stg_customers'],
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Preview stg_customers, spot the data issues, then mark complete.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Preview the model, spot the issues, then mark complete.' }
    return { passed: true }
  },
  badge: {
    id: 'data-detective',
    name: 'Data Detective',
    emoji: '🕵️',
    caption: "Sofie's first Slack — survived",
  },
  quiz: {
    question: 'Which of the following does NOT indicate a data quality problem?',
    options: [
      'A NULL value in a column that should always have a value',
      'A duplicate id in a column meant to be unique',
      'A row count that changes between runs because upstream data changed',
      'A status column whose value occasionally updates for the same row',
    ],
    correctIndex: 2,
    explanation: 'Row counts changing over time is normal — data evolves, and so do mutable columns like status. NULLs in non-nullable columns and duplicates on identifiers, on the other hand, are classic quality issues and the main target of dbt tests.',
  },
  docs: [
    { label: 'About data tests', url: 'https://docs.getdbt.com/docs/build/data-tests' },
  ],
}

export default level11
