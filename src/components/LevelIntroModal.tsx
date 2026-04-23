import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { getLevelById, getModuleForLevel } from '../levels'

export default function LevelIntroModal() {
  const show = useGameStore((s) => s.showLevelIntro)
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const dismiss = useGameStore((s) => s.dismissLevelIntro)

  const level = getLevelById(currentLevelId)
  const mod = getModuleForLevel(currentLevelId)

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [show, dismiss])

  if (!show || !level) return null

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.18s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          animation: 'slideUp 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 16px',
            borderBottom: '1px solid var(--color-border-subtle)',
            position: 'relative',
          }}
        >
          <button
            onClick={dismiss}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '22px',
              lineHeight: 1,
              padding: '4px 8px',
              borderRadius: '4px',
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
            ×
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-accent-orange-dim)',
                color: 'var(--color-accent-orange)',
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                padding: '2px 7px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Level {level.id}
            </span>
            {mod && (
              <span
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                }}
              >
                Module {mod.id} — {mod.title}
              </span>
            )}
          </div>

          <h2
            style={{
              margin: 0,
              color: 'var(--color-text)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {level.title}
          </h2>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px 28px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--color-text-secondary)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '14px',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {level.description}
          </p>

          <div
            style={{
              marginTop: '18px',
              background: 'var(--color-base)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span
              style={{
                color: 'var(--color-success)',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono, monospace',
                lineHeight: 1.6,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                flexShrink: 0,
                paddingTop: '2px',
              }}
            >
              Goal
            </span>
            <span
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
                fontFamily: 'IBM Plex Sans, sans-serif',
                lineHeight: 1.6,
              }}
            >
              {level.goal.description}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 28px 20px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              color: 'var(--color-muted)',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              marginRight: 'auto',
            }}
          >
            esc · click outside to close
          </span>
          <button
            onClick={dismiss}
            style={{
              background: 'var(--color-accent-orange)',
              border: '1px solid var(--color-accent-orange)',
              borderRadius: '6px',
              color: '#0d1117',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              padding: '8px 18px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Let's go
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
