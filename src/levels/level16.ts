import type { Level } from '../engine/types'
import { allTestsPass, modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

function countYamlDescriptions(yml: string): number {
  return (yml.match(/^[ \t]+description:\s*\S/gm) ?? []).length
}

const level16: Level = {
  id: 16,
  chapter: 5,
  title: 'Add a description to a model',
  description: `Models earn their keep when other people can read them. The fastest way to make a model self-explanatory is to write a one-line \`description:\` next to its name in the YAML — and one for each column too.

The shape is:

  models:
    - name: stg_customers
      description: One row per customer, cleaned from the raw signup feed.
      columns:
        - name: customer_id
          description: Stable surrogate id used everywhere downstream.

Open \`models/schema.yml\` and add a \`description:\` for stg_customers and for at least two of its columns. The model still needs to build and its tests still need to pass — descriptions live next to the same tests you wrote earlier.`,
  hint: 'Add `description: <one sentence>` indented under stg_customers, and another under at least two columns. Keep the existing tests in place.',
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/schema.yml': `version: 2

models:
  - name: stg_customers
    # TODO: add a description for the model on the next line
    columns:
      - name: customer_id
        # TODO: add a description for this column
        tests:
          - not_null
          - unique
      - name: email
        # TODO: add a description for this column
        tests:
          - not_null
`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run', 'test'],
  goal: {
    description: 'Document stg_customers and at least two of its columns, then run dbt build.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    const yml = state.files['models/schema.yml'] ?? ''
    if (countYamlDescriptions(yml) < 3)
      return { passed: false, reason: 'Add a description: line on stg_customers and on at least two of its columns.' }
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run (or dbt build) so stg_customers is built.' }
    if (!allTestsPass(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt test (or dbt build) and make sure tests still pass.' }
    return { passed: true }
  },
  badge: { id: 'documenter', name: 'Documenter', emoji: '📝' },
  quiz: {
    question: 'Where do model and column descriptions live in a dbt project?',
    options: [
      'In a Markdown README in the project root',
      'In the same YAML file as the tests, next to each model and column',
      'Inside the .sql file as -- SQL comments',
      'In a separate docs/ directory that dbt does not read',
    ],
    correctIndex: 1,
    explanation: 'Descriptions sit beside tests in YAML (commonly schema.yml). Keeping docs and tests in one place means a single source of truth for what the model is and what guarantees it makes.',
  },
  docs: [
    { label: 'Model properties', url: 'https://docs.getdbt.com/reference/resource-properties/description' },
  ],
}

export default level16
