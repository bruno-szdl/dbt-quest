import type { Level } from '../engine/types'
import { modelShown, snapshotRanAtLeast } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,status,updated_at
1,Alice Martin,alice@example.com,active,2024-01-05
2,Bob Chen,bob@example.com,active,2024-01-17
3,Carol Silva,carol@example.com,active,2024-02-02`

const level41: Level = {
  id: 41,
  chapter: 12,
  title: 'Inspect what dbt added',
  description: `The snapshot from the previous level captured 3 rows. But snap_customers has more columns than raw_customers — dbt adds three SCD-2 columns of its own. These are what make a snapshot useful as a history table.

Run \`dbt show --select snap_customers\` and look at the columns in the output. The new ones are:

  • \`dbt_valid_from\`  — when this version of the row became the truth.
  • \`dbt_valid_to\`    — when it stopped being the truth (NULL if it still is).
  • \`dbt_updated_at\`  — the timestamp dbt observed for this version.

Right after a first run every row has \`dbt_valid_to = NULL\` — meaning "this is the current version and there's no newer one yet". When you re-run the snapshot after the source has changed (next level), dbt will close out the old row by setting its \`dbt_valid_to\`, and insert a fresh row with NULL valid_to for the new state.

That pair — \`(dbt_valid_from, dbt_valid_to)\` — is the SCD-2 contract. Every consumer model that wants the current view filters \`dbt_valid_to IS NULL\`. Every consumer that wants a point-in-time view filters \`<some_date> BETWEEN dbt_valid_from AND COALESCE(dbt_valid_to, now())\`.

Your task: run \`dbt show --select snap_customers\`. Read the columns. The lesson completes once you have shown the snapshot.`,
  hint: 'Type `dbt show --select snap_customers` in the terminal.',
  story: {
    messages: [
      {
        from: 'priya',
        body: `take a look at what dbt added — \`dbt show --select snap_customers\`. three new cols: \`dbt_valid_from\`, \`dbt_valid_to\`, \`dbt_updated_at\`. \`valid_to IS NULL\` is how every consumer asks "what's true now?".`,
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
  },
  seeds: {},
  preRanSnapshots: ['snap_customers'],
  requiredSteps: [],
  goal: {
    description: 'Run `dbt show --select snap_customers` and inspect the SCD-2 columns dbt added.',
    dagShape: {
      nodes: [
        { id: 'raw_customers', label: 'raw_customers', layer: 'source' },
        { id: 'snap_customers', label: 'snap_customers', layer: 'intermediate' },
      ],
      edges: [{ source: 'raw_customers', target: 'snap_customers' }],
    },
  },
  validate: (state) => {
    if (!snapshotRanAtLeast(state, 'snap_customers', 1))
      return { passed: false, reason: 'snap_customers should already be captured for this level. Try resetting if it isn\'t.' }
    if (!modelShown(state, 'snap_customers'))
      return { passed: false, reason: 'Run `dbt show --select snap_customers` to inspect the SCD-2 columns.' }
    return { passed: true }
  },
  badge: {
    id: 'scd2-reader',
    name: 'SCD-2 Reader',
    emoji: '🪞',
    caption: 'valid_from / valid_to / updated_at',
  },
  quiz: {
    question: 'What does `dbt_valid_to IS NULL` tell you about a row in a snapshot table?',
    options: [
      'The snapshot run failed for that row',
      'The row is the current truth — no newer version has superseded it yet',
      'The row was inserted in the very first snapshot run',
      'The unique_key was missing when this row was captured',
    ],
    correctIndex: 1,
    explanation: 'A NULL `dbt_valid_to` is SCD-2 for "still current". When a newer version arrives, dbt sets the old row\'s `dbt_valid_to` and inserts a fresh row with NULL `valid_to` — so at any moment, exactly one row per unique_key has `valid_to IS NULL`.',
  },
  docs: [
    { label: 'About snapshots', url: 'https://docs.getdbt.com/docs/build/snapshots' },
  ],
}

export default level41
