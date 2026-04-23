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
    <div className="shrink-0 border-b border-[#30363d]" style={{ background: '#161b22' }}>
      {levelJustCompleted && (
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ background: '#3fb95015', borderBottom: '1px solid #3fb95030' }}
        >
          <span
            style={{
              color: '#3fb950',
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
                  color: '#3fb950',
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
                  background: '#3fb950',
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
                onMouseEnter={(e) => { e.currentTarget.style.background = '#52c962' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#3fb950' }}
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
                color: '#484f58',
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
            background: '#ff694a1a',
            border: '1px solid #ff694a33',
            color: '#ff694a',
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
            color: '#e6edf3',
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
            color: '#8b949e',
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
            color: '#7d8590',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '11px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ff694a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#7d8590'
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
          className="border-t border-[#30363d]"
          style={{ padding: '10px 12px', maxHeight: '260px', overflowY: 'auto', background: '#0d1117' }}
        >
          <p
            style={{
              color: '#c9d1d9',
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
                  background: '#1c2128',
                  border: '1px solid #d2992230',
                  borderRadius: '4px',
                  padding: '7px 10px',
                }}
              >
                <div
                  style={{
                    color: '#d29922',
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
                    color: '#8b949e',
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
                  border: '1px solid #30363d',
                  borderRadius: '4px',
                  color: '#7d8590',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#484f58'
                  e.currentTarget.style.color = '#e6edf3'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#30363d'
                  e.currentTarget.style.color = '#7d8590'
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
      className="border-t border-[#30363d]"
      style={{ padding: '8px 12px', background: '#0d1117' }}
    >
      <div
        style={{
          color: '#484f58',
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
              color: it.done ? ('highlight' in it && it.highlight ? '#3fb950' : '#c9d1d9') : '#7d8590',
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
  const borderColor = done ? (highlight ? '#3fb950' : '#484f58') : '#30363d'
  const fill = done && highlight ? '#3fb950' : 'transparent'
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
            stroke={highlight ? '#0d1117' : '#7d8590'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}
