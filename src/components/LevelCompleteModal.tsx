import { useGameStore } from '../store/gameStore'
import { getLastLevelId, getLevelById, modules, moduleEndingAt } from '../levels'

export default function LevelCompleteModal() {
  const show = useGameStore((s) => s.showLevelComplete)
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const completedLevels = useGameStore((s) => s.completedLevels)
  const dismissLevelCompleteModal = useGameStore((s) => s.dismissLevelCompleteModal)
  const loadLevel = useGameStore((s) => s.loadLevel)

  const level = getLevelById(currentLevelId)
  const isLastLevel = currentLevelId === getLastLevelId()
  const hasQuiz = level?.quiz != null

  // Module-completion celebration: this level is the last in its module → unlock the module badge.
  const closingModule = moduleEndingAt(currentLevelId)
  const ownerModule = modules.find((m) => m.levelIds.includes(currentLevelId))
  const remainingInModule = ownerModule
    ? ownerModule.levelIds.filter((id) => !completedLevels.has(id)).length
    : 0

  function handleContinue() {
    if (hasQuiz) {
      dismissLevelCompleteModal()
    } else if (!isLastLevel) {
      dismissLevelCompleteModal()
      loadLevel(currentLevelId + 1)
    } else {
      dismissLevelCompleteModal()
    }
  }

  function handleSkipQuiz() {
    const { courseCompleteSeen } = useGameStore.getState()
    useGameStore.setState({
      showLevelComplete: false,
      showLevelQuiz: false,
      showCourseComplete: isLastLevel && !courseCompleteSeen,
    })
    if (!isLastLevel) loadLevel(currentLevelId + 1)
  }

  if (!show || !level) return null

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
        @keyframes badgePop {
          0% { transform: scale(0.5); opacity: 0 }
          70% { transform: scale(1.15) }
          100% { transform: scale(1); opacity: 1 }
        }
      `}</style>
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-success-border)',
          borderRadius: '12px',
          maxWidth: '420px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px var(--color-success-border)',
          animation: 'slideUp 0.22s ease-out',
          padding: '36px 32px 28px',
          textAlign: 'center',
        }}
      >
        {/* Emoji — module badge if closing a module, else the per-level stamp */}
        <div
          style={{
            fontSize: closingModule ? '64px' : '48px',
            lineHeight: 1,
            marginBottom: '16px',
            animation: 'badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            animationDelay: '0.1s',
          }}
        >
          {closingModule ? closingModule.badge.emoji : level.badge?.emoji ?? '✨'}
        </div>

        {/* Level / Module tag */}
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
          {closingModule
            ? `Module ${closingModule.id} complete`
            : `Level ${currentLevelId} complete`}
        </span>

        {/* Title */}
        <h2
          style={{
            margin: '0 0 8px',
            color: 'var(--color-text)',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {closingModule
            ? `${closingModule.badge.name} badge earned`
            : level.badge?.name ?? level.title}
        </h2>

        {level.badge?.caption && (
          <p
            style={{
              margin: '0 0 14px',
              color: 'var(--color-text-secondary)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '12.5px',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {level.badge.caption}
          </p>
        )}

        {/* Subtitle */}
        <p
          style={{
            margin: '0 0 28px',
            color: 'var(--color-text-muted)',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '13px',
            lineHeight: 1.6,
          }}
        >
          {hasQuiz
            ? 'Answer a quick question before moving on.'
            : isLastLevel
              ? "You've completed all levels!"
              : closingModule
                ? `Module ${closingModule.id} of ${modules.length}. Ready for the next?`
                : ownerModule && remainingInModule > 0
                  ? `${remainingInModule} more level${remainingInModule === 1 ? '' : 's'} to earn the ${ownerModule.badge.name} badge.`
                  : 'Ready for the next challenge?'}
        </p>

        {/* Button */}
        <button
          onClick={handleContinue}
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
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {isLastLevel ? 'Finish' : hasQuiz ? 'Take the quiz' : 'Next level'}
          {!isLastLevel && (
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          )}
        </button>

        {hasQuiz && (
          <button
            onClick={handleSkipQuiz}
            style={{
              marginTop: '10px',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '11px',
              padding: '4px 8px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'var(--color-border)',
              textUnderlineOffset: '3px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            {isLastLevel ? 'Skip the quiz' : 'Skip the quiz and continue'}
          </button>
        )}
      </div>
    </div>
  )
}
