import type { Level } from '../engine/types'
import { modelRan, outputColumnsInclude } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level04: Level = {
  id: 4,
  chapter: 1,
  title: 'Rename a column and run again',
  description: `Raw tables often have generic column names that don't communicate meaning. A staging model is a good place to rename columns into something business-friendly.

For example, \`id\` is ambiguous — is it a customer id or a user id? Renaming it to \`customer_id\` removes the guesswork.

Your task: in stg_customers, rename \`id\` to \`customer_id\` using a SQL alias, then run dbt run.`,
  hint: 'Use a SQL alias: `id as customer_id`. Keep it on the same line as the column. Then run `dbt run`.',
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
    description: 'Rename `id` to `customer_id`, then run `dbt run`.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to rebuild the model.' }
    if (!outputColumnsInclude(state, 'stg_customers', ['customer_id']))
      return { passed: false, reason: 'The output should have a column named customer_id.' }
    return { passed: true }
  },
  badge: { id: 'clean-columns', name: 'Clean Columns', emoji: '✨' },
  quiz: {
    question: 'In standard SQL, how do you give a column a different output name?',
    options: [
      'RENAME original TO new',
      'original ALIAS new',
      'original AS new',
      'CAST(original AS new)',
    ],
    correctIndex: 2,
    explanation: 'The AS keyword creates a column alias. Writing `id as customer_id` keeps the underlying column the same but renames it in the result.',
  },
}

export default level04
