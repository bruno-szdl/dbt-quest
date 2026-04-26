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
  const avatarSize = compact ? 22 : 28
  const nameSize = compact ? 11 : 12
  const metaSize = compact ? 10 : 11
  const bodySize = compact ? 12 : 13.5
  return (
    <div style={{ display: 'flex', gap: compact ? '8px' : '10px', alignItems: 'flex-start' }}>
      <div
        style={{
          flexShrink: 0,
          width: `${avatarSize}px`,
          height: `${avatarSize}px`,
          borderRadius: '50%',
          background: sender.accent,
          color: '#0d1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: `${avatarSize - 14}px`,
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
            fontSize: `${nameSize}px`,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: sender.accent, fontWeight: 600 }}>{sender.name}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: `${metaSize}px` }}>
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
            fontSize: `${bodySize}px`,
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
