import type { Level } from '../engine/types'
import { collectModels } from '../engine/compiler'
import {
  selectorsDagShape,
  selectorsFiles,
  selectorsSeeds,
} from './_selectorsFixture'

const level30: Level = {
  id: 30,
  chapter: 8,
  title: 'Add tags to a model',
  description: `Graph operators (\`+model\`, \`model+\`) are great when you know which model you're aiming at. But sometimes the natural grouping is semantic, not structural: "every model that runs hourly", "every PII-aware model", "every metric used by the finance dashboard".

That's what tags are for. A model can carry one or more tags, and any selector can match by tag.

You declare tags either inline in the SQL config, or in YAML next to the model:

  models:
    - name: my_model
      config:
        tags: ['daily']

Your task: open \`models/schema.yml\` and add the tag \`daily\` to BOTH stg_orders and int_customer_orders. Selecting them in the next lesson will only work cleanly if both ends of the chain are tagged — int_customer_orders depends on stg_orders, so tagging just one would leave a broken ref.`,
  hint: "Under each model in models/schema.yml, replace the TODO with `config:\\n      tags: ['daily']`.",
  initialFiles: selectorsFiles({
    'models/schema.yml': `version: 2

models:
  - name: stg_orders
    # TODO: add config.tags: ['daily']
  - name: int_customer_orders
    # TODO: add config.tags: ['daily']
`,
  }),
  seeds: selectorsSeeds,
  requiredSteps: ['files'],
  goal: {
    description: "Tag stg_orders and int_customer_orders with 'daily' in models/schema.yml.",
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    const models = collectModels(state.files)
    const stgOrders = models.find((m) => m.name === 'stg_orders')
    const intCo = models.find((m) => m.name === 'int_customer_orders')
    if (!stgOrders?.tags.includes('daily'))
      return { passed: false, reason: "Add the 'daily' tag to stg_orders in models/schema.yml." }
    if (!intCo?.tags.includes('daily'))
      return { passed: false, reason: "Add the 'daily' tag to int_customer_orders in models/schema.yml." }
    return { passed: true }
  },
  badge: { id: 'tagger', name: 'Tagger', emoji: '🏷️' },
  quiz: {
    question: "What's the main reason to use a tag instead of just listing models by name?",
    options: [
      'Tags run faster than fully-qualified names',
      'Tags let you group models by intent (schedule, owner, sensitivity), so a single selector keeps working as the project grows',
      'Tags are required before a model can be referenced with `ref()`',
      'Tags replace the need for `--select`',
    ],
    correctIndex: 1,
    explanation: 'Tags decouple "which models to run together" from "where they live in the graph". A `tag:hourly` selector keeps doing the right thing as you add new hourly models, without anyone editing the schedule.',
  },
  docs: [
    { label: 'Tags', url: 'https://docs.getdbt.com/reference/resource-configs/tags' },
  ],
}

export default level30
