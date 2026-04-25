import type { Level } from '../engine/types'
import {
  exactRan,
  selectorsDagShape,
  selectorsFilesWithTags,
  selectorsSeeds,
} from './_selectorsFixture'

const level32: Level = {
  id: 32,
  chapter: 8,
  title: 'Combine tag and graph selectors',
  description: `Graph operators (\`+\`, \`+\`) compose with tag selectors. Mix them and you get expressive shortcuts.

  dbt run --select tag:daily+

That reads as: every model with the \`daily\` tag, AND every model downstream of those tagged models. Useful when daily-tagged staging models flow into untagged marts that should still rebuild on the daily run.

In this project the \`daily\` tag is on stg_orders and int_customer_orders. Their descendants are fct_orders and fct_customer_orders. So the selector pulls in four models — and importantly leaves stg_customers and dim_customers untouched, because they're on the OTHER branch of the graph.

Your task: run \`dbt run --select tag:daily+\` and confirm exactly those four models built.`,
  hint: 'Type `dbt run --select tag:daily+`. The trailing + extends the tag set with all downstream models.',
  initialFiles: selectorsFilesWithTags(),
  seeds: selectorsSeeds,
  requiredSteps: ['run'],
  goal: {
    description: 'Run `dbt run --select tag:daily+` to build the daily-tagged models and everything downstream.',
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    if (state.ranModels.size === 0)
      return { passed: false, reason: 'Run `dbt run --select tag:daily+`.' }
    if (!exactRan(state.ranModels, ['stg_orders', 'int_customer_orders', 'fct_orders', 'fct_customer_orders']))
      return {
        passed: false,
        reason: 'Expected the daily-tagged models and their descendants. Reset the level and try `dbt run --select tag:daily+`.',
      }
    return { passed: true }
  },
  badge: { id: 'composer', name: 'Selector Composer', emoji: '🧬' },
  quiz: {
    question: 'Why is `tag:daily+` often more useful than plain `tag:daily` for a scheduled production run?',
    options: [
      'It runs faster',
      'It rebuilds the tagged models AND every downstream model that consumes them, so dashboards see fresh data',
      'It runs tests automatically',
      'It silences errors from upstream models',
    ],
    correctIndex: 1,
    explanation: 'Tagging only the staging models that change daily is enough — the trailing + lets the rest of the graph cascade. New downstream models inherit the schedule for free, no tag-fan-out required.',
  },
  docs: [
    { label: 'Graph operators', url: 'https://docs.getdbt.com/reference/node-selection/graph-operators' },
  ],
}

export default level32
