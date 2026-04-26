import type { StoryMessage } from '../engine/types'
import { CAST } from '../levels/cast'

interface StoryThreadProps {
  messages: StoryMessage[]
  /** Compact = right-panel sizing. Default = modal sizing. */
  compact?: boolean
}

export default function StoryThread({ messages, compact = false }: StoryThreadProps) {
  if (messages.length === 0) return null
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '10px' : '14px',
      }}
    >
      {messages.map((msg, i) => (
        <StoryBubble key={i} msg={msg} compact={compact} />
      ))}
    </div>
  )
}

function StoryBubble({ msg, compact }: { msg: StoryMessage; compact: boolean }) {
  const sender = CAST[msg.from]
  // Avatar dimensions stay in px (layout), font sizes in rem (typography).
  const avatarPx = compact ? 22 : 28
  const avatarFontRem = compact ? '0.5rem' : '0.875rem'
  const nameFontRem = compact ? '0.6875rem' : '0.75rem'
  const metaFontRem = compact ? '0.625rem' : '0.6875rem'
  const bodyFontRem = compact ? '0.75rem' : '0.84375rem'
  return (
    <div style={{ display: 'flex', gap: compact ? '8px' : '10px', alignItems: 'flex-start' }}>
      <div
        style={{
          flexShrink: 0,
          width: `${avatarPx}px`,
          height: `${avatarPx}px`,
          borderRadius: '50%',
          background: sender.accent,
          color: '#0d1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: avatarFontRem,
          fontWeight: 700,
          marginTop: '2px',
        }}
      >
        {sender.initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            marginBottom: '4px',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: nameFontRem,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: sender.accent, fontWeight: 600 }}>{sender.name}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: metaFontRem }}>
            {sender.role}
            {msg.time ? ` · ${msg.time}` : ''}
          </span>
        </div>
        <div
          style={{
            background: 'var(--color-base)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: compact ? '6px' : '8px',
            padding: compact ? '8px 10px' : '10px 12px',
            color: 'var(--color-text)',
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: bodyFontRem,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}
        >
          {msg.body}
        </div>
      </div>
    </div>
  )
}
