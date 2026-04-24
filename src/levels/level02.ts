import type { Level } from '../engine/types'
import { modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const level02: Level = {
  id: 2,
  chapter: 1,
  title: 'Explore your model',
  description: `You just built stg_customers as a view in DuckDB. But what does the output actually look like?

dbt has a command for that: dbt show. It queries the model directly and prints a preview of the rows in the terminal.

  dbt show --select stg_customers

After running it, dbt-quest will also open the Results tab automatically so you can see the data in a table format. Notice that stg_customers also appears in the Database Explorer on the left — it's a real view you can query at any time.

Your task: run dbt run to rebuild the model, then run dbt show --select stg_customers to preview the data.`,
  hint: 'First run `dbt run`, then run `dbt show --select stg_customers`. The Results tab will open automatically.',
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
  requiredSteps: ['run'],
  goal: {
    description: 'Run dbt run, then run dbt show --select stg_customers to preview the output.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run `dbt run` to build the model first.' }
    if (!state.shownModels.has('stg_customers'))
      return { passed: false, reason: 'Run `dbt show --select stg_customers` to preview the data.' }
    return { passed: true }
  },
  badge: { id: 'first-preview', name: 'First Preview', emoji: '🔍' },
  quiz: {
    question: 'By default, what does dbt create when you run a model?',
    options: [
      'A permanent table with data physically stored',
      'A view — a saved query that runs each time it is read',
      'A CSV file exported to the filesystem',
      'A materialized view with incremental updates',
    ],
    correctIndex: 1,
    explanation: "By default dbt materializes models as views. A view doesn't store data — it re-runs the SELECT query each time someone reads it. You can see this in the Database Explorer, where stg_customers appears under Views.",
  },
}

export default level02
