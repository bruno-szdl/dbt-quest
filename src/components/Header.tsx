import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getLevelById, levels, modules } from '../levels'

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
        <BadgeStrip />
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

function BadgeStrip() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const unlockedBadges = useGameStore((s) => s.unlockedBadges)
  const levelJustCompleted = useGameStore((s) => s.levelJustCompleted)
  const total = levels.length

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const earned = levels
    .filter((l) => l.badge && unlockedBadges.has(l.badge.id))
    .map((l) => ({ ...(l.badge as NonNullable<typeof l.badge>), levelId: l.id }))

  const count = earned.length
  const recent = earned.slice(-5)
  const overflow = Math.max(0, count - recent.length)
  const isEmpty = count === 0

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        title={isEmpty ? 'No badges earned yet' : `${count} of ${total} badges earned`}
        style={{
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '3px 8px 3px 6px',
          height: '28px',
          cursor: 'pointer',
          transition: 'border-color 0.12s, background 0.12s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-muted)'
          e.currentTarget.style.background = 'rgba(128,128,128,0.06)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {isEmpty ? (
          <>
            <TrophyIcon />
            <span style={{ color: 'var(--color-muted)', fontSize: '11px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              No badges yet
            </span>
          </>
        ) : (
          <>
            {overflow > 0 && (
              <span
                style={{
                  color: 'var(--color-muted)',
                  fontSize: '10px',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '1px 5px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '9px',
                  lineHeight: 1,
                }}
              >
                +{overflow}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {recent.map((b, i) => {
                const isNewest = i === recent.length - 1 && levelJustCompleted
                return (
                  <span
                    key={b.id}
                    className={isNewest ? 'btn-pulse-success' : ''}
                    style={{
                      fontSize: '15px',
                      lineHeight: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                    }}
                  >
                    {b.emoji}
                  </span>
                )
              })}
            </div>
          </>
        )}
        <span style={{ color: 'var(--color-border)', fontSize: '11px' }}>·</span>
        <span
          style={{
            color: count > 0 ? 'var(--color-text-muted)' : 'var(--color-muted)',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {count}/{total}
        </span>
      </button>

      {open && <BadgePopover onClose={() => setOpen(false)} />}
    </div>
  )
}

function BadgePopover({ onClose }: { onClose: () => void }) {
  const unlockedBadges = useGameStore((s) => s.unlockedBadges)
  const loadLevel = useGameStore((s) => s.loadLevel)
  const count = levels.filter((l) => l.badge && unlockedBadges.has(l.badge.id)).length

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '12px',
        width: '300px',
        maxHeight: '420px',
        overflowY: 'auto',
        zIndex: 100,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span
          style={{
            color: 'var(--color-text)',
            fontSize: '12px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 600,
          }}
        >
          Badges
        </span>
        <span
          style={{
            color: 'var(--color-muted)',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {count} / {levels.length}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
        {levels.map((lvl) => {
          const badge = lvl.badge
          const earned = badge ? unlockedBadges.has(badge.id) : false
          return (
            <button
              key={lvl.id}
              onClick={() => { void loadLevel(lvl.id); onClose() }}
              title={badge ? `L${lvl.id} — ${badge.name}${earned ? '' : ' (locked)'}` : `L${lvl.id} — ${lvl.title}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '6px 2px',
                background: earned ? 'var(--color-success-bg)' : 'transparent',
                border: `1px solid ${earned ? 'var(--color-success-border)' : 'var(--color-border-subtle)'}`,
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'background 0.12s, border-color 0.12s',
              }}
              onMouseEnter={(e) => {
                if (!earned) {
                  e.currentTarget.style.background = 'rgba(128,128,128,0.08)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }
              }}
              onMouseLeave={(e) => {
                if (!earned) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                }
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  lineHeight: 1,
                  filter: earned ? 'none' : 'grayscale(1)',
                  opacity: earned ? 1 : 0.3,
                }}
              >
                {badge ? badge.emoji : '·'}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: earned ? 'var(--color-success)' : 'var(--color-muted)',
                }}
              >
                L{lvl.id}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TrophyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--color-muted)">
      <path d="M4 1a.5.5 0 0 0-.5.5V3h-1A1.5 1.5 0 0 0 1 4.5v1a2.5 2.5 0 0 0 2.5 2.5H4c.23 1.63 1.43 2.94 3 3.32V13H5a1 1 0 0 0-1 1v.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V14a1 1 0 0 0-1-1H9v-1.68c1.57-.38 2.77-1.69 3-3.32h.5A2.5 2.5 0 0 0 15 5.5v-1A1.5 1.5 0 0 0 13.5 3h-1V1.5a.5.5 0 0 0-.5-.5H4Zm-.5 6A1.5 1.5 0 0 1 2 5.5v-1a.5.5 0 0 1 .5-.5h1v3h-.5Zm10-1.5A1.5 1.5 0 0 1 12 7h-.5V4h1a.5.5 0 0 1 .5.5v1Z" />
    </svg>
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
