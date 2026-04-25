import type { Level } from '../engine/types'
import { lineageHasEdge, manuallyMarked } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level07: Level = {
  id: 7,
  chapter: 2,
  title: 'See the lineage',
  description: `Every ref() call adds an edge to the project's lineage graph. That graph is what makes dbt projects navigable at scale — you can trace any dataset back to its raw inputs.

Open the Lineage tab in the bottom panel. You should see two nodes — stg_customers and int_customer_summary — connected by an arrow. The arrow points from upstream to downstream: stg_customers is built first, then int_customer_summary.

As projects grow, the lineage becomes the primary tool for answering questions like "what breaks if I change this column?" or "where does this dashboard's data come from?".

When you're done inspecting the Lineage tab, mark the lesson complete below.`,
  hint: 'Click "Lineage" in the bottom panel tabs. You should see the arrow from stg_customers to int_customer_summary.',
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/int_customer_summary.sql': `select
    customer_id,
    customer_name,
    country
from {{ ref('stg_customers') }}`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  preRanModels: ['stg_customers', 'int_customer_summary'],
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Open the Lineage tab and inspect the dependency graph, then mark the lesson complete.',
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'int_customer_summary', label: 'int_customer_summary', layer: 'intermediate' },
      ],
      edges: [{ source: 'stg_customers', target: 'int_customer_summary' }],
    },
  },
  validate: (state) => {
    if (!lineageHasEdge(state, 'stg_customers', 'int_customer_summary'))
      return { passed: false, reason: "int_customer_summary should still use {{ ref('stg_customers') }}." }
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Inspect the Lineage tab and mark the lesson complete.' }
    return { passed: true }
  },
  badge: { id: 'lineage-seen', name: 'Lineage Seen', emoji: '🧭' },
  quiz: {
    question: 'What does a dbt lineage graph represent?',
    options: [
      'The physical storage layout of your warehouse tables',
      'The order in which columns appear in SELECT statements',
      'The dependencies between models, expressed as ref() calls',
      'The git history of changes to model files',
    ],
    correctIndex: 2,
    explanation: 'The lineage graph is built from every ref() and source() call in your project. It is the canonical view of how data flows through your transformations.',
  },
  docs: [
    { label: 'About dbt projects', url: 'https://docs.getdbt.com/docs/build/projects' },
    { label: 'About `ref` function', url: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref' },
  ],
}

export default level07
