import type { Level } from '../engine/types'
import {
  exactRan,
  selectorsDagShape,
  selectorsFilesWithTags,
  selectorsSeeds,
} from './_selectorsFixture'

const level31: Level = {
  id: 31,
  chapter: 8,
  title: 'Select models by tag',
  description: `Once a tag is declared, you can target every model that carries it with the \`tag:\` selector method:

  dbt run --select tag:daily

The schema.yml in this project already has the \`daily\` tag on stg_orders and int_customer_orders (the same ones you tagged last lesson, pre-loaded so you can focus on the selector itself).

Your task: run \`dbt run --select tag:daily\` and confirm exactly those two models built — no staging customers, no marts.`,
  hint: 'Type `dbt run --select tag:daily`.',
  story: {
    messages: [
      {
        from: 'yuki',
        body: `ok pretend it's wednesday 6am and the campaign is live. just the daily-tagged stuff refreshed pls. one command 🙏`,
      },
    ],
  },
  initialFiles: selectorsFilesWithTags(),
  seeds: selectorsSeeds,
  requiredSteps: ['run'],
  goal: {
    description: "Run `dbt run --select tag:daily` to build only the models tagged 'daily'.",
    dagShape: selectorsDagShape,
  },
  validate: (state) => {
    if (state.ranModels.size === 0)
      return { passed: false, reason: 'Run `dbt run --select tag:daily`.' }
    if (!exactRan(state.ranModels, ['stg_orders', 'int_customer_orders']))
      return {
        passed: false,
        reason: "Expected only the two 'daily'-tagged models. Reset the level and try `dbt run --select tag:daily`.",
      }
    return { passed: true }
  },
  badge: {
    id: 'tag-picker',
    name: 'Tag Picker',
    emoji: '🔖',
    caption: 'Campaign refresh, on cue',
  },
  quiz: {
    question: 'You schedule `dbt run --select tag:hourly` to run every hour. Six months later your team adds three new hourly models. What do you need to change?',
    options: [
      'Edit the cron schedule to list the new model names',
      'Nothing — as long as the new models carry the `hourly` tag, the existing selector picks them up automatically',
      'Add `--include` flags for each new model',
      'Re-run dbt parse on every CI build',
    ],
    correctIndex: 1,
    explanation: 'That is the whole point of selecting by tag — the selector describes intent ("hourly things"), not a list of names. New models that match the intent are picked up for free.',
  },
  docs: [
    { label: 'tag method', url: 'https://docs.getdbt.com/reference/node-selection/methods#tag' },
  ],
}

export default level31
