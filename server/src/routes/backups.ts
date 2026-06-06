import { Router } from 'express'
import fs from 'fs'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'
import { logAudit } from './audit'
import {
  createSchoolBackup,
  listSchoolBackups,
  resolveBackupPath,
  restoreSchoolBackup,
  getBackupStatus,
} from '../services/backup'

const router = Router()
const log = createLogger('BACKUPS')

router.use(authenticateToken, requireRole('admin'))

router.get('/status', async (req: AuthRequest, res) => {
  try {
    res.json(await getBackupStatus(req.user!.schoolId))
  } catch (err) {
    log.error('GET /status failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/', async (req: AuthRequest, res) => {
  try {
    const backups = listSchoolBackups(req.user!.schoolId)
    res.json({ backups })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, name, role } = req.user!
    const result = await createSchoolBackup(schoolId, 'manual')
    await logAudit({
      schoolId, userId, userName: name, userRole: role,
      action: 'CREATE_BACKUP', entityType: 'backup', entityId: result.filename,
      description: `نسخة احتياطية يدوية — ${result.info.totalRows} سجل`,
      ip: req.ip,
    })
    res.status(201).json(result)
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'فشل إنشاء النسخة الاحتياطية' })
  }
})

router.get('/:filename/download', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const filepath = resolveBackupPath(schoolId, req.params.filename)
    res.download(filepath, req.params.filename)
  } catch (err) {
    res.status(404).json({ error: (err as Error).message || 'Not found' })
  }
})

router.post('/:filename/restore', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, name, role } = req.user!
    const { confirm } = req.body
    if (confirm !== 'RESTORE') {
      return res.status(400).json({ error: 'أرسل confirm: "RESTORE" لتأكيد الاستعادة' })
    }

    const result = await restoreSchoolBackup(schoolId, req.params.filename)
    await logAudit({
      schoolId, userId, userName: name, userRole: role,
      action: 'RESTORE_BACKUP', entityType: 'backup', entityId: req.params.filename,
      description: `استعادة نسخة احتياطية — ${result.restoredRows} سجل`,
      ip: req.ip,
    })
    res.json({ ok: true, ...result })
  } catch (err) {
    log.error('POST /:filename/restore failed', { error: (err as Error).message })
    res.status(500).json({ error: (err as Error).message || 'فشلت الاستعادة' })
  }
})

router.delete('/:filename', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, name, role } = req.user!
    const filepath = resolveBackupPath(schoolId, req.params.filename)
    fs.unlinkSync(filepath)
    await logAudit({
      schoolId, userId, userName: name, userRole: role,
      action: 'DELETE_BACKUP', entityType: 'backup', entityId: req.params.filename,
      description: 'حذف نسخة احتياطية',
      ip: req.ip,
    })
    res.json({ ok: true })
  } catch (err) {
    res.status(404).json({ error: (err as Error).message || 'Not found' })
  }
})

export default router
