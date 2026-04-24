export type CommandType = 'run' | 'test' | 'build' | 'show' | 'compile' | 'seed' | 'snapshot'

export interface SelectorTerm {
  method: 'fqn' | 'tag' | 'path'
  value: string
  upstream: boolean   // +term
  downstream: boolean // term+
}

// Comma-separated terms within one token are ANDed (intersection).
export interface SelectorGroup {
  terms: SelectorTerm[]
}

export interface ParsedCommand {
  type: CommandType
  select: SelectorGroup[]  // space-separated groups are ORed (union)
  exclude: SelectorGroup[]
  raw: string
}

export type ParseResult =
  | { ok: true; command: ParsedCommand }
  | { ok: false; error: string }

const VALID_SUBCOMMANDS = ['run', 'test', 'build', 'show', 'compile', 'seed', 'snapshot'] as const

function parseSelectorTerm(raw: string): SelectorTerm {
  const upstream = raw.startsWith('+')
  const downstream = raw.endsWith('+')
  let value = raw.replace(/^\+/, '').replace(/\+$/, '')
  let method: 'fqn' | 'tag' | 'path' = 'fqn'
  if (value.startsWith('tag:')) {
    method = 'tag'
    value = value.slice(4)
  } else if (value.startsWith('path:')) {
    method = 'path'
    value = value.slice(5)
  } else if (value.includes('/')) {
    method = 'path'
  }
  return { method, value, upstream, downstream }
}

function parseSelectorGroup(token: string): SelectorGroup {
  return { terms: token.split(',').map(parseSelectorTerm) }
}

export function parseCommand(input: string): ParseResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'Empty command' }

  const parts = trimmed.split(/\s+/)

  if (parts[0] !== 'dbt') {
    return {
      ok: false,
      error: `Unknown command "${parts[0]}". Commands start with "dbt".`,
    }
  }

  const sub = parts[1]
  if (!sub) {
    return {
      ok: false,
      error: 'Missing subcommand. Try: dbt run, dbt test, dbt build, dbt compile',
    }
  }

  if (!(VALID_SUBCOMMANDS as readonly string[]).includes(sub)) {
    return {
      ok: false,
      error: `Unknown subcommand "${sub}". Supported: ${VALID_SUBCOMMANDS.join(', ')}`,
    }
  }

  const type = sub as CommandType
  const select: SelectorGroup[] = []
  const exclude: SelectorGroup[] = []

  let i = 2
  while (i < parts.length) {
    const flag = parts[i]

    if (flag === '--select' || flag === '-s') {
      const before = select.length
      i++
      while (i < parts.length && !parts[i].startsWith('-')) {
        select.push(parseSelectorGroup(parts[i]))
        i++
      }
      if (select.length === before)
        return { ok: false, error: '--select requires a model name' }
    } else if (flag === '--exclude') {
      const before = exclude.length
      i++
      while (i < parts.length && !parts[i].startsWith('-')) {
        exclude.push(parseSelectorGroup(parts[i]))
        i++
      }
      if (exclude.length === before)
        return { ok: false, error: '--exclude requires a model name' }
    } else if (flag.startsWith('-')) {
      return {
        ok: false,
        error: `Unknown flag "${flag}". Supported: --select (-s), --exclude`,
      }
    } else {
      i++
    }
  }

  return { ok: true, command: { type, select, exclude, raw: trimmed } }
}
