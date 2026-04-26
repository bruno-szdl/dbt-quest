import type { Level } from '../engine/types'
import { modelRan, outputColumnsInclude } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level03: Level = {
  id: 3,
  chapter: 1,
  title: 'Add a column and run again',
  description: `Editing the SQL in a model changes the shape of the dataset dbt produces. Because every run rebuilds the model from scratch, fixing a bug or adding a column is usually just: edit the file, hit run.

The starter stg_customers model is missing the email column. The analytics team wants to contact customers, so email needs to be included in the clean model.

Your task: add email to the SELECT list and run dbt run again.`,
  hint: 'Add `email` to the select list, for example between `name` and `country`. Then run `dbt run`.',
  story: {
    messages: [
      {
        from: 'yuki',
        body: `heyyy welcome to möller 👋 can stg_customers include email? doing a re-engagement campaign and i'd rather not hand-join the raw table again 🙏`,
      },
    ],
  },
  initialFiles: {
    'models/stg_customers.sql': `-- The analytics team wants email in this model.
-- Add the email column to the SELECT list, then run dbt run.

select
    id,
    name,
    -- add email here
    country
from raw_customers`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: 'Add `email` to stg_customers and run `dbt run`.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to rebuild the model.' }
    if (!outputColumnsInclude(state, 'stg_customers', ['id', 'name', 'email', 'country']))
      return { passed: false, reason: 'The output should include id, name, email, and country.' }
    return { passed: true }
  },
  badge: { id: 'first-column', name: 'First Column', emoji: '➕' },
  quiz: {
    question: 'After editing a model file, what do you need to do for the change to appear in the warehouse?',
    options: [
      'Nothing — dbt picks up edits automatically',
      'Run `dbt compile`',
      'Run `dbt run`',
      'Restart the warehouse',
    ],
    correctIndex: 2,
    explanation: '`dbt run` re-executes the SELECT against your warehouse and replaces the view or table with the new definition. Without it, the warehouse still shows the previous version of the model.',
  },
  docs: [
    { label: 'SQL models', url: 'https://docs.getdbt.com/docs/build/sql-models' },
  ],
}

export default level03
