import type { Level } from '../engine/types'
import { sourceDefined, modelRan } from '../engine/validators'

// For level 10 the seed key uses the "source.table" format so DuckDB registers
// it as raw__customers — matching what {{ source('raw', 'customers') }} compiles to.
const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@sparkle.co,2024-01-05,US
2,Bob Chen,bob@sparkle.co,2024-01-17,CA
3,Carol Silva,carol@sparkle.co,2024-02-02,BR
4,Dave Kumar,dave@sparkle.co,2024-02-11,IN
5,Eve Müller,eve@sparkle.co,2024-03-01,DE`

const level11: Level = {
  id: 11,
  chapter: 5,
  title: 'Using source()',
  description: `Until now, models have referenced raw tables directly (e.g. from raw_customers). This works, but dbt has a better way: sources.

Declaring a source tells dbt:
  - Where your raw data comes from.
  - How to reference it consistently using {{ source('name', 'table') }}.
  - That it's raw input, not a model — so it shows up differently in the DAG.

Sources are usually declared in a dedicated YAML file like sources.yml.

Your task has two steps:
  1. Declare the raw.customers source in sources.yml (a starter file is provided).
  2. Replace \`from raw_customers\` in stg_customers.sql with \`from {{ source('raw', 'customers') }}\`.

Then run dbt run to rebuild the model.`,
  hint: "In sources.yml add:\nsources:\n  - name: raw\n    tables:\n      - name: customers\n\nIn stg_customers.sql replace the FROM clause with:\nfrom {{ source('raw', 'customers') }}",
  initialFiles: {
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    created_at,
    country
from raw_customers`,
    'models/sources.yml': `version: 2

# TODO: Declare the raw.customers source here.
# See the hint for the exact YAML shape.
`,
  },
  seeds: {
    'raw.customers': RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Declare raw.customers as a source and use {{ source('raw', 'customers') }} in stg_customers.sql.",
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
      return { passed: false, reason: 'Declare raw.customers as a source in schema.yml.' }
    const sql = state.files['models/stg_customers.sql'] ?? ''
    if (!/source\s*\(\s*['"]raw['"]\s*,\s*['"]customers['"]\s*\)/.test(sql))
      return { passed: false, reason: "Replace `from raw_customers` with `from {{ source('raw', 'customers') }}`." }
    if (!modelRan(state, 'stg_customers'))
      return { passed: false, reason: 'Run dbt run to rebuild the model.' }
    return { passed: true }
  },
  badge: { id: 'source-declared', name: 'Source Declared', emoji: '📡' },
  quiz: {
    question: "What is the purpose of {{ source('raw', 'customers') }} in a dbt model?",
    options: [
      "It creates a raw copy of the 'customers' table in your warehouse",
      "It seeds the database with CSV data from a file named customers.csv",
      "It references an upstream data source that dbt does not own or build",
      "It runs a raw SQL query without Jinja compilation",
    ],
    correctIndex: 2,
    explanation: "source() references tables that exist in your warehouse but are loaded by external processes (like an ETL tool), not by dbt. Declaring them in sources.yml lets dbt document lineage, run freshness checks, and display them in the DAG.",
  },
}

export default level11
