import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { getLevelById, levels } from '../levels'

export default function LevelQuizModal() {
  const show = useGameStore((s) => s.showLevelQuiz)
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const dismissLevelQuiz = useGameStore((s) => s.dismissLevelQuiz)
  const loadLevel = useGameStore((s) => s.loadLevel)

  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const level = getLevelById(currentLevelId)
  const quiz = level?.quiz
  const isLastLevel = currentLevelId >= levels.length

  function handleOptionClick(index: number) {
    if (revealed) return
    setSelected(index)
  }

  function handleCheck() {
    if (selected === null) return
    setRevealed(true)
  }

  function handleContinue() {
    setSelected(null)
    setRevealed(false)
    dismissLevelQuiz()
    if (!isLastLevel) loadLevel(currentLevelId + 1)
  }

  if (!show || !quiz) return null

  const isCorrect = selected === quiz.correctIndex

  return (
    <div
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
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          maxWidth: '580px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          animation: 'slideUp 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 14px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
              Level {currentLevelId} · Quiz
            </span>
          </div>
          <p
            style={{
              margin: 0,
              color: 'var(--color-text)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            {quiz.question}
          </p>
        </div>

        {/* Options */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {quiz.options.map((option, i) => {
            let borderColor = 'var(--color-border)'
            let bg = 'var(--color-base)'
            let textColor = 'var(--color-text-secondary)'
            let labelColor = 'var(--color-text-muted)'

            if (selected === i && !revealed) {
              borderColor = 'var(--color-accent-orange)'
              bg = 'var(--color-accent-bg)'
              textColor = 'var(--color-text)'
              labelColor = 'var(--color-accent-orange)'
            } else if (revealed) {
              if (i === quiz.correctIndex) {
                borderColor = 'var(--color-success)'
                bg = 'var(--color-success-bg)'
                textColor = 'var(--color-text)'
                labelColor = 'var(--color-success)'
              } else if (selected === i) {
                borderColor = 'var(--color-error, #f85149)'
                bg = 'rgba(248, 81, 73, 0.1)'
                textColor = 'var(--color-text)'
                labelColor = 'var(--color-error, #f85149)'
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionClick(i)}
                disabled={revealed}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  cursor: revealed ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.12s, background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (revealed || selected === i) return
                  e.currentTarget.style.borderColor = 'var(--color-muted)'
                }}
                onMouseLeave={(e) => {
                  if (revealed || selected === i) return
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `1px solid ${labelColor}`,
                    color: labelColor,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {revealed && i === quiz.correctIndex ? '✓' : revealed && selected === i ? '✗' : String.fromCharCode(65 + i)}
                </span>
                <span
                  style={{
                    color: textColor,
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  {option}
                </span>
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div
            style={{
              margin: '0 24px 16px',
              padding: '10px 14px',
              background: isCorrect ? 'var(--color-success-bg)' : 'rgba(248, 81, 73, 0.08)',
              border: `1px solid ${isCorrect ? 'var(--color-success-border)' : 'rgba(248, 81, 73, 0.3)'}`,
              borderRadius: '6px',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'var(--color-text-secondary)',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 600, color: isCorrect ? 'var(--color-success)' : 'var(--color-error, #f85149)' }}>
                {isCorrect ? 'Correct! ' : 'Not quite. '}
              </span>
              {quiz.explanation}
            </p>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px 18px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {!revealed ? (
            <button
              onClick={handleCheck}
              disabled={selected === null}
              style={{
                background: selected === null ? 'var(--color-border)' : 'var(--color-accent-orange)',
                border: 'none',
                borderRadius: '6px',
                color: selected === null ? 'var(--color-text-muted)' : '#0d1117',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                padding: '8px 20px',
                cursor: selected === null ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (selected !== null) e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Check answer
            </button>
          ) : (
            <button
              onClick={handleContinue}
              style={{
                background: 'var(--color-success)',
                border: 'none',
                borderRadius: '6px',
                color: '#0d1117',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                padding: '8px 20px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              {isLastLevel ? 'Finish' : 'Continue to next level'}
              {!isLastLevel && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
