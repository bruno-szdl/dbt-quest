import type { Level } from '../engine/types'
import { manuallyMarked } from '../engine/validators'
import {
  selectorsDagShape,
  selectorsFiles,
  selectorsSeeds,
} from './_selectorsFixture'

const level33: Level = {
  id: 33,
  chapter: 8,
  title: 'Compare comma vs space',
  description: `One last selector subtlety, the one that trips most people up the first time.

When you pass multiple selectors to \`--select\`, the separator changes the meaning:

  • SPACE  → union (OR). \`--select tag:daily tag:finance\` builds every model that is daily OR finance.
  • COMMA  → intersection (AND). \`--select tag:daily,tag:finance\` builds only models that are daily AND finance.

This fixture has tags arranged so the difference is visible:

  stg_orders            → tags: daily, finance
  int_customer_orders   → tags: daily
  fct_orders            → tags: finance

Predictions:
  • \`dbt run --select tag:daily tag:finance\` rebuilds all three (union).
  • \`dbt run --select tag:daily,tag:finance\` rebuilds only stg_orders (intersection).

Try both in the terminal and watch the model counts change. When the union/intersection distinction clicks, mark the lesson complete.`,
  hint: 'Run both `dbt run --select tag:daily tag:finance` and `dbt run --select tag:daily,tag:finance` and compare the model counts. Reset between attempts if you want a clean count.',
  initialFiles: selectorsFiles({
    'models/schema.yml': `version: 2

models:
  - name: stg_orders
    config:
      tags: ['daily', 'finance']
  - name: int_customer_orders
    config:
      tags: ['daily']
  - name: fct_orders
    config:
      tags: ['finance']
`,
  }),
  seeds: selectorsSeeds,
  requiredSteps: [],
  manualCompletion: true,
  goal: {
    description: 'Try both separators, compare the results, then mark complete.',
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    if (!manuallyMarked(state))
      return { passed: false, reason: 'Try both selector forms, then mark the lesson complete.' }
    return { passed: true }
  },
  badge: { id: 'set-theorist', name: 'Set Theorist', emoji: '∩' },
  quiz: {
    question: 'You want to run every model that is BOTH `pii` AND `nightly` — for a sensitive overnight job. Which selector?',
    options: [
      'dbt run --select tag:pii tag:nightly',
      'dbt run --select tag:pii,tag:nightly',
      'dbt run --select +tag:pii tag:nightly',
      'dbt run --select tag:pii --include tag:nightly',
    ],
    correctIndex: 1,
    explanation: 'Comma means intersection (AND). Space means union (OR). For "must be BOTH", use the comma form. Reach for this rarely — it is most useful when combining tag with another method, like `tag:nightly,config.materialized:incremental`.',
  },
  docs: [
    { label: 'Set operators', url: 'https://docs.getdbt.com/reference/node-selection/set-operators' },
  ],
}

export default level33
