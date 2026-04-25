import type { Level } from '../engine/types'
import { snapshotClosedAtLeast, snapshotRanAtLeast } from '../engine/validators'

const RAW_CUSTOMERS_V1 = `id,name,email,status,updated_at
1,Alice Martin,alice@example.com,active,2024-01-05
2,Bob Chen,bob@example.com,active,2024-01-17
3,Carol Silva,carol@example.com,active,2024-02-02`

const level40: Level = {
  id: 40,
  chapter: 11,
  title: 'Change the source data and run the snapshot again',
  description: `Snapshots become interesting the second time they run. The first run captures the initial state. Subsequent runs compare the current source rows to the last-captured versions and, for any row whose tracked column has changed, they store a new version alongside the old one.

Your mission: walk the snapshot through two runs with a source change in between.

Step-by-step:
  1. Run \`dbt seed\` and \`dbt snapshot\`. The first capture creates the snapshot table with 3 rows, all with dbt_valid_to = NULL (meaning "this is the current truth").
  2. Use \`dbt show --select snap_customers\` to verify.
  3. Open seeds/raw_customers.csv. Change Alice's email to \`alice.new@example.com\` AND bump her updated_at to \`2024-02-15\`. Do the same for Carol — change status to \`inactive\` and bump updated_at.
  4. Run \`dbt seed\` again (to reload the CSV into the warehouse), then \`dbt snapshot\` again. This time the snapshot should close out the two old rows and insert two new versions.
  5. Run \`dbt show --select snap_customers\` again. You should see 5 rows now: Bob still has one row; Alice and Carol each have two (an old one with dbt_valid_to set, and a new one with dbt_valid_to = NULL).

The lesson is complete once the second snapshot run has captured at least two historical versions.`,
  hint: 'Run dbt seed + dbt snapshot. Edit seeds/raw_customers.csv (change Alice + Carol, bump updated_at). Run dbt seed + dbt snapshot again.',
  initialFiles: {
    'seeds/raw_customers.csv': RAW_CUSTOMERS_V1,
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
  requiredSteps: ['files'],
  goal: {
    description: 'Snapshot once, change the source, snapshot again — history should grow.',
    dagShape: {
      nodes: [
        { id: 'raw_customers', label: 'raw_customers', layer: 'source' },
        { id: 'snap_customers', label: 'snap_customers', layer: 'intermediate' },
      ],
      edges: [{ source: 'raw_customers', target: 'snap_customers' }],
    },
  },
  validate: (state) => {
    if (!snapshotRanAtLeast(state, 'snap_customers', 2))
      return { passed: false, reason: 'Run `dbt snapshot` at least twice — once for the initial capture and once after the change.' }
    if (!snapshotClosedAtLeast(state, 'snap_customers', 1))
      return { passed: false, reason: 'The second run did not close any rows. Make sure you edited the CSV (change a value AND bump updated_at) before rerunning seed + snapshot.' }
    return { passed: true }
  },
  badge: { id: 'historian', name: 'Historian', emoji: '📜' },
  quiz: {
    question: 'A snapshot row has `dbt_valid_to = NULL`. What does that tell you?',
    options: [
      'The row has not been processed yet',
      'It is the current (most recent) version of that unique_key',
      'The snapshot run failed for this row',
      'The row has no tracked column',
    ],
    correctIndex: 1,
    explanation: 'A NULL dbt_valid_to marks "this version is still the truth". When a newer version arrives, dbt sets the old row\'s dbt_valid_to and inserts a fresh row with NULL valid_to for the new current version.',
  },
  docs: [
    { label: 'About snapshots', url: 'https://docs.getdbt.com/docs/build/snapshots' },
  ],
}

export default level40
