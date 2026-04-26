import type { Level } from '../engine/types'
import {
  exactRan,
  selectorsDagShape,
  selectorsFiles,
  selectorsSeeds,
} from './_selectorsFixture'

const level28: Level = {
  id: 28,
  chapter: 8,
  title: 'Select downstream with model+',
  description: `The mirror image of \`+model\` is \`model+\`: that selects the model and everything that depends on it, recursively.

This is what you reach for after fixing a bug in a staging model — you want to rebuild every downstream model so the fix propagates:

  dbt run --select stg_orders+

In this project stg_orders has three descendants: int_customer_orders, fct_orders, and fct_customer_orders (via int_customer_orders). So four models will run in dependency order.

Your task: run \`dbt run --select stg_orders+\` and confirm exactly four models built — stg_orders plus its three descendants.`,
  hint: 'Type `dbt run --select stg_orders+`. The trailing + means "include all descendants".',
  story: {
    messages: [
      {
        from: 'yuki',
        body: `revenue chart looked weird this morning — turns out it was an stg_orders bug. priya's pushing a fix now. but the marts won't see it until they rebuild 😬`,
      },
      {
        from: 'priya',
        body: `fix is in. need every downstream model to pick the change up so yuki's dashboards aren't stale. \`stg_orders+\` will cascade it.`,
      },
    ],
  },
  initialFiles: selectorsFiles(),
  seeds: selectorsSeeds,
  requiredSteps: ['run'],
  goal: {
    description: 'Run `dbt run --select stg_orders+` to rebuild stg_orders and everything downstream.',
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    if (state.ranModels.size === 0)
      return { passed: false, reason: 'Run `dbt run --select stg_orders+`.' }
    if (!exactRan(state.ranModels, ['stg_orders', 'int_customer_orders', 'fct_orders', 'fct_customer_orders']))
      return {
        passed: false,
        reason: 'Expected stg_orders and its three descendants. Reset the level and try `dbt run --select stg_orders+`.',
      }
    return { passed: true }
  },
  badge: { id: 'ripple', name: 'Ripple Runner', emoji: '⬇️' },
  quiz: {
    question: 'You just fixed a bug in stg_orders. Which command rebuilds every model that could be affected by the fix?',
    options: [
      'dbt run --select stg_orders',
      'dbt run --select +stg_orders',
      'dbt run --select stg_orders+',
      'dbt run',
    ],
    correctIndex: 2,
    explanation: '`stg_orders+` rebuilds stg_orders and every descendant in dependency order. That propagates the fix all the way to the marts without rebuilding unrelated trees.',
  },
  docs: [
    { label: 'Graph operators', url: 'https://docs.getdbt.com/reference/node-selection/graph-operators' },
  ],
}

export default level28
