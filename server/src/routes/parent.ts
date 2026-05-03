import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()

async function getChild(parentId: string, schoolId: string) {
  const result = await query(
    `SELECT id, name, name_en, student_id, class_id, grade_level, section,
            gender, date_of_birth, photo, bus_id, nationality
     FROM students WHERE parent_id=$1 AND school_id=$2 LIMIT 1`,
    [parentId, schoolId]
  )
  return result.rows[0]
}

router.get('/dashboard', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const { id: parentId, schoolId } = req.user!
    const child = await getChild(parentId, schoolId)
    if (!child) return res.json({ child: null, stats: {} })

    const today = new Date().toISOString().split('T')[0]
    const [gradesResult, recentGradesResult, attTodayResult, attMonthResult, msgResult, nextEventsResult, notifResult] = await Promise.all([
      query(`SELECT AVG(percentage) as avg, COUNT(*) as total FROM grades WHERE student_id=$1`, [child.id]),
      query(`SELECT subject_name, score, max_score, percentage, grade_letter, term, academic_year FROM grades WHERE student_id=$1 ORDER BY created_at DESC LIMIT 6`, [child.id]),
      query(`SELECT status FROM attendance WHERE person_id=$1 AND date=$2 AND person_type='student'`, [child.id, today]),
      query(`SELECT status, COUNT(*) FROM attendance WHERE person_id=$1 AND person_type='student' AND date >= date_trunc('month', NOW()) GROUP BY status`, [child.id]),
      query(`SELECT COUNT(*) FROM messages WHERE to_user_id=$1 AND is_read=false`, [parentId]),
      query(`SELECT * FROM events WHERE school_id=$1 AND start_date > NOW() ORDER BY start_date LIMIT 3`, [schoolId]),
      query(`SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [parentId]),
    ])

    const attMonth = attMonthResult.rows.reduce((a: any, r: any) => { a[r.status] = parseInt(r.count); return a }, {})
    const unreadNotif = notifResult.rows.filter((n: any) => !n.is_read).length
    res.json({
      child,
      stats: {
        gradeAvg: parseFloat(gradesResult.rows[0]?.avg || 0).toFixed(1),
        gradeCount: parseInt(gradesResult.rows[0]?.total || 0),
        recentGrades: recentGradesResult.rows,
        todayStatus: attTodayResult.rows[0]?.status || 'unknown',
        attendanceMonth: attMonth,
        unreadMessages: parseInt(msgResult.rows[0]?.count || 0),
        upcomingEvents: nextEventsResult.rows,
        notifications: notifResult.rows,
        unreadNotifications: unreadNotif,
      }
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/child', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId)
    if (!child) return res.json({ child: null })
    const bus = child.bus_id ? (await query('SELECT id, bus_number, plate_number, driver_name, driver_phone, route_name, morning_time, afternoon_time FROM buses WHERE id=$1', [child.bus_id])).rows[0] : null
    res.json({ child, bus })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/grades', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId)
    if (!child) return res.json({ grades: [], summary: {} })
    const { term, academicYear } = req.query
    let sql = 'SELECT * FROM grades WHERE student_id=$1'
    const params: any[] = [child.id]
    if (academicYear) { sql += ' AND academic_year=$2'; params.push(academicYear) }
    if (term) { sql += ` AND term=$${params.length+1}`; params.push(term) }
    sql += ' ORDER BY subject_name'
    const result = await query(sql, params)
    const grades = result.rows
    const avg = grades.length ? grades.reduce((s: number, g: any) => s + parseFloat(g.percentage), 0) / grades.length : 0
    res.json({
      grades,
      summary: {
        average: avg.toFixed(1),
        passed: grades.filter((g: any) => g.status === 'pass').length,
        failed: grades.filter((g: any) => g.status === 'fail').length,
        total: grades.length
      }
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/attendance', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId)
    if (!child) return res.json({ attendance: [] })
    const { month, year } = req.query
    let sql = `SELECT * FROM attendance WHERE person_id=$1 AND person_type='student'`
    const params: any[] = [child.id]
    if (month && year) { sql += ` AND EXTRACT(MONTH FROM date)=$2 AND EXTRACT(YEAR FROM date)=$3`; params.push(month, year) }
    sql += ' ORDER BY date DESC'
    const result = await query(sql, params)
    const stats = result.rows.reduce((a: any, r: any) => { a[r.status] = (a[r.status]||0)+1; return a }, {})
    res.json({ attendance: result.rows, stats })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/messages', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId } = req.user!
    const result = await query(`
      SELECT m.*, fu.name as from_name, fu.role as from_role, tu.name as to_name
      FROM messages m JOIN users fu ON fu.id=m.from_user_id JOIN users tu ON tu.id=m.to_user_id
      WHERE m.school_id=$1 AND m.parent_message_id IS NULL
        AND (m.from_user_id=$2 OR m.to_user_id=$2)
      ORDER BY m.created_at DESC`,
      [schoolId, userId]
    )
    res.json({ messages: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/messages', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    const adminResult = await query(`SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1`, [schoolId])
    const adminId = adminResult.rows[0]?.id
    if (!adminId) return res.status(400).json({ error: 'لا يوجد مسؤول في هذه المدرسة' })
    const { subject, body, priority } = req.body
    const result = await query(`
      INSERT INTO messages (school_id,from_user_id,to_user_id,subject,body,priority)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [schoolId, fromId, adminId, subject, body, priority||'normal']
    )
    await query(`INSERT INTO notifications (school_id,user_id,title,body,type) VALUES ($1,$2,$3,$4,$5)`,
      [schoolId, adminId, 'رسالة من ولي أمر', `${req.user!.name}: ${subject}`, 'message'])
    res.status(201).json({ message: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/schedule', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId)
    if (!child || !child.class_id) return res.json({ schedule: [] })
    const result = await query(`
      SELECT s.*, sub.name as subject_name, u.name as teacher_name
      FROM schedule s LEFT JOIN subjects sub ON sub.id=s.subject_id
      LEFT JOIN users u ON u.id=s.teacher_id WHERE s.class_id=$1 ORDER BY s.day_of_week, s.start_time`,
      [child.class_id]
    )
    res.json({ schedule: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/notifications', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    )
    const unread = result.rows.filter((n: any) => !n.is_read).length
    res.json({ notifications: result.rows, unread })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/notifications/read-all', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user!.id])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/notifications/:id/read', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user!.id]
    )
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
