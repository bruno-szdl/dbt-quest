import { useGameStore } from '../store/gameStore'

export default function ResultsPanel() {
  const lastPreview = useGameStore((s) => s.lastPreview)

  if (!lastPreview) {
    return <EmptyState />
  }

  const { name, columns, rows, rowCount } = lastPreview

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117' }}>
      <div
        className="flex items-center gap-2 shrink-0 border-b border-[#30363d]"
        style={{ padding: '6px 16px', background: '#0d1117' }}
      >
        <span
          style={{
            color: '#7d8590',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          preview
        </span>
        <span style={{ color: '#484f58' }}>·</span>
        <span
          style={{
            color: '#ff694a',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
          }}
        >
          {name}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            color: '#484f58',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
          }}
        >
          {rows.length} of {rowCount} row{rowCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ color: '#484f58', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
          >
            (no rows)
          </div>
        ) : (
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
            }}
          >
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    style={{
                      textAlign: 'left',
                      padding: '8px 14px',
                      background: '#161b22',
                      borderBottom: '1px solid #30363d',
                      color: '#7d8590',
                      fontWeight: 500,
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      position: 'sticky',
                      top: 0,
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    background: ri % 2 === 0 ? 'transparent' : '#161b2260',
                  }}
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: '6px 14px',
                        borderBottom: '1px solid #21262d',
                        color: cell === null || cell === undefined ? '#484f58' : '#e6edf3',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cell === null || cell === undefined ? 'NULL' : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-3"
      style={{ opacity: 0.55 }}
    >
      <ResultsIcon />
      <span
        style={{
          color: '#7d8590',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        No results yet
      </span>
      <span
        style={{
          color: '#484f58',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          textAlign: 'center',
          lineHeight: '1.6',
          maxWidth: '280px',
        }}
      >
        Run a model, then click <span style={{ color: '#7d8590' }}>Show Results</span>
        <br />
        (or run <span style={{ color: '#7d8590' }}>dbt show --select &lt;model&gt;</span>)
      </span>
    </div>
  )
}

function ResultsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="#7d8590" strokeWidth="1.2">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" />
      <line x1="5" y1="2.5" x2="5" y2="13.5" />
      <line x1="10" y1="2.5" x2="10" y2="13.5" />
    </svg>
  )
}
