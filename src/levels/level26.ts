import type { Level } from '../engine/types'
import { manuallyMarked, modelMaterialization, modelRan } from '../engine/validators'

const RAW_EVENTS = `id,user_id,event_type,event_at
1,1,login,2024-01-05
2,2,login,2024-01-06
3,1,purchase,2024-01-07
4,3,login,2024-01-07
5,2,purchase,2024-01-08
6,1,logout,2024-01-08`

const level26: Level = {
  id: 26,
  chapter: 8,
  title: 'Configure an incremental model as append',
  description: `When a model's underlying data only grows (events, logs, immutable rows), rebuilding it from scratch every dbt run is wasteful. Incremental materializations let dbt process only the new rows each run.

The simplest incremental strategy is append — each run adds the fresh rows on top of what's already in the table. It fits append-only data perfectly: events, page views, audit logs.

The syntax looks like this:

  {{ config(
      materialized='incremental',
      incremental_strategy='append',
      unique_key='id'
  ) }}

  select * from {{ source('raw', 'events') }}
  {% if is_incremental() %}
    where event_at > (select max(event_at) from {{ this }})
  {% endif %}

On the first run dbt builds the full table. On subsequent runs it only inserts rows newer than the latest row already stored.

Your task: open fct_events.sql and set it to materialized='incremental' with incremental_strategy='append'. Then run dbt run. (dbt-quest runs the model as a full rebuild, but the configuration is the real thing.) When done, mark the lesson complete.`,
  hint: "Replace the TODO config block with materialized='incremental' and incremental_strategy='append'.",
  initialFiles: {
    'models/fct_events.sql': `-- Task: configure this model as incremental with an append strategy.

{{ config(
    materialized='table'
) }}

select
    id,
    user_id,
    event_type,
    event_at
from raw_events`,
  },
  seeds: {
    raw_events: RAW_EVENTS,
  },
  requiredSteps: ['files', 'run'],
  manualCompletion: true,
  goal: {
    description: 'Configure fct_events as incremental+append, run dbt run, then mark complete.',
    dagShape: {
      nodes: [{ id: 'fct_events', label: 'fct_events', layer: 'mart' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelMaterialization(state, 'fct_events', 'incremental'))
      return { passed: false, reason: "Configure fct_events with materialized='incremental'." }
    const sql = state.files['models/fct_events.sql'] ?? ''
    if (!/incremental_strategy\s*=\s*['"]append['"]/.test(sql))
      return { passed: false, reason: "Add incremental_strategy='append' to the config." }
    if (!modelRan(state, 'fct_events'))
      return { passed: false, reason: 'Run dbt run to build fct_events.' }
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Mark the lesson complete once you have run it.' }
    return { passed: true }
  },
  badge: { id: 'append-only', name: 'Append Only', emoji: '➕' },
  quiz: {
    question: 'What does an incremental+append model do on the second dbt run?',
    options: [
      'Rebuilds the whole table from scratch',
      "Doesn't run at all — append models only build once",
      'Inserts only the new rows on top of the existing table',
      'Swaps the whole table with a freshly-built copy',
    ],
    correctIndex: 2,
    explanation: 'Append strategy inserts only rows that match the incremental filter (typically newer than the latest already stored). The existing rows are preserved untouched.',
  },
  docs: [
    { label: 'Incremental models', url: 'https://docs.getdbt.com/docs/build/incremental-models' },
    { label: 'Incremental strategies', url: 'https://docs.getdbt.com/docs/build/incremental-strategy' },
  ],
}

export default level26
