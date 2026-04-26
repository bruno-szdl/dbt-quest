import { useRef, useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { TerminalLine } from '../store/gameStore'

const COLOR: Record<string, string> = {
  green: 'var(--color-success)',
  red: 'var(--color-fail)',
  yellow: 'var(--color-warning)',
  gray: 'var(--color-text-muted)',
}

function lineColor(line: TerminalLine): string {
  return line.color ? COLOR[line.color] : 'var(--color-text)'
}

interface TerminalPanelProps {
  embedded?: boolean
}

export default function TerminalPanel({ embedded = false }: TerminalPanelProps) {
  const terminalHistory = useGameStore((s) => s.terminalHistory)
  const runCommand = useGameStore((s) => s.runCommand)

  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)

  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = outputRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [terminalHistory])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const cmd = input.trim()
        if (cmd) {
          runCommand(cmd)
          setCmdHistory((prev) => [cmd, ...prev])
          setHistoryIdx(-1)
        }
        setInput('')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = Math.min(historyIdx + 1, cmdHistory.length - 1)
        setHistoryIdx(next)
        if (next >= 0) setInput(cmdHistory[next])
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = Math.max(historyIdx - 1, -1)
        setHistoryIdx(next)
        setInput(next === -1 ? '' : cmdHistory[next])
      }
    },
    [input, cmdHistory, historyIdx, runCommand]
  )

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--color-terminal-bg)' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Internal title bar — hidden when embedded in the shared bottom drawer */}
      {!embedded && (
        <div
          className="flex items-center gap-2 px-4 shrink-0"
          style={{ height: '36px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <span style={{ color: 'var(--color-muted)' }}>
            <TerminalIcon />
          </span>
          <span
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            terminal
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-fail)', opacity: 0.4 }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-warning)', opacity: 0.4 }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--color-success)', opacity: 0.4 }} />
          </div>
        </div>
      )}

      {/* Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        style={{ scrollBehavior: 'smooth' }}
      >
        {terminalHistory.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
              lineHeight: '1.65',
              color: lineColor(line),
              whiteSpace: 'pre',
              minHeight: '1.65em',
            }}
          >
            {line.text || ' '}
          </div>
        ))}
      </div>

      {/* Input row */}
      <div
        className="flex items-center gap-0 px-4 shrink-0"
        style={{ height: '36px', background: 'var(--color-base)', borderTop: '1px solid var(--color-border)' }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            color: 'var(--color-accent-orange)',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
        type here&nbsp;&gt;&nbsp;
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="dbt-quest terminal input"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            caretColor: 'var(--color-text)',
          }}
        />
      </div>
    </div>
  )
}

function TerminalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H1.75ZM7.25 8a.75.75 0 0 1-.22.53l-2.25 2.25a.75.75 0 0 1-1.06-1.06L5.44 8 3.72 6.28a.75.75 0 0 1 1.06-1.06l2.25 2.25c.141.14.22.331.22.53Zm1.5 1.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z" />
    </svg>
  )
}
