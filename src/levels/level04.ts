import type { Level } from '../engine/types'
import { modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const level04: Level = {
  id: 3,
  chapter: 1,
  title: 'Clean up column names',
  description: `Raw data often has generic or unclear column names that don't communicate intent. A staging model is the right place to rename columns and make them self-explanatory.

For example: the column id is ambiguous — is it a customer ID, a user ID, or something else? Renaming it to customer_id makes it immediately clear.

Your task: rename id to customer_id and name to customer_name using SQL aliases. Then run dbt run to rebuild the model.`,
  hint: 'Use SQL aliases: `id as customer_id` and `name as customer_name`. You can write them on the same line as the column.',
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
  requiredSteps: ['files', 'run'],
  goal: {
    description: 'Rename id to customer_id and name to customer_name, then run dbt run.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    const sql = (state.files['models/stg_customers.sql'] ?? '').toLowerCase()
    if (!/\bid\s+as\s+customer_id\b/.test(sql))
      return { passed: false, reason: 'Rename id to customer_id using `id as customer_id`.' }
    if (!/\bname\s+as\s+customer_name\b/.test(sql))
      return { passed: false, reason: 'Rename name to customer_name using `name as customer_name`.' }
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to rebuild the model.' }
    return { passed: true }
  },
  badge: { id: 'clean-columns', name: 'Clean Columns', emoji: '✨' },
  quiz: {
    question: 'How do you rename a column in a SQL SELECT statement?',
    options: [
      'RENAME original_name TO new_name',
      'original_name ALIAS new_name',
      'original_name AS new_name',
      'CAST(original_name AS new_name)',
    ],
    correctIndex: 2,
    explanation: 'The AS keyword creates a column alias. For example, `customer_id AS id` renames the output column to "id". This is how dbt models produce clean, consistent column names.',
  },
}

export default level04
