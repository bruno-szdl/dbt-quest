import type { Level } from '../engine/types'
import { lineageHasSourceEdge, modelRan, sourceDefined } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level19: Level = {
  id: 19,
  chapter: 6,
  title: 'Use source() in a staging model',
  description: `Once a source is declared, staging models reference it with \`{{ source('name', 'table') }}\` instead of the bare table name. The declaration is reused — you don't have to repeat the schema name in every model.

The source \`raw.customers\` has already been declared in models/sources.yml.

Your task: in stg_customers.sql replace \`from raw_customers\` with \`from {{ source('raw', 'customers') }}\`, then run dbt run. Once you do, the lineage tab will start showing raw.customers as an upstream node feeding into stg_customers.`,
  hint: "Replace `from raw_customers` with `from {{ source('raw', 'customers') }}`. Then run `dbt run`.",
  story: {
    messages: [
      {
        from: 'priya',
        body: `now wire stg_customers up to the source you just declared. same data — but the lineage tab will start showing where it came from. it's about being honest about inputs.`,
      },
    ],
  },
  initialFiles: {
    'models/sources.yml': `version: 2

sources:
  - name: raw
    tables:
      - name: customers
`,
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
  },
  seeds: {
    'raw.customers': RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Use {{ source('raw', 'customers') }} in stg_customers.sql and run dbt run.",
    dagShape: {
      nodes: [
        { id: 'raw.customers', label: 'raw.customers', layer: 'source' },
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
      ],
      edges: [{ source: 'raw.customers', target: 'stg_customers' }],
    },
  },
  validate: (state) => {
    if (!sourceDefined(state, 'raw', 'customers'))
      return { passed: false, reason: 'Keep the raw.customers declaration in sources.yml.' }
    if (!lineageHasSourceEdge(state, 'raw', 'customers', 'stg_customers'))
      return { passed: false, reason: "Replace the bare table name with {{ source('raw', 'customers') }}." }
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to rebuild the model.' }
    return { passed: true }
  },
  badge: { id: 'source-used', name: 'Source Plugged In', emoji: '🔌' },
  quiz: {
    question: "What does {{ source('raw', 'customers') }} compile to?",
    options: [
      'A bare Python import',
      'A reference to a raw input declared in sources.yml, resolved to the correct schema and table',
      "A dbt test on the 'customers' table",
      "An empty string when raw is not set",
    ],
    correctIndex: 1,
    explanation: 'source() looks up the declaration in sources.yml and resolves to the concrete schema.table for the current environment. It also registers the source as an upstream node in the lineage graph.',
  },
  docs: [
    { label: 'About `source` function', url: 'https://docs.getdbt.com/reference/dbt-jinja-functions/source' },
    { label: 'About sources', url: 'https://docs.getdbt.com/docs/build/sources' },
  ],
}

export default level19
