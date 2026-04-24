import { create } from 'zustand'
import { parseCommand } from '../engine/commandParser'
import { execute } from '../engine/runner'
import { previewModel } from '../engine/executor'
import { getLevelById } from '../levels'
import type { TerminalLine } from '../engine/runner'
import { registerCsv, resetDb } from '../engine/duckdb'
import { sourceViewName } from '../engine/compiler'

export type BottomTab = 'commands' | 'results' | 'lineage'

export interface PreviewResult {
  name: string
  columns: string[]
  rows: unknown[][]
  rowCount: number
}

export type { TerminalLine }

let checkLevelTimer: ReturnType<typeof setTimeout> | null = null

interface StoreState {
  files: Record<string, string>
  activeFile: string | null
  ranModels: Set<string>
  shownModels: Set<string>
  testResults: Record<string, 'pass' | 'fail' | 'untested'>
  terminalHistory: TerminalLine[]
  running: boolean
  lastPreview: PreviewResult | null

  currentLevelId: number
  completedLevels: Set<number>
  unlockedBadges: Set<string>
  hintRevealed: boolean
  levelJustCompleted: boolean
  showLevelComplete: boolean
  showLevelIntro: boolean
  showLevelQuiz: boolean

  bottomTab: BottomTab
  bottomCollapsed: boolean

  setFileContent: (path: string, content: string) => void
  openFile: (path: string) => void
  createFile: (path: string, content: string) => void
  deleteFile: (path: string) => void
  runCommand: (input: string) => Promise<void>
  showModel: (name: string) => Promise<void>

  loadLevel: (id: number) => Promise<void>
  resetLevel: () => Promise<void>
  checkLevel: () => void
  revealHint: () => void
  dismissLevelComplete: () => void
  openLevelComplete: () => void
  dismissLevelCompleteModal: () => void
  dismissLevelIntro: () => void
  dismissLevelQuiz: () => void
  openLevelIntro: () => void

  setBottomTab: (tab: BottomTab) => void
  setBottomCollapsed: (collapsed: boolean) => void

  theme: 'dark' | 'light'
  toggleTheme: () => void
}

/**
 * Translate a seed key like `raw.users` into the DuckDB table name used by
 * compiled source() calls. Bare names pass through unchanged.
 */
function seedTableName(key: string): string {
  const [src, tbl] = key.split('.')
  return tbl ? sourceViewName(src, tbl) : src
}

export const useGameStore = create<StoreState>((set, get) => ({
  files: {},
  activeFile: null,
  ranModels: new Set<string>(),
  shownModels: new Set<string>(),
  testResults: {},
  terminalHistory: [{ text: 'dbt-quest — loading...', color: 'gray' }],
  running: false,
  lastPreview: null,

  currentLevelId: 0,
  completedLevels: new Set<number>(),
  unlockedBadges: new Set<string>(),
  hintRevealed: false,
  levelJustCompleted: false,
  showLevelComplete: false,
  showLevelIntro: false,
  showLevelQuiz: false,

  bottomTab: 'commands',
  bottomCollapsed: false,

  theme: (localStorage.getItem('dbt-quest-theme') as 'dark' | 'light') ?? 'dark',

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next === 'light' ? 'light' : ''
    localStorage.setItem('dbt-quest-theme', next)
    set({ theme: next })
  },

  setFileContent: (path, content) => {
    set((s) => ({ files: { ...s.files, [path]: content } }))
    if (checkLevelTimer) clearTimeout(checkLevelTimer)
    checkLevelTimer = setTimeout(() => get().checkLevel(), 800)
  },

  openFile: (path) => set({ activeFile: path }),

  createFile: (path, content) =>
    set((s) => ({
      files: { ...s.files, [path]: content },
      activeFile: path,
    })),

  deleteFile: (path) =>
    set((s) => {
      const files = { ...s.files }
      delete files[path]
      const remaining = Object.keys(files)
      const activeFile =
        s.activeFile === path
          ? remaining.length > 0
            ? remaining[0]
            : null
          : s.activeFile
      return { files, activeFile }
    }),

  runCommand: async (input: string) => {
    if (get().running) return

    const cmdLine: TerminalLine = { text: `dbt > ${input}` }
    const parsed = parseCommand(input)

    if (!parsed.ok) {
      set((s) => ({
        terminalHistory: [
          ...s.terminalHistory,
          cmdLine,
          { text: `Error: ${parsed.error}`, color: 'red' as const },
          { text: '' },
        ],
      }))
      return
    }

    set((s) => ({
      running: true,
      terminalHistory: [...s.terminalHistory, cmdLine],
    }))

    try {
      const s = get()
      const result = await execute(parsed.command, {
        files: s.files,
        ranModels: s.ranModels,
        shownModels: s.shownModels,
        testResults: s.testResults,
      })

      set((current) => ({
        terminalHistory: [...current.terminalHistory, ...result.lines],
        ranModels: result.updatedState.ranModels ?? current.ranModels,
        testResults: result.updatedState.testResults ?? current.testResults,
      }))

      // Mirror `dbt show --select <m>` results into the Results tab.
      if (parsed.command.type === 'show' && parsed.command.select.length === 1) {
        const target = parsed.command.select[0].name
        const latestRan = result.updatedState.ranModels ?? get().ranModels
        if (latestRan.has(target)) {
          try {
            const res = await previewModel(target, 20)
            set((cur) => ({
              lastPreview: { name: target, columns: res.columns, rows: res.rows, rowCount: res.rowCount },
              shownModels: new Set([...cur.shownModels, target]),
              bottomTab: 'results',
              bottomCollapsed: false,
            }))
          } catch {
            /* ignore — terminal already shows the error */
          }
        }
      }
    } catch (e) {
      set((current) => ({
        terminalHistory: [
          ...current.terminalHistory,
          { text: `Unexpected error: ${e instanceof Error ? e.message : String(e)}`, color: 'red' },
          { text: '' },
        ],
      }))
    } finally {
      set({ running: false })
      get().checkLevel()
    }
  },

  showModel: async (name: string) => {
    if (get().running) return
    set((s) => ({
      running: true,
      bottomTab: 'results',
      bottomCollapsed: false,
      terminalHistory: [...s.terminalHistory, { text: `dbt > dbt show --select ${name}` }],
    }))
    try {
      if (!get().ranModels.has(name)) {
        set((s) => ({
          terminalHistory: [
            ...s.terminalHistory,
            { text: `Model "${name}" hasn't been run yet. Run 'dbt run' first.`, color: 'yellow' },
            { text: '' },
          ],
        }))
        return
      }
      const res = await previewModel(name, 20)
      set((s) => ({
        lastPreview: { name, columns: res.columns, rows: res.rows, rowCount: res.rowCount },
        terminalHistory: [
          ...s.terminalHistory,
          { text: `Preview of "${name}" — ${res.rowCount} row${res.rowCount !== 1 ? 's' : ''}. See the Results tab.`, color: 'gray' },
          { text: '' },
        ],
      }))
    } catch (e) {
      set((s) => ({
        terminalHistory: [
          ...s.terminalHistory,
          { text: e instanceof Error ? e.message : String(e), color: 'red' },
          { text: '' },
        ],
      }))
    } finally {
      set({ running: false })
    }
  },

  setBottomTab: (tab) => set({ bottomTab: tab, bottomCollapsed: false }),
  setBottomCollapsed: (collapsed) => set({ bottomCollapsed: collapsed }),

  resetLevel: async () => {
    const id = get().currentLevelId
    if (id) await get().loadLevel(id)
  },

  loadLevel: async (id: number) => {
    const level = getLevelById(id)
    if (!level) return

    if (checkLevelTimer) {
      clearTimeout(checkLevelTimer)
      checkLevelTimer = null
    }

    // Show the intro modal only when moving to a different level — not on
    // reset (same id) or reload.
    const prevId = get().currentLevelId
    const levelChanged = id !== prevId

    const firstFile = Object.keys(level.initialFiles)[0] ?? null
    set({
      files: { ...level.initialFiles },
      activeFile: firstFile,
      ranModels: new Set<string>(),
      shownModels: new Set<string>(),
      testResults: {},
      currentLevelId: id,
      hintRevealed: false,
      levelJustCompleted: false,
      showLevelIntro: levelChanged,
      lastPreview: null,
      running: true,
      terminalHistory: [
        { text: `Level ${id} — ${level.title}`, color: 'gray' },
        { text: 'Preparing DuckDB…', color: 'gray' },
      ],
    })

    try {
      await resetDb()
      const seeds = level.seeds ?? {}
      for (const [key, csv] of Object.entries(seeds)) {
        await registerCsv(seedTableName(key), csv)
      }
      const seedNames = Object.keys(seeds)
      set((s) => ({
        terminalHistory: [
          ...s.terminalHistory.slice(0, 1),
          { text: level.goal.description, color: 'gray' },
          { text: '' },
          seedNames.length
            ? { text: `Seeded: ${seedNames.join(', ')}`, color: 'gray' }
            : { text: 'No seeds for this level.', color: 'gray' },
          { text: `Try: dbt run${seedNames.length ? ' · dbt show --select <model>' : ''}`, color: 'gray' },
          { text: '' },
        ],
      }))
    } catch (e) {
      set((s) => ({
        terminalHistory: [
          ...s.terminalHistory,
          { text: `Failed to initialise DuckDB: ${e instanceof Error ? e.message : String(e)}`, color: 'red' },
          { text: '' },
        ],
      }))
    } finally {
      set({ running: false })
    }
  },

  checkLevel: () => {
    const s = get()
    const level = getLevelById(s.currentLevelId)
    if (!level) return
    if (s.completedLevels.has(s.currentLevelId)) return

    const result = level.validate({
      files: s.files,
      ranModels: s.ranModels,
      shownModels: s.shownModels,
      testResults: s.testResults,
    })

    if (result.passed) {
      set((current) => ({
        completedLevels: new Set([...current.completedLevels, current.currentLevelId]),
        unlockedBadges: level.badge
          ? new Set([...current.unlockedBadges, level.badge!.id])
          : current.unlockedBadges,
        levelJustCompleted: true,
        terminalHistory: [
          ...current.terminalHistory,
          { text: '' },
          {
            text: `✓ Level ${current.currentLevelId} complete! ${level.badge ? level.badge.emoji + ' ' + level.badge.name : ''}`,
            color: 'green' as const,
          },
          { text: '' },
        ],
      }))
    }
  },

  revealHint: () => set({ hintRevealed: true }),

  dismissLevelComplete: () => set({ levelJustCompleted: false }),
  openLevelComplete: () => set({ showLevelComplete: true }),

  dismissLevelCompleteModal: () => {
    const level = getLevelById(get().currentLevelId)
    set({ showLevelComplete: false, showLevelQuiz: level?.quiz != null })
  },

  dismissLevelQuiz: () => set({ showLevelQuiz: false }),

  dismissLevelIntro: () => set({ showLevelIntro: false }),
  openLevelIntro: () => set({ showLevelIntro: true }),
}))
