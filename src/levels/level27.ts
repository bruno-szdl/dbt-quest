import type { Level } from '../engine/types'
import { manuallyMarked, modelMaterialization, modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,updated_at,status
1,Alice Martin,alice@example.com,2024-01-05,active
2,Bob Chen,bob@example.com,2024-01-17,active
3,Carol Silva,carol@example.com,2024-02-02,active
4,Dave Kumar,dave@example.com,2024-02-11,inactive`

const level27: Level = {
  id: 27,
  chapter: 8,
  title: 'Configure an incremental model as merge',
  description: `Append works when rows are immutable. But often records change — a customer updates their email, an order status flips from pending to completed. For that, you need merge.

The merge strategy tells dbt to match incoming rows to existing rows on a key, then:
  • Update the row if the key already exists.
  • Insert a new row otherwise.

The configuration looks like:

  {{ config(
      materialized='incremental',
      incremental_strategy='merge',
      unique_key='customer_id'
  ) }}

  select * from {{ source('raw', 'customers') }}
  {% if is_incremental() %}
    where updated_at > (select max(updated_at) from {{ this }})
  {% endif %}

\`unique_key\` is the column dbt uses to match rows. Without it, merge has no way to tell updates apart from inserts.

Your task: configure fct_customers as incremental with strategy='merge' and unique_key='customer_id'. Run dbt run and then mark complete.`,
  hint: "Inside the config() call: materialized='incremental', incremental_strategy='merge', unique_key='customer_id'.",
  initialFiles: {
    'models/fct_customers.sql': `-- Task: configure as incremental+merge on customer_id.

{{ config(
    materialized='table'
) }}

select
    id         as customer_id,
    name       as customer_name,
    email,
    status,
    updated_at
from raw_customers`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run'],
  manualCompletion: true,
  goal: {
    description: 'Configure fct_customers as incremental+merge on customer_id, run it, then mark complete.',
    dagShape: {
      nodes: [{ id: 'fct_customers', label: 'fct_customers', layer: 'mart' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelMaterialization(state, 'fct_customers', 'incremental'))
      return { passed: false, reason: "Set materialized='incremental'." }
    const sql = state.files['models/fct_customers.sql'] ?? ''
    if (!/incremental_strategy\s*=\s*['"]merge['"]/.test(sql))
      return { passed: false, reason: "Add incremental_strategy='merge'." }
    if (!/unique_key\s*=\s*['"][^'"]+['"]/.test(sql))
      return { passed: false, reason: "Add unique_key='customer_id'." }
    if (!modelRan(state, 'fct_customers'))
      return { passed: false, reason: 'Run dbt run to build fct_customers.' }
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Mark the lesson complete once you have run it.' }
    return { passed: true }
  },
  badge: { id: 'merge-master', name: 'Merge Master', emoji: '🔀' },
  quiz: {
    question: "Why does the merge strategy need a unique_key?",
    options: [
      'Because merge only works on indexed columns',
      'Because dbt uses it to decide whether an incoming row is an update or an insert',
      "It's purely documentation — merge works without it",
      'Because merge builds a separate audit log keyed by that column',
    ],
    correctIndex: 1,
    explanation: 'Without a unique_key, merge has no way to know which existing row corresponds to an incoming row. The key is what turns "update or insert" into a deterministic decision.',
  },
  docs: [
    { label: 'Incremental strategies — merge', url: 'https://docs.getdbt.com/docs/build/incremental-strategy#merge-strategy' },
  ],
}

export default level27
