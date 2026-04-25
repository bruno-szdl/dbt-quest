import type { Level } from '../engine/types'
import { modelRan, modelRefs, outputColumnsInclude } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const COUNTRY_CODES = `code,country_name,region
US,United States,Americas
CA,Canada,Americas
BR,Brazil,Americas
IN,India,Asia
DE,Germany,Europe
FR,France,Europe
JP,Japan,Asia`

const level21: Level = {
  id: 21,
  chapter: 6,
  title: 'Reference the seed',
  description: `Once a seed is loaded, you reference it from a model exactly like any other dataset — with ref().

That's a nice property: models don't need to care whether the upstream is a staging model, an intermediate model, or a seed. They are all just ref() calls.

Your task: complete models/int_customer_enriched.sql so that it joins stg_customers with the country_codes seed on the country column. Add \`country_name\` and \`region\` to the SELECT list, then run dbt run.`,
  hint: "Use `join {{ ref('country_codes') }} as cc on c.country = cc.code` and add cc.country_name, cc.region to the SELECT.",
  initialFiles: {
    'seeds/country_codes.csv': COUNTRY_CODES,
    'models/stg_customers.sql': `select
    id         as customer_id,
    name       as customer_name,
    email,
    country
from raw_customers`,
    'models/int_customer_enriched.sql': `-- Task: join {{ ref('country_codes') }} to get country_name and region.

select
    c.customer_id,
    c.customer_name,
    c.country
from {{ ref('stg_customers') }} as c`,
  },
  seeds: {
    raw_customers: RAW_CUSTOMERS,
  },
  requiredSteps: ['files', 'run'],
  goal: {
    description: "Join {{ ref('country_codes') }} into int_customer_enriched and include country_name and region.",
    dagShape: {
      nodes: [
        { id: 'stg_customers', label: 'stg_customers', layer: 'staging' },
        { id: 'country_codes', label: 'country_codes', layer: 'source' },
        { id: 'int_customer_enriched', label: 'int_customer_enriched', layer: 'intermediate' },
      ],
      edges: [
        { source: 'stg_customers', target: 'int_customer_enriched' },
        { source: 'country_codes', target: 'int_customer_enriched' },
      ],
    },
  },
  validate: (state) => {
    if (!modelRefs(state, 'int_customer_enriched', 'country_codes'))
      return { passed: false, reason: "Use {{ ref('country_codes') }} to join the seed into int_customer_enriched." }
    if (!modelRan(state, 'int_customer_enriched'))
      return { passed: false, reason: 'Run dbt run to build int_customer_enriched.' }
    if (!outputColumnsInclude(state, 'int_customer_enriched', ['country_name', 'region']))
      return { passed: false, reason: 'Include country_name and region from the seed in the SELECT.' }
    return { passed: true }
  },
  badge: { id: 'seed-joined', name: 'Seed Joined', emoji: '🌍' },
  quiz: {
    question: 'How do you reference a seed from a model?',
    options: [
      "With {{ source('seeds', 'name') }}",
      "With {{ ref('seed_name') }}",
      "By writing the raw CSV path",
      "With {{ seed('name') }}",
    ],
    correctIndex: 1,
    explanation: 'Seeds are addressed with ref(), same as any model. This keeps downstream SQL uniform regardless of whether the upstream is a model, a snapshot, or a seed.',
  },
  docs: [
    { label: 'About seeds', url: 'https://docs.getdbt.com/docs/build/seeds' },
    { label: 'About `ref` function', url: 'https://docs.getdbt.com/reference/dbt-jinja-functions/ref' },
  ],
}

export default level21
