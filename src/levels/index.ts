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
import level32 from './level32'
import level33 from './level33'
import level34 from './level34'
import level35 from './level35'
import level36 from './level36'
import level37 from './level37'
import level38 from './level38'
import level39 from './level39'
import level40 from './level40'
import level41 from './level41'
import level42 from './level42'

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
  level32,
  level33,
  level34,
  level35,
  level36,
  level37,
  level38,
  level39,
  level40,
  level41,
  level42,
]

export interface ModuleBadge {
  id: string
  name: string
  emoji: string
}

export interface Module {
  id: number
  title: string
  description: string
  levelIds: number[]
  /** Badge unlocked when every level in this module is complete. */
  badge: ModuleBadge
}

export const modules: Module[] = [
  {
    id: 1,
    title: 'First contact with dbt',
    description: 'A model is a SQL transformation you run, inspect and edit.',
    levelIds: [1, 2, 3, 4],
    badge: { id: 'mod-first-contact', name: 'First Steps', emoji: '🚀' },
  },
  {
    id: 2,
    title: 'Multiple models and dependencies',
    description: 'Wire models together with ref() and read the lineage.',
    levelIds: [5, 6, 7, 8],
    badge: { id: 'mod-dependencies', name: 'Wired Up', emoji: '🔗' },
  },
  {
    id: 3,
    title: 'Materializations',
    description: 'Choose how a model is built — view or table.',
    levelIds: [9, 10],
    badge: { id: 'mod-materializations', name: 'Solid Form', emoji: '🗄️' },
  },
  {
    id: 4,
    title: 'Data quality and testing',
    description: 'Catch bad data early with tests and dbt build.',
    levelIds: [11, 12, 13, 14, 15],
    badge: { id: 'mod-data-quality', name: 'Quality Assured', emoji: '✅' },
  },
  {
    id: 5,
    title: 'Documentation',
    description: 'Make models self-explanatory with descriptions on models and columns.',
    levelIds: [16, 17],
    badge: { id: 'mod-documentation', name: 'Self-Documenting', emoji: '📝' },
  },
  {
    id: 6,
    title: 'Sources and seeds',
    description: 'Formalise raw inputs with sources and small CSVs with seeds.',
    levelIds: [18, 19, 20, 21, 22],
    badge: { id: 'mod-sources-seeds', name: 'Roots Down', emoji: '🌱' },
  },
  {
    id: 7,
    title: 'Project structure',
    description: 'Organise models into staging, intermediate and marts.',
    levelIds: [23, 24, 25],
    badge: { id: 'mod-structure', name: 'Architect', emoji: '🏛️' },
  },
  {
    id: 8,
    title: 'Selectors and tags',
    description: 'Run subsets of the project with graph operators and tag selectors.',
    levelIds: [26, 27, 28, 29, 30, 31, 32, 33],
    badge: { id: 'mod-selectors', name: "Surgeon's Touch", emoji: '🎯' },
  },
  {
    id: 9,
    title: 'Ephemeral models',
    description: 'Reusable SQL that never becomes a warehouse object.',
    levelIds: [34, 35],
    badge: { id: 'mod-ephemeral', name: 'Phantom', emoji: '👻' },
  },
  {
    id: 10,
    title: 'Incremental models',
    description: 'Process only new rows instead of rebuilding from scratch.',
    levelIds: [36, 37, 38],
    badge: { id: 'mod-incremental', name: 'Smart Refresh', emoji: '⚡' },
  },
  {
    id: 11,
    title: 'Snapshots',
    description: 'Preserve historical versions of changing source data.',
    levelIds: [39, 40, 41],
    badge: { id: 'mod-snapshots', name: 'Time Keeper', emoji: '⏳' },
  },
  {
    id: 12,
    title: 'Final challenge',
    description: 'Debug a half-finished pipeline and ship it green.',
    levelIds: [42],
    badge: { id: 'mod-final', name: 'dbt Graduate', emoji: '🎓' },
  },
]

/** Badge for answering every level's quiz correctly. */
export const QUIZ_BADGE: ModuleBadge = {
  id: 'quiz-master',
  name: 'Quiz Master',
  emoji: '🧠',
}

/** Badge for earning every other badge. */
export const MASTER_BADGE: ModuleBadge = {
  id: 'master',
  name: 'Möller Champion',
  emoji: '🏆',
}

/**
 * Module ids whose every level appears in `completedLevels` — i.e. the module
 * badge has been earned.
 */
export function earnedModuleBadgeIds(completedLevels: Set<number>): Set<string> {
  const earned = new Set<string>()
  for (const mod of modules) {
    if (mod.levelIds.every((id) => completedLevels.has(id))) earned.add(mod.badge.id)
  }
  return earned
}

/** Total number of levels that have a quiz attached. */
export function totalQuizCount(): number {
  return levels.filter((l) => l.quiz != null).length
}

/** True when every level with a quiz has been answered correctly. */
export function quizBadgeEarned(correctlyAnsweredQuizzes: Set<number>): boolean {
  return correctlyAnsweredQuizzes.size >= totalQuizCount()
}

/** True when every module badge AND the quiz badge have been earned. */
export function masterBadgeEarned(
  completedLevels: Set<number>,
  correctlyAnsweredQuizzes: Set<number>,
): boolean {
  return (
    earnedModuleBadgeIds(completedLevels).size === modules.length &&
    quizBadgeEarned(correctlyAnsweredQuizzes)
  )
}

/** The module that ends with this level id, if any (used to celebrate module completion). */
export function moduleEndingAt(levelId: number): Module | undefined {
  return modules.find((m) => m.levelIds[m.levelIds.length - 1] === levelId)
}

export function getLevelById(id: number): Level | undefined {
  return levels.find((l) => l.id === id)
}

export function getModuleForLevel(levelId: number): Module | undefined {
  return modules.find((m) => m.levelIds.includes(levelId))
}

/** The id of the highest-numbered level — used to detect the curriculum finale. */
export function getLastLevelId(): number {
  return levels.reduce((max, l) => (l.id > max ? l.id : max), 0)
}
