import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme before first render to prevent flash
const saved = localStorage.getItem('dbt-quest-theme')
const prefersDark = !window.matchMedia('(prefers-color-scheme: light)').matches
const theme = saved ?? (prefersDark ? 'dark' : 'light')
if (theme === 'light') document.documentElement.dataset.theme = 'light'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
