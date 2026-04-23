import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getLevelById, levels } from '../levels'

export default function LevelPanel() {
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const hintRevealed = useGameStore((s) => s.hintRevealed)
  const levelJustCompleted = useGameStore((s) => s.levelJustCompleted)
  const revealHint = useGameStore((s) => s.revealHint)
  const dismissLevelComplete = useGameStore((s) => s.dismissLevelComplete)
  const loadLevel = useGameStore((s) => s.loadLevel)
  const [expanded, setExpanded] = useState(false)

  const level = getLevelById(currentLevelId)
  if (!level) return null

  const isLastLevel = currentLevelId >= levels.length

  return (
    <div className="shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
      {levelJustCompleted && (
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ background: 'var(--color-success-bg)', borderBottom: '1px solid var(--color-success-border)' }}
        >
          <span
            style={{
              color: 'var(--color-success)',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {level.badge?.emoji} Level complete!{level.badge ? ` ${level.badge.name} unlocked.` : ''}
          </span>
          <div className="flex items-center gap-1.5">
            {isLastLevel ? (
              <span
                style={{
                  color: 'var(--color-success)',
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontWeight: 600,
                }}
              >
                All levels done! 🎉
              </span>
            ) : (
              <button
                onClick={() => loadLevel(currentLevelId + 1)}
                style={{
                  background: 'var(--color-success)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#0d1117',
                  fontSize: '11px',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontWeight: 600,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                Next Level
                <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            )}
            <button
              onClick={dismissLevelComplete}
              style={{
                color: 'var(--color-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                padding: '0 2px',
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Always-visible header: chapter tag + title */}
      <div className="flex items-center gap-2 px-3" style={{ padding: '10px 12px 6px 12px' }}>
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
        <span
          style={{
            color: 'var(--color-text)',
            fontSize: '12px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontWeight: 600,
          }}
        >
          {level.title}
        </span>
      </div>

      {/* Short summary — always visible */}
      <div style={{ padding: '0 12px 10px 12px' }}>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: '11.5px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            lineHeight: '1.55',
            margin: 0,
          }}
        >
          {level.goal.description}
        </p>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 mt-2"
          style={{
            background: 'transparent',
            border: 'none',
            padding: '2px 0',
            color: 'var(--color-text-muted)',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '11px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent-orange)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)'
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {expanded ? 'Hide instructions' : 'Show instructions'}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            padding: '10px 12px',
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'var(--color-base)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '11.5px',
              fontFamily: 'IBM Plex Sans, sans-serif',
              whiteSpace: 'pre-wrap',
              margin: '0 0 10px 0',
              lineHeight: '1.7',
            }}
          >
            {level.description}
          </p>

          {level.hint &&
            (hintRevealed ? (
              <div
                style={{
                  background: 'var(--color-hint-bg)',
                  border: '1px solid var(--color-warning)30',
                  borderRadius: '4px',
                  padding: '7px 10px',
                }}
              >
                <div
                  style={{
                    color: 'var(--color-warning)',
                    fontSize: '9px',
                    fontFamily: 'JetBrains Mono, monospace',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.1em',
                    marginBottom: '3px',
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
            ))}
        </div>
      )}

      <ProgressChecklist />
    </div>
  )
}

function ProgressChecklist() {
  const files = useGameStore((s) => s.files)
  const ranModels = useGameStore((s) => s.ranModels)
  const testResults = useGameStore((s) => s.testResults)
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const completedLevels = useGameStore((s) => s.completedLevels)
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
    <div
      style={{ padding: '8px 12px', background: 'var(--color-base)', borderTop: '1px solid var(--color-border)' }}
    >
      <div
        style={{
          color: 'var(--color-muted)',
          fontSize: '9px',
          fontFamily: 'JetBrains Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '6px',
        }}
      >
        Progress
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {items.map((it) => (
          <li
            key={it.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              color: it.done ? ('highlight' in it && it.highlight ? 'var(--color-success)' : 'var(--color-text-secondary)') : 'var(--color-text-muted)',
              fontSize: '11px',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            <CheckBox done={it.done} highlight={'highlight' in it && !!it.highlight} />
            <span style={{ textDecoration: it.done && !('highlight' in it && it.highlight) ? 'line-through' : 'none' }}>{it.label}</span>
          </li>
        ))}
      </ul>
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
        width: '12px',
        height: '12px',
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
