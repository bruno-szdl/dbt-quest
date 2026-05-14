import { useGameStore } from '../store/gameStore'
import { getLastLessonId } from '../lessons'

/**
 * Lesson 0: pure-prose introduction. Rendered as a full-width article
 * instead of the four-panel IDE. Mirrors SQLBolt's first-page pattern.
 */
const codeStyle = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.85em',
  background: 'var(--color-base)',
  padding: '1px 4px',
  borderRadius: '3px',
  border: '1px solid var(--color-border-subtle)',
}

export default function IntroPage() {
  const loadLesson = useGameStore((s) => s.loadLesson)

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--color-base)', color: 'var(--color-text)' }}
    >
      <article
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '48px 32px 80px',
          fontFamily: 'IBM Plex Sans, sans-serif',
          fontSize: '1rem',
          lineHeight: 1.65,
          color: 'var(--color-text-secondary)',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            margin: '0 0 24px',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Introduction to dbt
        </h1>
        <p style={{ margin: '0 0 16px' }}>
          Welcome to <strong style={{ color: 'var(--color-text)' }}>dbt-quest</strong>, a series of
          short, interactive lessons designed to help you learn{' '}
          <strong style={{ color: 'var(--color-text)' }}>dbt</strong> right in your browser, inspired by{' '}
          <a
            href="https://sqlbolt.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
          >
            SQLBolt
          </a>.
        </p>

        <SectionHeader>What is dbt?</SectionHeader>
        <p style={{ margin: '0 0 16px' }}>
          dbt is the open-source tool data teams use to turn raw warehouse tables into trustworthy,
          documented, tested models. It sits on top of any SQL warehouse (Snowflake, Databricks, BigQuery,
          Postgres, DuckDB, …) and gives you a way to manage your transformation SQL <em>as code</em>:
          version-controlled, modular, and testable.
        </p>

        <Aside title="Did you know?">
          dbt projects are just folders of <code style={codeStyle}>.sql</code> and <code style={codeStyle}>.yml</code> files. No proprietary syntax. If you can write SQL, you can write dbt. But dbt turns those files into something bigger: a managed, tested, documented, version-controlled transformation framework with full lineage.
        </Aside>

        <p style={{ margin: '0 0 12px' }}>
          A dbt project is a folder full of <code style={codeStyle}>.sql</code> files. Each file is a{' '}
          <code style={codeStyle}>SELECT</code> statement (what dbt calls a <strong style={{ color: 'var(--color-text)' }}>model</strong>).
          When you run <code style={codeStyle}>dbt run</code>, dbt:
        </p>
        <ol style={{ margin: '0 0 16px', paddingLeft: '0', listStyle: 'none' }}>
          <li style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
            <span style={{ color: 'var(--color-accent-orange)', flexShrink: 0 }}>→</span>
            <span>Reads all your SQL models</span>
          </li>
          <li style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
            <span style={{ color: 'var(--color-accent-orange)', flexShrink: 0 }}>→</span>
            <span>Figures out which models depend on others (the <strong style={{ color: 'var(--color-text)' }}>DAG</strong>)</span>
          </li>
          <li style={{ display: 'flex', gap: '8px', marginBottom: '3px' }}>
            <span style={{ color: 'var(--color-accent-orange)', flexShrink: 0 }}>→</span>
            <span>Runs them in the right order and builds the results in your database</span>
          </li>
        </ol>
        <p style={{ margin: '0 0 16px' }}>
          That's the core idea. Everything else (tests, docs, sources, materializations, snapshots)
          is built on top of those primitives.
        </p>

        <SectionHeader>An example DAG</SectionHeader>
        <p style={{ margin: '0 0 16px' }}>
          Real pipelines have several layers. A common pattern looks like this:
        </p>
        <DagDiagram />
        <p style={{ margin: '16px 0' }}>
          The arrows are <code style={codeStyle}>ref()</code> calls in SQL. dbt reads them, builds the graph above,
          and runs the models left-to-right.
        </p>

        <SectionHeader>About the lessons</SectionHeader>
        <p style={{ margin: '0 0 16px' }}>
          There are {getLastLessonId()} short lessons. Each one introduces a single concept, then gives you 3–5
          small tasks to apply it.
        </p>
        <p style={{ margin: '0 0 16px' }}>
          Go at your pace, edit the SQL freely, and don't worry about breaking things. Every
          lesson has a "Reset lesson" button in the top bar. If you get stuck, every task has a
          "Show hint" button.
        </p>
        <p style={{ margin: '0 0 16px' }}>
          By the end you'll be ready to open any real dbt project and contribute on day one.
        </p>

        <SectionHeader>Before you start</SectionHeader>
        <p style={{ margin: '0 0 16px' }}>
          You only need to know basic SQL —{' '}
          <code style={codeStyle}>SELECT</code>, <code style={codeStyle}>WHERE</code>, <code style={codeStyle}>GROUP BY</code>. That's it.
          You don't need a database, a dbt installation, or command-line experience.
          Everything runs in your browser.
        </p>

        <div style={{ marginTop: '40px' }}>
          <button
            onClick={() => void loadLesson(1)}
            style={{
              background: 'var(--color-success)',
              color: '#0d1117',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 22px',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Begin Lesson 1: Your first dbt model ›
          </button>
        </div>

        <Footer />
      </article>
    </div>
  )
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: '64px',
        paddingTop: '20px',
        borderTop: '1px solid var(--color-border-subtle)',
        textAlign: 'center' as const,
        fontFamily: 'IBM Plex Sans, sans-serif',
        fontSize: '0.8125rem',
        color: 'var(--color-text-muted)',
      }}
    >
      <div>
        Built by Bruno Lima
        {' · '}
        <FooterLink href="https://github.com/bruno-szdl/dbt-quest">GitHub</FooterLink>
        {' · '}
        <FooterLink href="https://www.linkedin.com/in/brunoszdl">LinkedIn</FooterLink>
      </div>
      <div style={{ marginTop: '6px', fontSize: '0.75rem' }}>
        Open-source · Issues and PRs welcome
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '1px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--color-accent-orange)'
        e.currentTarget.style.borderBottomColor = 'var(--color-accent-orange-dim)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--color-text-muted)'
        e.currentTarget.style.borderBottomColor = 'var(--color-border)'
      }}
    >
      {children}
    </a>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '36px 0 14px',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--color-border-subtle)',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--color-text)',
        letterSpacing: '-0.005em',
      }}
    >
      {children}
    </h2>
  )
}

function Aside({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--color-accent-bg)',
        border: '1px solid var(--color-accent-orange-dim)',
        borderRadius: '6px',
        padding: '12px 16px',
        margin: '20px 0',
      }}
    >
      <div
        style={{
          color: 'var(--color-accent-orange)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.6875rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          marginBottom: '6px',
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

function DagDiagram() {
  const nodes: { id: string; label: string; layer: string; x: number; y: number }[] = [
    { id: 'raw_customers', label: 'raw.customers', layer: 'source', x: 0, y: 0 },
    { id: 'raw_orders', label: 'raw.orders', layer: 'source', x: 0, y: 1 },
    { id: 'stg_customers', label: 'stg_customers', layer: 'staging', x: 1, y: 0 },
    { id: 'stg_orders', label: 'stg_orders', layer: 'staging', x: 1, y: 1 },
    { id: 'int_orders_joined', label: 'int_orders_joined', layer: 'intermediate', x: 2, y: 0.5 },
    { id: 'fct_revenue', label: 'fct_revenue', layer: 'mart', x: 3, y: 0.5 },
  ]
  const edges: [string, string][] = [
    ['raw_customers', 'stg_customers'],
    ['raw_orders', 'stg_orders'],
    ['stg_customers', 'int_orders_joined'],
    ['stg_orders', 'int_orders_joined'],
    ['int_orders_joined', 'fct_revenue'],
  ]
  const colWidth = 150
  const rowHeight = 60
  const nodeW = 130
  const nodeH = 34
  const padX = 12
  const padY = 18
  const W = colWidth * 4 + padX * 2 - (colWidth - nodeW)
  const H = rowHeight * 2 + padY * 2

  const layerColor: Record<string, string> = {
    source: 'var(--color-text-muted)',
    staging: 'var(--color-accent-orange)',
    intermediate: 'var(--color-warning)',
    mart: 'var(--color-success)',
  }

  const pos = (n: typeof nodes[number]) => ({
    cx: padX + n.x * colWidth + nodeW / 2,
    cy: padY + n.y * rowHeight + nodeH / 2,
  })

  return (
    <div
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        background: 'var(--color-surface)',
        padding: '12px',
        overflowX: 'auto' as const,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill="var(--color-text-muted)" />
          </marker>
        </defs>
        {edges.map(([from, to]) => {
          const f = nodes.find((n) => n.id === from)!
          const t = nodes.find((n) => n.id === to)!
          const a = pos(f)
          const b = pos(t)
          const x1 = a.cx + nodeW / 2
          const x2 = b.cx - nodeW / 2 - 4
          return (
            <line
              key={`${from}-${to}`}
              x1={x1}
              y1={a.cy}
              x2={x2}
              y2={b.cy}
              stroke="var(--color-text-muted)"
              strokeWidth="1.2"
              markerEnd="url(#arrow)"
              opacity="0.6"
            />
          )
        })}
        {nodes.map((n) => {
          const p = pos(n)
          return (
            <g key={n.id} transform={`translate(${p.cx - nodeW / 2}, ${p.cy - nodeH / 2})`}>
              <rect
                width={nodeW}
                height={nodeH}
                rx={5}
                fill="var(--color-base)"
                stroke={layerColor[n.layer]}
                strokeWidth="1.4"
              />
              <text
                x={nodeW / 2}
                y={nodeH / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-text)"
              >
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
        <LegendDot color={layerColor.source} label="source" />
        <LegendDot color={layerColor.staging} label="staging" />
        <LegendDot color={layerColor.intermediate} label="intermediate" />
        <LegendDot color={layerColor.mart} label="mart" />
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '3px', border: `1.5px solid ${color}`, display: 'inline-block' }} />
      {label}
    </span>
  )
}
