import type { Level } from '../engine/types'
import { sourceDefined } from '../engine/validators'

const RAW_CUSTOMERS = `id,name,email,created_at,country
1,Alice Martin,alice@example.com,2024-01-05,US
2,Bob Chen,bob@example.com,2024-01-17,CA
3,Carol Silva,carol@example.com,2024-02-02,BR
4,Dave Kumar,dave@example.com,2024-02-11,IN
5,Eve Müller,eve@example.com,2024-03-01,DE`

const level18: Level = {
  id: 18,
  chapter: 6,
  title: 'Declare a source',
  description: `Every raw input to your project comes from somewhere — an ingestion pipeline, an event stream, a production database replica. dbt calls these inputs sources.

Before you can reference a source in SQL, you declare it in a YAML file. Declarations look like this:

  version: 2

  sources:
    - name: raw
      tables:
        - name: customers
        - name: orders

\`name\` groups tables that share the same origin (for example, all tables replicated from the production app). Each \`- name:\` under \`tables:\` is one raw table.

Your task: complete models/sources.yml so that a source called \`raw\` exposes a table called \`customers\`.`,
  hint: "Add this block below `version: 2`:\nsources:\n  - name: raw\n    tables:\n      - name: customers",
  story: {
    messages: [
      {
        from: 'priya',
        body: `marcus pointed every model at \`raw_customers\` directly — like the warehouse name was magic. that's how stuff breaks when we promote to prod. let's declare it properly: a source called \`raw\` with a table called \`customers\`.`,
      },
    ],
  },
  initialFiles: {
    'models/sources.yml': `version: 2

# TODO: declare a source called "raw" with a table called "customers".
`,
  },
  seeds: {
    'raw.customers': RAW_CUSTOMERS,
  },
  requiredSteps: ['files'],
  goal: {
    description: 'Declare raw.customers in models/sources.yml.',
    dagShape: {
      nodes: [{ id: 'raw.customers', label: 'raw.customers', layer: 'source' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!sourceDefined(state, 'raw', 'customers'))
      return { passed: false, reason: 'Add a source named `raw` with a table named `customers` to models/sources.yml.' }
    return { passed: true }
  },
  badge: { id: 'source-declared', name: 'Source Declared', emoji: '📡' },
  quiz: {
    question: 'Why declare raw tables as dbt sources instead of referencing them directly?',
    options: [
      'dbt refuses to run otherwise',
      'It makes the SQL faster at runtime',
      'Sources give you documentation, lineage and freshness checks for raw inputs',
      'Sources materialize the raw tables as views automatically',
    ],
    correctIndex: 2,
    explanation: 'Declaring sources makes raw inputs first-class: they show up in lineage, can have tests and docs attached, and can be monitored for freshness. dbt itself does not create or own them.',
  },
  docs: [
    { label: 'About sources', url: 'https://docs.getdbt.com/docs/build/sources' },
  ],
}

export default level18
