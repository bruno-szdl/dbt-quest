import type { Level } from '../engine/types'
import { modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const README = `# möller-coffee-dbt

if you're reading this you're the new hire. sorry about the state
of things — had to leave faster than i wanted.

what works:
  - stg_customers builds
  - dbt run will get you that far at least

what doesn't:
  - dim_customers is broken, don't bother
  - the whole orders side needs a rewrite
  - never got around to writing tests, sorry priya

good luck. it's a good company.

  — m
`

const level01: Level = {
  id: 1,
  chapter: 1,
  title: 'Run your first model',
  description: `In dbt, a model is a SQL SELECT statement saved in a .sql file under models/. When you run dbt, it takes your query and materializes the result as a view or table in the database.

A first model — stg_customers — is already there. Run \`dbt run\` in the terminal at the bottom of the screen. That builds every model in the project.`,
  hint: 'Type `dbt run` in the terminal at the bottom of the screen and press Enter.',
  story: {
    messages: [
      {
        from: 'priya',
        time: '09:14',
        body: `Welcome to Möller Coffee. Sorry to throw you in cold — Marcus left two weeks ago and i haven't touched his dbt project since. There's a models/ folder, one file in it, and i think it should run.

Open the terminal and try \`dbt run\`. If it builds, we know the project isn't completely broken. If it doesn't, we'll know how broken it is. ☕`,
      },
    ],
  },
  initialFiles: {
    'README.md': README,
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
    description: 'Run `dbt run` to build the stg_customers model.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run `dbt run` to build the model.' }
    return { passed: true }
  },
  badge: { id: 'first-run', name: 'First Run', emoji: '🚀' },
  quiz: {
    question: 'Which command tells dbt to build your models in the database?',
    options: [
      'dbt compile',
      'dbt run',
      'dbt execute',
      'dbt deploy',
    ],
    correctIndex: 1,
    explanation: '`dbt run` compiles every model into SQL and executes it against the warehouse, creating views or tables depending on the materialization.',
  },
  docs: [
    { label: 'About `dbt run`', url: 'https://docs.getdbt.com/reference/commands/run' },
    { label: 'About dbt models', url: 'https://docs.getdbt.com/docs/build/models' },
  ],
}

export default level01
