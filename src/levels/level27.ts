import type { Level } from '../engine/types'
import {
  exactRan,
  selectorsDagShape,
  selectorsFiles,
  selectorsSeeds,
} from './_selectorsFixture'

const level27: Level = {
  id: 27,
  chapter: 8,
  title: 'Select upstream with +model',
  description: `Sometimes you don't just want to build one model — you want to build that model and everything it depends on, so the data is fresh end-to-end.

Prefix the selector with \`+\` to mean "this model and all of its ancestors":

  dbt run --select +dim_customers

That builds dim_customers along with every model dim_customers depends on, recursively. In this project dim_customers refs only stg_customers, so two models will run.

Your task: run \`dbt run --select +dim_customers\` and confirm both stg_customers and dim_customers built — but nothing else.`,
  hint: 'Type `dbt run --select +dim_customers`. The leading + means "include all ancestors".',
  story: {
    messages: [
      {
        from: 'yuki',
        body: `dim_customers feels stale on my dashboard. can you rebuild it AND its upstreams? not the whole project pls, just that branch 🙏`,
      },
    ],
  },
  initialFiles: selectorsFiles(),
  seeds: selectorsSeeds,
  requiredSteps: ['run'],
  goal: {
    description: 'Run `dbt run --select +dim_customers` to build dim_customers and its upstream chain.',
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    if (state.ranModels.size === 0)
      return { passed: false, reason: 'Run `dbt run --select +dim_customers`.' }
    if (!exactRan(state.ranModels, ['stg_customers', 'dim_customers']))
      return {
        passed: false,
        reason: 'Expected exactly stg_customers and dim_customers. Reset the level and try `dbt run --select +dim_customers`.',
      }
    return { passed: true }
  },
  badge: { id: 'upstream-traveller', name: 'Upstream Traveller', emoji: '⬆️' },
  quiz: {
    question: 'What does `dbt run --select +dim_customers` build?',
    options: [
      'Just dim_customers',
      'dim_customers and every model that depends on it',
      'dim_customers and every model it depends on, recursively',
      'Every model in the project',
    ],
    correctIndex: 2,
    explanation: 'The leading `+` walks the lineage upstream from the selected model. This is the right selector when you want a model freshly rebuilt with everything it needs, in dependency order.',
  },
  docs: [
    { label: 'Graph operators', url: 'https://docs.getdbt.com/reference/node-selection/graph-operators' },
  ],
}

export default level27
