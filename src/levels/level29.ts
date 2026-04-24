import type { Level } from '../engine/types'
import { snapshotRanAtLeast } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,status,updated_at
1,Alice Martin,alice@example.com,active,2024-01-05
2,Bob Chen,bob@example.com,active,2024-01-17
3,Carol Silva,carol@example.com,active,2024-02-02`

const level29: Level = {
  id: 29,
  chapter: 9,
  title: 'Configure and run a snapshot',
  description: `Sources change over time — customers update their email, orders change status, a plan tier gets downgraded. Most of the time, the source only shows you the current state.

Snapshots are dbt's answer to "what did this row look like last month?". They watch a source table and, every time a tracked column changes, keep a new historical version of the row alongside the current one.

A snapshot is declared in a .sql file under \`snapshots/\` with a special config:

  {% snapshot snap_customers %}
  {{ config(
      target_schema='snapshots',
      strategy='timestamp',
      unique_key='customer_id',
      updated_at='updated_at'
  ) }}
  select ... from ...
  {% endsnapshot %}

Key pieces:
  • \`unique_key\` — how to identify a row across runs.
  • \`strategy='timestamp'\` — detect changes using a column like \`updated_at\`.
  • \`strategy='check'\` — alternative that compares specific columns row-by-row.

The starter snap_customers.sql is missing \`unique_key\` and \`updated_at\`. Fill them in, then run \`dbt snapshot\`. dbt-quest will create the snapshot table with SCD-2 columns (dbt_valid_from, dbt_valid_to, dbt_updated_at). Once it runs, use \`dbt show --select snap_customers\` to see the captured rows.`,
  hint: "Add `unique_key='customer_id'` and `updated_at='updated_at'` to the config block, then run `dbt snapshot`.",
  initialFiles: {
    'snapshots/snap_customers.sql': `{% snapshot snap_customers %}
{{ config(
    target_schema='snapshots',
    strategy='timestamp'
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
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files'],
  goal: {
    description: 'Complete the snapshot config and run `dbt snapshot`.',
    dagShape: {
      nodes: [
        { id: 'raw_customers', label: 'raw_customers', layer: 'source' },
        { id: 'snap_customers', label: 'snap_customers', layer: 'intermediate' },
      ],
      edges: [{ source: 'raw_customers', target: 'snap_customers' }],
    },
  },
  validate: (state) => {
    const sql = state.files['snapshots/snap_customers.sql'] ?? ''
    if (!/unique_key\s*=\s*['"][^'"]+['"]/.test(sql))
      return { passed: false, reason: "Add `unique_key='customer_id'` to the config." }
    if (!/updated_at\s*=\s*['"][^'"]+['"]/.test(sql))
      return { passed: false, reason: "Add `updated_at='updated_at'` to the config." }
    if (!snapshotRanAtLeast(state, 'snap_customers', 1))
      return { passed: false, reason: 'Run `dbt snapshot` to capture the first snapshot.' }
    return { passed: true }
  },
  badge: { id: 'time-traveler', name: 'Time Traveler', emoji: '⏳' },
  quiz: {
    question: 'What is the purpose of `unique_key` in a snapshot configuration?',
    options: [
      'It becomes the primary key of the snapshot table',
      'It tells dbt how to identify the same row across different snapshot runs',
      'It sorts the historical versions within the snapshot table',
      'It prevents duplicate rows in the source table',
    ],
    correctIndex: 1,
    explanation: 'dbt uses unique_key to match each incoming row to its historical versions. Without it, dbt cannot tell whether a row is "the same customer, now changed" or "a brand-new customer".',
  },
}

export default level29
