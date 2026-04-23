import { useState, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'

// ── tree types ────────────────────────────────────────────────────────────────

interface DirNode {
  type: 'dir'
  name: string
  path: string
  children: TreeNode[]
}

interface FileNode {
  type: 'file'
  name: string
  path: string
}

type TreeNode = DirNode | FileNode

function buildTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = []
  const dirMap = new Map<string, DirNode>()

  for (const filePath of Object.keys(files).sort()) {
    const parts = filePath.split('/')
    let current = root

    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join('/')
      let dir = dirMap.get(dirPath)
      if (!dir) {
        dir = { type: 'dir', name: parts[i], path: dirPath, children: [] }
        dirMap.set(dirPath, dir)
        current.push(dir)
      }
      current = dir.children
    }

    current.push({ type: 'file', name: parts[parts.length - 1], path: filePath })
  }

  return root
}

// ── icons ─────────────────────────────────────────────────────────────────────

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop() ?? ''
  const color =
    ext === 'sql'
      ? 'var(--color-accent-orange)'
      : ext === 'yml' || ext === 'yaml'
        ? 'var(--color-success)'
        : 'var(--color-text-muted)'
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill={color}
      style={{ flexShrink: 0, opacity: 0.85 }}
    >
      <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5L7.5 1H2Zm0 1h5v3h3v6H2V2Z" />
    </svg>
  )
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="var(--color-muted)" style={{ flexShrink: 0 }}>
      {open ? (
        <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3h-6.5L6.092 1.337A1.75 1.75 0 0 0 4.843 1H1.75ZM0 11.25V5.5h14.5v7.75a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25ZM14.5 4H1.75a.25.25 0 0 0-.25.25V4h13V4ZM1.5 2.75A.25.25 0 0 1 1.75 2.5h3.093a.25.25 0 0 1 .178.073L6.5 4H1.5V2.75Z" />
      ) : (
        <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25V4.75A1.75 1.75 0 0 0 14.25 3h-6.5L6.092 1.337A1.75 1.75 0 0 0 4.843 1H1.75ZM1.5 2.75A.25.25 0 0 1 1.75 2.5h3.093a.25.25 0 0 1 .178.073L6.5 4H1.5V2.75Zm0 2.75h13v7.75a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25V5.5Z" />
      )}
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
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.12s',
        flexShrink: 0,
        fill: 'none',
      }}
    >
      <path d="M2.5 1.5L5.5 4 2.5 6.5" stroke="var(--color-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7.75 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 7.75 2Z" />
    </svg>
  )
}

// ── tree nodes ────────────────────────────────────────────────────────────────

interface ItemProps {
  node: TreeNode
  depth: number
  activeFile: string | null
  onOpen: (path: string) => void
  onDelete: (path: string) => void
  onCreateInDir: (dirPath: string) => void
}

function DirItem({ node, depth, activeFile, onOpen, onDelete, onCreateInDir }: ItemProps & { node: DirNode }) {
  const [expanded, setExpanded] = useState(true)
  const [hovered, setHovered] = useState(false)
  const indent = 8 + depth * 14

  return (
    <div>
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 w-full"
          style={{
            padding: `3px 28px 3px ${indent}px`,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            textAlign: 'left',
            userSelect: 'none',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-border-subtle)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <ChevronIcon expanded={expanded} />
          <FolderIcon open={expanded} />
          <span style={{ marginLeft: '4px' }}>{node.name}</span>
        </button>

        {hovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!expanded) setExpanded(true)
              onCreateInDir(node.path)
            }}
            title={`New file in ${node.path}/`}
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-accent-orange)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-muted)'
            }}
          >
            <PlusIcon />
          </button>
        )}
      </div>

      {expanded &&
        node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            onOpen={onOpen}
            onDelete={onDelete}
            onCreateInDir={onCreateInDir}
          />
        ))}
    </div>
  )
}

function FileItem({ node, depth, activeFile, onOpen, onDelete }: ItemProps & { node: FileNode }) {
  const [hovered, setHovered] = useState(false)
  const isActive = node.path === activeFile
  const indent = 8 + depth * 14

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => onOpen(node.path)}
        className="flex items-center gap-1.5 w-full"
        style={{
          padding: `3px 28px 3px ${indent}px`,
          background: isActive ? 'var(--color-accent-bg)' : 'transparent',
          border: 'none',
          borderLeft: `2px solid ${isActive ? 'var(--color-accent-orange)' : 'transparent'}`,
          cursor: 'pointer',
          color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
          fontSize: '11px',
          fontFamily: 'JetBrains Mono, monospace',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--color-border-subtle)'
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent'
        }}
      >
        <FileIcon name={node.name} />
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {node.name}
        </span>
      </button>

      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.path)
          }}
          title="Delete file"
          style={{
            position: 'absolute',
            right: '5px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-muted)',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '3px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-fail)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-muted)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
          </svg>
        </button>
      )}
    </div>
  )
}

function TreeItem(props: ItemProps) {
  if (props.node.type === 'dir') {
    return <DirItem {...props} node={props.node} />
  }
  return <FileItem {...props} node={props.node} />
}

// ── main component ────────────────────────────────────────────────────────────

export default function FileExplorer() {
  const files = useGameStore((s) => s.files)
  const activeFile = useGameStore((s) => s.activeFile)
  const openFile = useGameStore((s) => s.openFile)
  const createFile = useGameStore((s) => s.createFile)
  const deleteFile = useGameStore((s) => s.deleteFile)

  const [creating, setCreating] = useState(false)
  const [newPath, setNewPath] = useState('')
  const [focusTick, setFocusTick] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    if (creating) {
      inputRef.current?.focus()
      const el = inputRef.current
      if (el) el.setSelectionRange(el.value.length, el.value.length)
    }
  }, [creating, focusTick])

  const submit = useCallback(() => {
    const path = newPath.trim()
    if (path && !path.endsWith('/')) createFile(path, '')
    setCreating(false)
    setNewPath('')
  }, [newPath, createFile])

  const startCreateInDir = useCallback((dirPath: string) => {
    setNewPath(`${dirPath}/`)
    setCreating(true)
    setFocusTick((t) => t + 1)
  }, [])

  const startCreateAtRoot = useCallback(() => {
    setNewPath('')
    setCreating((c) => !c)
    setFocusTick((t) => t + 1)
  }, [])

  const tree = buildTree(files)

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: '100%', background: 'var(--color-base)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between shrink-0"
        style={{ height: '36px', padding: '0 8px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <span
          style={{
            color: 'var(--color-text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Files
        </span>
        <button
          onClick={startCreateAtRoot}
          title="New file (type the full path)"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: creating ? 'var(--color-accent-orange)' : 'var(--color-muted)',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '3px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text)'
            e.currentTarget.style.background = 'var(--color-border-subtle)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = creating ? 'var(--color-accent-orange)' : 'var(--color-muted)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688ZM8.75 7a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 8.75 7Z" />
          </svg>
        </button>
      </div>

      {/* New-file input */}
      {creating && (
        <div
          className="shrink-0"
          style={{ padding: '6px 8px', background: 'var(--color-base)', borderBottom: '1px solid var(--color-border)' }}
        >
          <input
            ref={inputRef}
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              } else if (e.key === 'Escape') {
                cancelRef.current = true
                setCreating(false)
                setNewPath('')
              }
            }}
            onBlur={() => {
              if (cancelRef.current) {
                cancelRef.current = false
                return
              }
              submit()
            }}
            placeholder="models/staging/name.sql"
            spellCheck={false}
            style={{
              width: '100%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-accent-orange-dim)',
              borderRadius: '3px',
              color: 'var(--color-text)',
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '4px 6px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              color: 'var(--color-muted)',
              fontSize: '9px',
              fontFamily: 'JetBrains Mono, monospace',
              marginTop: '3px',
            }}
          >
            ↵ create · esc cancel
          </div>
        </div>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: '4px' }}>
        {tree.length === 0 ? (
          <div
            style={{
              color: 'var(--color-muted)',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono, monospace',
              padding: '16px 8px',
              textAlign: 'center',
              lineHeight: '1.6',
            }}
          >
            No files yet.
            <br />
            Click + to create one.
          </div>
        ) : (
          tree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              activeFile={activeFile}
              onOpen={openFile}
              onDelete={deleteFile}
              onCreateInDir={startCreateInDir}
            />
          ))
        )}
      </div>
    </div>
  )
}
