import { createLogger } from './logger'

const log = createLogger('SENTRY')

let initialized = false

export function initSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    log.info('Sentry disabled — set SENTRY_DSN to enable')
    return
  }
  initialized = true
  log.info('Sentry stub initialized', { dsn: dsn.slice(0, 20) + '...' })
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  if (!initialized) {
    log.error('Uncaptured exception (Sentry off)', {
      error: err instanceof Error ? err.message : String(err),
      ...context,
    })
    return
  }
  log.error('Sentry capture', {
    error: err instanceof Error ? err.message : String(err),
    ...context,
  })
}
