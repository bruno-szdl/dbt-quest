import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { levels, modules } from '../levels'

export default function LandingPage() {
  const showLanding = useGameStore((s) => s.showLanding)
  const dismissLanding = useGameStore((s) => s.dismissLanding)

  useEffect(() => {
    if (!showLanding) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissLanding()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showLanding, dismissLanding])

  if (!showLanding) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to dbt-quest"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'var(--color-base)',
        color: 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '960px',
          padding: '24px',
          fontFamily: 'IBM Plex Sans, sans-serif',
        }}
      >
        <Hero />
        <WhatIsDbtQuest />
      </main>
    </div>
  )
}

function PrimaryCta() {
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const dismissLanding = useGameStore((s) => s.dismissLanding)

  const hasProgress = currentLevelId > 0 && completedLevels.size > 0
  const label = hasProgress ? `Continue from level ${currentLevelId}` : 'Start learning'

  return (
    <button
      onClick={dismissLanding}
      style={{
        background: 'var(--color-accent-orange)',
        color: '#0d1117',
        border: 'none',
        borderRadius: '8px',
        padding: '14px 28px',
        fontSize: '1rem',
        fontWeight: 600,
        fontFamily: 'IBM Plex Sans, sans-serif',
        cursor: 'pointer',
        boxShadow: '0 4px 14px var(--color-accent-orange-dim)',
        transition: 'transform 0.12s, box-shadow 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 8px 22px var(--color-accent-orange-dim)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 14px var(--color-accent-orange-dim)'
      }}
    >
      {label}
    </button>
  )
}

function Hero() {
  return (
    <section
      style={{
        textAlign: 'center',
        paddingBottom: '32px',
      }}
    >
      <Logo />
      <h1
        style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '24px 0 12px',
          lineHeight: 1.05,
        }}
      >
        <span style={{ color: 'var(--color-accent-orange)' }}>dbt</span>
        <span style={{ color: 'var(--color-text)' }}>quest</span>
      </h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: 'var(--color-text-secondary)',
          maxWidth: '560px',
          margin: '0 auto 32px',
          lineHeight: 1.5,
        }}
      >
        Learn dbt by playing — no setup, no install, just SQL in your browser.
      </p>
      <PrimaryCta />
      <p
        style={{
          marginTop: '20px',
          color: 'var(--color-muted)',
          fontSize: '0.8125rem',
        }}
      >
        Free ·{' '}
        <a
          href="https://github.com/bruno-szdl/dbt-quest"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-muted)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--color-border)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            paddingBottom: '1px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent-orange)'
            e.currentTarget.style.borderBottomColor = 'var(--color-accent-orange-dim)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-muted)'
            e.currentTarget.style.borderBottomColor = 'var(--color-border)'
          }}
        >
          open-source
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 11l6-6" />
            <path d="M6 5h5v5" />
          </svg>
        </a>{' '}
        · {levels.length} levels · {modules.length} modules
      </p>
    </section>
  )
}

function Logo() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '64px',
        height: '64px',
        borderRadius: '14px',
        background: 'var(--color-accent-bg)',
        border: '1px solid var(--color-accent-orange-dim)',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
        <path
          d="M8 23 L16 9 L24 23"
          stroke="var(--color-accent-orange)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="8" cy="23" r="2.4" fill="var(--color-accent-orange)" />
        <circle cx="16" cy="9" r="2.4" fill="var(--color-accent-orange)" />
        <circle cx="24" cy="23" r="2.4" fill="var(--color-accent-orange)" />
        <line x1="8" y1="23" x2="24" y2="23" stroke="var(--color-accent-orange)" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function WhatIsDbtQuest() {
  return (
    <section
      style={{
        paddingTop: '32px',
        borderTop: '1px solid var(--color-border-subtle)',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          margin: '0 0 20px',
          color: 'var(--color-text)',
          letterSpacing: '-0.01em',
        }}
      >
        What is dbt-quest?
      </h2>
      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '1.0625rem',
          lineHeight: 1.7,
          maxWidth: '820px',
          margin: '0 auto',
        }}
      >
        An interactive course that teaches dbt by having you build dbt projects, level by level.
        Join <strong style={{ color: 'var(--color-text)' }}>Möller Coffee</strong> as their new
        analytics engineer — Marcus just left, the warehouse is a mess, and the team needs you
        to ship trustworthy tables before the next board meeting.
      </p>
    </section>
  )
}
