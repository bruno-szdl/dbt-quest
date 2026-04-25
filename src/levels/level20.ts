import type { Level } from '../engine/types'
import { seedLoaded } from '../engine/validators'

const COUNTRY_CODES = `code,country_name,region
US,United States,Americas
CA,Canada,Americas
BR,Brazil,Americas
IN,India,Asia
DE,Germany,Europe
FR,France,Europe
JP,Japan,Asia`

const level20: Level = {
  id: 20,
  chapter: 6,
  title: 'Add a seed',
  description: `Sources are for raw data loaded into the warehouse by someone else. Seeds are different — they are small CSV files that live inside the dbt project and that dbt itself loads into the warehouse for you.

Seeds are a good fit for tiny reference tables (country codes, mapping tables, thresholds, demo data) where the file being version-controlled next to the code is a feature, not a bug.

A seed file is just a CSV under \`seeds/\`. To load it, you run:

  dbt seed

A seed called \`country_codes\` is already in the project at \`seeds/country_codes.csv\`. Your task: run \`dbt seed\` and watch it get loaded into the warehouse. It will appear in the Database Explorer on the left once the command finishes.`,
  hint: 'Run `dbt seed` in the terminal.',
  initialFiles: {
    'seeds/country_codes.csv': COUNTRY_CODES,
  },
  seeds: {},
  requiredSteps: [],
  goal: {
    description: 'Run `dbt seed` to load the country_codes CSV into the warehouse.',
    dagShape: {
      nodes: [{ id: 'country_codes', label: 'country_codes', layer: 'source' }],
      edges: [],
    },
  },
  validate: (state) => {
    if (!seedLoaded(state, 'country_codes'))
      return { passed: false, reason: 'Run `dbt seed` to load country_codes.' }
    return { passed: true }
  },
  badge: { id: 'seed-sower', name: 'Seed Sower', emoji: '🌾' },
  quiz: {
    question: 'Which of the following is a good use case for a dbt seed?',
    options: [
      'A 50 GB event log refreshed nightly',
      'The production customers table, replicated from the app database',
      'A small CSV of country codes used to enrich reports',
      'A Python script that generates synthetic data',
    ],
    correctIndex: 2,
    explanation: 'Seeds are designed for small, mostly-static reference data you want versioned next to your code. Big, frequently-changing data belongs in a real ingestion pipeline and should be a source, not a seed.',
  },
  docs: [
    { label: 'About seeds', url: 'https://docs.getdbt.com/docs/build/seeds' },
  ],
}

export default level20
