import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('DASHBOARD')

router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const today = new Date().toISOString().split('T')[0]

    const [
      students,
      employees,
      buses,
      todayStudentAtt,
      todayEmployeeAtt,
      unreadMsgs,
      events,
      weeklyAtt,
    ] = await Promise.all([
      query(`SELECT COUNT(*) FROM students WHERE school_id=$1 AND status='active'`, [schoolId]),
      query(`SELECT COUNT(*), COALESCE(SUM(salary),0) as total_salary FROM employees WHERE school_id=$1 AND status='active'`, [schoolId]),
      query(`SELECT COUNT(*) FROM buses WHERE school_id=$1 AND is_active=true`, [schoolId]),
      query(`SELECT status, COUNT(*) as count FROM attendance WHERE school_id=$1 AND date=$2 AND person_type='student' GROUP BY status`, [schoolId, today]),
      query(`SELECT status, COUNT(*) as count FROM attendance WHERE school_id=$1 AND date=$2 AND person_type='employee' GROUP BY status`, [schoolId, today]),
      query(`SELECT COUNT(*) FROM messages WHERE school_id=$1 AND to_user_id=(SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1) AND is_read=false`, [schoolId]),
      query(`SELECT COUNT(*) FROM events WHERE school_id=$1 AND start_date >= CURRENT_DATE AND start_date <= CURRENT_DATE + INTERVAL '30 days'`, [schoolId]),
      query(`
        SELECT date, person_type, status, COUNT(*) as count
        FROM attendance
        WHERE school_id=$1 AND date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY date, person_type, status
        ORDER BY date ASC
      `, [schoolId]),
    ])

    const buildAttMap = (rows: any[]) => {
      const m: Record<string, number> = {}
      rows.forEach((r: any) => { m[r.status] = parseInt(r.count) })
      return { present: m['present'] || 0, absent: m['absent'] || 0, late: m['late'] || 0, excused: m['excused'] || 0 }
    }

    res.json({
      students:  { total: parseInt(students.rows[0].count) },
      employees: { total: parseInt(employees.rows[0].count) },
      buses:     { total: parseInt(buses.rows[0].count) },
      salary:    { total: parseFloat(employees.rows[0].total_salary) },
      todayAttendance: {
        students:  buildAttMap(todayStudentAtt.rows),
        employees: buildAttMap(todayEmployeeAtt.rows),
      },
      messages:  { unread: parseInt(unreadMsgs.rows[0].count) },
      events:    { upcoming: parseInt(events.rows[0].count) },
      weeklyAttendance: weeklyAtt.rows,
    })
  } catch (err) {
    log.error('GET /stats failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/activity', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [news, events, messages] = await Promise.all([
      query(`SELECT 'news' as type, title, created_at FROM news WHERE school_id=$1 ORDER BY created_at DESC LIMIT 5`, [schoolId]),
      query(`SELECT 'event' as type, title, start_date as created_at FROM events WHERE school_id=$1 ORDER BY start_date DESC LIMIT 5`, [schoolId]),
      query(`SELECT 'message' as type, subject as title, created_at FROM messages WHERE school_id=$1 ORDER BY created_at DESC LIMIT 5`, [schoolId]),
    ])
    const activity = [...news.rows, ...events.rows, ...messages.rows]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
    res.json({ activity })
  } catch (err) {
    log.error('GET /activity failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
