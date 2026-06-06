import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { promisify } from 'util'
import { PoolClient } from 'pg'
import { query } from '../db'
import { withTransaction } from '../db/transaction'
import { createLogger } from '../utils/logger'

const log = createLogger('BACKUP')
const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

export const BACKUP_VERSION = 1

/** جداول مرتبطة مباشرة بـ school_id */
const SCHOOL_TABLES = [
  'school_settings',
  'users',
  'classes',
  'buses',
  'leave_types',
  'library_books',
  'learning_support_settings',
  'employees',
  'students',
  'subjects',
  'attendance',
  'grades',
  'schedule',
  'messages',
  'news',
  'events',
  'notifications',
  'staff_public',
  'gallery',
  'achievements',
  'fees',
  'broadcasts',
  'exams',
  'library_borrows',
  'employee_leaves',
  'homework',
  'conduct_records',
  'audit_logs',
  'user_sessions',
  'invoices',
  'job_postings',
  'contact_submissions',
  'job_applications',
  'alumni_registrations',
  'public_alerts',
  'public_faqs',
  'public_videos',
  'public_articles',
  'school_teams',
  'hall_of_fame',
  'ls_services',
  'ls_specialists',
  'ls_articles',
  'ls_gallery',
] as const

/** ترتيب الإدراج عند الاستعادة (الآباء قبل الأبناء) */
const RESTORE_ORDER = [
  'schools',
  'school_settings',
  'users',
  'classes',
  'buses',
  'leave_types',
  'library_books',
  'learning_support_settings',
  'employees',
  'students',
  'subjects',
  'student_buses',
  'attendance',
  'grades',
  'schedule',
  'messages',
  'news',
  'events',
  'notifications',
  'staff_public',
  'gallery',
  'achievements',
  'fees',
  'broadcasts',
  'exams',
  'library_borrows',
  'employee_leaves',
  'homework',
  'homework_submissions',
  'conduct_records',
  'audit_logs',
  'user_sessions',
  'invoices',
  'job_postings',
  'contact_submissions',
  'job_applications',
  'alumni_registrations',
  'public_alerts',
  'public_faqs',
  'public_videos',
  'public_articles',
  'school_teams',
  'hall_of_fame',
  'ls_services',
  'ls_specialists',
  'ls_articles',
  'ls_gallery',
] as const

export type BackupPayload = {
  version: number
  createdAt: string
  schoolId: string
  schoolName: string
  trigger: 'auto' | 'manual'
  tables: Record<string, unknown[]>
  meta: { rowCounts: Record<string, number> }
}

export type BackupFileInfo = {
  filename: string
  schoolId: string
  createdAt: string
  sizeBytes: number
  trigger: 'auto' | 'manual'
  rowCounts: Record<string, number>
  totalRows: number
}

export function getBackupDir(): string {
  const dir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function schoolBackupPath(schoolId: string): string {
  const dir = path.join(getBackupDir(), schoolId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function safeFilename(name: string): boolean {
  return /^[a-f0-9-]+_\d{8}_\d{6}\.json\.gz$/.test(name)
}

async function exportTableRows(schoolId: string, table: string): Promise<unknown[]> {
  const res = await query(`SELECT * FROM ${table} WHERE school_id = $1`, [schoolId])
  return res.rows
}

async function exportLinkedRows(schoolId: string): Promise<Record<string, unknown[]>> {
  const [studentBuses, hwSubs] = await Promise.all([
    query(
      `SELECT sb.* FROM student_buses sb
       JOIN students s ON s.id = sb.student_id
       WHERE s.school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT hs.* FROM homework_submissions hs
       JOIN homework h ON h.id = hs.homework_id
       WHERE h.school_id = $1`,
      [schoolId]
    ),
  ])
  return {
    student_buses: studentBuses.rows,
    homework_submissions: hwSubs.rows,
  }
}

export async function createSchoolBackup(
  schoolId: string,
  trigger: 'auto' | 'manual' = 'manual'
): Promise<{ filename: string; filepath: string; info: BackupFileInfo }> {
  const schoolRes = await query('SELECT id, name FROM schools WHERE id = $1', [schoolId])
  if (!schoolRes.rows[0]) throw new Error('School not found')

  const tables: Record<string, unknown[]> = {}
  const rowCounts: Record<string, number> = {}

  tables.schools = (await query('SELECT * FROM schools WHERE id = $1', [schoolId])).rows

  for (const table of SCHOOL_TABLES) {
    const rows = await exportTableRows(schoolId, table)
    tables[table] = rows
    rowCounts[table] = rows.length
  }

  const linked = await exportLinkedRows(schoolId)
  for (const [k, rows] of Object.entries(linked)) {
    tables[k] = rows
    rowCounts[k] = rows.length
  }

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    schoolId,
    schoolName: schoolRes.rows[0].name,
    trigger,
    tables,
    meta: { rowCounts },
  }

  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('') + '_' + [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')

  const filename = `${schoolId}_${stamp}.json.gz`
  const filepath = path.join(schoolBackupPath(schoolId), filename)
  const compressed = await gzip(Buffer.from(JSON.stringify(payload), 'utf8'))
  fs.writeFileSync(filepath, compressed)

  const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0)
  const info: BackupFileInfo = {
    filename,
    schoolId,
    createdAt: payload.createdAt,
    sizeBytes: compressed.length,
    trigger,
    rowCounts,
    totalRows,
  }

  log.info('School backup created', { schoolId, filename, totalRows, trigger })
  return { filename, filepath, info }
}

async function readBackupFile(filepath: string): Promise<BackupPayload> {
  const raw = fs.readFileSync(filepath)
  const json = await gunzip(raw)
  const payload = JSON.parse(json.toString('utf8')) as BackupPayload
  if (payload.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${payload.version}`)
  }
  return payload
}

export function listSchoolBackups(schoolId: string): BackupFileInfo[] {
  const dir = schoolBackupPath(schoolId)
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json.gz'))
    .map(filename => {
      const filepath = path.join(dir, filename)
      const stat = fs.statSync(filepath)
      let meta: Partial<BackupFileInfo> = {}
      try {
        const raw = zlib.gunzipSync(fs.readFileSync(filepath))
        const payload = JSON.parse(raw.toString('utf8')) as BackupPayload
        meta = {
          createdAt: payload.createdAt,
          trigger: payload.trigger,
          rowCounts: payload.meta?.rowCounts || {},
          totalRows: Object.values(payload.meta?.rowCounts || {}).reduce((a, b) => a + b, 0),
        }
      } catch {
        meta = { createdAt: stat.mtime.toISOString(), trigger: 'manual', rowCounts: {}, totalRows: 0 }
      }
      return {
        filename,
        schoolId,
        createdAt: meta.createdAt || stat.mtime.toISOString(),
        sizeBytes: stat.size,
        trigger: meta.trigger || 'manual',
        rowCounts: meta.rowCounts || {},
        totalRows: meta.totalRows || 0,
      } satisfies BackupFileInfo
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function resolveBackupPath(schoolId: string, filename: string): string {
  if (!safeFilename(filename) || !filename.startsWith(schoolId + '_')) {
    throw new Error('Invalid backup filename')
  }
  const filepath = path.join(schoolBackupPath(schoolId), filename)
  if (!fs.existsSync(filepath)) throw new Error('Backup file not found')
  return filepath
}

async function deleteSchoolTableData(client: PoolClient, schoolId: string): Promise<void> {
  await client.query(
    `DELETE FROM homework_submissions WHERE homework_id IN (SELECT id FROM homework WHERE school_id = $1)`,
    [schoolId]
  )
  await client.query(
    `DELETE FROM student_buses WHERE student_id IN (SELECT id FROM students WHERE school_id = $1)`,
    [schoolId]
  )

  const deleteOrder = [...SCHOOL_TABLES].reverse().filter(t => t !== 'school_settings')
  for (const table of deleteOrder) {
    await client.query(`DELETE FROM ${table} WHERE school_id = $1`, [schoolId])
  }
}

function insertRow(client: PoolClient, table: string, row: Record<string, unknown>): Promise<void> {
  const cols = Object.keys(row)
  if (!cols.length) return Promise.resolve()
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
  return client.query(sql, cols.map(c => row[c])).then(() => undefined)
}

export async function restoreSchoolBackup(
  schoolId: string,
  filename: string
): Promise<{ restoredRows: number }> {
  const filepath = resolveBackupPath(schoolId, filename)
  const payload = await readBackupFile(filepath)

  if (payload.schoolId !== schoolId) {
    throw new Error('Backup belongs to a different school')
  }

  let restoredRows = 0

  await withTransaction(async (client) => {
    await deleteSchoolTableData(client, schoolId)

    for (const table of RESTORE_ORDER) {
      const rows = (payload.tables[table] || []) as Record<string, unknown>[]
      if (table === 'schools') {
        for (const row of rows) {
          const { id, ...rest } = row
          if (String(id) !== schoolId) continue
          const cols = Object.keys(rest)
          const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ')
          await client.query(
            `UPDATE schools SET ${sets} WHERE id = $1`,
            [schoolId, ...cols.map(c => rest[c])]
          )
        }
        continue
      }

      for (const row of rows) {
        await insertRow(client, table, row)
        restoredRows++
      }
    }
  })

  log.info('School backup restored', { schoolId, filename, restoredRows })
  return { restoredRows }
}

export async function pruneOldBackups(schoolId: string): Promise<number> {
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10)
  const maxKeep = parseInt(process.env.BACKUP_MAX_FILES || '60', 10)
  const backups = listSchoolBackups(schoolId)
  const cutoff = Date.now() - retentionDays * 86400000
  let removed = 0

  for (let i = 0; i < backups.length; i++) {
    const b = backups[i]
    const tooOld = new Date(b.createdAt).getTime() < cutoff
    const overLimit = i >= maxKeep
    if (tooOld || overLimit) {
      fs.unlinkSync(path.join(schoolBackupPath(schoolId), b.filename))
      removed++
    }
  }

  if (removed) log.info('Old backups pruned', { schoolId, removed })
  return removed
}

export async function runStartupBackupIfNeeded(): Promise<void> {
  if (process.env.BACKUP_ON_START === 'false') return
  const schools = await query(`SELECT id FROM schools WHERE status IN ('active', 'trial', 'suspended')`)
  const today = new Date().toISOString().slice(0, 10)
  for (const row of schools.rows) {
    const backups = listSchoolBackups(row.id)
    const hasToday = backups.some(b => b.createdAt.startsWith(today))
    if (!hasToday) {
      try {
        await createSchoolBackup(row.id, 'auto')
        await pruneOldBackups(row.id)
      } catch (err) {
        log.error('Startup backup failed', { schoolId: row.id, error: (err as Error).message })
      }
    }
  }
}

export async function runDailyBackups(): Promise<void> {
  const schools = await query(`SELECT id FROM schools WHERE status IN ('active', 'trial', 'suspended')`)
  for (const row of schools.rows) {
    try {
      await createSchoolBackup(row.id, 'auto')
      await pruneOldBackups(row.id)
    } catch (err) {
      log.error('Auto backup failed for school', { schoolId: row.id, error: (err as Error).message })
    }
  }
}

export async function getBackupStatus(schoolId: string) {
  const backups = listSchoolBackups(schoolId)
  const latest = backups[0] || null
  return {
    enabled: process.env.BACKUP_AUTO !== 'false',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    scheduleHour: parseInt(process.env.BACKUP_HOUR || '3', 10),
    latest,
    totalBackups: backups.length,
  }
}
