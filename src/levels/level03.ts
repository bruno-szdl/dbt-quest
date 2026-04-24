import type { Level } from '../engine/types'
import { modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const level03: Level = {
  id: 3,
  chapter: 1,
  title: 'Your first model',
  description: `A dbt model is a SQL file you write and maintain. The results are rebuilt every time you run dbt — making your transformations reproducible and version-controlled.

The stg_customers model is almost complete, but the created_at column is missing. Without it, the analytics team won't know when each customer signed up.

Your task: add created_at to the SELECT statement, then run dbt run to rebuild the model.`,
  hint: 'Add `created_at` to the select list, between email and country. Then run dbt run.',
  initialFiles: {
    'models/stg_customers.sql': `-- This model is missing the created_at column.
-- Add it to the SELECT list below (hint: between email and country),
-- then run dbt run to rebuild the model.

select
    id,
    name,
    email,
    -- ← add created_at here
    country
from raw_customers`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: 'Add the created_at column to stg_customers, then run dbt run.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    // Strip -- comments so the placeholder comment doesn't satisfy the check.
    const sql = (state.files['models/stg_customers.sql'] ?? '').replace(/--[^\n]*/g, '')
    if (!sql.includes('created_at'))
      return { passed: false, reason: 'Add the created_at column to the SELECT statement.' }
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to rebuild the model.' }
    return { passed: true }
  },
  badge: { id: 'first-model', name: 'First Model', emoji: '🌱' },
  quiz: {
    question: 'In dbt, what is a "model"?',
    options: [
      'A Python class that defines transformations',
      'A SQL SELECT statement saved as a .sql file',
      'A CREATE TABLE statement executed directly',
      'A JSON configuration describing the schema',
    ],
    correctIndex: 1,
    explanation: 'A dbt model is simply a SQL SELECT statement in a .sql file. dbt wraps it with CREATE VIEW or CREATE TABLE automatically based on your materialization setting.',
  },
}

export default level03
