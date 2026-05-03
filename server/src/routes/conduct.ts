import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { studentId, type, severity, startDate, endDate, className } = req.query
    let q = `
      SELECT cr.*, s.name as student_name, s.student_number, s.class_name,
             u.name as reported_by_name
      FROM conduct_records cr
      LEFT JOIN students s ON s.id = cr.student_id
      LEFT JOIN users u ON u.id = cr.reported_by
      WHERE cr.school_id=$1
    `
    const params: any[] = [schoolId]
    if (studentId) { params.push(studentId); q += ` AND cr.student_id=$${params.length}` }
    if (type)      { params.push(type);      q += ` AND cr.record_type=$${params.length}` }
    if (severity)  { params.push(severity);  q += ` AND cr.severity=$${params.length}` }
    if (className) { params.push(className); q += ` AND s.class_name=$${params.length}` }
    if (startDate) { params.push(startDate); q += ` AND cr.record_date >= $${params.length}` }
    if (endDate)   { params.push(endDate);   q += ` AND cr.record_date <= $${params.length}` }
    q += ' ORDER BY cr.record_date DESC, cr.created_at DESC'
    const result = await query(q, params)
    const stats = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN record_type='incident' THEN 1 END) as incidents,
        COUNT(CASE WHEN record_type='reward' THEN 1 END) as rewards,
        COUNT(CASE WHEN record_type='warning' THEN 1 END) as warnings,
        COUNT(CASE WHEN severity='high' OR severity='critical' THEN 1 END) as serious,
        COUNT(CASE WHEN NOT parent_notified AND record_type IN ('incident','warning') THEN 1 END) as pending_notifications
      FROM conduct_records WHERE school_id=$1
    `, [schoolId])
    // Top students by positive points
    const topStudents = await query(`
      SELECT s.name, s.class_name, SUM(cr.points) as total_points, COUNT(cr.id) as total_records
      FROM conduct_records cr
      LEFT JOIN students s ON s.id = cr.student_id
      WHERE cr.school_id=$1 AND cr.record_type='reward' AND cr.points > 0
      GROUP BY s.id, s.name, s.class_name ORDER BY total_points DESC LIMIT 5
    `, [schoolId])
    res.json({ records: result.rows, stats: stats.rows[0], topStudents: topStudents.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { studentId, recordType, category, title, description, severity, points, actionTaken, parentNotified, recordDate } = req.body
    if (!studentId || !recordType || !title)
      return res.status(400).json({ error: 'Student, type and title required' })
    const result = await query(`
      INSERT INTO conduct_records (school_id, student_id, record_type, category, title, description,
        severity, points, action_taken, parent_notified, record_date, reported_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [schoolId, studentId, recordType, category, title, description,
        severity || 'low', parseInt(points) || 0, actionTaken,
        parentNotified || false, recordDate || new Date().toISOString().split('T')[0], userId])
    res.status(201).json({ record: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { category, title, description, severity, points, actionTaken, parentNotified } = req.body
    const result = await query(`
      UPDATE conduct_records SET category=COALESCE($1,category), title=COALESCE($2,title),
        description=COALESCE($3,description), severity=COALESCE($4,severity),
        points=COALESCE($5,points), action_taken=COALESCE($6,action_taken),
        parent_notified=COALESCE($7,parent_notified)
      WHERE id=$8 AND school_id=$9 RETURNING *
    `, [category, title, description, severity, parseInt(points) || null, actionTaken, parentNotified, req.params.id, schoolId])
    res.json({ record: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    await query('DELETE FROM conduct_records WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

// Student conduct summary
router.get('/student/:studentId', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const records = await query(`
      SELECT cr.*, u.name as reported_by_name FROM conduct_records cr
      LEFT JOIN users u ON u.id = cr.reported_by
      WHERE cr.school_id=$1 AND cr.student_id=$2 ORDER BY cr.record_date DESC
    `, [schoolId, req.params.studentId])
    const summary = await query(`
      SELECT
        SUM(CASE WHEN record_type='reward' THEN points ELSE 0 END) as reward_points,
        SUM(CASE WHEN record_type='incident' THEN 1 ELSE 0 END) as incidents,
        SUM(CASE WHEN record_type='reward' THEN 1 ELSE 0 END) as rewards,
        SUM(CASE WHEN record_type='warning' THEN 1 ELSE 0 END) as warnings
      FROM conduct_records WHERE school_id=$1 AND student_id=$2
    `, [schoolId, req.params.studentId])
    res.json({ records: records.rows, summary: summary.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

export default router
