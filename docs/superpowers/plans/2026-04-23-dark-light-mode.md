# Dark/Light Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark/light mode toggle to the header, backed by CSS variables, that persists to localStorage and respects `prefers-color-scheme` on first visit.

**Architecture:** CSS variables in `index.css` are the single source of truth for both palettes. A `[data-theme="light"]` block overrides the dark defaults. All hardcoded hex strings in component inline styles are replaced with `var(--color-*)` references. A `theme` field in the Zustand store drives the `data-theme` attribute on `<html>`. Monaco Editor receives a `theme` prop; React Flow components read from the store for props that can't use CSS vars.

**Tech Stack:** Tailwind CSS v4 (CSS variables), Zustand, `@monaco-editor/react`

---

## Color variable mapping

Use this table throughout all migration tasks. Every hardcoded hex value maps to a CSS variable.

| Hex | CSS variable |
|-----|-------------|
| `#0d1117` | `var(--color-base)` |
| `#161b22` | `var(--color-surface)` |
| `#0a0e14` | `var(--color-terminal-bg)` |
| `#080c12` | `var(--color-dag-bg)` |
| `#1c2128` | `var(--color-hint-bg)` |
| `#21262d` | `var(--color-border-subtle)` |
| `#30363d` | `var(--color-border)` |
| `#484f58` | `var(--color-muted)` |
| `#6e7681` | `var(--color-muted)` |
| `#7d8590` | `var(--color-text-muted)` |
| `#8b949e` | `var(--color-text-muted)` |
| `#c9d1d9` | `var(--color-text-secondary)` |
| `#e6edf3` | `var(--color-text)` |
| `#ff694a` | `var(--color-accent-orange)` |
| `#ff694a1a` | `var(--color-accent-bg)` |
| `#ff694a12` | `var(--color-accent-bg)` |
| `#ff694a33` | `var(--color-accent-orange-dim)` |
| `#3fb950` | `var(--color-success)` |
| `#3fb95015` | `var(--color-success-bg)` |
| `#3fb95030` | `var(--color-success-border)` |
| `#f85149` | `var(--color-fail)` |
| `#d29922` | `var(--color-warning)` |

---

### Task 1: Extend CSS variables — add light palette and new dark tokens

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace the `@theme` block and add the light theme override in `src/index.css`**

Replace everything from `@theme {` to the closing `}` with the expanded version, then add the `[data-theme="light"]` block immediately after it:

```css
@theme {
  --color-base: #0d1117;
  --color-surface: #161b22;
  --color-terminal-bg: #0a0e14;
  --color-dag-bg: #080c12;
  --color-hint-bg: #1c2128;
  --color-border: #30363d;
  --color-border-subtle: #21262d;
  --color-muted: #484f58;
  --color-text: #e6edf3;
  --color-text-secondary: #c9d1d9;
  --color-text-muted: #7d8590;
  --color-accent-orange: #ff694a;
  --color-accent-orange-dim: #ff694a33;
  --color-accent-bg: #ff694a1a;
  --color-success: #3fb950;
  --color-success-bg: #3fb95015;
  --color-success-border: #3fb95030;
  --color-fail: #f85149;
  --color-warning: #d29922;

  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

[data-theme="light"] {
  --color-base: #ffffff;
  --color-surface: #f6f8fa;
  --color-terminal-bg: #f0f2f4;
  --color-dag-bg: #f6f8fa;
  --color-hint-bg: #f6f8fa;
  --color-border: #d0d7de;
  --color-border-subtle: #eaeef2;
  --color-muted: #8c959f;
  --color-text: #1f2328;
  --color-text-secondary: #3d444d;
  --color-text-muted: #636c76;
  --color-accent-orange: #e05a3a;
  --color-accent-orange-dim: #e05a3a33;
  --color-accent-bg: #e05a3a12;
  --color-success: #1a7f37;
  --color-success-bg: #1a7f3715;
  --color-success-border: #1a7f3730;
  --color-fail: #cf222e;
  --color-warning: #9a6700;
}
```

Also update the `html, body, #root` block below it to use variables:

```css
html,
body,
#root {
  height: 100%;
  margin: 0;
  background-color: var(--color-base);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add light theme CSS variables"
```

---

### Task 2: Add theme state to the store and initialize it on app load

**Files:**
- Modify: `src/store/gameStore.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Add `theme` and `toggleTheme` to `gameStore.ts`**

Add the type and initial value to the `StoreState` interface and the `create` call. Find the `StoreState` interface block and add:

```typescript
// in the StoreState interface, after bottomCollapsed:
  theme: 'dark' | 'light'
  toggleTheme: () => void
```

In the `create<StoreState>((set, get) => ({` object, after `bottomCollapsed: false,` add:

```typescript
  theme: 'dark',

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next === 'light' ? 'light' : ''
    localStorage.setItem('dbt-quest-theme', next)
    set({ theme: next })
  },
```

- [ ] **Step 2: Initialize theme before first render in `src/main.tsx`**

Replace the contents of `src/main.tsx` with:

```typescript
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
```

- [ ] **Step 3: Sync the store's initial `theme` value with localStorage in `main.tsx`**

The store initializes with `theme: 'dark'` hardcoded. We need to set it from localStorage at startup. Update the store's initial `theme` value to read from localStorage:

In `gameStore.ts`, change the initial `theme` value from:
```typescript
  theme: 'dark',
```
to:
```typescript
  theme: (localStorage.getItem('dbt-quest-theme') as 'dark' | 'light') ?? 'dark',
```

- [ ] **Step 4: Commit**

```bash
git add src/store/gameStore.ts src/main.tsx
git commit -m "feat: add theme toggle state and localStorage persistence"
```

---

### Task 3: Add toggle button to Header and migrate Header.tsx colors

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Add `ThemeToggleButton` component to `Header.tsx`**

Add this function at the bottom of `Header.tsx` (before the closing of the file):

```typescript
function ThemeToggleButton() {
  const theme = useGameStore((s) => s.theme)
  const toggleTheme = useGameStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '28px',
        height: '28px',
        background: 'transparent',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-muted)'
        e.currentTarget.style.color = 'var(--color-text)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-text-muted)'
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.061-1.06a.75.75 0 0 1 0-1.061Zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM16 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm10.657-5.657a.75.75 0 0 1 0 1.061l-1.061 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 0 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0Z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Z" />
    </svg>
  )
}
```

- [ ] **Step 2: Add `ThemeToggleButton` to the header's right side**

In the `Header` component, find the right-side flex container:

```tsx
<div className="flex items-center gap-3">
  <ActionButtons />
  <div className="w-px h-5 bg-[#30363d]" />
  <ProgressBar />
  <HelpButton />
</div>
```

Replace it with:

```tsx
<div className="flex items-center gap-3">
  <ActionButtons />
  <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />
  <ProgressBar />
  <ThemeToggleButton />
  <HelpButton />
</div>
```

- [ ] **Step 3: Migrate hardcoded hex colors in `Header.tsx`**

Apply the color mapping table. Key replacements in `Header.tsx`:

In the `<header>` element:
```tsx
// before:
style={{ height: '52px', background: '#161b22' }}
// after:
style={{ height: '52px', background: 'var(--color-surface)' }}
```

In `LevelSelector` dropdown button and dropdown panel:
- `background: '#ffffff0a'` → `background: 'var(--color-muted)22'` (keep hover subtle)
- `background: '#161b22'` → `background: 'var(--color-surface)'`
- `border: '1px solid #30363d'` → `border: '1px solid var(--color-border)'`
- `boxShadow: '0 8px 24px rgba(0,0,0,0.6)'` → keep as-is
- `color: '#7d8590'` → `color: 'var(--color-text-muted)'`
- `color: '#484f58'` → `color: 'var(--color-muted)'`
- `color: '#ff694a'` → `color: 'var(--color-accent-orange)'`
- `color: '#e6edf3'` → `color: 'var(--color-text)'`
- `background: '#ff694a1a'` → `background: 'var(--color-accent-bg)'`
- `border: '1px solid #ff694a33'` → `border: '1px solid var(--color-accent-orange-dim)'`
- `background: '#ff694a12'` (selected row) → `background: 'var(--color-accent-bg)'`
- `color: '#3fb950'` → `color: 'var(--color-success)'`
- Module separator divider `background: '#21262d'` → `background: 'var(--color-border-subtle)'`

In `ActionButton`:
- `border: '1px solid #30363d'` → `border: '1px solid var(--color-border)'`
- `color: '#e6edf3'` → `color: 'var(--color-text)'`
- `background: '#ff694a'` / `border: '1px solid #ff694a'` → keep `var(--color-accent-orange)` for both
- `color: '#0d1117'` (text on primary button) → `color: 'var(--color-base)'`
- `borderColor: '#484f58'` (hover) → `borderColor: 'var(--color-muted)'`

In `ProgressBar`:
- `background: '#3fb950'` → `background: 'var(--color-success)'`
- `border: '1px solid #3fb95088'` → `border: '1px solid var(--color-success)'`
- `background: '#21262d'` → `background: 'var(--color-border-subtle)'`
- `border: '1px solid #30363d'` → `border: '1px solid var(--color-border)'`
- `color: '#484f58'` → `color: 'var(--color-muted)'`

In `HelpButton`:
- `border: '1px solid #30363d'` → `border: '1px solid var(--color-border)'`
- `color: '#7d8590'` → `color: 'var(--color-text-muted)'`
- `borderColor: '#484f58'` → `borderColor: 'var(--color-muted)'`
- `color: '#e6edf3'` → `color: 'var(--color-text)'`

In `DbtLogo`:
- `fill="#ff694a"` attrs → keep as-is (SVG path fills using accent color, already themed via CSS var indirectly... but SVG fill attributes don't read CSS vars). Replace `fill="#ff694a"` with `fill="var(--color-accent-orange)"` — note: SVG `fill` attributes support `currentColor` but not CSS vars directly. Instead, wrap the SVG or use `fill="currentColor"` with `color: var(--color-accent-orange)` on the parent. For simplicity, add a wrapper `<span style={{ color: 'var(--color-accent-orange)' }}>` and change all `fill="#ff694a"` to `fill="currentColor"` in `DbtLogo`.

In `LevelSelector` title in header:
- `color: '#ff694a'` → `color: 'var(--color-accent-orange)'`
- `color: '#e6edf3'` → `color: 'var(--color-text)'`
- `color: '#484f58'` → `color: 'var(--color-muted)'`

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add theme toggle button; migrate Header colors to CSS vars"
```

---

### Task 4: Migrate App.tsx, Editor.tsx, and TerminalPanel.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Editor.tsx`
- Modify: `src/components/TerminalPanel.tsx`

- [ ] **Step 1: Migrate `App.tsx`**

In `App.tsx`, the hardcoded colors are:
```tsx
// outer div:
className="flex flex-col h-full bg-[#0d1117] overflow-hidden"
// change to:
className="flex flex-col h-full overflow-hidden"
style={{ background: 'var(--color-base)' }}

// aside (left sidebar):
style={{ width: sidebarWidth, minWidth: '220px', background: '#0d1117' }}
// change to:
style={{ width: sidebarWidth, minWidth: '220px', background: 'var(--color-base)' }}

// sidebar border div and className:
className="flex flex-col shrink-0 border-r border-[#30363d] overflow-hidden"
// change to (border via Tailwind won't update with CSS var, use style):
className="flex flex-col shrink-0 overflow-hidden"
style={{ width: sidebarWidth, minWidth: '220px', background: 'var(--color-base)', borderRight: '1px solid var(--color-border)' }}

// resize handle div (border-r):
style={{ width: '4px', background: '#30363d' }}
// change to:
style={{ width: '4px', background: 'var(--color-border)' }}
// hover: background: '#484f58' → background: 'var(--color-muted)'

// border-t on BottomPanel and border-r in aside — wherever Tailwind classes like
// border-[#30363d] appear, convert to inline style: borderTop/borderRight: '1px solid var(--color-border)'
```

Also remove `border-r border-[#30363d]` from aside className and replace with `style` prop with `borderRight: '1px solid var(--color-border)'`.

- [ ] **Step 2: Migrate `Editor.tsx`**

Key changes:

a) Outer container:
```tsx
// before:
style={{ background: '#0d1117' }}
// after:
style={{ background: 'var(--color-base)' }}
```

b) Tabs header bar:
```tsx
// before:
style={{ background: '#161b22', minHeight: '36px' }}
// after:
style={{ background: 'var(--color-surface)', minHeight: '36px' }}
```

c) Tab buttons:
```tsx
// before:
background: isActive ? '#0d1117' : 'transparent',
borderTop: isActive ? '1px solid #ff694a' : '1px solid transparent',
color: isActive ? '#e6edf3' : '#7d8590',
// after:
background: isActive ? 'var(--color-base)' : 'transparent',
borderTop: isActive ? '1px solid var(--color-accent-orange)' : '1px solid transparent',
color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
```

Tab border-r class `border-[#30363d]` → add `borderRight: '1px solid var(--color-border)'` to the `style` prop and remove the Tailwind class.

d) Monaco Editor — add theme prop that reads from store:
```tsx
// Add import at the top:
import { useGameStore } from '../store/gameStore'

// In Editor():
const theme = useGameStore((s) => s.theme)

// Change the MonacoEditor element:
<MonacoEditor
  key={activeFile}
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
```

Note: Monaco must re-mount when the key changes. Because `key={activeFile}`, it already remounts when switching files. To react to theme changes without losing content, also add `theme` to the Monaco key: `key={`${activeFile}-${theme}`}`. This causes a brief remount on theme toggle but avoids the complexity of calling `editor.updateOptions`.

e) Empty state icon and text:
```tsx
// EditorIcon color style:
style={{ color: '#484f58' }}  →  style={{ color: 'var(--color-muted)' }}

// "No file open" text:
color: '#7d8590'  →  color: 'var(--color-text-muted)'
```

- [ ] **Step 3: Migrate `TerminalPanel.tsx`**

Key changes:

a) Outer div background:
```tsx
style={{ background: '#0a0e14' }}  →  style={{ background: 'var(--color-terminal-bg)' }}
```

b) Internal title bar (non-embedded):
```tsx
style={{ height: '36px', background: '#161b22' }}  →  style={{ height: '36px', background: 'var(--color-surface)' }}
// border-b border-[#30363d] class → add borderBottom: '1px solid var(--color-border)' to style, remove Tailwind class
color: '#484f58'  →  color: 'var(--color-muted)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'
```

c) Traffic light dots (keep as-is — they're decorative and use semantic colors `#f85149`, `#e3b341`, `#3fb950`).

d) Terminal output text colors in the `COLOR` map:
```typescript
// The COLOR map uses semantic colors (green/red/yellow/gray) — keep the semantic hex values.
// They're design-consistent and intentional for terminal output coloring.
// Only the default (uncolored) text color changes:
// In lineColor():
return line.color ? COLOR[line.color] : '#e6edf3'
// change to:
return line.color ? COLOR[line.color] : 'var(--color-text)'
```

e) Input row:
```tsx
style={{ height: '36px', background: '#0d1117' }}  →  style={{ height: '36px', background: 'var(--color-base)' }}
// border-t border-[#30363d] class → add borderTop: '1px solid var(--color-border)', remove Tailwind class
```

f) Prompt text:
```tsx
color: '#ff694a'  →  color: 'var(--color-accent-orange)'
```

g) Input field:
```tsx
color: '#e6edf3'  →  color: 'var(--color-text)'
caretColor: '#e6edf3'  →  caretColor: 'var(--color-text)'
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/Editor.tsx src/components/TerminalPanel.tsx
git commit -m "feat: migrate App, Editor, and TerminalPanel colors to CSS vars"
```

---

### Task 5: Migrate BottomPanel.tsx, LevelPanel.tsx, and LevelIntroModal.tsx

**Files:**
- Modify: `src/components/BottomPanel.tsx`
- Modify: `src/components/LevelPanel.tsx`
- Modify: `src/components/LevelIntroModal.tsx`

- [ ] **Step 1: Migrate `BottomPanel.tsx`**

Key changes (apply color mapping table):

```tsx
// Outer container:
border-t border-[#30363d]  →  remove Tailwind class; add borderTop: '1px solid var(--color-border)'
background: '#0d1117'  →  background: 'var(--color-base)'

// Resize handle hover:
background: '#484f58'  →  background: 'var(--color-muted)'

// Tab bar:
background: '#161b22'  →  background: 'var(--color-surface)'
border-b border-[#30363d]  →  remove; add borderBottom: '1px solid var(--color-border)'

// TabButton active:
borderTop: active ? '2px solid #ff694a' : '2px solid transparent'
  →  borderTop: active ? '2px solid var(--color-accent-orange)' : '2px solid transparent'
borderBottom: active ? '1px solid #0d1117' : 'none'
  →  borderBottom: active ? '1px solid var(--color-base)' : 'none'
color: active ? '#e6edf3' : '#7d8590'
  →  color: active ? 'var(--color-text)' : 'var(--color-text-muted)'
// TabButton icon:
color: active ? '#ff694a' : '#484f58'
  →  color: active ? 'var(--color-accent-orange)' : 'var(--color-muted)'
// TabButton hover:
color: '#e6edf3'  →  color: 'var(--color-text)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'

// CollapseButton hover:
background: '#ffffff0a'  →  background: 'rgba(128,128,128,0.08)'
color: '#e6edf3'  →  color: 'var(--color-text)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'
```

- [ ] **Step 2: Migrate `LevelPanel.tsx`**

Key changes:

```tsx
// Root div:
background: '#161b22'  →  background: 'var(--color-surface)'
border-b border-[#30363d]  →  remove class; add borderBottom: '1px solid var(--color-border)'

// Level-complete banner:
background: '#3fb95015'  →  background: 'var(--color-success-bg)'
borderBottom: '1px solid #3fb95030'  →  borderBottom: '1px solid var(--color-success-border)'
color: '#3fb950'  →  color: 'var(--color-success)'

// "Next Level" button:
background: '#3fb950'  →  background: 'var(--color-success)'
color: '#0d1117'  →  color: 'var(--color-base)'
// hover: background: '#52c962' → keep literal (lightened success; acceptable)

// Dismiss button:
color: '#484f58'  →  color: 'var(--color-muted)'

// Chapter tag:
background: '#ff694a1a'  →  background: 'var(--color-accent-bg)'
border: '1px solid #ff694a33'  →  border: '1px solid var(--color-accent-orange-dim)'
color: '#ff694a'  →  color: 'var(--color-accent-orange)'

// Level title:
color: '#e6edf3'  →  color: 'var(--color-text)'

// Goal description:
color: '#8b949e'  →  color: 'var(--color-text-muted)'

// "Show/Hide instructions" button:
color: '#7d8590'  →  color: 'var(--color-text-muted)'
// hover: color: '#ff694a' → color: 'var(--color-accent-orange)'

// Expanded instructions area:
background: '#0d1117'  →  background: 'var(--color-base)'
border-t border-[#30363d]  →  remove class; add borderTop: '1px solid var(--color-border)'
color: '#c9d1d9'  →  color: 'var(--color-text-secondary)'

// Hint box (revealed):
background: '#1c2128'  →  background: 'var(--color-hint-bg)'
border: '1px solid #d2992230'  →  border: '1px solid color-mix(in srgb, var(--color-warning) 20%, transparent)'
color: '#d29922'  →  color: 'var(--color-warning)'
color: '#8b949e'  →  color: 'var(--color-text-muted)'

// "Show Hint" button:
border: '1px solid #30363d'  →  border: '1px solid var(--color-border)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'
// hover: borderColor: '#484f58' → borderColor: 'var(--color-muted)'
//        color: '#e6edf3' → color: 'var(--color-text)'

// ProgressChecklist:
background: '#0d1117'  →  background: 'var(--color-base)'
border-t border-[#30363d]  →  remove class; add borderTop: '1px solid var(--color-border)'
color: '#484f58'  →  color: 'var(--color-muted)'
color: '#c9d1d9'  →  color: 'var(--color-text-secondary)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'
color: '#3fb950'  →  color: 'var(--color-success)'

// CheckBox:
border color done+highlight: '#3fb950' → 'var(--color-success)'
border color done: '#484f58' → 'var(--color-muted)'
border color undone: '#30363d' → 'var(--color-border)'
fill done+highlight: '#3fb950' → 'var(--color-success)'
checkmark stroke highlight: '#0d1117' → 'var(--color-base)'
checkmark stroke regular: '#7d8590' → 'var(--color-text-muted)'
```

- [ ] **Step 3: Migrate `LevelIntroModal.tsx`**

Key changes:

```tsx
// Backdrop:
background: 'rgba(0, 0, 0, 0.72)'  →  keep as-is (overlay, fine for both modes)

// Modal card:
background: '#161b22'  →  background: 'var(--color-surface)'
border: '1px solid #30363d'  →  border: '1px solid var(--color-border)'
boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'  →  keep as-is

// Header separator:
borderBottom: '1px solid #21262d'  →  borderBottom: '1px solid var(--color-border-subtle)'

// Close button:
color: '#7d8590'  →  color: 'var(--color-text-muted)'
// hover: background: '#ffffff0a' → background: 'rgba(128,128,128,0.08)'
//        color: '#e6edf3' → color: 'var(--color-text)'

// Level badge:
background: '#ff694a1a'  →  background: 'var(--color-accent-bg)'
border: '1px solid #ff694a33'  →  border: '1px solid var(--color-accent-orange-dim)'
color: '#ff694a'  →  color: 'var(--color-accent-orange)'

// Module label:
color: '#7d8590'  →  color: 'var(--color-text-muted)'

// Title h2:
color: '#e6edf3'  →  color: 'var(--color-text)'

// Description text:
color: '#c9d1d9'  →  color: 'var(--color-text-secondary)'

// Goal box:
background: '#0d1117'  →  background: 'var(--color-base)'
border: '1px solid #30363d'  →  border: '1px solid var(--color-border)'
"Goal" label color: '#3fb950'  →  color: 'var(--color-success)'
goal text: '#c9d1d9'  →  color: 'var(--color-text-secondary)'

// Footer separator:
borderTop: '1px solid #21262d'  →  borderTop: '1px solid var(--color-border-subtle)'

// "esc" hint:
color: '#484f58'  →  color: 'var(--color-muted)'

// "Let's go" button:
background: '#ff694a'  →  background: 'var(--color-accent-orange)'
border: '1px solid #ff694a'  →  border: '1px solid var(--color-accent-orange)'
color: '#0d1117'  →  color: 'var(--color-base)'
// hover: background: '#ff7d61' → keep literal (lighten accent, acceptable)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomPanel.tsx src/components/LevelPanel.tsx src/components/LevelIntroModal.tsx
git commit -m "feat: migrate BottomPanel, LevelPanel, LevelIntroModal colors to CSS vars"
```

---

### Task 6: Migrate ResultsPanel.tsx, FileExplorer.tsx, DagPanel.tsx, DatabaseExplorer.tsx

**Files:**
- Modify: `src/components/ResultsPanel.tsx`
- Modify: `src/components/FileExplorer.tsx`
- Modify: `src/components/DagPanel.tsx`
- Modify: `src/components/DatabaseExplorer.tsx`

- [ ] **Step 1: Migrate `ResultsPanel.tsx`**

Key changes:

```tsx
// Outer div:
background: '#0d1117'  →  background: 'var(--color-base)'

// Header bar:
background: '#0d1117'  →  background: 'var(--color-base)'
border-b border-[#30363d]  →  remove; add borderBottom: '1px solid var(--color-border)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'
color: '#484f58'  →  color: 'var(--color-muted)'
color: '#ff694a'  →  color: 'var(--color-accent-orange)'

// Table header cells:
background: '#161b22'  →  background: 'var(--color-surface)'
borderBottom: '1px solid #30363d'  →  borderBottom: '1px solid var(--color-border)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'

// Alternating row background:
background: ri % 2 === 0 ? 'transparent' : '#161b2260'
  →  background: ri % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--color-surface) 60%, transparent)'

// Cell border and text:
borderBottom: '1px solid #21262d'  →  borderBottom: '1px solid var(--color-border-subtle)'
color: cell === null ... ? '#484f58' : '#e6edf3'
  →  color: cell === null ... ? 'var(--color-muted)' : 'var(--color-text)'

// Empty state:
color: '#484f58'  →  color: 'var(--color-muted)'

// EmptyState text colors:
color: '#7d8590'  →  color: 'var(--color-text-muted)'
color: '#484f58'  →  color: 'var(--color-muted)'

// ResultsIcon stroke:
stroke="#7d8590"  →  stroke="var(--color-text-muted)"
```

- [ ] **Step 2: Migrate `FileExplorer.tsx`**

Key changes:

```tsx
// Root container:
background: '#0d1117'  →  background: 'var(--color-base)'
border-r border-[#30363d]  →  remove; add borderRight: '1px solid var(--color-border)'

// Header bar:
background: '#161b22'  →  background: 'var(--color-surface)'
border-b border-[#30363d]  →  remove; add borderBottom: '1px solid var(--color-border)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'

// New-file button colors:
color: creating ? '#ff694a' : '#484f58'
  →  color: creating ? 'var(--color-accent-orange)' : 'var(--color-muted)'
// hover: color: '#e6edf3' → color: 'var(--color-text)'

// New-file input area:
background: '#0d1117'  →  background: 'var(--color-base)'
border-b border-[#30363d]  →  remove; add borderBottom: '1px solid var(--color-border)'
// Input field:
background: '#161b22'  →  background: 'var(--color-surface)'
border: '1px solid #ff694a55'  →  border: '1px solid color-mix(in srgb, var(--color-accent-orange) 33%, transparent)'
color: '#e6edf3'  →  color: 'var(--color-text)'
// hint text:
color: '#484f58'  →  color: 'var(--color-muted)'

// DirItem button:
color: '#8b949e'  →  color: 'var(--color-text-muted)'
// hover: background: '#ffffff0a' → background: 'rgba(128,128,128,0.08)'

// DirItem "+" icon:
color: '#484f58'  →  color: 'var(--color-muted)'
// hover: color: '#ff694a' → color: 'var(--color-accent-orange)'

// FileItem:
background: isActive ? '#ff694a1a' : 'transparent'
  →  background: isActive ? 'var(--color-accent-bg)' : 'transparent'
borderLeft: `2px solid ${isActive ? '#ff694a' : 'transparent'}`
  →  borderLeft: `2px solid ${isActive ? 'var(--color-accent-orange)' : 'transparent'}`
color: isActive ? '#e6edf3' : '#8b949e'
  →  color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)'
// hover: background: '#ffffff0a' → background: 'rgba(128,128,128,0.08)'

// Delete icon:
color: '#484f58'  →  color: 'var(--color-muted)'
// hover: color: '#f85149' → color: 'var(--color-fail)'

// Empty state text:
color: '#484f58'  →  color: 'var(--color-muted)'

// FolderIcon fill:
fill="#6e7681"  →  fill="var(--color-muted)"

// ChevronIcon:
fill="#484f58"  →  fill="var(--color-muted)"
stroke="#484f58"  →  stroke="var(--color-muted)"
```

- [ ] **Step 3: Migrate `DagPanel.tsx`**

DagPanel has two types of colors: component UI colors (migrated to CSS vars) and React Flow data colors (need the store's theme value for props that don't accept CSS vars).

Add `useGameStore` import if not present. Read `theme` in `DagPanel`:
```tsx
const theme = useGameStore((s) => s.theme)
```
Pass it down to `DagCanvas`:
```tsx
<DagCanvas rfNodes={rfNodes} rfEdges={rfEdges} goalShape={goalShape} theme={theme} />
```

Update `DagCanvasProps`:
```typescript
interface DagCanvasProps {
  rfNodes: Node[]
  rfEdges: Edge[]
  goalShape?: GoalDagShape
  theme: 'dark' | 'light'
}
```

Key changes for CSS-var-able inline styles:

```tsx
// DagPanel outer div:
background: '#080c12'  →  background: 'var(--color-dag-bg)'

// Non-embedded header bar:
background: '#161b22'  →  background: 'var(--color-surface)'
border-b border-[#30363d]  →  remove; add borderBottom: '1px solid var(--color-border)'
color: '#484f58'  →  color: 'var(--color-muted)'
color: '#7d8590'  →  color: 'var(--color-text-muted)'
// "goal" indicator dot: background: '#ff694a' → background: 'var(--color-accent-orange)'

// ModelNode background:
background: '#161b22'  →  background: 'var(--color-surface)'
// (LAYER_COLOR and LAYER_BG are semantic — keep as-is)

// ModelNode label text:
color: '#e6edf3'  →  color: 'var(--color-text)'

// EmptyState:
color: '#7d8590'  →  color: 'var(--color-text-muted)'
color: '#484f58'  →  color: 'var(--color-muted)'
// DagPlaceholderIcon strokes: stroke="#7d8590" → stroke="var(--color-text-muted)"
```

For React Flow components that take color props (not CSS-var-able), use the theme param:

```tsx
// toRfEdges — add theme param:
function toRfEdges(dagEdges: DagEdge[], theme: 'dark' | 'light'): Edge[] {
  const edgeColor = theme === 'dark' ? '#484f58' : '#8c959f'
  return dagEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
    style: { stroke: edgeColor, strokeWidth: 1.5 },
  }))
}
// Call: const rawEdges = toRfEdges(dagEdges, theme)  (pass theme from DagPanel props)

// Background component:
color="#30363d"  →  color={theme === 'dark' ? '#30363d' : '#d0d7de'}

// MiniMap:
style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px' }}
  →  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
maskColor="#0d111766"  →  maskColor={theme === 'dark' ? '#0d111766' : '#ffffff66'}

// Controls:
style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px' }}
  →  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px' }}
```

Update the `useMemo` in `DagPanel` to pass `theme` to `toRfEdges`:
```tsx
const { rfNodes, rfEdges } = useMemo(() => {
  const { nodes: dagNodes, edges: dagEdges } = buildDag(files)
  const rawNodes = toRfNodes(dagNodes, ranModels, testResults)
  const rawEdges = toRfEdges(dagEdges, theme)
  const { nodes, edges } = applyDagreLayout(rawNodes, rawEdges)
  return { rfNodes: nodes, rfEdges: edges }
}, [files, ranModels, testResults, theme])
```

- [ ] **Step 4: Migrate `DatabaseExplorer.tsx`**

Key changes:

```tsx
// Root container:
borderTop: '1px solid #21262d'  →  borderTop: '1px solid var(--color-border-subtle)'
background: '#0d1117'  →  background: 'var(--color-base)'

// Header text:
color: '#7d8590'  →  color: 'var(--color-text-muted)'
count badge: color: '#484f58' → color: 'var(--color-muted)'

// "main" schema label:
color: '#7d8590'  →  color: 'var(--color-text-muted)'

// Table/view name text:
color: '#c9d1d9'  →  color: 'var(--color-text-secondary)'

// Row hover:
background: '#161b22'  →  background: 'var(--color-surface)'

// Empty state text:
color: '#484f58'  →  color: 'var(--color-muted)'

// ChevronIcon fill/stroke: fill="#6e7681" stroke="#6e7681" → fill="var(--color-muted)" stroke="var(--color-muted)"
// SchemaIcon: fill="#6e7681" → fill="var(--color-muted)"
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ResultsPanel.tsx src/components/FileExplorer.tsx src/components/DagPanel.tsx src/components/DatabaseExplorer.tsx
git commit -m "feat: migrate remaining component colors to CSS vars; complete dark/light mode"
```

- [ ] **Step 6: Visual check**

Start the dev server and verify both modes:

```bash
npm run dev
```

1. Default loads in dark mode (or respects `prefers-color-scheme`)
2. Click the sun/moon toggle in the header — app switches to light mode immediately
3. Reload — light mode persists (localStorage)
4. Toggle back to dark — all panels, modals, DAG, results table look correct
5. Open a `.sql` file in Monaco — editor theme switches with the rest of the UI
6. Run a level to completion — progress checklist, success banner, badges all readable in light mode
