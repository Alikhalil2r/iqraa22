import fs from 'fs'
import path from 'path'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',
  info:  '\x1b[32m',
  warn:  '\x1b[33m',
  error: '\x1b[31m',
}
const RESET = '\x1b[0m'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL]
}

function format(level: LogLevel, module: string, message: string, meta?: Record<string, unknown>): string {
  const ts   = new Date().toISOString()
  const lvl  = level.toUpperCase().padEnd(5)
  const metaStr = meta ? ' ' + JSON.stringify(meta) : ''
  return `${ts} [${lvl}] [${module}] ${message}${metaStr}`
}

function write(level: LogLevel, module: string, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return
  const line = format(level, module, message, meta)
  const colored = `${COLORS[level]}${line}${RESET}`
  if (level === 'error') {
    process.stderr.write(colored + '\n')
  } else {
    process.stdout.write(colored + '\n')
  }
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => write('debug', module, msg, meta),
    info:  (msg: string, meta?: Record<string, unknown>) => write('info',  module, msg, meta),
    warn:  (msg: string, meta?: Record<string, unknown>) => write('warn',  module, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => write('error', module, msg, meta),
  }
}

export const logger = createLogger('APP')
