import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getLevelById, levels, modules } from '../levels'

function activeModelName(activeFile: string | null): string | null {
  if (!activeFile) return null
  if (!activeFile.startsWith('models/') || !activeFile.endsWith('.sql')) return null
  const base = activeFile.split('/').pop() ?? ''
  return base.replace(/\.sql$/, '')
}

export default function Header() {
  return (
    <header
      className="flex items-center justify-between px-5 py-0 shrink-0"
      style={{ height: '52px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-3">
        <DbtLogo />
        <div className="flex flex-col justify-center" style={{ gap: '1px' }}>
          <div className="flex items-center gap-1.5">
            <span
              className="font-semibold tracking-tight"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--color-accent-orange)', fontSize: '15px' }}
            >
              dbt
            </span>
            <span
              className="font-semibold tracking-tight"
              style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--color-text)', fontSize: '15px' }}
            >
              quest
            </span>
          </div>
          <span
            style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--color-muted)', fontSize: '10px', lineHeight: 1 }}
          >
            Free dbt practice for the community
          </span>
        </div>

        <div className="w-px h-4 ml-1" style={{ background: 'var(--color-border)' }} />

        <LevelSelector />
      </div>

      <div className="flex items-center gap-3">
        <ActionButtons />

        <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />

        <ProgressBar />
        <ThemeToggleButton />
        <HelpButton />
      </div>
    </header>
  )
}

function LevelSelector() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const loadLevel = useGameStore((s) => s.loadLevel)
  const level = getLevelById(currentLevelId)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '4px 6px',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.08)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        title="Select a level"
      >
        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
          Level
        </span>
        <span
          className="font-semibold px-2.5 py-0.5 rounded"
          style={{
            background: 'var(--color-accent-bg)',
            border: '1px solid var(--color-accent-orange-dim)',
            color: 'var(--color-accent-orange)',
            fontSize: '13px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {currentLevelId || '—'}
        </span>
        {level && (
          <>
            <span style={{ color: 'var(--color-muted)', fontSize: '12px' }}>—</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              {level.title}
            </span>
          </>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            color: 'var(--color-muted)',
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '6px',
            width: '280px',
            maxHeight: '420px',
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {modules.map((mod, modIdx) => (
            <div key={mod.id}>
              {modIdx > 0 && (
                <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />
              )}
              <div
                style={{
                  color: 'var(--color-muted)',
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 8px 2px',
                }}
              >
                Module {mod.id} — {mod.title}
              </div>
              {mod.levelIds.map((levelId) => {
                const lvl = getLevelById(levelId)
                if (!lvl) return null
                const isCompleted = completedLevels.has(levelId)
                const isCurrent = levelId === currentLevelId
                return (
                  <button
                    key={levelId}
                    onClick={() => { void loadLevel(levelId); setOpen(false) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '5px 8px',
                      background: isCurrent ? 'var(--color-accent-bg)' : 'transparent',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'rgba(128,128,128,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isCurrent ? 'var(--color-accent-bg)' : 'transparent'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        color: isCurrent ? 'var(--color-accent-orange)' : isCompleted ? 'var(--color-success)' : 'var(--color-muted)',
                        width: '16px',
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {levelId}
                    </span>
                    <span
                      style={{
                        fontFamily: 'IBM Plex Sans, sans-serif',
                        fontSize: '11.5px',
                        color: isCurrent ? 'var(--color-text)' : 'var(--color-text-muted)',
                        flex: 1,
                      }}
                    >
                      {lvl.title}
                    </span>
                    {isCompleted && (
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5l3 3 7-7" stroke="var(--color-success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {isCurrent && !isCompleted && (
                      <svg width="8" height="8" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" fill="var(--color-accent-orange)" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionButtons() {
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
        onClick={() => runCommand('dbt run')}
        icon={<PlayIcon />}
      />
      <ActionButton
        label="Test"
        disabled={running}
        onClick={() => runCommand('dbt test')}
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
        onClick={() => model && showModel(model)}
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

function DbtLogo() {
  return (
    <span style={{ color: 'var(--color-accent-orange)', display: 'flex' }}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="currentColor" fillOpacity="0.12" />
        <path
          d="M8 23 L16 9 L24 23"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="8" cy="23" r="2" fill="currentColor" />
        <circle cx="16" cy="9" r="2" fill="currentColor" />
        <circle cx="24" cy="23" r="2" fill="currentColor" />
        <line x1="8" y1="23" x2="24" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
      </svg>
    </span>
  )
}

function ProgressBar() {
  const completedLevels = useGameStore((s) => s.completedLevels)
  const total = levels.length

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex gap-1"
        role="progressbar"
        aria-label="Level progress"
        aria-valuenow={completedLevels.size}
        aria-valuemax={total}
      >
        {Array.from({ length: total }).map((_, i) => {
          const done = completedLevels.has(i + 1)
          return (
            <div
              key={i}
              className="rounded-full transition-colors"
              style={{
                width: '6px',
                height: '6px',
                background: done ? 'var(--color-success)' : 'var(--color-border-subtle)',
                border: done ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
              }}
            />
          )
        })}
      </div>
      <span style={{ color: 'var(--color-muted)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
        {completedLevels.size}/{total}
      </span>
    </div>
  )
}

function ThemeToggleButton() {
  const theme = useGameStore((s) => s.theme)
  const toggleTheme = useGameStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center rounded"
      style={{
        width: '28px',
        height: '28px',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-muted)'
        e.currentTarget.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.061-1.06a.75.75 0 0 1 0-1.061Zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM16 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm10.657-5.657a.75.75 0 0 1 0 1.061l-1.061 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 0 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Z" />
    </svg>
  )
}

function HelpButton() {
  return (
    <button
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '28px',
        height: '28px',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
      aria-label="Help"
      onMouseEnter={(e) => {
        const t = e.currentTarget
        t.style.borderColor = 'var(--color-muted)'
        t.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        const t = e.currentTarget
        t.style.borderColor = 'var(--color-border)'
        t.style.color = 'var(--color-text-muted)'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm6.5-2.5a1.5 1.5 0 1 1 3 0c0 .607-.379 1.065-.892 1.456-.485.37-.858.75-.858 1.294V9a.75.75 0 0 1-1.5 0v-.75c0-1.002.666-1.607 1.177-1.987.47-.36.573-.617.573-.763a1.5 1.5 0 0 0-1.5-1.5ZM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
      </svg>
    </button>
  )
}
