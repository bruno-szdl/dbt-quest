import type { Level } from '../engine/types'
import {
  exactRan,
  selectorsDagShape,
  selectorsFiles,
  selectorsSeeds,
} from './_selectorsFixture'

const level26: Level = {
  id: 26,
  chapter: 8,
  title: 'Select a single model',
  description: `\`dbt run\` builds every model in the project by default. Most of the time that's overkill — you've changed one model and want to rebuild only that one.

The \`--select\` flag (or its short form \`-s\`) tells dbt to build a subset:

  dbt run --select stg_customers

That builds stg_customers and nothing else.

Your task: open the lineage panel, get a feel for the six models in this project, then run \`dbt run --select stg_customers\`. The terminal should report exactly one model built.`,
  hint: 'Type `dbt run --select stg_customers` (or `dbt run -s stg_customers`).',
  initialFiles: selectorsFiles(),
  seeds: selectorsSeeds,
  requiredSteps: ['run'],
  goal: {
    description: 'Run `dbt run --select stg_customers` and build only that one model.',
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    if (state.ranModels.size === 0)
      return { passed: false, reason: 'Run `dbt run --select stg_customers`.' }
    if (!exactRan(state.ranModels, ['stg_customers']))
      return {
        passed: false,
        reason: 'Only stg_customers should have run. Reset the level and try `dbt run --select stg_customers`.',
      }
    return { passed: true }
  },
  badge: { id: 'sniper', name: 'Sniper Selector', emoji: '🎯' },
  quiz: {
    question: 'What does `dbt run --select stg_customers` do?',
    options: [
      'Builds every model in the project, with stg_customers first',
      'Builds only stg_customers — no other models, no upstreams, no downstreams',
      'Builds stg_customers and every model that depends on it',
      'Runs tests for stg_customers but does not build it',
    ],
    correctIndex: 1,
    explanation: '`--select model_name` is the most precise selector. It builds exactly that one model — no upstream ancestors, no downstream descendants. Use it when you have changed a single file and want a fast iteration loop.',
  },
  docs: [
    { label: 'Node selection syntax', url: 'https://docs.getdbt.com/reference/node-selection/syntax' },
  ],
}

export default level26
