import type { Level } from '../engine/types'
import { quizCorrect } from '../engine/validators'

const level18: Level = {
  id: 18,
  chapter: 5,
  title: 'Why documentation matters',
  description: `A description is just a string in YAML, but it's load-bearing once a project has more than one author.

Where descriptions actually pay off
  • Onboarding — new teammates can read what a model means without reverse-engineering the SQL.
  • Lineage handoff — analysts following a graph from a dashboard back to a source can land on each node and read what it represents.
  • The dbt docs site — \`dbt docs generate\` plus \`dbt docs serve\` builds a browsable site from your descriptions, tests, and lineage. dbt-quest doesn't simulate the rendered site, but in a real project that site is where most non-engineers look first.
  • Self-documenting contracts — descriptions and tests in the same YAML file form the public contract of the model: what it is, and what guarantees it makes.

Where descriptions do NOT help
  • Restating the column name in English ("customer_id is the customer id"). If the description equals the name, delete it.
  • Internal implementation notes that change every refactor. Those belong in commit messages, not descriptions.
  • Anything time-sensitive ("temporarily filtered, will fix Tuesday"). It will rot.

Mental shortcut: write the one sentence you'd want to read if a stakeholder Slacked you "what's this column?". When you've thought it through, take the quiz to complete the lesson.`,
  hint: 'Picture explaining one of your real models to a new teammate in one sentence. That sentence is the description.',
  story: {
    messages: [
      {
        from: 'priya',
        body: `quick read before monday — when a description earns its keep vs. when it's noise. this is the stuff i'd want the new analyst to internalize before they touch yaml. quick quiz at the end to lock it in.`,
      },
    ],
  },
  initialFiles: {
    'models/schema.yml': `version: 2

models:
  - name: dim_customers
    description: One row per customer, with lifetime totals — the canonical customer dimension used by every dashboard.
    columns:
      - name: customer_id
        description: Stable surrogate id, foreign-keyed by every fact table.
        tests:
          - not_null
          - unique
      - name: lifetime_value
        description: Sum of completed-order amounts in USD, refreshed daily.
`,
  },
  seeds: {},
  requiredSteps: [],
  quizGates: true,
  goal: {
    description: 'Read the lesson, then take the quiz to complete the level.',
  },
  validate: (state) => {
    if (!quizCorrect(state))
      return { passed: false, reason: 'Take the quiz and answer correctly to complete the lesson.' }
    return { passed: true }
  },
  badge: { id: 'doc-thinker', name: 'Doc Thinker', emoji: '📚' },
  quiz: {
    question: 'Which of these is the BEST candidate for a description?',
    options: [
      'customer_id — "The customer id."',
      'lifetime_value — "Sum of completed-order amounts in USD, refreshed daily."',
      'order_count — "See order_count_v2 for the new logic; this one is deprecated."',
      'created_at — "Temporarily filtered to last 90 days for the spike investigation."',
    ],
    correctIndex: 1,
    explanation: 'A useful description explains what the value means and how it is computed. The other three are anti-patterns: option 1 just paraphrases the column name (delete it), option 3 documents an internal refactor that belongs in a commit message, and option 4 is a time-bound note that will rot.',
  },
  docs: [
    { label: 'Documentation', url: 'https://docs.getdbt.com/docs/build/documentation' },
  ],
}

export default level18
