import type { Level } from '../engine/types'
import { manuallyMarked } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR`

const COUNTRY_CODES = `code,country_name,region
US,United States,Americas
CA,Canada,Americas
BR,Brazil,Americas`

const level20: Level = {
  id: 20,
  chapter: 5,
  title: 'Compare source vs seed',
  description: `Sources and seeds are both raw inputs, but they represent different things:

Source — data owned by something other than dbt.
  • Loaded into the warehouse by an ingestion pipeline, ETL tool, or replication.
  • Usually large and frequently-changing.
  • Declared in YAML with \`sources:\` and referenced via \`{{ source(...) }}\`.
  • Example: the production customers table replicated nightly.

Seed — data owned by the dbt project itself.
  • A CSV file committed in \`seeds/\`, loaded by \`dbt seed\`.
  • Usually small and rarely changes.
  • Referenced via \`{{ ref(...) }}\`, just like a model.
  • Example: a country-code lookup table used to enrich reports.

Rule of thumb: if the data belongs in the warehouse regardless of dbt, it's a source. If the data only makes sense next to the dbt code, it's a seed.

Both files have been provided so you can open them side by side. When the distinction feels clear, mark the lesson complete.`,
  hint: 'Open sources.yml and seeds/country_codes.csv and note how each is used.',
  initialFiles: {
    'models/sources.yml': `version: 2

sources:
  - name: raw
    tables:
      - name: customers
`,
    'seeds/country_codes.csv': COUNTRY_CODES,
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    country
from {{ source('raw', 'customers') }}`,
  },
  seeds: {
    'raw.customers': RAW_CUSTOMERS,
  },
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Inspect the source and the seed, then mark complete.',
    dagShape: {
      nodes: [
        { id: 'raw.customers', label: 'raw.customers', layer: 'source' },
        { id: 'country_codes', label: 'country_codes', layer: 'source' },
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
      ],
      edges: [{ source: 'raw.customers', target: 'stg_customers' }],
    },
  },
  validate: (state) => {
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Compare the two, then mark the lesson complete.' }
    return { passed: true }
  },
  badge: { id: 'source-vs-seed', name: 'Source vs Seed', emoji: '🗺️' },
  quiz: {
    question: 'Which data is most likely a seed rather than a source?',
    options: [
      'The production orders table replicated from the app database',
      'A 100 GB event stream landed by a Kafka connector',
      'A 12-row CSV mapping product SKUs to categories',
      'A Salesforce contacts export refreshed hourly',
    ],
    correctIndex: 2,
    explanation: 'Seeds shine for small, mostly-static reference data owned by the dbt project. Large or frequently-refreshed data belongs in a real ingestion pipeline and should be declared as a source.',
  },
}

export default level20
