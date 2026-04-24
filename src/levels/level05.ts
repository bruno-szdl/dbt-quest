import type { Level } from '../engine/types'
import { hasModel, modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const RAW_ORDERS = `id,customer_id,amount,status,created_at
1,1,49.99,completed,2024-01-10
2,1,24.99,completed,2024-01-20
3,2,89.99,completed,2024-01-25
4,3,12.99,pending,2024-02-05
5,4,199.99,completed,2024-02-15
6,5,39.99,refunded,2024-03-05
7,1,59.99,completed,2024-03-12
8,2,14.99,pending,2024-04-01`

const level05: Level = {
  id: 4,
  chapter: 2,
  title: 'A second model',
  description: `Real dbt projects have many models — not just one. Each model represents one clean, focused dataset.

At Sparkle Co, customers place orders. The raw orders data lives in raw_orders, and we need a staging model for it just like we built one for customers.

Your task: create a new model file called models/stg_orders.sql that selects from raw_orders. Use the + button in the file explorer to create the file, then write a SELECT statement and run dbt run.`,
  hint: 'Click the + button in the file explorer, type `models/stg_orders.sql`, and write: select id as order_id, customer_id, amount, status, created_at from raw_orders',
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
    raw_orders: RAW_ORDERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: 'Create models/stg_orders.sql and run dbt run.',
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'stg_orders', label: 'stg_orders', layer: 'staging' },
      ],
      edges: [],
    },
  },
  validate: (state) => {
    if (!hasModel(state, 'stg_orders'))
      return { passed: false, reason: 'Create a model file named stg_orders.sql.' }
    if (!modelRan(state, 'stg_orders'))
      return { passed: false, reason: 'Run dbt run to build your new model.' }
    return { passed: true }
  },
  badge: { id: 'second-model', name: 'Second Model', emoji: '📦' },
  quiz: {
    question: 'Where do dbt model SQL files live in a project?',
    options: [
      'In the seeds/ directory',
      'In the macros/ directory',
      'In the models/ directory',
      'In the snapshots/ directory',
    ],
    correctIndex: 2,
    explanation: 'All dbt models go in the models/ directory (or subdirectories within it). dbt discovers and runs every .sql file in this directory automatically.',
  },
}

export default level05
