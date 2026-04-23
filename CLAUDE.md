# Learn dbt Branching

Jogo web, em inglês, interativo que ensina dbt (data build tool) através de níveis progressivos, inspirado em Learn Git Branching. Cada nível apresenta um objetivo visual do DAG que o jogador precisa alcançar editando arquivos e rodando comandos dbt fake.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** para estilo
- **Monaco Editor** (`@monaco-editor/react`) para edição de arquivos
- **React Flow** (`reactflow`) para visualização do DAG
- **xterm.js** (`@xterm/xterm`) para o terminal fake
- **html-to-image** para gerar PNG dos badges compartilháveis
- **Zustand** para estado global (mais simples que Redux, sem boilerplate)
- **localStorage** para progresso — sem backend, sem login
- Deploy: Vercel

## Princípios de arquitetura

1. **Zero backend.** Tudo roda no browser. Nada de Supabase, Firebase, nada.
2. **Níveis são dados, não código.** Cada nível é um objeto JSON/TS com `initialFiles`, `goal`, `validate()`. Adicionar nível = adicionar entrada no array. Nunca mexer na engine pra adicionar nível novo.
3. **Engine simula, não executa.** Não rodamos SQL de verdade. `dbt run` parseia os arquivos do jogador, constrói o DAG, roda validações estáticas e imprime output fake realista.
4. **Estado central imutável.** Um `useGameStore` (Zustand) com `files`, `ranModels`, `testResults`, `currentLevel`. Todo componente lê daqui.
5. **Validação declarativa.** `validate(state) => { passed: boolean, hints: string[] }`. Nunca lógica espalhada.

## Layout da tela (desktop-first, min 1280px)

```
┌────────────────────────────────────────────────────┐
│ Header: logo | nível atual | progresso | menu      │
├──────────────────────┬─────────────────────────────┤
│                      │                             │
│  Editor (Monaco)     │   DAG (React Flow)          │
│  + tabs de arquivo   │   + objetivo fantasma       │
│                      │   no fundo                  │
│                      │                             │
├──────────────────────┤                             │
│  Terminal (xterm)    │                             │
│                      │                             │
└──────────────────────┴─────────────────────────────┘
```

Mobile: fora de escopo pro MVP. Mostrar tela "abra no desktop".

## Estrutura de pastas

```
src/
  engine/          # core do jogo (file system, command parser, validator, dag builder)
  levels/          # um arquivo .ts por nível, exportando Level
  components/      # Editor, Terminal, DAG, Header, LevelCompleteModal
  store/           # zustand store
  share/           # geração do badge PNG
  App.tsx
```

## Convenções

- O jogo deve ser todo em inglês
- TypeScript strict. Tipos explícitos em fronteiras de módulo.
- Componentes em PascalCase, hooks em `useX`, tudo mais camelCase.
- Sem CSS-in-JS. Só Tailwind.
- Paleta: fundo `#0d1117`, texto `#e6edf3`, accent dbt laranja `#ff694a`, verde success `#3fb950`, vermelho fail `#f85149`. Inspirada em dbt Cloud dark mode.