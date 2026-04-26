import type { Level } from '../engine/types'
import { modelMaterialization, modelRan } from '../engine/validators'

const RAW_EVENTS = `id,user_id,event_type,event_at
1,1,login,2024-01-05
2,2,login,2024-01-06
3,1,purchase,2024-01-07
4,3,login,2024-01-07
5,2,purchase,2024-01-08
6,1,logout,2024-01-08`

const level37: Level = {
  id: 37,
  chapter: 11,
  title: 'Add the is_incremental() filter',
  description: `Setting \`materialized='incremental'\` is half the picture. The other half is telling dbt which rows to bring in on a re-run. That's what the \`is_incremental()\` Jinja block is for.

The pattern looks like:

  select * from {{ source('raw', 'events') }}
  {% if is_incremental() %}
    where event_at > (select max(event_at) from {{ this }})
  {% endif %}

Two things to notice:
  • \`is_incremental()\` returns true only on a re-run (when the target table already exists). On the first run the block is skipped and dbt builds the full table.
  • \`{{ this }}\` resolves to the model's own table name, so the WHERE clause is "newer than the last row I already have".

dbt-quest still rebuilds the full table on every run (this is a learning sim, not a production warehouse), but it WILL evaluate the \`is_incremental\` filter against the prior table on a re-run and report how many rows it would have appended. That's the closest you can get to the real "would have processed N new rows" feedback dbt gives in production.

Your task: in fct_events.sql, add an \`{% if is_incremental() %} … {% endif %}\` block after the SELECT that filters \`where event_at > (select max(event_at) from {{ this }})\`. Run dbt run twice — the first run builds fresh; the second prints the diagnostic line.

Tip — see a non-zero count
After the second run prints \`would append 0 new rows\` (because the seed didn't change), open \`seeds/raw_events.csv\` in the file explorer and append a fresh event with a later \`event_at\`. Then run \`dbt seed\` followed by \`dbt run\`. The diagnostic will jump to match the new rows the filter would have picked up.`,
  hint: "After the SELECT, add:\n{% if is_incremental() %}\n  where event_at > (select max(event_at) from {{ this }})\n{% endif %}\nThen run dbt run twice.",
  story: {
    messages: [
      {
        from: 'priya',
        body: `now the filter — the part that actually saves work in prod. \`is_incremental()\` skips on first run, fires on every re-run. dbt-quest still does a full rebuild but it'll show you the \`would-have-appended\` count so you can feel what real dbt does.`,
      },
    ],
  },
  initialFiles: {
    'seeds/raw_events.csv': RAW_EVENTS,
    'models/fct_events.sql': `-- Task: add an {% if is_incremental() %} block that filters by event_at.

{{ config(
    materialized='incremental',
    incremental_strategy='append'
) }}

select
    id,
    user_id,
    event_type,
    event_at
from raw_events`,
  },
  seeds: {},
  requiredSteps: ['files', 'run'],
  goal: {
    description: 'Add an is_incremental() block to fct_events, then run dbt run twice.',
    dagShape: {
      nodes: [{ id: 'fct_events', label: 'fct_events', layer: 'mart' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelMaterialization(state, 'fct_events', 'incremental'))
      return { passed: false, reason: "fct_events should still be materialized='incremental'." }
    const sql = state.files['models/fct_events.sql'] ?? ''
    if (!/\{%\s*if\s+is_incremental\s*\(\s*\)\s*%\}/i.test(sql))
      return { passed: false, reason: 'Wrap the WHERE clause in `{% if is_incremental() %} … {% endif %}`.' }
    if (!/\{%\s*endif\s*%\}/i.test(sql))
      return { passed: false, reason: 'Close the block with `{% endif %}`.' }
    if (!/\{\{\s*this\s*\}\}/i.test(sql))
      return { passed: false, reason: 'Reference the current model with `{{ this }}` inside the filter.' }
    if (!/where[\s\S]*event_at\s*>/i.test(sql))
      return { passed: false, reason: 'Add `where event_at > (select max(event_at) from {{ this }})` inside the block.' }
    if (!modelRan(state, 'fct_events'))
      return { passed: false, reason: 'Run dbt run to (re)build fct_events.' }
    return { passed: true }
  },
  badge: {
    id: 'incremental-filter',
    name: 'Skip the Old Rows',
    emoji: '⏩',
    caption: 'Diagnostic count — like a real warehouse',
  },
  quiz: {
    question: 'On the FIRST run of an incremental model, what does the `{% if is_incremental() %}` block do?',
    options: [
      'It runs the WHERE clause and processes only the newest rows',
      'It is skipped entirely — there is no prior table to filter against, so dbt builds the full table',
      'It throws an error because `{{ this }}` does not exist yet',
      'It runs once for every row in the source',
    ],
    correctIndex: 1,
    explanation: '`is_incremental()` is false on the first run (the model has no existing table). dbt skips the block and does a full build. From the second run onward it returns true and the WHERE clause kicks in, narrowing the work to "newer than what I already have".',
  },
  docs: [
    { label: 'About `is_incremental()`', url: 'https://docs.getdbt.com/reference/dbt-jinja-functions/is_incremental' },
    { label: 'Incremental models', url: 'https://docs.getdbt.com/docs/build/incremental-models' },
  ],
}

export default level37
