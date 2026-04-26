import type { Level } from '../engine/types'
import {
  exactRan,
  selectorsDagShape,
  selectorsFiles,
  selectorsSeeds,
} from './_selectorsFixture'

const level29: Level = {
  id: 29,
  chapter: 8,
  title: 'Select both directions with +model+',
  description: `\`+\` and \`+\` combine. Wrap a model with both, and you get the model plus its full upstream chain plus its full downstream chain — the entire connected slice the model lives in.

This is the "rebuild this model and everything that touches it" selector:

  dbt run --select +int_customer_orders+

In this project int_customer_orders sits in the middle of one branch:
  • upstream: stg_orders
  • the model itself
  • downstream: fct_customer_orders

Three models in total. Notice the OTHER branch (stg_customers → dim_customers) and the OTHER mart on the orders branch (fct_orders) are NOT rebuilt — they don't touch int_customer_orders.

Your task: run \`dbt run --select +int_customer_orders+\` and confirm exactly those three models built.`,
  hint: 'Type `dbt run --select +int_customer_orders+`. Both + signs together mean "ancestors and descendants".',
  story: {
    messages: [
      {
        from: 'priya',
        body: `i'm changing int_customer_orders for yuki's churn report. want the full slice it touches rebuilt — fresh inputs above, marts below. the customers branch can stay put.`,
      },
      {
        from: 'yuki',
        body: `🙏 just don't make me wait for stg_customers + dim_customers again, those are unrelated`,
      },
    ],
  },
  initialFiles: selectorsFiles(),
  seeds: selectorsSeeds,
  requiredSteps: ['run'],
  goal: {
    description: 'Run `dbt run --select +int_customer_orders+` to rebuild the full slice around it.',
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    if (state.ranModels.size === 0)
      return { passed: false, reason: 'Run `dbt run --select +int_customer_orders+`.' }
    if (!exactRan(state.ranModels, ['stg_orders', 'int_customer_orders', 'fct_customer_orders']))
      return {
        passed: false,
        reason: 'Expected stg_orders, int_customer_orders, and fct_customer_orders. Reset the level and try `dbt run --select +int_customer_orders+`.',
      }
    return { passed: true }
  },
  badge: { id: 'slice', name: 'Slice Surgeon', emoji: '🪚' },
  quiz: {
    question: 'When is `+model+` the right selector?',
    options: [
      'Always — it is the safe default for daily runs',
      'When you have changed a model in the middle of the graph and want to rebuild every model that depends on its upstream OR depends on it',
      "When you've changed an upstream model and want to rebuild only its descendants",
      'When you only want to run the tests for that model',
    ],
    correctIndex: 1,
    explanation: '`+model+` selects the model plus its full upstream chain plus its full downstream chain. Option 3 describes `model+` (descendants only) — close, but missing the upstream half. Use `+model+` when a change in the middle of the graph needs an end-to-end validation.',
  },
  docs: [
    { label: 'Graph operators', url: 'https://docs.getdbt.com/reference/node-selection/graph-operators' },
  ],
}

export default level29
