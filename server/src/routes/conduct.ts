import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
router.use(authenticateToken)
const log = createLogger('CONDUCT')

const VALID_TYPES     = ['incident', 'reward', 'warning', 'note'] as const
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { studentId, type, severity, startDate, endDate, className, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let q = `
      SELECT cr.id, cr.student_id, cr.record_type, cr.category, cr.title, cr.description,
             cr.severity, cr.points, cr.action_taken, cr.parent_notified, cr.record_date, cr.created_at,
             s.name as student_name, s.student_number, s.class_name,
             u.name as reported_by_name
      FROM conduct_records cr
      LEFT JOIN students s ON s.id=cr.student_id
      LEFT JOIN users u    ON u.id=cr.reported_by
      WHERE cr.school_id=$1`
    const params: unknown[] = [schoolId]
    if (studentId) { params.push(studentId); q += ` AND cr.student_id=$${params.length}` }
    if (type && VALID_TYPES.includes(String(type) as any))         { params.push(type);      q += ` AND cr.record_type=$${params.length}` }
    if (severity && VALID_SEVERITIES.includes(String(severity) as any)) { params.push(severity); q += ` AND cr.severity=$${params.length}` }
    if (className) { params.push(className); q += ` AND s.class_name=$${params.length}` }
    if (startDate) { params.push(startDate); q += ` AND cr.record_date >= $${params.length}` }
    if (endDate)   { params.push(endDate);   q += ` AND cr.record_date <= $${params.length}` }
    q += ` ORDER BY cr.record_date DESC, cr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)

    const [result, stats, topStudents] = await Promise.all([
      query(q, params),
      query(`
        SELECT COUNT(*) as total,
          COUNT(CASE WHEN record_type='incident' THEN 1 END) as incidents,
          COUNT(CASE WHEN record_type='reward'   THEN 1 END) as rewards,
          COUNT(CASE WHEN record_type='warning'  THEN 1 END) as warnings,
          COUNT(CASE WHEN severity IN ('high','critical') THEN 1 END) as serious,
          COUNT(CASE WHEN NOT parent_notified AND record_type IN ('incident','warning') THEN 1 END) as pending_notifications
        FROM conduct_records WHERE school_id=$1`, [schoolId]),
      query(`
        SELECT s.name, s.class_name, SUM(cr.points) as total_points, COUNT(cr.id) as total_records
        FROM conduct_records cr
        LEFT JOIN students s ON s.id=cr.student_id
        WHERE cr.school_id=$1 AND cr.record_type='reward' AND cr.points > 0
        GROUP BY s.id, s.name, s.class_name ORDER BY total_points DESC LIMIT 5`, [schoolId])
    ])
    res.json({ records: result.rows, stats: stats.rows[0], topStudents: topStudents.rows })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { studentId, recordType, category, title, description, severity, points, actionTaken, parentNotified, recordDate } = req.body
    if (!studentId || !recordType || !title)
      return res.status(400).json({ error: 'الطالب والنوع والعنوان مطلوبة' })
    if (!VALID_TYPES.includes(recordType))
      return res.status(400).json({ error: 'نوع السجل غير صالح' })

    const result = await query(`
      INSERT INTO conduct_records (school_id, student_id, record_type, category, title, description,
        severity, points, action_taken, parent_notified, record_date, reported_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [schoolId, studentId, recordType, category, title.slice(0, 200),
       description?.slice(0, 2000), severity || 'low', parseInt(String(points)) || 0,
       actionTaken?.slice(0, 1000), parentNotified || false,
       recordDate || new Date().toISOString().split('T')[0], userId]
    )
    log.info('Conduct record created', { recordId: result.rows[0].id, type: recordType })
    res.status(201).json({ record: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { category, title, description, severity, points, actionTaken, parentNotified } = req.body
    const result = await query(`
      UPDATE conduct_records SET
        category=COALESCE($1,category), title=COALESCE($2,title),
        description=COALESCE($3,description), severity=COALESCE($4,severity),
        points=COALESCE($5,points), action_taken=COALESCE($6,action_taken),
        parent_notified=COALESCE($7,parent_notified)
      WHERE id=$8 AND school_id=$9 RETURNING *`,
      [category, title?.slice(0, 200), description?.slice(0, 2000),
       severity, points !== undefined ? parseInt(String(points)) : null,
       actionTaken?.slice(0, 1000), parentNotified, req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ record: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM conduct_records WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/student/:studentId', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [records, summary] = await Promise.all([
      query(`
        SELECT cr.id, cr.record_type, cr.category, cr.title, cr.description, cr.severity,
               cr.points, cr.action_taken, cr.parent_notified, cr.record_date, cr.created_at,
               u.name as reported_by_name
        FROM conduct_records cr LEFT JOIN users u ON u.id=cr.reported_by
        WHERE cr.school_id=$1 AND cr.student_id=$2 ORDER BY cr.record_date DESC LIMIT 100`,
        [schoolId, req.params.studentId]),
      query(`
        SELECT
          COALESCE(SUM(CASE WHEN record_type='reward'   THEN points ELSE 0 END),0) as reward_points,
          COUNT(CASE WHEN record_type='incident' THEN 1 END) as incidents,
          COUNT(CASE WHEN record_type='reward'   THEN 1 END) as rewards,
          COUNT(CASE WHEN record_type='warning'  THEN 1 END) as warnings
        FROM conduct_records WHERE school_id=$1 AND student_id=$2`,
        [schoolId, req.params.studentId])
    ])
    res.json({ records: records.rows, summary: summary.rows[0] })
  } catch (err) {
    log.error('GET /student/:id failed', { id: req.params.studentId, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
