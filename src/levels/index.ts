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
    title: 'Foundations',
    description: 'Understand SQL models and the dbt workflow.',
    levelIds: [1, 2, 3, 4],
  },
  {
    id: 2,
    title: 'Dependencies',
    description: 'Connect models using ref() to build a dependency graph.',
    levelIds: [5, 6, 7],
  },
  {
    id: 3,
    title: 'Materializations',
    description: 'Control how models are built with config().',
    levelIds: [8],
  },
  {
    id: 4,
    title: 'Data Quality',
    description: 'Validate your data with dbt tests.',
    levelIds: [9, 10],
  },
  {
    id: 5,
    title: 'Sources',
    description: 'Declare raw input tables as explicit sources.',
    levelIds: [11],
  },
]

export function getLevelById(id: number): Level | undefined {
  return levels.find((l) => l.id === id)
}

export function getModuleForLevel(levelId: number): Module | undefined {
  return modules.find((m) => m.levelIds.includes(levelId))
}
