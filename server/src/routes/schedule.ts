import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { className, dayOfWeek } = req.query
    let q = `SELECT s.*, c.name as class_name_db FROM schedule s LEFT JOIN classes c ON c.id = s.class_id WHERE s.school_id=$1`
    const params: any[] = [schoolId]
    if (className) { params.push(`%${className}%`); q += ` AND (s.subject_name ILIKE $${params.length} OR s.teacher_name ILIKE $${params.length} OR c.name ILIKE $${params.length})` }
    if (dayOfWeek !== undefined) { params.push(dayOfWeek); q += ` AND s.day_of_week=$${params.length}` }
    q += ' ORDER BY s.day_of_week, s.start_time'
    const result = await query(q, params)
    res.json({ schedule: result.rows, total: result.rowCount })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { classId, subjectName, teacherName, dayOfWeek, startTime, endTime, room, className } = req.body
    if (dayOfWeek === undefined || !startTime || !endTime) return res.status(400).json({ error: 'dayOfWeek, startTime, endTime required' })
    const result = await query(`
      INSERT INTO schedule (school_id, class_id, subject_name, teacher_name, day_of_week, start_time, end_time, room)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [schoolId, classId||null, subjectName||null, teacherName||null, dayOfWeek, startTime, endTime, room||null])
    res.status(201).json({ entry: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { classId, subjectName, teacherName, dayOfWeek, startTime, endTime, room } = req.body
    const result = await query(`
      UPDATE schedule SET class_id=$1, subject_name=$2, teacher_name=$3, day_of_week=$4, start_time=$5, end_time=$6, room=$7
      WHERE id=$8 AND school_id=$9 RETURNING *
    `, [classId||null, subjectName||null, teacherName||null, dayOfWeek, startTime, endTime, room||null, req.params.id, schoolId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ entry: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    await query('DELETE FROM schedule WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
