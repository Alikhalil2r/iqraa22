import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole, AppRole } from '../middleware/auth'
import { isValidUUID } from '../middleware/validate'

const router = Router()

async function canParentMessage(schoolId: string, toUserId: string): Promise<boolean> {
  if (!isValidUUID(toUserId)) return false
  const r = await query(
    'SELECT id, role, school_id FROM users WHERE id=$1 AND is_active=true',
    [toUserId]
  )
  const recipient = r.rows[0]
  if (!recipient || recipient.school_id !== schoolId) return false
  return ['admin', 'teacher'].includes(recipient.role as AppRole)
}

const CHILD_BASE = `
  SELECT s.id, s.name, s.name_en, s.student_number, s.class_id, s.class_name,
         s.gender, s.date_of_birth, s.photo, s.bus_id, s.nationality, s.academic_year, s.status,
         b.bus_number, b.route_name, b.plate_number, b.driver_name, b.driver_phone,
         b.supervisor_name, b.supervisor_phone, b.morning_time, b.afternoon_time
  FROM students s
  LEFT JOIN buses b ON b.id = s.bus_id
  WHERE s.parent_id = $1 AND s.school_id = $2 AND s.status = 'active'`

async function getChildren(parentId: string, schoolId: string) {
  const result = await query(`${CHILD_BASE} ORDER BY s.name`, [parentId, schoolId])
  return result.rows
}

async function getChild(parentId: string, schoolId: string, childId?: string) {
  if (childId) {
    const result = await query(`${CHILD_BASE} AND s.id = $3`, [parentId, schoolId, childId])
    return result.rows[0]
  }
  const result = await query(`${CHILD_BASE} ORDER BY s.created_at LIMIT 1`, [parentId, schoolId])
  return result.rows[0]
}

router.get('/children', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const children = await getChildren(req.user!.id, req.user!.schoolId)
    res.json({ children })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/dashboard', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const { id: parentId, schoolId } = req.user!
    const childId = req.query.childId as string | undefined
    const children = await getChildren(parentId, schoolId)
    const child = await getChild(parentId, schoolId, childId)
    if (!child) return res.json({ child: null, children, stats: {} })

    const today = new Date().toISOString().split('T')[0]
    const [gradesResult, recentGradesResult, attTodayResult, attMonthResult, msgResult, nextEventsResult, notifResult, pendingHwResult, unpaidFeesResult] = await Promise.all([
      query(`SELECT AVG(percentage) as avg, COUNT(*) as total FROM grades WHERE student_id=$1`, [child.id]),
      query(`SELECT subject_name, score, max_score, percentage, grade_letter, term, academic_year FROM grades WHERE student_id=$1 ORDER BY created_at DESC LIMIT 6`, [child.id]),
      query(`SELECT status FROM attendance WHERE person_id=$1 AND date=$2 AND person_type='student'`, [child.id, today]),
      query(`SELECT status, COUNT(*) FROM attendance WHERE person_id=$1 AND person_type='student' AND date >= date_trunc('month', NOW()) GROUP BY status`, [child.id]),
      query(`SELECT COUNT(*) FROM messages WHERE to_user_id=$1 AND is_read=false`, [parentId]),
      query(`SELECT * FROM events WHERE school_id=$1 AND start_date > NOW() ORDER BY start_date LIMIT 3`, [schoolId]),
      query(`SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [parentId]),
      query(`SELECT COUNT(*) FROM homework_submissions hs JOIN homework h ON h.id=hs.homework_id WHERE hs.student_id=$1 AND hs.status='pending' AND h.due_date >= CURRENT_DATE AND h.status='active'`, [child.id]),
      query(`SELECT COUNT(*) FROM fees WHERE student_id=$1 AND status IN ('unpaid','partial')`, [child.id]),
    ])

    const attMonth = attMonthResult.rows.reduce((a: any, r: any) => { a[r.status] = parseInt(r.count); return a }, {})
    const unreadNotif = notifResult.rows.filter((n: any) => !n.is_read).length
    res.json({
      child,
      children,
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
        pendingHomework: parseInt(pendingHwResult.rows[0]?.count || 0),
        unpaidFees: parseInt(unpaidFeesResult.rows[0]?.count || 0),
      }
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/child', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const childId = req.query.childId as string | undefined
    const child = await getChild(req.user!.id, req.user!.schoolId, childId)
    if (!child) return res.json({ child: null, bus: null })
    const bus = child.bus_id ? {
      id: child.bus_id,
      bus_number: child.bus_number,
      plate_number: child.plate_number,
      driver_name: child.driver_name,
      driver_phone: child.driver_phone,
      supervisor_name: child.supervisor_name,
      supervisor_phone: child.supervisor_phone,
      route_name: child.route_name,
      morning_time: child.morning_time,
      afternoon_time: child.afternoon_time,
    } : null
    const pickup = child.bus_id
      ? (await query('SELECT pickup_location, pickup_time, dropoff_location, dropoff_time FROM student_buses WHERE student_id=$1 AND bus_id=$2', [child.id, child.bus_id])).rows[0]
      : null
    res.json({ child, bus, pickup })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/grades', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
    if (!child) return res.json({ grades: [], summary: {} })
    const { term, academicYear } = req.query
    let sql = 'SELECT * FROM grades WHERE student_id=$1'
    const params: any[] = [child.id]
    if (academicYear) { sql += ' AND academic_year=$2'; params.push(academicYear) }
    if (term) { sql += ` AND term=$${params.length + 1}`; params.push(term) }
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
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
    if (!child) return res.json({ attendance: [] })
    const { month, year } = req.query
    let sql = `SELECT * FROM attendance WHERE person_id=$1 AND person_type='student'`
    const params: any[] = [child.id]
    if (month && year) { sql += ` AND EXTRACT(MONTH FROM date)=$2 AND EXTRACT(YEAR FROM date)=$3`; params.push(month, year) }
    sql += ' ORDER BY date DESC'
    const result = await query(sql, params)
    const stats = result.rows.reduce((a: any, r: any) => { a[r.status] = (a[r.status] || 0) + 1; return a }, {})
    res.json({ attendance: result.rows, stats })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/homework', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
    if (!child) return res.json({ homework: [], stats: {} })
    const result = await query(`
      SELECT h.id, h.title, h.subject_name, h.description, h.due_date, h.max_score, h.status as hw_status,
             hs.id as submission_id, hs.status, hs.score, hs.feedback, hs.submission_date,
             u.name as teacher_name
      FROM homework h
      JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = $1
      LEFT JOIN users u ON u.id = h.created_by
      WHERE h.school_id = $2 AND h.status != 'archived'
      ORDER BY h.due_date DESC`,
      [child.id, req.user!.schoolId]
    )
    const rows = result.rows
    res.json({
      homework: rows,
      stats: {
        total: rows.length,
        pending: rows.filter((r: any) => r.status === 'pending').length,
        submitted: rows.filter((r: any) => ['submitted', 'graded', 'late'].includes(r.status)).length,
        graded: rows.filter((r: any) => r.status === 'graded').length,
      }
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/fees', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
    if (!child) return res.json({ fees: [], summary: {} })
    const result = await query(
      `SELECT * FROM fees WHERE student_id=$1 ORDER BY due_date DESC NULLS LAST, created_at DESC`,
      [child.id]
    )
    const fees = result.rows
    const total = fees.reduce((s: number, f: any) => s + parseFloat(f.amount), 0)
    const paid = fees.reduce((s: number, f: any) => s + parseFloat(f.paid_amount || 0), 0)
    res.json({
      fees,
      summary: {
        total: total.toFixed(2),
        paid: paid.toFixed(2),
        remaining: (total - paid).toFixed(2),
        unpaidCount: fees.filter((f: any) => f.status === 'unpaid' || f.status === 'partial').length,
      }
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/conduct', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
    if (!child) return res.json({ records: [], summary: {} })
    const result = await query(`
      SELECT c.*, u.name as reported_by_name
      FROM conduct_records c
      LEFT JOIN users u ON u.id = c.reported_by
      WHERE c.student_id = $1
      ORDER BY c.record_date DESC, c.created_at DESC`,
      [child.id]
    )
    const records = result.rows
    const points = records.reduce((s: number, r: any) => s + (r.points || 0), 0)
    res.json({
      records,
      summary: {
        total: records.length,
        incidents: records.filter((r: any) => r.record_type === 'incident').length,
        rewards: records.filter((r: any) => r.record_type === 'reward').length,
        warnings: records.filter((r: any) => r.record_type === 'warning').length,
        points,
      }
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/bus', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
    if (!child) return res.json({ bus: null, pickup: null })
    if (!child.bus_id) return res.json({ bus: null, pickup: null, message: 'الطالب غير مسجل في حافلة' })
    const busResult = await query(
      `SELECT id, bus_number, plate_number, driver_name, driver_phone, supervisor_name, supervisor_phone,
              capacity, route_name, route_description, morning_time, afternoon_time, is_active
       FROM buses WHERE id=$1`,
      [child.bus_id]
    )
    const pickup = (await query(
      'SELECT pickup_location, pickup_time, dropoff_location, dropoff_time FROM student_buses WHERE student_id=$1 AND bus_id=$2',
      [child.id, child.bus_id]
    )).rows[0] || null
    res.json({ bus: busResult.rows[0] || null, pickup, childName: child.name })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/messages/recipients', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const result = await query(
      `SELECT id, name, role, username
       FROM users
       WHERE school_id = $1 AND is_active = true AND role IN ('admin', 'teacher')
       ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, name ASC`,
      [schoolId]
    )
    res.json({ recipients: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/messages/:id', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(404).json({ error: 'Not found' })
    const { id: userId, schoolId } = req.user!
    const result = await query(`
      SELECT m.id, m.subject, m.body, m.is_read, m.created_at, m.from_user_id, m.to_user_id,
        fu.name as from_name, fu.role as from_role, tu.name as to_name, tu.role as to_role
      FROM messages m
      JOIN users fu ON fu.id = m.from_user_id
      JOIN users tu ON tu.id = m.to_user_id
      WHERE m.id = $1 AND m.school_id = $2`, [req.params.id, schoolId])
    const msg = result.rows[0]
    if (!msg) return res.status(404).json({ error: 'Not found' })
    if (msg.from_user_id !== userId && msg.to_user_id !== userId) {
      return res.status(403).json({ error: 'غير مصرح' })
    }
    if (msg.to_user_id === userId && !msg.is_read) {
      await query('UPDATE messages SET is_read=true WHERE id=$1', [req.params.id])
    }
    const replies = await query(`
      SELECT m.id, m.body, m.created_at, fu.name as from_name, fu.role as from_role
      FROM messages m JOIN users fu ON fu.id = m.from_user_id
      WHERE m.parent_message_id = $1 AND m.school_id = $2 ORDER BY m.created_at ASC`,
      [req.params.id, schoolId])
    res.json({ message: msg, replies: replies.rows })
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

router.put('/messages/:id/read', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    await query(
      `UPDATE messages SET is_read=true WHERE id=$1 AND school_id=$2 AND to_user_id=$3`,
      [req.params.id, req.user!.schoolId, req.user!.id]
    )
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/messages/:id/reply', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(404).json({ error: 'Not found' })
    const { id: fromId, schoolId } = req.user!
    const { body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'النص مطلوب' })
    if (body.length > 5000) return res.status(400).json({ error: 'الرد طويل جداً' })

    const parent = await query(
      'SELECT id, from_user_id, to_user_id, subject FROM messages WHERE id=$1 AND school_id=$2 AND parent_message_id IS NULL',
      [req.params.id, schoolId]
    )
    if (!parent.rows[0]) return res.status(404).json({ error: 'الرسالة غير موجودة' })

    const msg = parent.rows[0]
    if (msg.from_user_id !== fromId && msg.to_user_id !== fromId) {
      return res.status(403).json({ error: 'غير مصرح' })
    }

    const toId = msg.from_user_id === fromId ? msg.to_user_id : msg.from_user_id
    const result = await query(`
      INSERT INTO messages (school_id, from_user_id, to_user_id, subject, body, parent_message_id)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, body, created_at`,
      [schoolId, fromId, toId, `Re: ${msg.subject}`, body.trim().slice(0, 5000), req.params.id]
    )
    await query(
      `INSERT INTO notifications (school_id, user_id, title, body, type, link) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, toId, 'رد من ولي أمر', `${req.user!.name}: ${msg.subject}`, 'message', '/admin/messages']
    )
    res.status(201).json({ reply: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/messages', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    const { subject, body, priority, toUserId } = req.body

    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'الموضوع والنص مطلوبان' })
    }
    if (subject.length > 300) return res.status(400).json({ error: 'الموضوع طويل جداً' })
    if (body.length > 5000) return res.status(400).json({ error: 'الرسالة طويلة جداً' })

    let targetId = toUserId
    if (!targetId) {
      const adminResult = await query(`SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1`, [schoolId])
      targetId = adminResult.rows[0]?.id
    }
    if (!targetId) return res.status(400).json({ error: 'لا يوجد مسؤول في هذه المدرسة' })
    if (!(await canParentMessage(schoolId, targetId))) {
      return res.status(403).json({ error: 'لا يمكنك مراسلة هذا المستخدم' })
    }

    const result = await query(`
      INSERT INTO messages (school_id,from_user_id,to_user_id,subject,body,priority)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [schoolId, fromId, targetId, subject.trim(), body.trim(), priority || 'normal']
    )
    await query(`INSERT INTO notifications (school_id,user_id,title,body,type,link) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, targetId, 'رسالة من ولي أمر', `${req.user!.name}: ${subject.trim()}`, 'message', '/admin/messages'])
    res.status(201).json({ message: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/schedule', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
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

router.get('/exams', authenticateToken, requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const child = await getChild(req.user!.id, req.user!.schoolId, req.query.childId as string)
    if (!child) return res.json({ exams: [] })
    const result = await query(
      `SELECT e.id, e.subject_name, e.class_name, e.exam_type, e.exam_date, e.max_score, e.term, e.academic_year,
              g.score, g.percentage, g.grade_letter
       FROM exams e
       LEFT JOIN grades g ON g.student_id = $1 AND g.subject_name = e.subject_name AND g.school_id = e.school_id
       WHERE e.school_id = $2 AND (e.class_name = $3 OR e.class_name IS NULL)
       ORDER BY e.exam_date DESC`,
      [child.id, req.user!.schoolId, child.class_name]
    )
    res.json({ child, exams: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
