import { useGameStore } from '../store/gameStore'
import { getLevelById, levels } from '../levels'

export default function LevelPanel() {
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const hintRevealed = useGameStore((s) => s.hintRevealed)
  const levelJustCompleted = useGameStore((s) => s.levelJustCompleted)
  const revealHint = useGameStore((s) => s.revealHint)
  const dismissLevelComplete = useGameStore((s) => s.dismissLevelComplete)
  const openLevelComplete = useGameStore((s) => s.openLevelComplete)

  const level = getLevelById(currentLevelId)
  if (!level) return null

  const isLastLevel = currentLevelId >= levels.length

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {/* Completion banner */}
      {levelJustCompleted && (
        <div
          className="flex items-center shrink-0"
          style={{
            background: 'linear-gradient(180deg, var(--color-success-bg), transparent), var(--color-success-bg)',
            borderBottom: '1px solid var(--color-success-border)',
            padding: '12px 14px',
            gap: '12px',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {level.badge?.emoji ?? '🎉'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                color: 'var(--color-success)',
                fontSize: '13px',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Level complete!
            </div>
            <div
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '11px',
                fontFamily: 'IBM Plex Sans, sans-serif',
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {level.badge ? `${level.badge.name} badge unlocked` : 'Nicely done'}
            </div>
          </div>

          {isLastLevel ? (
            <span style={{ color: 'var(--color-success)', fontSize: '11px', fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, flexShrink: 0 }}>
              All levels done! 🎉
            </span>
          ) : (
            <button
              onClick={openLevelComplete}
              className="btn-pulse-success"
              style={{
                background: 'var(--color-success)',
                border: 'none',
                borderRadius: '6px',
                color: '#0d1117',
                fontSize: '12px',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontWeight: 600,
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Continue
              <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          )}

          <button
            onClick={dismissLevelComplete}
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              color: 'var(--color-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              padding: '2px 4px',
            }}
            aria-label="Dismiss"
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-muted)' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header: chapter tag + title */}
      <div className="shrink-0" style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              background: 'var(--color-accent-bg)',
              border: '1px solid var(--color-accent-orange-dim)',
              color: 'var(--color-accent-orange)',
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '1px 5px',
              borderRadius: '3px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}
          >
            Ch {level.chapter}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
            Level {level.id}
          </span>
        </div>
        <h2
          style={{
            margin: 0,
            color: 'var(--color-text)',
            fontSize: '14px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 700,
            lineHeight: 1.3,
          }}
        >
          {level.title}
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto" style={{ borderTop: '1px solid var(--color-border)' }}>
        {/* Goal */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div
            style={{
              color: 'var(--color-success)',
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              marginBottom: '6px',
            }}
          >
            Goal
          </div>
          <p
            style={{
              margin: 0,
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontFamily: 'IBM Plex Sans, sans-serif',
              lineHeight: 1.6,
            }}
          >
            {level.goal.description}
          </p>
        </div>

        {/* Instructions */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            Instructions
          </div>
          <p
            style={{
              margin: 0,
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              fontFamily: 'IBM Plex Sans, sans-serif',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {level.description}
          </p>
        </div>

        {/* Hint */}
        {level.hint && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            {hintRevealed ? (
              <div
                style={{
                  background: 'var(--color-hint-bg)',
                  border: '1px solid var(--color-warning)30',
                  borderRadius: '4px',
                  padding: '9px 12px',
                }}
              >
                <div
                  style={{
                    color: 'var(--color-warning)',
                    fontSize: '9px',
                    fontFamily: 'JetBrains Mono, monospace',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.1em',
                    marginBottom: '5px',
                  }}
                >
                  Hint
                </div>
                <div
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.55',
                  }}
                >
                  {level.hint}
                </div>
              </div>
            ) : (
              <button
                onClick={revealHint}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  color: 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  width: '100%',
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
                Show Hint
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress checklist — pinned to bottom */}
      <div className="shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        <ProgressChecklist />
      </div>
    </div>
  )
}

function ProgressChecklist() {
  const files = useGameStore((s) => s.files)
  const ranModels = useGameStore((s) => s.ranModels)
  const testResults = useGameStore((s) => s.testResults)
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const manuallyMarkedComplete = useGameStore((s) => s.manuallyMarkedComplete)
  const markLessonComplete = useGameStore((s) => s.markLessonComplete)
  const level = getLevelById(currentLevelId)
  if (!level) return null

  const steps = level.requiredSteps ?? ['files', 'run', 'test']

  const initialPaths = new Set(Object.keys(level.initialFiles))
  const editedOrNewFiles = Object.keys(files).some(
    (p) => !initialPaths.has(p) || files[p] !== level.initialFiles[p],
  )
  const ranSomething = ranModels.size > 0
  const testedSomething = Object.keys(testResults).length > 0
  const passed = completedLevels.has(currentLevelId)
  const alreadyMarked = manuallyMarkedComplete.has(currentLevelId)

  const stepItems = [
    { id: 'files' as const, label: 'Edit files', done: editedOrNewFiles },
    { id: 'run' as const, label: 'Run dbt run', done: ranSomething },
    { id: 'test' as const, label: 'Run dbt test', done: testedSomething },
  ].filter((it) => steps.includes(it.id))

  const items = [
    ...stepItems,
    { id: 'pass', label: 'Level passed', done: passed, highlight: true },
  ]

  return (
    <div style={{ padding: '10px 16px 14px' }}>
      <div
        style={{
          color: 'var(--color-muted)',
          fontSize: '9px',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '8px',
        }}
      >
        Progress
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {items.map((it) => (
          <li
            key={it.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: it.done
                ? ('highlight' in it && it.highlight ? 'var(--color-success)' : 'var(--color-text-secondary)')
                : 'var(--color-text-muted)',
              fontSize: '12px',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            <CheckBox done={it.done} highlight={'highlight' in it && !!it.highlight} />
            <span style={{ textDecoration: it.done && !('highlight' in it && it.highlight) ? 'line-through' : 'none' }}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>

      {level.manualCompletion && !passed && (
        <button
          onClick={markLessonComplete}
          disabled={alreadyMarked}
          style={{
            marginTop: '12px',
            background: 'transparent',
            border: '1px solid var(--color-success)',
            borderRadius: '4px',
            color: 'var(--color-success)',
            fontSize: '11px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 600,
            padding: '6px 10px',
            cursor: alreadyMarked ? 'default' : 'pointer',
            width: '100%',
            opacity: alreadyMarked ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!alreadyMarked) e.currentTarget.style.background = 'var(--color-success-bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {alreadyMarked ? 'Marked — finishing up…' : "I've read it — mark this lesson complete"}
        </button>
      )}
    </div>
  )
}

function CheckBox({ done, highlight }: { done: boolean; highlight: boolean }) {
  const borderColor = done
    ? highlight ? 'var(--color-success)' : 'var(--color-muted)'
    : 'var(--color-border)'
  const fill = done && highlight ? 'var(--color-success)' : 'transparent'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '13px',
        height: '13px',
        border: `1px solid ${borderColor}`,
        borderRadius: '3px',
        background: fill,
        flexShrink: 0,
      }}
    >
      {done && (
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5.2l2 2 4-4.4"
            stroke={highlight ? 'var(--color-base)' : 'var(--color-text-muted)'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
