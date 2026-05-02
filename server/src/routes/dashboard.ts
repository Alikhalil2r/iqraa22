import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const today = new Date().toISOString().split('T')[0]

    const [
      studentsResult, employeesResult, busesResult,
      studentsAttResult, employeesAttResult,
      messagesResult, newsResult, eventsResult
    ] = await Promise.all([
      query('SELECT COUNT(*) FROM students WHERE school_id=$1 AND status=$2', [schoolId,'active']),
      query('SELECT COUNT(*) FROM employees WHERE school_id=$1 AND status=$2', [schoolId,'active']),
      query('SELECT COUNT(*) FROM buses WHERE school_id=$1 AND is_active=$2', [schoolId,true]),
      query(`SELECT status, COUNT(*) FROM attendance WHERE school_id=$1 AND date=$2 AND person_type='student' GROUP BY status`, [schoolId,today]),
      query(`SELECT status, COUNT(*) FROM attendance WHERE school_id=$1 AND date=$2 AND person_type='employee' GROUP BY status`, [schoolId,today]),
      query(`SELECT COUNT(*) FROM messages WHERE school_id=$1 AND to_user_id=(SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1) AND is_read=false`, [schoolId]),
      query('SELECT COUNT(*) FROM news WHERE school_id=$1 AND is_published=true', [schoolId]),
      query('SELECT COUNT(*) FROM events WHERE school_id=$1 AND start_date >= NOW()', [schoolId]),
    ])

    const attS = studentsAttResult.rows.reduce((a: any, r: any) => { a[r.status] = parseInt(r.count); return a }, {})
    const attE = employeesAttResult.rows.reduce((a: any, r: any) => { a[r.status] = parseInt(r.count); return a }, {})

    // Weekly attendance trend (last 7 days)
    const weeklyAtt = await query(`
      SELECT date, person_type, status, COUNT(*) as count
      FROM attendance WHERE school_id=$1 AND date >= NOW()-INTERVAL '7 days'
      GROUP BY date, person_type, status ORDER BY date
    `, [schoolId])

    // Salary total
    const salaryResult = await query('SELECT SUM(salary) as total FROM employees WHERE school_id=$1 AND status=$2', [schoolId,'active'])

    res.json({
      students: { total: parseInt(studentsResult.rows[0].count) },
      employees: { total: parseInt(employeesResult.rows[0].count) },
      buses: { total: parseInt(busesResult.rows[0].count) },
      todayAttendance: {
        students: attS,
        employees: attE,
        date: today
      },
      messages: { unread: parseInt(messagesResult.rows[0].count) },
      news: { total: parseInt(newsResult.rows[0].count) },
      events: { upcoming: parseInt(eventsResult.rows[0].count) },
      salary: { total: parseFloat(salaryResult.rows[0].total || 0) },
      weeklyAttendance: weeklyAtt.rows
    })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/activity', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const [news, events, messages] = await Promise.all([
      query(`SELECT 'news' as type, title, created_at FROM news WHERE school_id=$1 ORDER BY created_at DESC LIMIT 5`, [schoolId]),
      query(`SELECT 'event' as type, title, start_date as created_at FROM events WHERE school_id=$1 ORDER BY created_at DESC LIMIT 5`, [schoolId]),
      query(`SELECT 'message' as type, subject as title, created_at FROM messages WHERE school_id=$1 ORDER BY created_at DESC LIMIT 5`, [schoolId]),
    ])
    const activity = [...news.rows, ...events.rows, ...messages.rows]
      .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
    res.json({ activity })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
