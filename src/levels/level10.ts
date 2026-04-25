import type { Level } from '../engine/types'
import { manuallyMarked } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level10: Level = {
  id: 10,
  chapter: 3,
  title: 'Compare view vs table',
  description: `The same SQL can be built as a view or as a table — only the config() line changes. That tiny difference carries real consequences.

View:
  • Cheap to build (dbt just stores the query).
  • Every read re-runs the SQL against upstream data, so the data is always fresh.
  • Can be slow when the SQL is complex or the upstream data is large.

Table:
  • Rebuilds store the result rows physically.
  • Reads are fast because nothing is recomputed.
  • Data is only as fresh as the last dbt run.

Rule of thumb: start with views. Promote frequently-read or expensive models to tables.

In this lesson there is nothing to change — two versions of stg_customers are provided so you can inspect how each looks in the Database Explorer. One shows up under Views, the other under Tables. When you have seen the difference, mark the lesson complete below.`,
  hint: 'Run `dbt run` once, open the Database Explorer on the left, and look at where each model appears.',
  initialFiles: {
    'models/stg_customers_view.sql': `-- Built as a view (default): a saved query re-executed on every read.
select
    id         as customer_id,
    name       as customer_name,
    email,
    country
from raw_customers`,
    'models/stg_customers_table.sql': `{{ config(materialized='table') }}
-- Built as a table: result rows are stored physically.
select
    id         as customer_id,
    name       as customer_name,
    email,
    country
from raw_customers`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  preRanModels: ['stg_customers_view', 'stg_customers_table'],
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Inspect the two materializations in the Database Explorer, then mark complete.',
    dagShape: {
      nodes: [
        { id: 'stg_customers_view', label: 'stg_customers_view', layer: 'staging' },
        { id: 'stg_customers_table', label: 'stg_customers_table', layer: 'staging' },
      ],
      edges: [],
    },
  },
  validate: (state) => {
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Compare view vs table, then mark the lesson complete.' }
    return { passed: true }
  },
  badge: { id: 'view-vs-table', name: 'View vs Table', emoji: '⚖️' },
  quiz: {
    question: 'Which statement is true about a dbt `table` materialization?',
    options: [
      'It is always faster to build than a view',
      'Reads are fast because rows are stored physically',
      'It automatically refreshes when upstream data changes',
      'It requires the incremental strategy',
    ],
    correctIndex: 1,
    explanation: 'A table stores rows on disk, which makes reads fast. The trade-off: the data only reflects the state of the last dbt run — upstream changes are not seen until you re-run.',
  },
  docs: [
    { label: 'Materializations', url: 'https://docs.getdbt.com/docs/build/materializations' },
  ],
}

export default level10
