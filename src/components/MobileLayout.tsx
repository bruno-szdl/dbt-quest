import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '../store/gameStore'
import { getLessonById } from '../lessons'
import { ALL_PANELS } from '../engine/types'
import LessonPanel from './LessonPanel'
import FileExplorer from './FileExplorer'
import DatabaseExplorer from './DatabaseExplorer'
import Editor from './Editor'
import TerminalPanel from './TerminalPanel'
import ResultsPanel from './ResultsPanel'
import DagPanel from './DagPanel'

type MobileTab = 'lesson' | 'files' | 'editor' | 'console' | 'lineage'

const TAB_IDS: MobileTab[] = ['lesson', 'files', 'editor', 'console', 'lineage']

export default function MobileLayout() {
  const { t } = useTranslation()
  const ALL_TABS: { id: MobileTab; label: string }[] = TAB_IDS.map((id) => ({
    id,
    label: t(`mobile.tabs.${id}`),
  }))
  const [tab, setTab] = useState<MobileTab>('lesson')
  const [consoleSub, setConsoleSub] = useState<'commands' | 'results'>('commands')
  const currentLessonId = useGameStore((s) => s.currentLessonId)
  const lessonPanels = getLessonById(currentLessonId)?.panels ?? ALL_PANELS
  const seenFiles = lessonPanels.includes('files')
  const seenWarehouse = lessonPanels.includes('warehouse')
  const seenLineage = lessonPanels.includes('lineage')

  // The mobile "Files" tab also contains the Database explorer, so we keep it
  // visible whenever either panel is unlocked for this lesson.
  const showFilesTab = seenFiles || seenWarehouse
  const showLineageTab = seenLineage

  const tabs = ALL_TABS.filter((t) => {
    if (t.id === 'files') return showFilesTab
    if (t.id === 'lineage') return showLineageTab
    return true
  })

  // If the user previously selected a tab that's now hidden (e.g. they were
  // on Lineage and switched back to lesson 1), fall back to Lesson during
  // render rather than via an effect.
  const activeTab: MobileTab = tabs.some((t) => t.id === tab) ? tab : 'lesson'

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--color-base)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="flex-1 overflow-hidden">
        {activeTab === 'lesson' && (
          <div className="h-full overflow-hidden">
            <LessonPanel />
          </div>
        )}
        {activeTab === 'files' && (
          <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--color-base)' }}>
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              {seenFiles && (
                <div className="flex-1 overflow-hidden min-h-0">
                  <FileExplorer />
                </div>
              )}
              {seenWarehouse && <DatabaseExplorer />}
            </div>
          </div>
        )}
        {activeTab === 'editor' && (
          <div className="h-full flex flex-col overflow-hidden">
            <Editor />
          </div>
        )}
        {activeTab === 'console' && (
          <div className="h-full flex flex-col overflow-hidden">
            <ConsoleSubTabs sub={consoleSub} setSub={setConsoleSub} />
          </div>
        )}
        {activeTab === 'lineage' && (
          <div className="h-full flex flex-col overflow-hidden">
            <LineageView />
          </div>
        )}
      </div>

      <nav
        className="flex shrink-0"
        role="tablist"
        aria-label={t('mobile.sectionsAria')}
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabs.map((t) => {
          const active = t.id === activeTab
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={active}
              aria-label={t.label}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                borderTop: active ? '2px solid var(--color-accent-orange)' : '2px solid transparent',
                color: active ? 'var(--color-accent-orange)' : 'var(--color-text-muted)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.625rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '10px 4px 12px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function ConsoleSubTabs({
  sub,
  setSub,
}: {
  sub: 'commands' | 'results'
  setSub: (s: 'commands' | 'results') => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <SubTabBtn label={t('workspace.commands')} active={sub === 'commands'} onClick={() => setSub('commands')} />
        <SubTabBtn label={t('workspace.results')} active={sub === 'results'} onClick={() => setSub('results')} />
      </div>
      <div className="flex-1 overflow-hidden">
        {sub === 'commands' ? <TerminalPanel embedded /> : <ResultsPanel />}
      </div>
    </div>
  )
}

function SubTabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--color-accent-orange)' : '2px solid transparent',
        color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.6875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '10px 8px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function LineageView() {
  const currentLessonId = useGameStore((s) => s.currentLessonId)
  const lesson = getLessonById(currentLessonId)
  return <DagPanel embedded goalShape={lesson?.goal?.dagShape} />
}
