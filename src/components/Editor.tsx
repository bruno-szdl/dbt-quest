import MonacoEditor from '@monaco-editor/react'
import { useGameStore } from '../store/gameStore'

function detectLanguage(path: string): string {
  if (path.endsWith('.sql')) return 'sql'
  if (path.endsWith('.yml') || path.endsWith('.yaml')) return 'yaml'
  return 'plaintext'
}

function basename(path: string): string {
  return path.split('/').pop() ?? path
}

export default function Editor() {
  const files = useGameStore((s) => s.files)
  const activeFile = useGameStore((s) => s.activeFile)
  const openFile = useGameStore((s) => s.openFile)
  const setFileContent = useGameStore((s) => s.setFileContent)
  const theme = useGameStore((s) => s.theme)

  const filePaths = Object.keys(files).sort()

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-base)' }}>
      {/* Panel header + tabs */}
      <div
        className="flex items-end shrink-0 overflow-x-auto"
        style={{ background: 'var(--color-surface)', minHeight: '36px', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 px-3 shrink-0" style={{ height: '36px' }}>
          <EditorIcon />
          <span
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            editor
          </span>
        </div>

        <div className="flex items-end h-full">
          {filePaths.map((path) => {
            const isActive = path === activeFile
            return (
              <button
                key={path}
                title={path}
                onClick={() => openFile(path)}
                className="flex items-center gap-1.5 px-3 shrink-0 cursor-pointer"
                style={{
                  height: '36px',
                  background: isActive ? 'var(--color-base)' : 'transparent',
                  borderRight: '1px solid var(--color-border)',
                  borderTop: isActive ? '1px solid var(--color-accent-orange)' : '1px solid transparent',
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
              >
                <FileIcon path={path} />
                <span>{basename(path)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-hidden">
        {activeFile === null ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30 select-none">
            <EditorIcon size={32} />
            <span
              style={{
                color: 'var(--color-text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              No file open
            </span>
          </div>
        ) : (
          <MonacoEditor
            key={`${activeFile}-${theme}`}
            height="100%"
            language={detectLanguage(activeFile)}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            defaultValue={files[activeFile] ?? ''}
            onChange={(val) => setFileContent(activeFile, val ?? '')}
            onMount={(editor) => editor.focus()}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              padding: { top: 8 },
            }}
          />
        )}
      </div>
    </div>
  )
}

function EditorIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={{ color: 'var(--color-muted)' }}>
      <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75V1.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
    </svg>
  )
}

function FileIcon({ path }: { path: string }) {
  const ext = path.split('.').pop() ?? ''
  const color =
    ext === 'sql'
      ? 'var(--color-accent-orange)'
      : ext === 'yml' || ext === 'yaml'
        ? 'var(--color-success)'
        : 'var(--color-text-muted)'
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill={color} style={{ opacity: 0.8, flexShrink: 0 }}>
      <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5L7.5 1H2Zm0 1h5v3h3v6H2V2Z" />
    </svg>
  )
}
