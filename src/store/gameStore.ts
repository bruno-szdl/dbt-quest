import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { parseCommand } from '../engine/commandParser'
import { execute } from '../engine/runner'
import { previewModel, plan, materializeModels } from '../engine/executor'
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
  modelColumns: Record<string, string[]>
  loadedSeeds: Set<string>
  buildSucceeded: boolean
  snapshotRunCounts: Record<string, number>
  snapshotClosedRows: Record<string, number>
  manuallyMarkedComplete: Set<number>
  terminalHistory: TerminalLine[]
  running: boolean
  lastPreview: PreviewResult | null

  currentLevelId: number
  completedLevels: Set<number>
  unlockedBadges: Set<string>
  dismissedIntros: Set<number>
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
  markLessonComplete: () => void
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

  resetAllProgress: () => Promise<void>
}

const PERSIST_KEY = 'dbt-quest-storage'

/**
 * Translate a seed key like `raw.users` into the DuckDB table name used by
 * compiled source() calls. Bare names pass through unchanged.
 */
function seedTableName(key: string): string {
  const [src, tbl] = key.split('.')
  return tbl ? sourceViewName(src, tbl) : src
}

export const useGameStore = create<StoreState>()(
  persist(
    (set, get) => ({
  files: {},
  activeFile: null,
  ranModels: new Set<string>(),
  shownModels: new Set<string>(),
  testResults: {},
  modelColumns: {},
  loadedSeeds: new Set<string>(),
  buildSucceeded: false,
  snapshotRunCounts: {},
  snapshotClosedRows: {},
  manuallyMarkedComplete: new Set<number>(),
  terminalHistory: [{ text: 'dbt-quest — loading...', color: 'gray' }],
  running: false,
  lastPreview: null,

  currentLevelId: 0,
  completedLevels: new Set<number>(),
  unlockedBadges: new Set<string>(),
  dismissedIntros: new Set<number>(),
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

    const cmdLine: TerminalLine = { text: `type here > ${input}` }
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
        modelColumns: s.modelColumns,
        loadedSeeds: s.loadedSeeds,
        buildSucceeded: s.buildSucceeded,
        snapshotRunCounts: s.snapshotRunCounts,
        snapshotClosedRows: s.snapshotClosedRows,
      })

      set((current) => ({
        terminalHistory: [...current.terminalHistory, ...result.lines],
        ranModels: result.updatedState.ranModels ?? current.ranModels,
        testResults: result.updatedState.testResults ?? current.testResults,
        modelColumns: result.updatedState.modelColumns ?? current.modelColumns,
        loadedSeeds: result.updatedState.loadedSeeds ?? current.loadedSeeds,
        buildSucceeded: result.updatedState.buildSucceeded ?? current.buildSucceeded,
        snapshotRunCounts: result.updatedState.snapshotRunCounts ?? current.snapshotRunCounts,
        snapshotClosedRows: result.updatedState.snapshotClosedRows ?? current.snapshotClosedRows,
      }))

      // Mirror `dbt show --select <m>` results into the Results tab.
      const showTerm = parsed.command.type === 'show' && parsed.command.select.length === 1
        ? parsed.command.select[0].terms[0]
        : null
      const showTarget = showTerm?.method === 'fqn' ? showTerm.value : null
      if (showTarget) {
        const latestRan = result.updatedState.ranModels ?? get().ranModels
        if (latestRan.has(showTarget)) {
          const target = showTarget
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
      terminalHistory: [...s.terminalHistory, { text: `type here > dbt show --select ${name}` }],
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
        shownModels: new Set([...s.shownModels, name]),
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
      get().checkLevel()
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

    // Show the intro modal until the player has dismissed it for this level.
    // Persisting dismissedIntros means a reload before "Let's go" still shows
    // the modal, but jumping back to a level you've already seen does not.
    const showIntro = !get().dismissedIntros.has(id)

    const firstFile = Object.keys(level.initialFiles)[0] ?? null
    set({
      files: { ...level.initialFiles },
      activeFile: firstFile,
      ranModels: new Set<string>(),
      shownModels: new Set<string>(),
      testResults: {},
      modelColumns: {},
      loadedSeeds: new Set<string>(),
      buildSucceeded: false,
      snapshotRunCounts: {},
      snapshotClosedRows: {},
      currentLevelId: id,
      hintRevealed: false,
      levelJustCompleted: false,
      showLevelIntro: showIntro,
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
      // Silently register any seeds/*.csv files from initialFiles into DuckDB
      // so downstream models work. `dbt seed` still needs to run to mark them
      // as user-loaded for validation.
      for (const [path, csv] of Object.entries(level.initialFiles)) {
        if (path.startsWith('seeds/') && path.endsWith('.csv')) {
          const name = path.split('/').pop()!.replace(/\.csv$/, '')
          await registerCsv(name, csv.trim())
        }
      }
      const preRanSet = new Set<string>()
      const preRanColumns: Record<string, string[]> = {}
      if (level.preRanModels?.length) {
        const execPlan = plan(level.initialFiles)
        const toRun = execPlan.sorted.filter((m) => level.preRanModels!.includes(m.name))
        const outcomes = await materializeModels(toRun)
        for (const o of outcomes) {
          if (o.passed) {
            preRanSet.add(o.name)
            preRanColumns[o.name] = o.columns
          }
        }
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
        ...(preRanSet.size ? { ranModels: preRanSet, modelColumns: preRanColumns } : {}),
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
      modelColumns: s.modelColumns,
      loadedSeeds: s.loadedSeeds,
      buildSucceeded: s.buildSucceeded,
      snapshotRunCounts: s.snapshotRunCounts,
      snapshotClosedRows: s.snapshotClosedRows,
      manuallyMarkedComplete: s.manuallyMarkedComplete,
      currentLevelId: s.currentLevelId,
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

  markLessonComplete: () => {
    const s = get()
    if (!s.currentLevelId) return
    if (s.manuallyMarkedComplete.has(s.currentLevelId)) return
    set({
      manuallyMarkedComplete: new Set([...s.manuallyMarkedComplete, s.currentLevelId]),
    })
    get().checkLevel()
  },

  dismissLevelComplete: () => set({ levelJustCompleted: false }),
  openLevelComplete: () => set({ showLevelComplete: true }),

  dismissLevelCompleteModal: () => {
    const level = getLevelById(get().currentLevelId)
    set({ showLevelComplete: false, showLevelQuiz: level?.quiz != null })
  },

  dismissLevelQuiz: () => set({ showLevelQuiz: false }),

  dismissLevelIntro: () =>
    set((s) => ({
      showLevelIntro: false,
      dismissedIntros: s.currentLevelId
        ? new Set([...s.dismissedIntros, s.currentLevelId])
        : s.dismissedIntros,
    })),
  openLevelIntro: () => set({ showLevelIntro: true }),

  resetAllProgress: async () => {
    set({
      completedLevels: new Set<number>(),
      unlockedBadges: new Set<string>(),
      manuallyMarkedComplete: new Set<number>(),
      dismissedIntros: new Set<number>(),
      currentLevelId: 0,
    })
    try {
      localStorage.removeItem(PERSIST_KEY)
    } catch {
      /* ignore — quota / privacy mode */
    }
    await get().loadLevel(1)
  },
    }),
    {
      name: PERSIST_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        completedLevels: [...s.completedLevels],
        unlockedBadges: [...s.unlockedBadges],
        manuallyMarkedComplete: [...s.manuallyMarkedComplete],
        dismissedIntros: [...s.dismissedIntros],
        currentLevelId: s.currentLevelId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as {
          completedLevels?: number[]
          unlockedBadges?: string[]
          manuallyMarkedComplete?: number[]
          dismissedIntros?: number[]
          currentLevelId?: number
        }
        const completed = p.completedLevels ?? []
        const dismissed =
          p.dismissedIntros ?? (completed.length > 0 ? completed : [])
        return {
          ...current,
          completedLevels: new Set(completed),
          unlockedBadges: new Set(p.unlockedBadges ?? []),
          manuallyMarkedComplete: new Set(p.manuallyMarkedComplete ?? []),
          dismissedIntros: new Set(dismissed),
          currentLevelId: p.currentLevelId ?? 0,
        }
      },
    },
  ),
)
