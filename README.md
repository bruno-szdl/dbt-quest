# dbt Quest

An interactive browser-based game that teaches [dbt (data build tool)](https://www.getdbt.com/) through progressive levels — inspired by [Learn Git Branching](https://learngitbranching.js.org/).

Each level presents a target DAG that you need to reach by editing dbt files and running commands in a simulated terminal. No backend, no login — everything runs in the browser.

## Features

- Visual DAG editor powered by React Flow
- Monaco-based code editor with dbt SQL/YAML support
- Fake-but-realistic dbt terminal (xterm.js)
- Progressive levels covering core dbt concepts
- Shareable completion badges
- Progress saved in localStorage

## Tech Stack

- Vite + React 18 + TypeScript
- Tailwind CSS
- Monaco Editor (`@monaco-editor/react`)
- React Flow (`reactflow`)
- xterm.js (`@xterm/xterm`)
- Zustand (state management)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
```

Output goes to `dist/` — ready to deploy on Vercel, Netlify, or any static host.

## Deploying to Vercel

Import the repo on [vercel.com](https://vercel.com). Vercel auto-detects Vite:
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

No extra configuration needed.
