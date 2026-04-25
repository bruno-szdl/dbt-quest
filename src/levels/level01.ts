import type { Level } from '../engine/types'
import { modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level01: Level = {
  id: 1,
  chapter: 1,
  title: 'Run your first model',
  description: `You have joined the analytics team and your job is to turn raw data into clean, reliable datasets for reporting.

In dbt, a model is a SQL SELECT statement saved in a .sql file under models/. When you run dbt, it takes your query and materializes the result as a view or table in the database.

A first model — stg_customers — has already been written for you. It simply selects from the raw_customers table.

Your task is short: run \`dbt run\` from the terminal at the bottom of the screen. That tells dbt to build every model in the project.`,
  hint: 'Type `dbt run` in the terminal at the bottom of the screen and press Enter.',
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
