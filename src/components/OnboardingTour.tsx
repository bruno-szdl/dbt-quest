import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { modules } from '../levels'
import { useModalA11y } from '../hooks/useModalA11y'
import { useIsMobile } from '../hooks/useIsMobile'

type Placement = 'right' | 'left' | 'top' | 'bottom'

type CardStep = {
  kind: 'card'
  title: string
  body: React.ReactNode
}

type SpotlightStep = {
  kind: 'spotlight'
  target: string
  title: string
  body: React.ReactNode
  placement: Placement
}

type Step = CardStep | SpotlightStep

const BEATS: Record<number, string> = {
  4: 'first stakeholder review',
  7: 'first mart pinned',
  13: '🎓 board meeting',
}

const TOOLTIP_WIDTH = 340
const TOOLTIP_GAP = 16
const VIEWPORT_PAD = 12

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function readRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function tooltipPosition(
  rect: Rect,
  placement: Placement,
  tooltipHeight: number,
  vw: number,
  vh: number,
): { top: number; left: number } {
  let top = 0
  let left = 0
  switch (placement) {
    case 'right':
      left = rect.left + rect.width + TOOLTIP_GAP
      top = rect.top + rect.height / 2 - tooltipHeight / 2
      break
    case 'left':
      left = rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP
      top = rect.top + rect.height / 2 - tooltipHeight / 2
      break
    case 'bottom':
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
      top = rect.top + rect.height + TOOLTIP_GAP
      break
    case 'top':
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2
      top = rect.top - tooltipHeight - TOOLTIP_GAP
      break
  }
  // If primary placement clips, fall back to the opposite axis or clamp.
  if (placement === 'right' && left + TOOLTIP_WIDTH > vw - VIEWPORT_PAD) {
    left = rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP
  }
  if (placement === 'left' && left < VIEWPORT_PAD) {
    left = rect.left + rect.width + TOOLTIP_GAP
  }
  if (placement === 'bottom' && top + tooltipHeight > vh - VIEWPORT_PAD) {
    top = rect.top - tooltipHeight - TOOLTIP_GAP
  }
  if (placement === 'top' && top < VIEWPORT_PAD) {
    top = rect.top + rect.height + TOOLTIP_GAP
  }
  left = clamp(left, VIEWPORT_PAD, vw - TOOLTIP_WIDTH - VIEWPORT_PAD)
  top = clamp(top, VIEWPORT_PAD, vh - tooltipHeight - VIEWPORT_PAD)
  return { top, left }
}

function Roadmap() {
  return (
    <ul
      style={{
        margin: '12px 0 0',
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
              padding: '5px 8px',
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
  )
}

const DESKTOP_STEPS: Step[] = [
  {
    kind: 'card',
    title: "You're the new analytics engineer.",
    body: (
      <>
        <p style={{ margin: '0 0 10px' }}>
          dbt-quest is a browser-based dbt practice game. SQL runs on{' '}
          <strong>DuckDB WASM</strong> — no setup, no backend, nothing to install. You
          play an analytics engineer at Möller Coffee, working through 44 levels across
          13 modules.
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.78125rem' }}>
          Here's the roadmap:
        </p>
        <Roadmap />
      </>
    ),
  },
  {
    kind: 'spotlight',
    target: 'header',
    placement: 'bottom',
    title: 'Top bar',
    body: (
      <>
        Your current level, badges earned, a <strong>Reset</strong> menu (this level or
        all progress), the theme toggle, and a <strong>?</strong> button that replays
        this tour any time.
      </>
    ),
  },
  {
    kind: 'spotlight',
    target: 'files',
    placement: 'right',
    title: 'Project files & warehouse',
    body: (
      <>
        Your dbt project files at the top — models, sources, seeds, tests. The DuckDB
        warehouse below shows the tables those models materialize into.
      </>
    ),
  },
  {
    kind: 'spotlight',
    target: 'editor',
    placement: 'bottom',
    title: 'SQL editor',
    body: (
      <>
        Where you write models. Use <code>ref()</code> and <code>source()</code> just
        like real dbt. Edits auto-save and re-validate the level as you type.
      </>
    ),
  },
  {
    kind: 'spotlight',
    target: 'bottom',
    placement: 'top',
    title: 'Terminal, DAG, results',
    body: (
      <>
        Run <code>dbt run</code>, <code>dbt test</code>, <code>dbt show</code> from the
        terminal. Switch tabs to see lineage or query previews.
      </>
    ),
  },
  {
    kind: 'spotlight',
    target: 'level',
    placement: 'left',
    title: 'Current goal',
    body: (
      <>
        What you need to do to clear the level, hints when you're stuck, and your
        progress through the current module.
      </>
    ),
  },
  {
    kind: 'card',
    title: 'Day 1 starts now.',
    body: (
      <p style={{ margin: 0 }}>
        That's the whole tour. You can replay it any time from the settings menu in the
        top bar. Good luck.
      </p>
    ),
  },
]

const MOBILE_INTRO: Step = {
  kind: 'card',
  title: "You're the new analytics engineer.",
  body: (
    <>
      <div
        style={{
          padding: '10px 12px',
          marginBottom: '12px',
          borderRadius: '8px',
          background: 'var(--color-accent-bg)',
          border: '1px solid var(--color-accent-orange-dim)',
          color: 'var(--color-text)',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--color-accent-orange)' }}>Heads up:</strong>{' '}
        dbt-quest is designed for desktop. The mobile experience is limited — the SQL
        editor, terminal, and DAG were built for a wider screen. Open this on a laptop
        for the full game.
      </div>
      <p style={{ margin: '0 0 10px' }}>
        dbt-quest is a browser-based dbt practice game. SQL runs on{' '}
        <strong>DuckDB WASM</strong> — no setup, no backend, nothing to install. You
        play an analytics engineer at Möller Coffee, working through 44 levels across
        13 modules.
      </p>
      <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.78125rem' }}>
        Here's the roadmap:
      </p>
      <Roadmap />
    </>
  ),
}

const MOBILE_STEPS: Step[] = [MOBILE_INTRO, DESKTOP_STEPS[DESKTOP_STEPS.length - 1]]

export default function OnboardingTour() {
  const show = useGameStore((s) => s.showWelcome)
  const dismiss = useGameStore((s) => s.dismissWelcome)
  const stepIndex = useGameStore((s) => s.tourStep)
  const setStep = useGameStore((s) => s.setTourStep)
  const isMobile = useIsMobile()

  const steps = useMemo(() => (isMobile ? MOBILE_STEPS : DESKTOP_STEPS), [isMobile])
  const safeIndex = clamp(stepIndex, 0, steps.length - 1)
  const step = steps[safeIndex]

  const isFirst = safeIndex === 0
  const isLast = safeIndex === steps.length - 1

  const goNext = useCallback(() => {
    if (isLast) dismiss()
    else setStep(safeIndex + 1)
  }, [isLast, dismiss, setStep, safeIndex])

  const goPrev = useCallback(() => {
    if (isFirst) return
    setStep(safeIndex - 1)
  }, [isFirst, setStep, safeIndex])

  useEffect(() => {
    if (!show) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [show, dismiss, goNext, goPrev])

  if (!show) return null

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes tourTooltipIn {
          from { opacity: 0; transform: translateY(6px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
      {step.kind === 'card' ? (
        <CardOverlay
          title={step.title}
          body={step.body}
          stepIndex={safeIndex}
          stepCount={steps.length}
          isFirst={isFirst}
          isLast={isLast}
          onNext={goNext}
          onPrev={goPrev}
          onSkip={dismiss}
        />
      ) : (
        <SpotlightOverlay
          step={step}
          stepIndex={safeIndex}
          stepCount={steps.length}
          isFirst={isFirst}
          isLast={isLast}
          onNext={goNext}
          onPrev={goPrev}
          onSkip={dismiss}
        />
      )}
    </>
  )
}

function FooterControls({
  stepIndex,
  stepCount,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
}: {
  stepIndex: number
  stepCount: number
  isFirst: boolean
  isLast: boolean
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <button
        onClick={onSkip}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '0.75rem',
          cursor: 'pointer',
          padding: '4px 6px',
          marginRight: 'auto',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
      >
        Skip tour
      </button>
      <span
        style={{
          color: 'var(--color-muted)',
          fontSize: '0.625rem',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {stepIndex + 1} / {stepCount}
      </span>
      <button
        onClick={onPrev}
        disabled={isFirst}
        style={{
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          color: isFirst ? 'var(--color-muted)' : 'var(--color-text-muted)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '7px 12px',
          cursor: isFirst ? 'not-allowed' : 'pointer',
          opacity: isFirst ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (isFirst) return
          e.currentTarget.style.borderColor = 'var(--color-muted)'
          e.currentTarget.style.color = 'var(--color-text)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.color = isFirst ? 'var(--color-muted)' : 'var(--color-text-muted)'
        }}
      >
        Back
      </button>
      <button
        onClick={onNext}
        style={{
          background: 'var(--color-accent-orange)',
          border: 'none',
          borderRadius: '6px',
          color: '#0d1117',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '0.8125rem',
          fontWeight: 700,
          padding: '8px 16px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        {isLast ? "Let's go" : 'Next'}
        <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
  )
}

function CardOverlay({
  title,
  body,
  stepIndex,
  stepCount,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
}: {
  title: string
  body: React.ReactNode
  stepIndex: number
  stepCount: number
  isFirst: boolean
  isLast: boolean
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  const dialogRef = useModalA11y(true)
  return (
    <div
      onClick={onSkip}
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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-card-title"
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
              {isLast ? 'Ready' : 'Welcome'}
            </span>
            <span
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.6875rem',
                fontFamily: 'IBM Plex Sans, sans-serif',
              }}
            >
              dbt-quest · {isLast ? 'all set' : 'day zero'}
            </span>
          </div>
          <h2
            id="tour-card-title"
            style={{
              margin: 0,
              color: 'var(--color-text)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '1.375rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
            }}
          >
            {title}
          </h2>
        </div>
        <div
          style={{
            padding: '18px 28px',
            overflowY: 'auto',
            flex: 1,
            color: 'var(--color-text-secondary)',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '0.875rem',
            lineHeight: 1.55,
          }}
        >
          {body}
        </div>
        <div
          style={{
            padding: '14px 28px 20px',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <FooterControls
            stepIndex={stepIndex}
            stepCount={stepCount}
            isFirst={isFirst}
            isLast={isLast}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={onSkip}
          />
        </div>
      </div>
    </div>
  )
}

function SpotlightOverlay({
  step,
  stepIndex,
  stepCount,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
}: {
  step: SpotlightStep
  stepIndex: number
  stepCount: number
  isFirst: boolean
  isLast: boolean
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  const dialogRef = useModalA11y(true)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<Rect | null>(() => readRect(step.target))
  const [tooltipHeight, setTooltipHeight] = useState(180)
  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  // Recompute target rect on step change, resize, and scroll.
  useLayoutEffect(() => {
    let raf = 0
    const measure = () => {
      raf = requestAnimationFrame(() => {
        setRect(readRect(step.target))
        setViewport({ w: window.innerWidth, h: window.innerHeight })
      })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step.target])

  // Track tooltip height for accurate placement.
  useLayoutEffect(() => {
    if (!tooltipRef.current) return
    setTooltipHeight(tooltipRef.current.offsetHeight)
    const ro = new ResizeObserver(() => {
      if (tooltipRef.current) setTooltipHeight(tooltipRef.current.offsetHeight)
    })
    ro.observe(tooltipRef.current)
    return () => ro.disconnect()
  }, [step.target, step.title])

  // If the target can't be found, fall back to a centered card so the user isn't stuck.
  if (!rect) {
    return (
      <CardOverlay
        title={step.title}
        body={step.body}
        stepIndex={stepIndex}
        stepCount={stepCount}
        isFirst={isFirst}
        isLast={isLast}
        onNext={onNext}
        onPrev={onPrev}
        onSkip={onSkip}
      />
    )
  }

  const { w: vw, h: vh } = viewport
  const tip = tooltipPosition(rect, step.placement, tooltipHeight, vw, vh)
  const dim = 'rgba(0, 0, 0, 0.72)'

  return (
    <>
      {/* Four dim panels around the spotlight. pointer-events:auto so the user can't click panels through. */}
      <div
        onClick={onSkip}
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: rect.top, background: dim, zIndex: 250, animation: 'fadeIn 0.16s ease-out' }}
      />
      <div
        onClick={onSkip}
        style={{ position: 'fixed', top: rect.top, left: 0, width: rect.left, height: rect.height, background: dim, zIndex: 250, animation: 'fadeIn 0.16s ease-out' }}
      />
      <div
        onClick={onSkip}
        style={{
          position: 'fixed',
          top: rect.top,
          left: rect.left + rect.width,
          width: Math.max(0, vw - (rect.left + rect.width)),
          height: rect.height,
          background: dim,
          zIndex: 250,
          animation: 'fadeIn 0.16s ease-out',
        }}
      />
      <div
        onClick={onSkip}
        style={{
          position: 'fixed',
          top: rect.top + rect.height,
          left: 0,
          width: '100vw',
          height: Math.max(0, vh - (rect.top + rect.height)),
          background: dim,
          zIndex: 250,
          animation: 'fadeIn 0.16s ease-out',
        }}
      />

      {/* Orange ring around the spotlight (pointer-events: none so panel underneath stays interactive — but we don't want it interactive during tour, so keep none anyway; the dim panels block clicks elsewhere). */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: rect.top - 2,
          left: rect.left - 2,
          width: rect.width + 4,
          height: rect.height + 4,
          borderRadius: '4px',
          boxShadow: '0 0 0 2px var(--color-accent-orange-dim), 0 0 24px rgba(255, 105, 74, 0.25)',
          pointerEvents: 'none',
          zIndex: 255,
          animation: 'fadeIn 0.18s ease-out',
        }}
      />

      {/* Tooltip card */}
      <div
        ref={(el) => {
          tooltipRef.current = el
          dialogRef.current = el
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-spotlight-title"
        tabIndex={-1}
        style={{
          position: 'fixed',
          top: tip.top,
          left: tip.left,
          width: TOOLTIP_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 261,
          outline: 'none',
          animation: 'tourTooltipIn 0.2s ease-out',
        }}
      >
        <div style={{ padding: '16px 20px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
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
              Tour
            </span>
            <span
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.6875rem',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {stepIndex + 1} / {stepCount}
            </span>
          </div>
          <h3
            id="tour-spotlight-title"
            style={{
              margin: 0,
              color: 'var(--color-text)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              letterSpacing: '-0.005em',
            }}
          >
            {step.title}
          </h3>
        </div>
        <div
          style={{
            padding: '6px 20px 14px',
            color: 'var(--color-text-secondary)',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '0.84375rem',
            lineHeight: 1.55,
          }}
        >
          {step.body}
        </div>
        <div
          style={{
            padding: '10px 16px 14px',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <FooterControls
            stepIndex={stepIndex}
            stepCount={stepCount}
            isFirst={isFirst}
            isLast={isLast}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={onSkip}
          />
        </div>
      </div>
    </>
  )
}
