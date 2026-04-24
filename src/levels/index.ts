import type { Level } from '../engine/types'
import level01 from './level01'
import level02 from './level02'
import level03 from './level03'
import level04 from './level04'
import level05 from './level05'
import level06 from './level06'
import level07 from './level07'
import level08 from './level08'
import level09 from './level09'
import level10 from './level10'
import level11 from './level11'
import level12 from './level12'
import level13 from './level13'
import level14 from './level14'
import level15 from './level15'
import level16 from './level16'
import level17 from './level17'
import level18 from './level18'
import level19 from './level19'
import level20 from './level20'
import level21 from './level21'
import level22 from './level22'
import level23 from './level23'
import level24 from './level24'
import level25 from './level25'
import level26 from './level26'
import level27 from './level27'
import level28 from './level28'
import level29 from './level29'
import level30 from './level30'
import level31 from './level31'

export const levels: Level[] = [
  level01,
  level02,
  level03,
  level04,
  level05,
  level06,
  level07,
  level08,
  level09,
  level10,
  level11,
  level12,
  level13,
  level14,
  level15,
  level16,
  level17,
  level18,
  level19,
  level20,
  level21,
  level22,
  level23,
  level24,
  level25,
  level26,
  level27,
  level28,
  level29,
  level30,
  level31,
]

export interface Module {
  id: number
  title: string
  description: string
  levelIds: number[]
}

export const modules: Module[] = [
  {
    id: 1,
    title: 'First contact with dbt',
    description: 'A model is a SQL transformation you run, inspect and edit.',
    levelIds: [1, 2, 3, 4],
  },
  {
    id: 2,
    title: 'Multiple models and dependencies',
    description: 'Wire models together with ref() and read the lineage.',
    levelIds: [5, 6, 7, 8],
  },
  {
    id: 3,
    title: 'Materializations',
    description: 'Choose how a model is built — view or table.',
    levelIds: [9, 10],
  },
  {
    id: 4,
    title: 'Data quality and testing',
    description: 'Catch bad data early with tests and dbt build.',
    levelIds: [11, 12, 13, 14, 15],
  },
  {
    id: 5,
    title: 'Sources and seeds',
    description: 'Formalise raw inputs with sources and small CSVs with seeds.',
    levelIds: [16, 17, 18, 19, 20],
  },
  {
    id: 6,
    title: 'Project structure',
    description: 'Organise models into staging, intermediate and marts.',
    levelIds: [21, 22, 23],
  },
  {
    id: 7,
    title: 'Ephemeral models',
    description: 'Reusable SQL that never becomes a warehouse object.',
    levelIds: [24, 25],
  },
  {
    id: 8,
    title: 'Incremental models',
    description: 'Process only new rows instead of rebuilding from scratch.',
    levelIds: [26, 27, 28],
  },
  {
    id: 9,
    title: 'Snapshots',
    description: 'Preserve historical versions of changing source data.',
    levelIds: [29, 30, 31],
  },
]

export function getLevelById(id: number): Level | undefined {
  return levels.find((l) => l.id === id)
}

export function getModuleForLevel(levelId: number): Module | undefined {
  return modules.find((m) => m.levelIds.includes(levelId))
}
