import type { Level } from '../engine/types'
import { modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const level01: Level = {
  id: 1,
  chapter: 1,
  title: 'Your first query',
  description: `You've just joined the analytics team at Sparkle Co, an online marketplace.

The engineering team stores raw customer data in a table called raw_customers. Your job is to build clean, reliable models on top of that raw data.

In dbt, a model is a SQL SELECT statement saved as a .sql file. When you run dbt, it reads your file and materializes it as a view or table in the database.

A model file has already been created for you. Your task is simple: run dbt run to build it, then click "Show Results" to see the data.`,
  hint: 'Type `dbt run` in the terminal at the bottom of the screen. Then click "Show Results" in the toolbar to preview the output.',
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
    description: 'Run dbt run to build the stg_customers model.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run the model with `dbt run`.' }
    return { passed: true }
  },
  badge: { id: 'first-run', name: 'First Run', emoji: '🚀' },
}

export default level01
