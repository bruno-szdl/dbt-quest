import type { Level } from '../engine/types'
import { hasModel, modelRan, modelRefs, outputColumnsInclude } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,status,updated_at
1,Alice Martin,alice@example.com,active,2024-01-05
2,Bob Chen,bob@example.com,active,2024-01-17
3,Carol Silva,carol@example.com,active,2024-02-02`

const level43: Level = {
  id: 43,
  chapter: 12,
  title: 'Build a model that consumes a snapshot',
  description: `A snapshot captures history, but dashboards rarely query it directly — they want shapes like "active customers right now" or "the customer table as of June 1". The fix is the same as for any raw input: build a model on top of the snapshot.

snap_customers has already been captured for you (you can preview it with \`dbt show --select snap_customers\` to confirm). Each row carries the SCD-2 columns dbt added: \`dbt_valid_from\`, \`dbt_valid_to\`, \`dbt_updated_at\`. The convention:

  • \`dbt_valid_to IS NULL\`  →  this is the current version of the row.
  • \`dbt_valid_to IS NOT NULL\` → this row was the truth from valid_from to valid_to.

Your task: complete models/dim_customers_active.sql so it ref()s snap_customers and returns only the rows that are currently active (i.e. \`dbt_valid_to IS NULL\`). Output \`customer_id\`, \`customer_name\`, \`email\`, \`status\`. Then run dbt run.

When to use snapshots — quick reference

Good fits
  • A dimension whose rows mutate and you care about history (customers, employees, products).
  • A source that arrives as current state only, where the team will eventually ask "what did this look like on day X?".

Bad fits
  • Append-only data (events, logs) — the raw table is already history.
  • Data where only "current" matters — adds noise without benefit.
  • Data already modelled as SCD-2 upstream.`,
  hint: "Filter with `where dbt_valid_to is null` and select customer_id, customer_name, email, status from {{ ref('snap_customers') }}.",
  story: {
    messages: [
      {
        from: 'sofie',
        body: `For my "active customers" tile, can we have a clean view of the snapshot — just the live rows? I don't need the historical versions in the dashboard, just the current state with history available if I ever ask.`,
      },
      {
        from: 'priya',
        body: `easy — dim_customers_active on top of snap_customers, filter dbt_valid_to is null. that's the standard pattern.`,
      },
    ],
  },
  initialFiles: {
    'seeds/raw_customers.csv': RAW_CUSTOMERS,
    'snapshots/snap_customers.sql': `{% snapshot snap_customers %}
{{ config(
    target_schema='snapshots',
    strategy='timestamp',
    unique_key='customer_id',
    updated_at='updated_at'
) }}

select
    id         as customer_id,
    name       as customer_name,
    email,
    status,
    updated_at
from raw_customers

{% endsnapshot %}
`,
    'models/dim_customers_active.sql': `-- Task: ref({'snap_customers'}) and filter to dbt_valid_to IS NULL.
-- Select customer_id, customer_name, email, status.

select
    customer_id,
    customer_name,
    email,
    status
from raw_customers`,
  },
  seeds: {},
  preRanSnapshots: ['snap_customers'],
  requiredSteps: ['files', 'run'],
  goal: {
    description: 'Build dim_customers_active on top of snap_customers, then run dbt run.',
    dagShape: {
      nodes: [
        { id: 'raw_customers', label: 'raw_customers', layer: 'source' },
        { id: 'snap_customers', label: 'snap_customers', layer: 'intermediate' },
        { id: 'dim_customers_active', label: 'dim_customers_active', layer: 'mart' },
      ],
      edges: [
        { source: 'raw_customers', target: 'snap_customers' },
        { source: 'snap_customers', target: 'dim_customers_active' },
      ],
    },
  },
  validate: (state) => {
    if (!hasModel(state, 'dim_customers_active'))
      return { passed: false, reason: 'Create models/dim_customers_active.sql.' }
    if (!modelRefs(state, 'dim_customers_active', 'snap_customers'))
      return { passed: false, reason: "dim_customers_active should ref({'snap_customers'})." }
    const sql = state.files['models/dim_customers_active.sql'] ?? ''
    if (!/dbt_valid_to\s+is\s+null/i.test(sql))
      return { passed: false, reason: 'Filter to current rows with `where dbt_valid_to is null`.' }
    if (!modelRan(state, 'dim_customers_active'))
      return { passed: false, reason: 'Run dbt run to build dim_customers_active.' }
    if (!outputColumnsInclude(state, 'dim_customers_active', ['customer_id', 'customer_name', 'email', 'status']))
      return { passed: false, reason: 'Include customer_id, customer_name, email, and status in the SELECT.' }
    return { passed: true }
  },
  badge: {
    id: 'snapshot-consumer',
    name: 'History Reader',
    emoji: '📖',
    caption: 'Live rows on tap, history on demand',
  },
  quiz: {
    question: 'Why does the consumer model filter `dbt_valid_to IS NULL`?',
    options: [
      'It rebuilds the snapshot from scratch',
      'It removes deleted rows from the source table',
      'It keeps only the current version of each row, hiding the SCD-2 history rows',
      'It is required for the snapshot to validate',
    ],
    correctIndex: 2,
    explanation: 'Snapshot tables hold every historical version of a row. `dbt_valid_to IS NULL` is the SCD-2 convention for "this row is the current truth" — perfect for a "live customers" mart. To build a point-in-time view, you would filter on a specific date instead.',
  },
  docs: [
    { label: 'About snapshots', url: 'https://docs.getdbt.com/docs/build/snapshots' },
  ],
}

export default level43
