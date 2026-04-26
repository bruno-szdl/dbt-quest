import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { safeStorage } from './store/safeStorage.ts'

// Apply saved theme before first render to prevent flash
const saved = safeStorage.getItem('dbt-quest-theme')
const prefersDark = !window.matchMedia('(prefers-color-scheme: light)').matches
const theme = saved ?? (prefersDark ? 'dark' : 'light')
if (theme === 'light') document.documentElement.dataset.theme = 'light'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
