import type { Level } from '../engine/types'
import { modelRefs, modelRan } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level06: Level = {
  id: 6,
  chapter: 2,
  title: 'Use ref() to reference another model',
  description: `Models almost always build on top of other models. When one model depends on another, you should reference it with {{ ref('model_name') }} instead of writing the table name directly.

Using ref() buys you two things:
  1. dbt learns about the dependency and builds upstream models first, in the correct order.
  2. The reference resolves to the right place in every environment automatically (dev, prod, etc.).

Your task: open models/int_customer_summary.sql and replace \`from stg_customers\` with \`from {{ ref('stg_customers') }}\`. Then run dbt run.`,
  hint: "Change `from stg_customers` to `from {{ ref('stg_customers') }}`. The double curly braces are dbt's Jinja template syntax.",
  story: {
    messages: [
      {
        from: 'priya',
        body: `there's an int_customer_summary marcus started. he hardcoded the table name. switch it to \`ref()\` so dbt actually knows it depends on stg_customers.`,
      },
    ],
  },
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/int_customer_summary.sql': `-- Task: replace the bare table name with {{ ref('stg_customers') }}
-- so dbt recognises the dependency.

select
    customer_id,
    customer_name,
    country
from stg_customers`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Update int_customer_summary.sql to use {{ ref('stg_customers') }}, then run dbt run.",
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'int_customer_summary', label: 'int_customer_summary', layer: 'intermediate' },
      ],
      edges: [{ source: 'stg_customers', target: 'int_customer_summary' }],
    },
  },
  validate: (state) => {
    if (!modelRefs(state, 'int_customer_summary', 'stg_customers'))
      return { passed: false, reason: "Use {{ ref('stg_customers') }} in int_customer_summary.sql." }
    if (!modelRan(state, 'int_customer_summary'))
      return { passed: false, reason: 'Run dbt run to build the model.' }
    return { passed: true }
  },
  badge: { id: 'first-ref', name: 'First ref()', emoji: '🔗' },
  quiz: {
    question: "What does {{ ref('model_name') }} tell dbt?",
    options: [
      'To import a Jinja macro',
      'To copy the referenced table physically',
      'That this model depends on another model',
      'To create a new schema',
    ],
    correctIndex: 2,
    explanation: "ref() declares a dependency. dbt uses it to order builds and to resolve the referenced model to the correct schema for each environment.",
  },
  docs: [
    { label: 'About `ref` function', url: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref' },
  ],
}

export default level06
