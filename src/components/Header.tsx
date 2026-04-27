import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  MASTER_BADGE,
  QUIZ_BADGE,
  earnedModuleBadgeIds,
  getLevelById,
  masterBadgeEarned,
  modules,
  quizBadgeEarned,
  totalQuizCount,
} from '../levels'
import type { ModuleBadge } from '../levels'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Header() {
  const isMobile = useIsMobile()
  return (
    <header
      data-tour="header"
      className="flex items-center justify-between shrink-0"
      style={{
        height: '52px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: isMobile ? '0 10px' : '0 20px',
        gap: '8px',
      }}
    >
      <div className="flex items-center gap-2 min-w-0" style={{ flex: 1 }}>
        <DbtLogo />
        {!isMobile && (
          <>
            <div className="flex flex-col justify-center" style={{ gap: '1px' }}>
              <div className="flex items-center gap-1.5">
                <span
                  className="font-semibold tracking-tight"
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--color-accent-orange)', fontSize: '0.9375rem' }}
                >
                  dbt
                </span>
                <span
                  className="font-semibold tracking-tight"
                  style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--color-text)', fontSize: '0.9375rem' }}
                >
                  quest
                </span>
              </div>
              <span
                style={{ fontFamily: 'IBM Plex Sans, sans-serif', color: 'var(--color-muted)', fontSize: '0.625rem', lineHeight: 1 }}
              >
                Free dbt practice for the community
              </span>
            </div>

            <div className="w-px h-4 ml-1" style={{ background: 'var(--color-border)' }} />
          </>
        )}

        <LevelSelector compact={isMobile} />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isMobile && <BadgeStrip />}
        <ResetMenu compact={isMobile} />
        <ThemeToggleButton />
        <HelpButton />
        <AboutButton />
      </div>
    </header>
  )
}

function LevelSelector({ compact = false }: { compact?: boolean } = {}) {
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
    <div ref={containerRef} style={{ position: 'relative', minWidth: 0, flex: compact ? 1 : 'initial' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={level ? `Level ${currentLevelId} — ${level.title}. Click to choose another level.` : 'Choose a level'}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '4px 6px',
          borderRadius: '5px',
          cursor: 'pointer',
          maxWidth: '100%',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(128,128,128,0.08)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        title="Select a level"
      >
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontFamily: 'IBM Plex Sans, sans-serif' }}>
          Level
        </span>
        <span
          className="font-semibold px-2.5 py-0.5 rounded"
          style={{
            background: 'var(--color-accent-bg)',
            border: '1px solid var(--color-accent-orange-dim)',
            color: 'var(--color-accent-orange)',
            fontSize: '0.8125rem',
            fontFamily: 'JetBrains Mono, monospace',
            flexShrink: 0,
          }}
        >
          {currentLevelId || '—'}
        </span>
        {level && (
          <>
            <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem', flexShrink: 0 }}>—</span>
            <span
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                fontFamily: 'IBM Plex Sans, sans-serif',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
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
          role="listbox"
          aria-label="Levels"
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
                  fontSize: '0.5625rem',
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
                        fontSize: '0.625rem',
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
                        fontSize: '0.71875rem',
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

/** All 14 badges in display order: 12 module → Quiz Master → Möller Champion. */
function allBadges(): ModuleBadge[] {
  return [...modules.map((m) => m.badge), QUIZ_BADGE, MASTER_BADGE]
}

function BadgeStrip() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const correctlyAnsweredQuizzes = useGameStore((s) => s.correctlyAnsweredQuizzes)
  const levelJustCompleted = useGameStore((s) => s.levelJustCompleted)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const moduleEarned = earnedModuleBadgeIds(completedLevels)
  const isEarned = (b: ModuleBadge): boolean => {
    if (b.id === QUIZ_BADGE.id) return quizBadgeEarned(correctlyAnsweredQuizzes)
    if (b.id === MASTER_BADGE.id) return masterBadgeEarned(completedLevels, correctlyAnsweredQuizzes)
    return moduleEarned.has(b.id)
  }

  const all = allBadges()
  const total = all.length
  const earned = all.filter(isEarned)
  const count = earned.length
  const recent = earned.slice(-3)
  const overflow = Math.max(0, count - recent.length)
  const isEmpty = count === 0

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        title={isEmpty ? 'No badges earned yet' : `${count} of ${total} badges earned`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={isEmpty ? 'No badges earned yet' : `${count} of ${total} badges earned`}
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
            <span style={{ color: 'var(--color-muted)', fontSize: '0.6875rem', fontFamily: 'IBM Plex Sans, sans-serif' }}>
              No badges yet
            </span>
          </>
        ) : (
          <>
            {overflow > 0 && (
              <span
                style={{
                  color: 'var(--color-muted)',
                  fontSize: '0.625rem',
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
                      fontSize: '0.9375rem',
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
        <span style={{ color: 'var(--color-border)', fontSize: '0.6875rem' }}>·</span>
        <span
          style={{
            color: count > 0 ? 'var(--color-text-muted)' : 'var(--color-muted)',
            fontSize: '0.6875rem',
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

function BadgePopover({ onClose: _onClose }: { onClose: () => void }) {
  const completedLevels = useGameStore((s) => s.completedLevels)
  const correctlyAnsweredQuizzes = useGameStore((s) => s.correctlyAnsweredQuizzes)

  const moduleEarned = earnedModuleBadgeIds(completedLevels)
  const quizDone = quizBadgeEarned(correctlyAnsweredQuizzes)
  const masterDone = masterBadgeEarned(completedLevels, correctlyAnsweredQuizzes)
  const totalQuizzes = totalQuizCount()
  const total = modules.length + 2
  const count =
    moduleEarned.size + (quizDone ? 1 : 0) + (masterDone ? 1 : 0)

  type Row = {
    badge: ModuleBadge
    earned: boolean
    progress: string
  }

  const rows: Row[] = [
    ...modules.map<Row>((m) => {
      const done = m.levelIds.filter((id) => completedLevels.has(id)).length
      return {
        badge: m.badge,
        earned: moduleEarned.has(m.badge.id),
        progress: `Module ${m.id} · ${done}/${m.levelIds.length} levels`,
      }
    }),
    {
      badge: QUIZ_BADGE,
      earned: quizDone,
      progress: `${correctlyAnsweredQuizzes.size}/${totalQuizzes} quizzes correct`,
    },
    {
      badge: MASTER_BADGE,
      earned: masterDone,
      progress: `${count - (masterDone ? 1 : 0)}/${total - 1} other badges`,
    },
  ]

  return (
    <div
      role="dialog"
      aria-label="Badges earned"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '12px',
        width: '300px',
        maxHeight: '480px',
        overflowY: 'auto',
        zIndex: 100,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span
          style={{
            color: 'var(--color-text)',
            fontSize: '0.75rem',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 600,
          }}
        >
          Badges
        </span>
        <span
          style={{
            color: 'var(--color-muted)',
            fontSize: '0.625rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {count} / {total}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {rows.map((r) => (
          <div
            key={r.badge.id}
            title={r.earned ? r.badge.name : `${r.badge.name} (locked)`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              background: r.earned ? 'var(--color-success-bg)' : 'transparent',
              border: `1px solid ${r.earned ? 'var(--color-success-border)' : 'var(--color-border-subtle)'}`,
              borderRadius: '5px',
            }}
          >
            <span
              style={{
                fontSize: '1.25rem',
                lineHeight: 1,
                width: '22px',
                textAlign: 'center',
                filter: r.earned ? 'none' : 'grayscale(1)',
                opacity: r.earned ? 1 : 0.4,
                flexShrink: 0,
              }}
            >
              {r.badge.emoji}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: r.earned ? 'var(--color-text)' : 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.badge.name}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.625rem',
                  color: r.earned ? 'var(--color-success)' : 'var(--color-muted)',
                }}
              >
                {r.progress}
              </span>
            </div>
          </div>
        ))}
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

function ResetMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resetLevel = useGameStore((s) => s.resetLevel)
  const resetAllProgress = useGameStore((s) => s.resetAllProgress)
  const running = useGameStore((s) => s.running)
  const currentLevelId = useGameStore((s) => s.currentLevelId)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const levelDisabled = running || !currentLevelId

  const handleResetLevel = () => {
    if (levelDisabled) return
    setOpen(false)
    if (confirm('Reset this level? All your edits will be discarded.')) void resetLevel()
  }

  const handleResetAll = () => {
    if (confirm('Reset all progress? You will lose every completed level and badge. This cannot be undone.')) {
      setOpen(false)
      void resetAllProgress()
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Reset"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center rounded transition-colors"
        style={{
          height: '28px',
          padding: compact ? '0 8px' : '0 10px',
          gap: '6px',
          background: 'transparent',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'IBM Plex Sans, sans-serif',
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
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a5 5 0 1 1-4.546 2.916.75.75 0 1 0-1.359-.632A6.5 6.5 0 1 0 8 1.5V.75a.25.25 0 0 0-.4-.2L5.9 1.825a.25.25 0 0 0 0 .4l1.7 1.275A.25.25 0 0 0 8 3.3V3Z" />
        </svg>
        {!compact && <span>Reset</span>}
        <svg
          width="9"
          height="9"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '4px',
            minWidth: '220px',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <SettingsItem
            label="Reset level"
            description={levelDisabled ? 'No level loaded' : 'Discard your edits on this level'}
            onClick={handleResetLevel}
            disabled={levelDisabled}
          />
          <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 0' }} />
          <SettingsItem
            label="Reset all progress"
            description="Discard every level and badge"
            onClick={handleResetAll}
            danger
          />
        </div>
      )}
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

function AboutButton() {
  const openLanding = useGameStore((s) => s.openLanding)

  return (
    <button
      onClick={openLanding}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '28px',
        height: '28px',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
      aria-label="About dbt-quest"
      title="About dbt-quest"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-muted)'
        e.currentTarget.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 7v4" />
        <circle cx="8" cy="4.8" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    </button>
  )
}

function HelpButton() {
  const replayWelcome = useGameStore((s) => s.replayWelcome)

  return (
    <button
      onClick={replayWelcome}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '28px',
        height: '28px',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
      aria-label="Replay intro tour"
      title="Replay intro tour"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-muted)'
        e.currentTarget.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M6.2 6.1c.15-.83.95-1.45 1.85-1.45 1.05 0 1.9.78 1.9 1.75 0 .8-.55 1.3-1.2 1.65-.55.3-.8.6-.8 1.2" />
        <circle cx="8" cy="11.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    </button>
  )
}

function SettingsItem({
  label,
  description,
  onClick,
  danger = false,
  disabled = false,
}: {
  label: string
  description: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '2px',
        width: '100%',
        padding: '8px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: '5px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = danger ? 'rgba(210, 63, 63, 0.12)' : 'rgba(128,128,128,0.08)'
      }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span
        style={{
          color: danger ? '#e25b5b' : 'var(--color-text)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '0.78125rem',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '0.65625rem',
        }}
      >
        {description}
      </span>
    </button>
  )
}
