import type { Level } from '../engine/types'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level02: Level = {
  id: 2,
  chapter: 1,
  title: 'View the model result',
  description: `Running a model is only half the job. Good data engineers also look at the output to verify it actually makes sense.

The \`dbt show\` command previews rows from a model. Run it like this:

  dbt show --select stg_customers

dbt-quest opens the Results tab automatically so you can browse the rows as a table. Notice that stg_customers also shows up in the Database Explorer on the left — it's a real view you can query anytime.`,
  hint: 'Run `dbt show --select stg_customers` in the terminal. The Results tab will pop open.',
  initialFiles: {
    'models/stg_customers.sql': `select
    id,
    name,
    email,
    created_at,
    country
from raw_customers`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  preRanModels: ['stg_customers'],
  requiredSteps: [],
  goal: {
    description: 'Run `dbt show --select stg_customers` to preview the output.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!state.shownModels.has('stg_customers'))
      return { passed: false, reason: 'Run `dbt show --select stg_customers` to preview the data.' }
    return { passed: true }
  },
  badge: { id: 'first-preview', name: 'First Preview', emoji: '🔍' },
  quiz: {
    question: 'By default, what does dbt create when you run a model?',
    options: [
      'A permanent table with the data physically stored',
      'A view — a saved query that re-runs on every read',
      'A CSV file exported to the filesystem',
      'An incremental snapshot',
    ],
    correctIndex: 1,
    explanation: 'By default dbt builds models as views. A view does not store rows — it re-executes the underlying SELECT each time someone queries it. You can see stg_customers listed under Views in the Database Explorer.',
  },
}

export default level02
