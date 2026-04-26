import { useGameStore } from '../store/gameStore'
import StoryThread from './StoryThread'

export default function CourseCompleteModal() {
  const show = useGameStore((s) => s.showCourseComplete)
  const dismiss = useGameStore((s) => s.dismissCourseComplete)

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        zIndex: 250,
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
        @keyframes capPop {
          0% { transform: scale(0.4) rotate(-12deg); opacity: 0 }
          70% { transform: scale(1.18) rotate(4deg) }
          100% { transform: scale(1) rotate(0); opacity: 1 }
        }
      `}</style>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-success-border)',
          borderRadius: '14px',
          maxWidth: '560px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.85), 0 0 0 1px var(--color-success-border)',
          animation: 'slideUp 0.26s ease-out',
        }}
      >
        {/* Hero */}
        <div
          style={{
            padding: '36px 32px 18px',
            textAlign: 'center',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              lineHeight: 1,
              marginBottom: '14px',
              animation: 'capPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              animationDelay: '0.15s',
            }}
          >
            🎓
          </div>
          <span
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              color: 'var(--color-success)',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '2px 8px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
              display: 'inline-block',
            }}
          >
            Course complete
          </span>
          <h2
            style={{
              margin: '0 0 8px',
              color: 'var(--color-text)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            You finished dbt Quest!
          </h2>
          <p
            style={{
              margin: 0,
              color: 'var(--color-text-muted)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '13px',
              lineHeight: 1.6,
            }}
          >
            You wired raw data through staging → intermediate → marts, wrote tests
            that catch bad rows, picked the right materialization, navigated lineage
            with selectors, and just debugged a half-finished pipeline back into
            production. That's the day-to-day work of a real analytics-engineering
            team.
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '20px 32px 8px',
            color: 'var(--color-text-secondary)',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '13px',
            lineHeight: 1.65,
          }}
        >
          {/* 3-months-later epilogue */}
          <div
            style={{
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '10px',
            }}
          >
            3 months later
          </div>
          <div style={{ marginBottom: '20px' }}>
            <StoryThread
              messages={[
                {
                  from: 'sofie',
                  body: `Quick one. Series B closed last week. Board specifically called out the data clarity. Whatever you did with that pipeline — keep doing it. ☕`,
                },
                {
                  from: 'priya',
                  body: `nice work. analysts #3 and #4 start monday. you're showing them the project.`,
                },
              ]}
            />
          </div>

          <p style={{ margin: '0 0 14px' }}>
            <strong style={{ color: 'var(--color-text)' }}>This is just the beginning.</strong>{' '}
            dbt-quest simulates the basics inside your browser. The real ecosystem is
            bigger: dbt Cloud, packages like <code>dbt-utils</code> and{' '}
            <code>dbt-expectations</code>, the semantic layer, exposures, modern
            warehouse adapters, and a whole community.
          </p>

          <div
            style={{
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
          >
            Where to go next
          </div>
          <ul
            style={{
              margin: '0 0 4px',
              paddingLeft: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <li>
              Set up dbt locally against a real warehouse (DuckDB, Postgres, BigQuery,
              Snowflake)
            </li>
            <li>
              Browse the{' '}
              <a
                href="https://docs.getdbt.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent-orange)' }}
              >
                dbt docs
              </a>
            </li>
            <li>
              Explore{' '}
              <a
                href="https://hub.getdbt.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent-orange)' }}
              >
                dbt packages
              </a>
            </li>
            <li>
              Join the{' '}
              <a
                href="https://www.getdbt.com/community/join-the-community"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-accent-orange)' }}
              >
                dbt community Slack
              </a>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 32px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--color-text-muted)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '12px',
              lineHeight: 1.6,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            Keep building, keep shipping, keep asking "what does this column mean?".
            Good luck out there. 🚀
          </p>
          <button
            onClick={dismiss}
            style={{
              background: 'var(--color-success)',
              border: 'none',
              borderRadius: '6px',
              color: '#0d1117',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              padding: '10px 24px',
              cursor: 'pointer',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.88'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
