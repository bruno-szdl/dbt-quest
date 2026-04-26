import { useCallback, useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Editor from './components/Editor'
import LevelPanel from './components/LevelPanel'
import FileExplorer from './components/FileExplorer'
import DatabaseExplorer from './components/DatabaseExplorer'
import BottomPanel from './components/BottomPanel'
import LevelIntroModal from './components/LevelIntroModal'
import LevelCompleteModal from './components/LevelCompleteModal'
import LevelQuizModal from './components/LevelQuizModal'
import CourseCompleteModal from './components/CourseCompleteModal'
import WelcomeModal from './components/WelcomeModal'
import { useGameStore } from './store/gameStore'
import { useIsMobile } from './hooks/useIsMobile'
import MobileLayout from './components/MobileLayout'

export default function App() {
  const loadLevel = useGameStore((s) => s.loadLevel)
  const initializedRef = useRef(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const resumeId = useGameStore.getState().currentLevelId || 1
    loadLevel(resumeId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [sidebarWidth, setSidebarWidth] = useState(220)
  const [rightPanelWidth, setRightPanelWidth] = useState(300)
  const draggingSidebar = useRef(false)
  const draggingRight = useRef(false)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const mainColumnRef = useRef<HTMLDivElement>(null)

  const onSidebarHandleDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingSidebar.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const onRightHandleDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingRight.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return
      const rect = workspaceRef.current.getBoundingClientRect()
      if (draggingSidebar.current) {
        const next = e.clientX - rect.left
        setSidebarWidth(Math.max(160, Math.min(380, next)))
      }
      if (draggingRight.current) {
        const next = rect.right - e.clientX
        setRightPanelWidth(Math.max(220, Math.min(520, next)))
      }
    }
    const onUp = () => {
      if (draggingSidebar.current || draggingRight.current) {
        draggingSidebar.current = false
        draggingRight.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
        <Header />
        <div className="flex-1 overflow-hidden">
          <MobileLayout />
        </div>
        <LevelIntroModal />
        <LevelCompleteModal />
        <LevelQuizModal />
        <CourseCompleteModal />
        <WelcomeModal />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-base)' }}>
      <Header />

      <div ref={workspaceRef} className="flex-1 flex overflow-hidden">
        {/* ── Left sidebar: file explorer + database explorer ──────────────── */}
        <aside
          className="flex flex-col shrink-0 overflow-hidden"
          style={{ width: sidebarWidth, minWidth: '160px', background: 'var(--color-base)', borderRight: '1px solid var(--color-border)' }}
        >
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden min-h-0">
              <FileExplorer />
            </div>
            <DatabaseExplorer />
          </div>
        </aside>

        {/* Sidebar ↔ main handle */}
        <div
          className="shrink-0 cursor-col-resize"
          style={{ width: '4px', background: 'var(--color-border)' }}
          onMouseDown={onSidebarHandleDown}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-muted)' }}
          onMouseLeave={(e) => { if (!draggingSidebar.current) e.currentTarget.style.background = 'var(--color-border)' }}
        />

        {/* ── Main column: editor + bottom drawer ───────────────────────────── */}
        <div
          ref={mainColumnRef}
          className="flex-1 flex flex-col overflow-hidden"
          style={{ minWidth: 0 }}
        >
          <div className="flex-1 overflow-hidden">
            <Editor />
          </div>
          <BottomPanel containerRef={mainColumnRef} />
        </div>

        {/* Main ↔ right panel handle */}
        <div
          className="shrink-0 cursor-col-resize"
          style={{ width: '4px', background: 'var(--color-border)' }}
          onMouseDown={onRightHandleDown}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-muted)' }}
          onMouseLeave={(e) => { if (!draggingRight.current) e.currentTarget.style.background = 'var(--color-border)' }}
        />

        {/* ── Right panel: level description + progress ─────────────────────── */}
        <aside
          className="flex flex-col shrink-0 overflow-hidden"
          style={{ width: rightPanelWidth, minWidth: '220px', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
        >
          <LevelPanel />
        </aside>
      </div>

      <LevelIntroModal />
      <LevelCompleteModal />
      <LevelQuizModal />
      <CourseCompleteModal />
      <WelcomeModal />
    </div>
  )
}
