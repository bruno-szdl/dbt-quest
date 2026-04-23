import type { GameState } from './types'

function findModelPath(files: Record<string, string>, name: string): string | undefined {
  return Object.keys(files).find(
    (p) =>
      p.startsWith('models/') &&
      p.endsWith('.sql') &&
      p.split('/').pop()!.replace(/\.sql$/, '') === name,
  )
}

export function hasModel(state: GameState, name: string): boolean {
  return Boolean(findModelPath(state.files, name))
}

export function modelRefs(state: GameState, modelName: string, refName: string): boolean {
  const path = findModelPath(state.files, modelName)
  if (!path) return false
  const content = state.files[path] ?? ''
  const re = /\{\{\s*ref\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g
  let m
  while ((m = re.exec(content))) if (m[1] === refName) return true
  return false
}

export function modelRan(state: GameState, name: string): boolean {
  return state.ranModels.has(name)
}

export function testPassed(
  state: GameState,
  modelName: string,
  _testName?: string,
): boolean {
  return state.testResults[modelName] === 'pass'
}

export function sourceDefined(
  state: GameState,
  sourceName: string,
  tableName: string,
): boolean {
  for (const [path, content] of Object.entries(state.files)) {
    if (!path.endsWith('.yml') && !path.endsWith('.yaml')) continue
    if (content.includes(`name: ${sourceName}`) && content.includes(`name: ${tableName}`))
      return true
  }
  return false
}

export function modelMaterialization(
  state: GameState,
  name: string,
  type: string,
): boolean {
  const path = findModelPath(state.files, name)
  if (!path) return false
  const content = state.files[path] ?? ''
  const re = /\{\{\s*config\s*\([^)]*materialized\s*=\s*['"](\w+)['"]/
  const m = re.exec(content)
  if (m) return m[1] === type
  return type === 'view'
}
