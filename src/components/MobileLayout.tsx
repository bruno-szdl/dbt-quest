import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getLevelById } from '../levels'
import { getModelName } from '../engine/compiler'
import LevelPanel from './LevelPanel'
import FileExplorer from './FileExplorer'
import DatabaseExplorer from './DatabaseExplorer'
import Editor from './Editor'
import TerminalPanel from './TerminalPanel'
import ResultsPanel from './ResultsPanel'
import DagPanel from './DagPanel'

type MobileTab = 'lesson' | 'files' | 'editor' | 'console' | 'lineage'

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'lesson', label: 'Lesson' },
  { id: 'files', label: 'Files' },
  { id: 'editor', label: 'Editor' },
  { id: 'console', label: 'Console' },
  { id: 'lineage', label: 'Lineage' },
]

export default function MobileLayout() {
  const [tab, setTab] = useState<MobileTab>('lesson')
  const [consoleSub, setConsoleSub] = useState<'commands' | 'results'>('commands')

  const goToConsole = (sub: 'commands' | 'results') => {
    setConsoleSub(sub)
    setTab('console')
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--color-base)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {tab === 'lesson' && (
          <div className="h-full overflow-hidden">
            <LevelPanel />
          </div>
        )}
        {tab === 'files' && (
          <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-base)' }}>
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              <div className="flex-1 overflow-hidden min-h-0">
                <FileExplorer />
              </div>
              <DatabaseExplorer />
            </div>
          </div>
        )}
        {tab === 'editor' && (
          <div className="h-full flex flex-col overflow-hidden">
            <MobileActionBar onAfterRun={() => goToConsole('commands')} onAfterShow={() => goToConsole('results')} />
            <div className="flex-1 overflow-hidden">
              <Editor />
            </div>
          </div>
        )}
        {tab === 'console' && (
          <div className="h-full flex flex-col overflow-hidden">
            <MobileActionBar onAfterRun={() => goToConsole('commands')} onAfterShow={() => goToConsole('results')} />
            <ConsoleSubTabs sub={consoleSub} setSub={setConsoleSub} />
          </div>
        )}
        {tab === 'lineage' && (
          <div className="h-full flex flex-col overflow-hidden">
            <LineageView />
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <nav
        className="flex shrink-0"
        role="tablist"
        aria-label="Mobile sections"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={active}
              aria-label={t.label}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderTop: active ? '2px solid var(--color-accent-orange)' : '2px solid transparent',
                color: active ? 'var(--color-accent-orange)' : 'var(--color-text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '10px 4px 12px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function MobileActionBar({
  onAfterRun,
  onAfterShow,
}: {
  onAfterRun: () => void
  onAfterShow: () => void
}) {
  const running = useGameStore((s) => s.running)
  const activeFile = useGameStore((s) => s.activeFile)
  const ranModels = useGameStore((s) => s.ranModels)
  const runCommand = useGameStore((s) => s.runCommand)
  const showModel = useGameStore((s) => s.showModel)

  const model =
    activeFile && activeFile.startsWith('models/') && activeFile.endsWith('.sql')
      ? getModelName(activeFile)
      : null
  const canShow = !!model && ranModels.has(model)

  return (
    <div
      className="flex items-center gap-1.5 shrink-0 overflow-x-auto"
      style={{
        padding: '8px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <ActBtn
        label="Run"
        primary
        disabled={running}
        onClick={() => { onAfterRun(); runCommand('dbt run') }}
      />
      <ActBtn
        label="Test"
        disabled={running}
        onClick={() => { onAfterRun(); runCommand('dbt test') }}
      />
      <ActBtn
        label="Show"
        disabled={running || !canShow}
        onClick={() => { if (model) { onAfterShow(); showModel(model) } }}
      />
    </div>
  )
}

function ActBtn({
  label,
  onClick,
  primary,
  disabled,
}: {
  label: string
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: '32px',
        padding: '0 12px',
        borderRadius: '5px',
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
        background: primary ? 'var(--color-accent-orange)' : 'transparent',
        border: primary ? '1px solid var(--color-accent-orange)' : '1px solid var(--color-border)',
        color: primary ? 'var(--color-base)' : 'var(--color-text)',
      }}
    >
      {label}
    </button>
  )
}

function ConsoleSubTabs({
  sub,
  setSub,
}: {
  sub: 'commands' | 'results'
  setSub: (s: 'commands' | 'results') => void
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        className="flex shrink-0"
        style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <SubTabBtn label="Commands" active={sub === 'commands'} onClick={() => setSub('commands')} />
        <SubTabBtn label="Results" active={sub === 'results'} onClick={() => setSub('results')} />
      </div>
      <div className="flex-1 overflow-hidden">
        {sub === 'commands' ? <TerminalPanel embedded /> : <ResultsPanel />}
      </div>
    </div>
  )
}

function SubTabBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--color-accent-orange)' : '2px solid transparent',
        color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.6875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '10px 8px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function LineageView() {
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const level = getLevelById(currentLevelId)
  return <DagPanel embedded goalShape={level?.goal.dagShape} />
}
