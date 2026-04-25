import type { Level } from '../engine/types'
import { manuallyMarked } from '../engine/validators'

const level28: Level = {
  id: 28,
  chapter: 8,
  title: 'Compare append vs merge',
  description: `Choosing between append and merge is almost always about whether your rows can change.

append
  • Inserts only new rows on top of what's stored.
  • Fastest strategy, no row matching required.
  • Right for immutable data: events, logs, page views, audit rows.
  • Wrong for anything where rows can be updated — stale data will stay forever.

merge
  • Matches each incoming row against the existing table by a unique_key.
  • Updates existing rows, inserts new ones.
  • Required for data where fields can change: customer dims, order status, any mutable entity.
  • Slightly more work per run than append, because of the key matching.

Rule of thumb:
  • "Does this row ever change after it's written?" → Yes: merge. No: append.

Both example models are included in this lesson so you can inspect the two config blocks side by side. When you feel confident picking one over the other, mark complete.`,
  hint: 'Open fct_events.sql and fct_customers.sql and compare their config() blocks.',
  initialFiles: {
    'models/fct_events.sql': `-- Append example: immutable events.
{{ config(
    materialized='incremental',
    incremental_strategy='append'
) }}

select
    id,
    user_id,
    event_type,
    event_at
from raw_events
`,
    'models/fct_customers.sql': `-- Merge example: mutable customer records.
{{ config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='customer_id'
) }}

select
    id         as customer_id,
    name       as customer_name,
    email,
    status,
    updated_at
from raw_customers
`,
  },
  seeds: {
    raw_events: `id,user_id,event_type,event_at
1,1,login,2024-01-05
2,2,login,2024-01-06`,
    raw_customers: `id,name,email,updated_at,status
1,Alice Martin,alice@example.com,2024-01-05,active
2,Bob Chen,bob@example.com,2024-01-17,active`,
  },
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Compare the two config blocks, then mark complete.',
    dagShape: {
      nodes: [
        { id: 'fct_events', label: 'fct_events', layer: 'mart' },
        { id: 'fct_customers', label: 'fct_customers', layer: 'mart' },
      ],
      edges: [],
    },
  },
  validate: (state) => {
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Compare append vs merge, then mark complete.' }
    return { passed: true }
  },
  badge: { id: 'strategist', name: 'Strategist', emoji: '🎯' },
  quiz: {
    question: 'A team is loading a customer_orders table where each row represents an order and order rows never change after insertion. Which incremental strategy fits best?',
    options: [
      'merge — always safer to match keys',
      'append — orders are immutable, so new rows just need to be added',
      'delete+insert — always required for fact tables',
      'snapshot — because we are tracking customers',
    ],
    correctIndex: 1,
    explanation: 'If the rows are truly immutable after insertion, append is the right fit. Merge would pay the cost of key matching with no benefit. (If later you discover a row can change — a correction, a refund — that is the signal to switch to merge.)',
  },
  docs: [
    { label: 'Incremental strategies', url: 'https://docs.getdbt.com/docs/build/incremental-strategy' },
  ],
}

export default level28
