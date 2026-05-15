import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/gameStore'
import { getLessonById, getLastLessonId, taskKey } from '../lessons'
import { useLocalizedLesson } from '../i18n/useLocalizedLesson'

export default function LessonPanel() {
  const currentLessonId = useGameStore((s) => s.currentLessonId)
  const completedTasks = useGameStore((s) => s.completedTasks)
  const revealedHints = useGameStore((s) => s.revealedHints)
  const correctQuizzes = useGameStore((s) => s.correctQuizzes)
  const revealHint = useGameStore((s) => s.revealHint)
  const markQuizCorrect = useGameStore((s) => s.markQuizCorrect)
  const loadLesson = useGameStore((s) => s.loadLesson)

  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { scrollRef.current?.scrollTo(0, 0) }, [currentLessonId])

  const rawLesson = getLessonById(currentLessonId)
  const lesson = useLocalizedLesson(rawLesson ?? { id: 0, title: '', concept: '', initialFiles: {}, tasks: [] })
  if (!rawLesson) return null

  const allTasksDone = lesson.tasks.every((t) =>
    completedTasks.has(taskKey(lesson.id, t.id)),
  )
  const isLast = lesson.id === getLastLessonId()

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <div className="shrink-0" style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span
            style={{
              background: 'var(--color-accent-bg)',
              border: '1px solid var(--color-accent-orange-dim)',
              color: 'var(--color-accent-orange)',
              fontSize: '0.5625rem',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '1px 5px',
              borderRadius: '3px',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
            }}
          >
            {t('lessonPanel.badge', { current: lesson.id, total: getLastLessonId() })}
          </span>
        </div>
        <h2 style={{ margin: 0, color: 'var(--color-text)', fontSize: '0.95rem', fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 700, lineHeight: 1.3 }}>
          {lesson.title}
        </h2>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Concept */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <Markdownish text={lesson.concept} />
          {lesson.id === 0 && <WorkspaceDiagram />}
        </div>

        {/* Tasks */}
        {lesson.tasks.length > 0 && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <SectionLabel>{t('lessonPanel.tasks')}</SectionLabel>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lesson.tasks.map((task, i) => {
              const key = taskKey(lesson.id, task.id)
              const done = completedTasks.has(key)
              const hintShown = revealedHints.has(key)
              return (
                <li
                  key={task.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '10px 12px',
                    background: done ? 'var(--color-success-bg)' : 'transparent',
                    border: `1px solid ${done ? 'var(--color-success-border)' : 'var(--color-border-subtle)'}`,
                    borderRadius: '6px',
                  }}
                >
                  <CheckBox done={done} index={i + 1} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--color-text)', fontSize: '0.8125rem', fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: 1.5 }}>
                      <Markdownish text={task.prompt} />
                    </div>
                    {task.hint && !done && (
                      <div style={{ marginTop: '6px' }}>
                        {hintShown ? (
                          <div style={{
                            background: 'var(--color-hint-bg)',
                            border: '1px solid var(--color-warning)',
                            borderRadius: '4px',
                            padding: '6px 9px',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.75rem',
                            fontFamily: 'JetBrains Mono, monospace',
                            whiteSpace: 'pre-wrap',
                          }}>
                            {task.hint}
                          </div>
                        ) : (
                          <button
                            onClick={() => revealHint(lesson.id, task.id)}
                            style={{
                              background: 'transparent',
                              border: '1px dashed var(--color-border)',
                              borderRadius: '4px',
                              color: 'var(--color-text-muted)',
                              fontSize: '0.6875rem',
                              fontFamily: 'IBM Plex Sans, sans-serif',
                              padding: '3px 8px',
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
                            {t('lessonPanel.showHint')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
        )}

        {/* Further reading */}
        {lesson.furtherReading && lesson.furtherReading.length > 0 && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <SectionLabel>{t('lessonPanel.furtherReading')}</SectionLabel>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lesson.furtherReading.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-accent-orange)',
                      fontSize: '0.75rem',
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      textDecoration: 'none',
                      lineHeight: 1.5,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
                  >
                    <span>{link.label}</span>
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 3h7v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 3L7 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M11 8v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quiz */}
        {lesson.quiz && allTasksDone && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <SectionLabel>{t('lessonPanel.quiz')}</SectionLabel>
            <QuizBlock
              key={lesson.id}
              question={lesson.quiz.question}
              options={lesson.quiz.options}
              correctIndex={lesson.quiz.correctIndex}
              explanation={lesson.quiz.explanation}
              alreadyCorrect={correctQuizzes.has(lesson.id)}
              onCorrect={() => markQuizCorrect(lesson.id)}
            />
          </div>
        )}

        {/* Next */}
        {allTasksDone && (
          <div style={{ padding: '14px 16px' }}>
            {isLast ? (
              <div style={{
                padding: '12px',
                border: '1px solid var(--color-success-border)',
                background: 'var(--color-success-bg)',
                borderRadius: '6px',
                color: 'var(--color-success)',
                fontSize: '0.8125rem',
                fontFamily: 'IBM Plex Sans, sans-serif',
                textAlign: 'center' as const,
              }}>
                {t('lessonPanel.courseComplete')}
              </div>
            ) : (
              <button
                onClick={() => void loadLesson(lesson.id + 1)}
                style={{
                  width: '100%',
                  background: 'var(--color-success)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#0d1117',
                  fontSize: '0.8125rem',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontWeight: 600,
                  padding: '10px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                {t('lessonPanel.nextLesson')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function WorkspaceDiagram() {
  const items: { tag: string; title: string; body: string }[] = [
    { tag: 'left', title: 'Files', body: "The dbt project folder. Models live under models/, tests under tests/, raw CSV seeds under seeds/. Click a file to open it in the editor." },
    { tag: 'center', title: 'Editor', body: 'Where you write SQL and YAML. Edits save instantly — there is no separate "save" step.' },
    { tag: 'bottom', title: 'Terminal / Results / Lineage', body: 'Run dbt commands (dbt run, dbt test, dbt build), inspect query results, and watch the DAG update as you add ref() calls between models.' },
    { tag: 'right', title: 'Lesson panel', body: "You are here. Each lesson opens with a short concept, then a checklist of tasks. The 'Show hint' button is your friend." },
  ]
  return (
    <div style={{ marginTop: '14px' }}>
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          background: 'var(--color-base)',
          padding: '10px',
          display: 'grid',
          gridTemplateColumns: '70px 1fr 70px',
          gridTemplateRows: '70px 40px',
          gap: '6px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.5625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
        }}
      >
        <Cell label="① Files" />
        <Cell label="② Editor" emphasis />
        <Cell label="④ Lesson" />
        <div style={{ gridColumn: '1 / 4' }}>
          <Cell label="③ Terminal / Results / Lineage" full />
        </div>
      </div>
      <ol style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((it, i) => (
          <li key={it.tag} style={{ display: 'flex', gap: '10px' }}>
            <span
              style={{
                flexShrink: 0,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--color-accent-bg)',
                border: '1px solid var(--color-accent-orange-dim)',
                color: 'var(--color-accent-orange)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.625rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1px',
              }}
            >
              {i + 1}
            </span>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--color-text)' }}>{it.title}.</strong> {it.body}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Cell({ label, emphasis, full }: { label: string; emphasis?: boolean; full?: boolean }) {
  return (
    <div
      style={{
        height: full ? '40px' : undefined,
        background: emphasis ? 'var(--color-accent-bg)' : 'var(--color-surface)',
        border: `1px solid ${emphasis ? 'var(--color-accent-orange-dim)' : 'var(--color-border)'}`,
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
        textAlign: 'center' as const,
        color: emphasis ? 'var(--color-accent-orange)' : 'var(--color-text-muted)',
      }}
    >
      {label}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: 'var(--color-text-muted)',
        fontSize: '0.5625rem',
        fontFamily: 'JetBrains Mono, monospace',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom: '10px',
      }}
    >
      {children}
    </div>
  )
}

function CheckBox({ done, index }: { done: boolean; index: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        flexShrink: 0,
        border: `1.5px solid ${done ? 'var(--color-success)' : 'var(--color-border)'}`,
        borderRadius: '50%',
        background: done ? 'var(--color-success)' : 'transparent',
        color: done ? '#0d1117' : 'var(--color-text-muted)',
        fontSize: '0.6875rem',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 700,
        marginTop: '1px',
      }}
    >
      {done ? (
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
          <path d="M2 5.2l2 2 4-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        index
      )}
    </span>
  )
}

function QuizBlock({
  question,
  options,
  correctIndex,
  explanation,
  alreadyCorrect,
  onCorrect,
}: {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  alreadyCorrect: boolean
  onCorrect: () => void
}) {
  const [picked, setPicked] = useState<number | null>(alreadyCorrect ? correctIndex : null)
  const isCorrect = picked === correctIndex

  return (
    <div>
      <div style={{ color: 'var(--color-text)', fontSize: '0.8125rem', fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: 1.5, marginBottom: '10px' }}>
        {renderInline(question)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {options.map((opt, i) => {
          const selected = picked === i
          const showResult = picked !== null
          const isThisCorrect = i === correctIndex
          let border = 'var(--color-border)'
          let bg = 'transparent'
          if (showResult && selected) {
            border = isThisCorrect ? 'var(--color-success)' : 'var(--color-warning)'
            bg = isThisCorrect ? 'var(--color-success-bg)' : 'var(--color-hint-bg)'
          } else if (showResult && isThisCorrect) {
            border = 'var(--color-success)'
            bg = 'var(--color-success-bg)'
          }
          return (
            <button
              key={i}
              onClick={() => {
                if (picked !== null && isCorrect) return
                setPicked(i)
                if (i === correctIndex) onCorrect()
              }}
              style={{
                textAlign: 'left' as const,
                padding: '8px 10px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '5px',
                color: 'var(--color-text)',
                fontSize: '0.75rem',
                fontFamily: 'IBM Plex Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              {renderInline(opt)}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 10px',
            border: `1px solid ${isCorrect ? 'var(--color-success-border)' : 'var(--color-border)'}`,
            background: isCorrect ? 'var(--color-success-bg)' : 'transparent',
            borderRadius: '5px',
            color: 'var(--color-text-secondary)',
            fontSize: '0.75rem',
            fontFamily: 'IBM Plex Sans, sans-serif',
            lineHeight: 1.5,
          }}
        >
          {isCorrect ? '✓ ' : ''}{renderInline(explanation)}
        </div>
      )}
    </div>
  )
}

/**
 * Splits concept text into blocks, treating fenced code (```...```) as an
 * atomic unit even when blank lines appear inside the fence.
 */
function splitBlocks(text: string): string[] {
  const blocks: string[] = []
  const lines = text.split('\n')
  let current: string[] = []
  let inFence = false

  const flush = () => {
    const s = current.join('\n').trim()
    if (s) blocks.push(s)
    current = []
  }

  for (const line of lines) {
    if (!inFence && line.startsWith('```')) {
      flush()
      inFence = true
      current.push(line)
    } else if (inFence) {
      current.push(line)
      if (line.startsWith('```') && current.length > 1) {
        flush()
        inFence = false
      }
    } else if (line === '') {
      flush()
    } else {
      current.push(line)
    }
  }
  flush()
  return blocks
}

/**
 * Renders text with minimal markdown: **bold**, `code`, fenced code blocks,
 * `- ` bullet lists, and paragraph breaks.
 */
function Markdownish({ text }: { text: string }) {
  const blocks = splitBlocks(text)
  return (
    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', fontFamily: 'IBM Plex Sans, sans-serif', lineHeight: 1.65 }}>
      {blocks.map((block, i) => {
        if (block.startsWith('```')) {
          const code = block.replace(/^```\w*\n?/, '').replace(/\n?```$/, '')
          return (
            <pre
              key={i}
              style={{
                background: 'var(--color-base)',
                border: '1px solid var(--color-border)',
                borderRadius: '5px',
                padding: '8px 10px',
                margin: '8px 0',
                fontSize: '0.75rem',
                fontFamily: 'JetBrains Mono, monospace',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto' as const,
              }}
            >
              {code}
            </pre>
          )
        }
        const lines = block.split('\n')
        if (lines.every(l => l.startsWith('- '))) {
          return (
            <div key={i} style={{ margin: '8px 0', paddingLeft: '12px' }}>
              {lines.map((l, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--color-accent-orange)', flexShrink: 0 }}>→</span>
                  <span>{renderInline(l.slice(2))}</span>
                </div>
              ))}
            </div>
          )
        }
        if (lines.every(l => /^\d+\.\s/.test(l))) {
          return (
            <div key={i} style={{ margin: '8px 0', paddingLeft: '12px' }}>
              {lines.map((l, j) => (
                <div key={j} style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--color-accent-orange)', flexShrink: 0 }}>→</span>
                  <span>{renderInline(l.replace(/^\d+\.\s/, ''))}</span>
                </div>
              ))}
            </div>
          )
        }
        return (
          <p key={i} style={{ margin: i === 0 ? '0 0 8px' : '8px 0' }}>
            {renderInline(block)}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0
  let m
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      parts.push(<strong key={i++} style={{ color: 'var(--color-text)' }}>{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('*')) {
      parts.push(<em key={i++}>{tok.slice(1, -1)}</em>)
    } else {
      parts.push(
        <code key={i++} style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.85em',
          background: 'var(--color-base)',
          padding: '1px 4px',
          borderRadius: '3px',
          border: '1px solid var(--color-border-subtle)',
        }}>{tok.slice(1, -1)}</code>,
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}
