import type { Level } from '../engine/types'
import { manuallyMarked } from '../engine/validators'

const level41: Level = {
  id: 41,
  chapter: 11,
  title: 'Understand when to use snapshots',
  description: `Snapshots are powerful but also have a cost (extra rows, extra config, a run that must happen regularly). So it's worth being deliberate about when to reach for them.

Good fits for a snapshot
  • A dimension table whose rows can change over time and you care about history. For example: customers (plan tier, country, status), employees (department, role), products (price, category).
  • A source that arrives as a snapshot of current state only, and you need to reconstruct "what did this look like on day X?".

Bad fits
  • Append-only data (events, logs). Those rows never change — the raw table is already a history.
  • Data where you only ever care about the current state. Snapshots add noise without benefit.
  • Data you already own history for (e.g. a source already modelled as SCD-2). No point duplicating.

Mental shortcut: "Would the business ever ask me 'what did this look like three months ago?'". If yes, snapshot. If no, skip.

Your task: think of a table in a project you've worked on (or can imagine). Decide whether it should be a snapshot or not, and why. Then mark the lesson complete.`,
  hint: 'Pick a real-or-imagined table and decide: snapshot or not? Why?',
  story: {
    messages: [
      {
        from: 'priya',
        body: `think of a real table you've worked with. snapshot or not? events: no. customers: yes. audit log: no. read, decide, mark complete.`,
      },
    ],
  },
  initialFiles: {
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
from {{ source('raw', 'customers') }}

{% endsnapshot %}
`,
  },
  seeds: {},
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Reflect on when snapshots pay off, then mark complete.',
  },
  validate: (state) => {
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Mark the lesson complete when ready.' }
    return { passed: true }
  },
  badge: { id: 'snapshot-strategist', name: 'Snapshot Strategist', emoji: '🗓️' },
  quiz: {
    question: 'Which of these tables is the BEST candidate for a snapshot?',
    options: [
      'app_clicks — one row per click, never updated after insertion',
      'customers — rows update over time when users change plan or status, and the team asks historical questions',
      'dim_dates — a static calendar table with one row per day',
      'audit_log — an append-only log of admin actions',
    ],
    correctIndex: 1,
    explanation: 'Snapshots shine for mutable dimensions where history matters. Event-like append tables already are their own history. Static reference tables have nothing to snapshot.',
  },
  docs: [
    { label: 'About snapshots', url: 'https://docs.getdbt.com/docs/build/snapshots' },
  ],
}

export default level41
