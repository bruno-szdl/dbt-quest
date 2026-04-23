export type CommandType = 'run' | 'test' | 'build' | 'show'

export interface Selector {
  name: string
  upstream: boolean   // +name
  downstream: boolean // name+
}

export interface ParsedCommand {
  type: CommandType
  select: Selector[]
  exclude: Selector[]
  raw: string
}

export type ParseResult =
  | { ok: true; command: ParsedCommand }
  | { ok: false; error: string }

const VALID_SUBCOMMANDS = ['run', 'test', 'build', 'show'] as const

function parseSelector(token: string): Selector {
  return {
    upstream: token.startsWith('+'),
    downstream: token.endsWith('+'),
    name: token.replace(/^\+/, '').replace(/\+$/, ''),
  }
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
      error: 'Missing subcommand. Try: dbt run, dbt test, dbt build',
    }
  }

  if (!(VALID_SUBCOMMANDS as readonly string[]).includes(sub)) {
    return {
      ok: false,
      error: `Unknown subcommand "${sub}". Supported: ${VALID_SUBCOMMANDS.join(', ')}`,
    }
  }

  const type = sub as CommandType
  const select: Selector[] = []
  const exclude: Selector[] = []

  let i = 2
  while (i < parts.length) {
    const flag = parts[i]

    if (flag === '--select' || flag === '-s') {
      i++
      while (i < parts.length && !parts[i].startsWith('-')) {
        select.push(parseSelector(parts[i]))
        i++
      }
      if (select.length === 0) {
        return { ok: false, error: '--select requires a model name' }
      }
    } else if (flag === '--exclude') {
      i++
      while (i < parts.length && !parts[i].startsWith('-')) {
        exclude.push(parseSelector(parts[i]))
        i++
      }
      if (exclude.length === 0) {
        return { ok: false, error: '--exclude requires a model name' }
      }
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
