import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameStore, type BottomTab } from '../store/gameStore'
import { getLevelById } from '../levels'
import TerminalPanel from './TerminalPanel'
import DagPanel from './DagPanel'
import ResultsPanel from './ResultsPanel'

const COLLAPSED_HEIGHT = 42
const DEFAULT_HEIGHT = 260
const MIN_OPEN_HEIGHT = 140

interface BottomPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>
}

export default function BottomPanel({ containerRef }: BottomPanelProps) {
  const tab = useGameStore((s) => s.bottomTab)
  const collapsed = useGameStore((s) => s.bottomCollapsed)
  const setTab = useGameStore((s) => s.setBottomTab)
  const setCollapsed = useGameStore((s) => s.setBottomCollapsed)
  const currentLevelId = useGameStore((s) => s.currentLevelId)

  const level = getLevelById(currentLevelId)
  const goalShape = level?.goal.dagShape

  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const dragging = useRef(false)

  const onHandleDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (collapsed) setCollapsed(false)
    dragging.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }, [collapsed, setCollapsed])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const next = rect.bottom - e.clientY
      const max = rect.height - 140
      setHeight(Math.max(MIN_OPEN_HEIGHT, Math.min(max, next)))
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [containerRef])

  const currentHeight = collapsed ? COLLAPSED_HEIGHT : height

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        height: currentHeight,
        background: 'var(--color-base)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      {/* Resize handle — above the tab bar */}
      <div
        onMouseDown={onHandleDown}
        style={{
          height: '4px',
          cursor: 'row-resize',
          background: 'transparent',
          marginTop: '-4px',
          position: 'relative',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-muted)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      />

      {/* Tab bar */}
      <div
        className="flex items-center shrink-0"
        style={{ height: '42px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', gap: '8px', paddingLeft: '8px' }}
      >
        <ActionButtons
          onBeforeRun={() => {
            if (collapsed) setCollapsed(false)
            setTab('commands')
          }}
          onBeforeShow={() => {
            if (collapsed) setCollapsed(false)
            setTab('results')
          }}
        />

        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />

        <div className="flex items-center h-full">
          <TabButton
            label="Commands"
            active={!collapsed && tab === 'commands'}
            onClick={() => setTab('commands')}
            icon={<TerminalIcon />}
          />
          <TabButton
            label="Results"
            active={!collapsed && tab === 'results'}
            onClick={() => setTab('results')}
            icon={<ResultsIcon />}
          />
          <TabButton
            label="Lineage"
            active={!collapsed && tab === 'lineage'}
            onClick={() => setTab('lineage')}
            icon={<LineageIcon />}
          />
        </div>

        <div className="flex items-center ml-auto pr-2 gap-1">
          <CollapseButton
            collapsed={collapsed}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden">
          {tab === 'commands' && <TerminalPanel embedded />}
          {tab === 'results' && <ResultsPanel />}
          {tab === 'lineage' && <DagPanel embedded goalShape={goalShape} />}
        </div>
      )}
    </div>
  )
}

function activeModelName(activeFile: string | null): string | null {
  if (!activeFile) return null
  if (!activeFile.startsWith('models/') || !activeFile.endsWith('.sql')) return null
  const base = activeFile.split('/').pop() ?? ''
  return base.replace(/\.sql$/, '')
}

interface ActionButtonsProps {
  onBeforeRun: () => void
  onBeforeShow: () => void
}

function ActionButtons({ onBeforeRun, onBeforeShow }: ActionButtonsProps) {
  const running = useGameStore((s) => s.running)
  const activeFile = useGameStore((s) => s.activeFile)
  const ranModels = useGameStore((s) => s.ranModels)
  const runCommand = useGameStore((s) => s.runCommand)
  const showModel = useGameStore((s) => s.showModel)
  const resetLevel = useGameStore((s) => s.resetLevel)

  const model = activeModelName(activeFile)
  const canShow = !!model && ranModels.has(model)

  return (
    <div className="flex items-center gap-1.5">
      <ActionButton
        label="Run"
        variant="primary"
        disabled={running}
        onClick={() => { onBeforeRun(); runCommand('dbt run') }}
        icon={<PlayIcon />}
      />
      <ActionButton
        label="Test"
        disabled={running}
        onClick={() => { onBeforeRun(); runCommand('dbt test') }}
        icon={<CheckIcon />}
      />
      <ActionButton
        label="Show Results"
        disabled={running || !canShow}
        title={
          canShow
            ? `dbt show --select ${model}`
            : model
              ? `Run ${model} first`
              : 'Open a .sql model file to preview'
        }
        onClick={() => { if (model) { onBeforeShow(); showModel(model) } }}
        icon={<TableIcon />}
      />
      <ActionButton
        label="Reset"
        disabled={running}
        onClick={() => {
          if (confirm('Reset this level? All your edits will be discarded.')) resetLevel()
        }}
        icon={<ResetIcon />}
      />
    </div>
  )
}

interface ActionButtonProps {
  label: string
  onClick: () => void
  icon: React.ReactNode
  disabled?: boolean
  variant?: 'primary' | 'default'
  title?: string
}

function ActionButton({
  label,
  onClick,
  icon,
  disabled,
  variant = 'default',
  title,
}: ActionButtonProps) {
  const isPrimary = variant === 'primary'
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '28px',
    padding: '0 10px',
    borderRadius: '5px',
    fontFamily: 'IBM Plex Sans, sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
  } as const

  const primary = {
    background: 'var(--color-accent-orange)',
    border: '1px solid var(--color-accent-orange)',
    color: 'var(--color-base)',
  } as const

  const secondary = {
    background: 'transparent',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  } as const

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      style={{ ...base, ...(isPrimary ? primary : secondary) }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (isPrimary) {
          e.currentTarget.style.background = '#ff7d61'
        } else {
          e.currentTarget.style.borderColor = 'var(--color-muted)'
          e.currentTarget.style.background = 'rgba(128,128,128,0.08)'
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        if (isPrimary) {
          e.currentTarget.style.background = 'var(--color-accent-orange)'
        } else {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <span style={{ display: 'flex' }}>{icon}</span>
      {label}
    </button>
  )
}

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 3.5v9a.5.5 0 0 0 .77.42l7-4.5a.5.5 0 0 0 0-.84l-7-4.5A.5.5 0 0 0 4 3.5Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" />
      <line x1="5" y1="2.5" x2="5" y2="13.5" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9" />
      <path d="M2.5 3v3h3" />
    </svg>
  )
}

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}

function TabButton({ label, active, onClick, icon }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 h-full"
      style={{
        background: 'transparent',
        border: 'none',
        borderTop: active ? '2px solid var(--color-accent-orange)' : '2px solid transparent',
        borderBottom: active ? '1px solid var(--color-base)' : 'none',
        marginBottom: active ? '-1px' : 0,
        color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      <span style={{ color: active ? 'var(--color-accent-orange)' : 'var(--color-muted)', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  )
}

function CollapseButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? 'Expand panel' : 'Collapse panel'}
      style={{
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: '4px',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        color: 'var(--color-text-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-border-subtle)'
        e.currentTarget.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.15s',
        }}
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

function TerminalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H1.75ZM7.25 8a.75.75 0 0 1-.22.53l-2.25 2.25a.75.75 0 0 1-1.06-1.06L5.44 8 3.72 6.28a.75.75 0 0 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm1.5 1.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z" />
    </svg>
  )
}

function ResultsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" />
      <line x1="5" y1="2.5" x2="5" y2="13.5" />
      <line x1="10" y1="2.5" x2="10" y2="13.5" />
    </svg>
  )
}

function LineageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3" cy="8" r="2" />
      <circle cx="13" cy="3.5" r="2" />
      <circle cx="13" cy="12.5" r="2" />
      <line x1="4.5" y1="7" x2="11.5" y2="4.5" stroke="currentColor" strokeWidth="1" />
      <line x1="4.5" y1="9" x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export type { BottomTab }
