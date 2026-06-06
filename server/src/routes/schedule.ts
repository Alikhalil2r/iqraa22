import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest, STAFF_ROLES } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/', requireRole(...STAFF_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    const { className, dayOfWeek } = req.query
    let q = `SELECT s.*, c.name as class_name_db, u.name as teacher_user_name FROM schedule s
      LEFT JOIN classes c ON c.id = s.class_id LEFT JOIN users u ON u.id = s.teacher_id WHERE s.school_id=$1`
    const params: unknown[] = [schoolId]
    if (role === 'teacher') { params.push(userId); q += ` AND s.teacher_id=$${params.length}` }
    if (className) { params.push(`%${className}%`); q += ` AND (s.subject_name ILIKE $${params.length} OR c.name ILIKE $${params.length})` }
    if (dayOfWeek !== undefined) { params.push(dayOfWeek); q += ` AND s.day_of_week=$${params.length}` }
    const result = await query(q + ' ORDER BY s.day_of_week, s.start_time', params)
    res.json({ schedule: result.rows, total: result.rowCount })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', requireRole('super_admin', 'admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    const { classId, subjectName, teacherName, teacherId, dayOfWeek, startTime, endTime, room } = req.body
    if (dayOfWeek === undefined || !startTime || !endTime) return res.status(400).json({ error: 'required fields missing' })
    let tid = teacherId || null, tname = teacherName || null
    if (role === 'teacher') { tid = userId; const me = await query('SELECT name FROM users WHERE id=$1', [userId]); tname = me.rows[0]?.name }
    const result = await query(
      `INSERT INTO schedule (school_id,class_id,subject_name,teacher_id,teacher_name,day_of_week,start_time,end_time,room) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [schoolId, classId||null, subjectName||null, tid, tname, dayOfWeek, startTime, endTime, room||null]
    )
    res.status(201).json({ entry: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', requireRole('super_admin', 'admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    const { classId, subjectName, teacherName, teacherId, dayOfWeek, startTime, endTime, room } = req.body
    if (role === 'teacher') {
      const owns = await query('SELECT id FROM schedule WHERE id=$1 AND school_id=$2 AND teacher_id=$3', [req.params.id, schoolId, userId])
      if (!owns.rows[0]) return res.status(403).json({ error: 'Forbidden' })
    }
    const result = await query(
      `UPDATE schedule SET class_id=$1,subject_name=$2,teacher_name=$3,teacher_id=$4,day_of_week=$5,start_time=$6,end_time=$7,room=$8 WHERE id=$9 AND school_id=$10 RETURNING *`,
      [classId||null, subjectName||null, teacherName||null, teacherId||null, dayOfWeek, startTime, endTime, room||null, req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ entry: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', requireRole('super_admin', 'admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM schedule WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
