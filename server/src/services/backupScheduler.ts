import { createLogger } from '../utils/logger'
import { runDailyBackups, runStartupBackupIfNeeded } from './backup'

const log = createLogger('BACKUP:SCHED')

let lastRunDate = ''
let intervalHandle: ReturnType<typeof setInterval> | null = null

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

async function tick(): Promise<void> {
  if (process.env.BACKUP_AUTO === 'false') return

  const hour = parseInt(process.env.BACKUP_HOUR || '3', 10)
  const now = new Date()
  if (now.getHours() !== hour) return
  if (lastRunDate === todayKey()) return

  lastRunDate = todayKey()
  log.info('Starting scheduled daily backups', { date: lastRunDate, hour })
  try {
    await runDailyBackups()
    log.info('Scheduled daily backups completed')
  } catch (err) {
    log.error('Scheduled daily backups failed', { error: (err as Error).message })
    lastRunDate = ''
  }
}

export function startBackupScheduler(): void {
  if (process.env.BACKUP_AUTO === 'false') {
    log.info('Automatic backups disabled (BACKUP_AUTO=false)')
    return
  }

  const checkMs = parseInt(process.env.BACKUP_CHECK_MS || String(15 * 60 * 1000), 10)
  log.info('Backup scheduler started', {
    hour: process.env.BACKUP_HOUR || '3',
    retentionDays: process.env.BACKUP_RETENTION_DAYS || '30',
    checkMs,
  })

  void tick()
  void runStartupBackupIfNeeded()
  intervalHandle = setInterval(() => { void tick() }, checkMs)
}

export function stopBackupScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
