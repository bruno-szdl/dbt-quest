import type { Level } from '../engine/types'
import { modelMaterialization, modelRan } from '../engine/validators'

const RAW_EVENTS = `id,user_id,event_type,event_at
1,1,login,2024-01-05
2,2,login,2024-01-06
3,1,purchase,2024-01-07
4,3,login,2024-01-07
5,2,purchase,2024-01-08
6,1,logout,2024-01-08`

const level36: Level = {
  id: 36,
  chapter: 11,
  title: 'Configure an incremental model as append',
  description: `When a model's underlying data only grows (events, logs, immutable rows), rebuilding it from scratch every dbt run is wasteful. Incremental materializations let dbt process only the new rows each run.

The simplest incremental strategy is append — each run adds the fresh rows on top of what's already in the table. It fits append-only data perfectly: events, page views, audit logs.

The configuration looks like this:

  {{ config(
      materialized='incremental',
      incremental_strategy='append'
  ) }}

  select * from {{ source('raw', 'events') }}

This level is just about flipping the configuration. The next level adds the \`is_incremental()\` filter that tells dbt which rows to process on a re-run.

Your task: open fct_events.sql and change the config so it's materialized='incremental' with incremental_strategy='append'. Then run dbt run.`,
  hint: "Replace the TODO config block with materialized='incremental' and incremental_strategy='append'.",
  story: {
    messages: [
      {
        from: 'priya',
        body: `the events table just crossed 5M rows. yuki's overnight refresh is now 18 minutes and growing. fct_events is append-only — perfect candidate for incremental + append.`,
      },
    ],
  },
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
  goal: {
    description: 'Configure fct_events as incremental+append, then run dbt run.',
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

export default level36
