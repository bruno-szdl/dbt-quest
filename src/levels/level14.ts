import type { Level } from '../engine/types'
import { allTestsPass, modelRan } from '../engine/validators'

// Intentionally broken: NULL email on id=3 and an exact duplicate on id=5.
const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level14: Level = {
  id: 14,
  chapter: 4,
  title: 'Fix the model so tests pass',
  description: `Tests are most useful when they fail. A failing test is a prompt: there's a real data quality problem and you need to either reject the bad rows or transform them away.

The workflow is simple and common: run → fail → fix → rerun.

The stg_customers model has tests declared in schema.yml (not_null + unique on customer_id, not_null on email). The raw data contains both problems:
  • A row with a NULL email.
  • A duplicated row for one customer id.

Run \`dbt run\` and \`dbt test\` first — confirm the failures for yourself. Then fix stg_customers.sql so that all tests pass. Two small changes are enough: filter out rows with NULL emails, and deduplicate.`,
  hint: 'Add `distinct` after SELECT to collapse the duplicate row, and add `WHERE email IS NOT NULL` to drop the bad row. Then rerun dbt run and dbt test.',
  initialFiles: {
    'models/stg_customers.sql': `-- Make every test in schema.yml pass.
-- Tip: DISTINCT and a WHERE clause are all you need.

select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/schema.yml': `version: 2

models:
  - name: stg_customers
    columns:
      - name: customer_id
        tests:
          - not_null
          - unique
      - name: email
        tests:
          - not_null
`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run', 'test'],
  goal: {
    description: 'Edit stg_customers.sql so dbt test passes every check.',
    dagShape: {
      nodes: [{ id: 'stg_customers', label: 'stg_customers', layer: 'staging' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to rebuild the model.' }
    if (!allTestsPass(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt test and make every test pass.' }
    return { passed: true }
  },
  badge: { id: 'bug-squasher', name: 'Bug Squasher', emoji: '🔧' },
  quiz: {
    question: 'A `not_null` test is failing on a column. What is the best response?',
    options: [
      'Delete the test so the build stays green',
      'Ignore it — a single failure will not break anything downstream',
      'Investigate the root cause, then either fix the data upstream or filter it out',
      'Change the test to `accepted_values` with NULL in the allowed list',
    ],
    correctIndex: 2,
    explanation: 'Tests exist so failures surface real problems. Deleting or loosening the test hides the issue from everyone downstream. Fix the root cause or be intentional about dropping bad rows in the staging model.',
  },
  docs: [
    { label: 'About data tests', url: 'https://docs.getdbt.com/docs/build/data-tests' },
  ],
}

export default level14
