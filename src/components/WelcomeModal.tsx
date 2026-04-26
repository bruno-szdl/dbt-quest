import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { modules } from '../levels'
import { useModalA11y } from '../hooks/useModalA11y'

/**
 * Single-card welcome that fires once on first visit and gives the new learner
 * a horizon — the 12-module roadmap, with the few story beats that will land
 * later highlighted in passing. Replayable from the Header help button.
 */
const BEATS: Record<number, string> = {
  4: 'first stakeholder review',
  7: 'first mart pinned',
  13: '🎓 board meeting',
}

export default function WelcomeModal() {
  const show = useGameStore((s) => s.showWelcome)
  const dismiss = useGameStore((s) => s.dismissWelcome)
  const dialogRef = useModalA11y(show)

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [show, dismiss])

  if (!show) return null

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        zIndex: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '14px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.85)',
          animation: 'slideUp 0.24s ease-out',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              style={{
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-accent-orange-dim)',
                color: 'var(--color-accent-orange)',
                fontSize: '0.625rem',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Welcome
            </span>
            <span
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.6875rem',
                fontFamily: 'IBM Plex Sans, sans-serif',
              }}
            >
              Möller Coffee · day zero
            </span>
          </div>
          <h2
            id="welcome-modal-title"
            style={{
              margin: '0 0 6px',
              color: 'var(--color-text)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '1.375rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
            }}
          >
            You're the new analytics engineer.
          </h2>
          <p
            style={{
              margin: 0,
              color: 'var(--color-text-secondary)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.84375rem',
              lineHeight: 1.55,
            }}
          >
            42 levels, 12 modules, one messy dbt project. Here's what's ahead.
          </p>
        </div>

        {/* Roadmap */}
        <div
          style={{
            padding: '14px 20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {modules.map((mod) => {
              const first = mod.levelIds[0]
              const last = mod.levelIds[mod.levelIds.length - 1]
              const range = first === last ? `L${first}` : `L${first}–${last}`
              const beat = BEATS[mod.id]
              return (
                <li
                  key={mod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    borderRadius: '5px',
                    background: beat ? 'var(--color-accent-bg)' : 'transparent',
                    border: beat ? '1px solid var(--color-accent-orange-dim)' : '1px solid transparent',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.625rem',
                      color: 'var(--color-muted)',
                      width: '20px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {mod.id < 10 ? `0${mod.id}` : mod.id}
                  </span>
                  <span
                    style={{
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text)',
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {mod.title}
                  </span>
                  {beat && (
                    <span
                      style={{
                        fontFamily: 'IBM Plex Sans, sans-serif',
                        fontSize: '0.6875rem',
                        fontStyle: 'italic',
                        color: 'var(--color-accent-orange)',
                        flexShrink: 0,
                      }}
                    >
                      {beat}
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.625rem',
                      color: 'var(--color-text-muted)',
                      width: '52px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {range}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 28px 20px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <button
            onClick={dismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.75rem',
              cursor: 'pointer',
              marginRight: 'auto',
              padding: '4px 6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            Skip
          </button>
          <span
            style={{
              color: 'var(--color-muted)',
              fontSize: '0.625rem',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            esc · click outside
          </span>
          <button
            onClick={dismiss}
            style={{
              background: 'var(--color-accent-orange)',
              border: 'none',
              borderRadius: '6px',
              color: '#0d1117',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.8125rem',
              fontWeight: 700,
              padding: '9px 20px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Start day 1
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
