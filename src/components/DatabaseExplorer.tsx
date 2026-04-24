import { useEffect, useState } from 'react'
import { runQuery } from '../engine/duckdb'
import { useGameStore } from '../store/gameStore'

interface CatalogEntry {
  name: string
  type: 'BASE TABLE' | 'VIEW'
}

function TableIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="var(--color-warning)" style={{ flexShrink: 0, opacity: 0.9 }}>
      <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25V1.75ZM6.5 6.5v8h7.75a.25.25 0 0 0 .25-.25V6.5H6.5Zm0-1.5h8V1.75a.25.25 0 0 0-.25-.25H6.5V5Zm-1.5 1.5H1.5v7.75c0 .138.112.25.25.25H5V6.5ZM5 5V1.5H1.75a.25.25 0 0 0-.25.25V5H5Z" />
    </svg>
  )
}

function ViewIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="#58a6ff" style={{ flexShrink: 0, opacity: 0.9 }}>
      <path d="M8 2C4.6 2 1.8 4.1.2 7.1a1 1 0 0 0 0 1.8C1.8 11.9 4.6 14 8 14s6.2-2.1 7.8-5.1a1 1 0 0 0 0-1.8C14.2 4.1 11.4 2 8 2Zm0 10a5 5 0 1 1 0-10A5 5 0 0 1 8 12Zm0-8a3 3 0 1 0 0 6A3 3 0 0 0 8 4Z" />
    </svg>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      style={{
        flexShrink: 0,
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.12s ease',
        fill: 'none',
      }}
    >
      <path d="M2 1 l4 3 -4 3" stroke="var(--color-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SchemaIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="var(--color-muted)" style={{ flexShrink: 0 }}>
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
    </svg>
  )
}

export default function DatabaseExplorer() {
  const running = useGameStore((s) => s.running)
  const currentLevelId = useGameStore((s) => s.currentLevelId)
  const [entries, setEntries] = useState<CatalogEntry[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [schemaExpanded, setSchemaExpanded] = useState(true)

  useEffect(() => {
    if (running) return
    async function refresh() {
      try {
        const result = await runQuery(
          `SELECT table_name, table_type
           FROM information_schema.tables
           WHERE table_schema = 'main'
           ORDER BY table_type DESC, table_name`,
        )
        setEntries(
          result.rows.map(([name, type]) => ({
            name: name as string,
            type: type as 'BASE TABLE' | 'VIEW',
          })),
        )
      } catch {
        setEntries([])
      }
    }
    refresh()
  }, [running, currentLevelId])

  const tables = entries.filter((e) => e.type === 'BASE TABLE')
  const views = entries.filter((e) => e.type === 'VIEW')

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-base)',
        flex: collapsed ? '0 0 auto' : '1 1 0',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          flexShrink: 0,
        }}
      >
        <ChevronIcon expanded={!collapsed} />
        <span
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Database
        </span>
        {entries.length > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              color: 'var(--color-muted)',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {entries.length}
          </span>
        )}
      </button>

      {/* Scrollable content */}
      {!collapsed && (
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '6px' }}>
          {entries.length === 0 ? (
            <div
              style={{
                padding: '4px 16px 8px',
                color: 'var(--color-muted)',
                fontSize: '11px',
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontStyle: 'italic',
              }}
            >
              No tables yet
            </div>
          ) : (
            <>
              {/* memory database > main schema */}
              <div style={{ paddingLeft: '12px' }}>
                <button
                  onClick={() => setSchemaExpanded((e) => !e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '2px 4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <ChevronIcon expanded={schemaExpanded} />
                  <SchemaIcon />
                  <span
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    main
                  </span>
                </button>

                {schemaExpanded && (
                  <div style={{ paddingLeft: '14px' }}>
                    {tables.map((t) => (
                      <div
                        key={t.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '2px 4px',
                          borderRadius: '3px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-surface)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <TableIcon />
                        <span
                          style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono, monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={t.name}
                        >
                          {t.name}
                        </span>
                      </div>
                    ))}
                    {views.map((v) => (
                      <div
                        key={v.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '2px 4px',
                          borderRadius: '3px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-surface)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <ViewIcon />
                        <span
                          style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono, monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={v.name}
                        >
                          {v.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
