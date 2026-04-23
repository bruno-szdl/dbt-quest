import { useMemo, useEffect, useRef, useCallback } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import * as dagre from 'dagre'
import { buildDag, type NodeLayer, type DagNode, type DagEdge } from '../engine/dagBuilder'
import { useGameStore } from '../store/gameStore'
import { type GoalDagShape } from '../engine/types'

// ── types ─────────────────────────────────────────────────────────────────────

export type { GoalDagShape }

type NodeStatus = 'idle' | 'ok' | 'fail' | 'error'

interface ModelNodeData {
  label: string
  layer: NodeLayer
  status: NodeStatus
  hasCycle: boolean
}

// ── constants ─────────────────────────────────────────────────────────────────

const NODE_W = 160
const NODE_H = 46

const LAYER_COLOR: Record<NodeLayer, string> = {
  source: '#3fb950',
  staging: '#388bfd',
  intermediate: '#d29922',
  mart: '#8957e5',
}

const LAYER_BG: Record<NodeLayer, string> = {
  source: '#3fb95012',
  staging: '#388bfd12',
  intermediate: '#d2992212',
  mart: '#8957e512',
}

// ── custom node ───────────────────────────────────────────────────────────────

function ModelNode({ data }: { data: ModelNodeData }) {
  const color = LAYER_COLOR[data.layer]
  const bg = LAYER_BG[data.layer]
  const borderColor = data.hasCycle ? '#f85149' : color

  const statusDot =
    data.hasCycle || data.status === 'error'
      ? '#f85149'
      : data.status === 'ok'
        ? '#3fb950'
        : data.status === 'fail'
          ? '#f85149'
          : '#484f58'

  return (
    <div
      className={data.hasCycle ? 'node-cycle' : ''}
      style={{
        background: 'var(--color-surface)',
        backgroundColor: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        padding: '7px 12px',
        width: NODE_W,
        minHeight: NODE_H,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        position: 'relative',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, border: 'none', width: 8, height: 8 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            color,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: 0.8,
          }}
        >
          {data.layer}
        </span>
        <span
          style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot, flexShrink: 0 }}
        />
      </div>

      <div
        style={{
          color: 'var(--color-text)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {data.label}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, border: 'none', width: 8, height: 8 }}
      />
    </div>
  )
}

const nodeTypes: NodeTypes = { modelNode: ModelNode }

// ── dagre layout ──────────────────────────────────────────────────────────────

function applyDagreLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) return { nodes, edges }

  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 90, marginx: 24, marginy: 24 })
  g.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id)
      return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } }
    }),
    edges,
  }
}

// ── data → RF nodes/edges ─────────────────────────────────────────────────────

function toRfNodes(
  dagNodes: DagNode[],
  ranModels: Set<string>,
  testResults: Record<string, 'pass' | 'fail' | 'untested'>,
): Node[] {
  return dagNodes.map((n) => {
    let status: NodeStatus = 'idle'
    if (n.hasCycle) {
      status = 'error'
    } else if (n.layer !== 'source' && ranModels.has(n.id)) {
      status = testResults[n.id] === 'fail' ? 'fail' : 'ok'
    }
    return {
      id: n.id,
      type: 'modelNode',
      position: { x: 0, y: 0 },
      data: { label: n.label, layer: n.layer, status, hasCycle: n.hasCycle } satisfies ModelNodeData,
    }
  })
}

function toRfEdges(dagEdges: DagEdge[], isDark: boolean): Edge[] {
  const edgeColor = isDark ? '#484f58' : '#8c959f'
  return dagEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
    style: { stroke: edgeColor, strokeWidth: 1.5 },
  }))
}

// ── ghost goal overlay ────────────────────────────────────────────────────────

function GhostGoal({ shape }: { shape: GoalDagShape }) {
  const count = shape.nodes.length
  if (count === 0) return null
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)))

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18, zIndex: 0 }}>
      <div className="relative w-full h-full">
        {shape.nodes.map((n, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          const totalCols = Math.min(cols, count)
          const left = `${10 + col * (80 / Math.max(totalCols - 1, 1))}%`
          const top = `${25 + row * 40}%`
          const color = LAYER_COLOR[n.layer]
          return (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                left,
                top,
                transform: 'translate(-50%, -50%)',
                border: `1px dashed ${color}`,
                borderRadius: '5px',
                padding: '5px 10px',
                color,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '9px',
                whiteSpace: 'nowrap',
                background: `${color}08`,
              }}
            >
              {n.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── inner canvas ──────────────────────────────────────────────────────────────

interface DagCanvasProps {
  rfNodes: Node[]
  rfEdges: Edge[]
  goalShape?: GoalDagShape
  isDark: boolean
}

function DagCanvas({ rfNodes, rfEdges, goalShape, isDark }: DagCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges)
  const rfRef = useRef<ReactFlowInstance | null>(null)
  const prevCount = useRef(rfNodes.length)

  useEffect(() => {
    setNodes(rfNodes)
  }, [rfNodes, setNodes])

  useEffect(() => {
    setEdges(rfEdges)
  }, [rfEdges, setEdges])

  useEffect(() => {
    if (rfNodes.length !== prevCount.current) {
      prevCount.current = rfNodes.length
      const t = setTimeout(() => rfRef.current?.fitView({ padding: 0.25, duration: 300 }), 60)
      return () => clearTimeout(t)
    }
  }, [rfNodes.length])

  const onInit = useCallback((instance: ReactFlowInstance) => {
    rfRef.current = instance
    instance.fitView({ padding: 0.25 })
  }, [])

  const bgDotColor = isDark ? '#30363d' : '#d0d7de'
  const minimapBg = isDark ? '#161b22' : '#f6f8fa'
  const minimapBorder = isDark ? '#30363d' : '#d0d7de'
  const minimapMask = isDark ? '#0d111766' : '#ffffff66'
  const controlsBg = isDark ? '#161b22' : '#ffffff'
  const controlsBorder = isDark ? '#30363d' : '#d0d7de'

  return (
    <div className="relative w-full h-full">
      {goalShape && <GhostGoal shape={goalShape} />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        style={{ background: 'transparent', zIndex: 1 }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color={bgDotColor}
          style={{ opacity: 0.5 }}
        />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as ModelNodeData
            return d.hasCycle ? '#f85149' : LAYER_COLOR[d.layer] ?? '#484f58'
          }}
          style={{
            background: minimapBg,
            border: `1px solid ${minimapBorder}`,
            borderRadius: '6px',
          }}
          maskColor={minimapMask}
        />
        <Controls
          style={{
            background: controlsBg,
            border: `1px solid ${controlsBorder}`,
            borderRadius: '6px',
          }}
        />
      </ReactFlow>
    </div>
  )
}

// ── empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
      style={{ opacity: 0.25 }}
    >
      <DagPlaceholderIcon />
      <span
        style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
        }}
      >
        DAG Viewer
      </span>
      <span
        style={{ color: 'var(--color-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}
      >
        add a model to see the graph
      </span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

interface DagPanelProps {
  goalShape?: GoalDagShape
  embedded?: boolean
}

export default function DagPanel({ goalShape, embedded = false }: DagPanelProps) {
  const files = useGameStore((s) => s.files)
  const ranModels = useGameStore((s) => s.ranModels)
  const testResults = useGameStore((s) => s.testResults)
  const theme = useGameStore((s) => s.theme)
  const isDark = theme === 'dark'

  const { rfNodes, rfEdges } = useMemo(() => {
    const { nodes: dagNodes, edges: dagEdges } = buildDag(files)
    const rawNodes = toRfNodes(dagNodes, ranModels, testResults)
    const rawEdges = toRfEdges(dagEdges, isDark)
    const { nodes, edges } = applyDagreLayout(rawNodes, rawEdges)
    return { rfNodes: nodes, rfEdges: edges }
  }, [files, ranModels, testResults, isDark])

  const isEmpty = rfNodes.length === 0

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-dag-bg)' }}>
      {/* Header — suppressed when embedded, since BottomPanel draws its own tab bar */}
      {!embedded && (
      <div
        className="flex items-center justify-between gap-2 px-4 shrink-0"
        style={{ height: '36px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--color-muted)' }}>
            <DagIcon />
          </span>
          <span
            style={{
              color: 'var(--color-text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            dag
          </span>
        </div>

        {goalShape && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-accent-orange)', opacity: 0.6 }}
            />
            <span
              style={{
                color: 'var(--color-muted)',
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              goal
            </span>
          </div>
        )}
      </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <DagCanvas rfNodes={rfNodes} rfEdges={rfEdges} goalShape={goalShape} isDark={isDark} />
        )}
      </div>
    </div>
  )
}

// ── icons ─────────────────────────────────────────────────────────────────────

function DagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25V2.75A1.75 1.75 0 0 0 14.25 1H1.75ZM1.5 2.75a.25.25 0 0 1 .25-.25h12.5a.25.25 0 0 1 .25.25v10.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25V2.75ZM11 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-6 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm3 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-6 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  )
}

function DagPlaceholderIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
      <circle cx="12" cy="24" r="5" stroke="var(--color-text-muted)" strokeWidth="1.5" />
      <circle cx="36" cy="12" r="5" stroke="var(--color-text-muted)" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="5" stroke="var(--color-text-muted)" strokeWidth="1.5" />
      <line x1="17" y1="22" x2="31" y2="14" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="17" y1="26" x2="31" y2="34" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  )
}
