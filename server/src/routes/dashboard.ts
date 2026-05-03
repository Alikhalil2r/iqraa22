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

    const [students, employees, buses, fees, attendance, unreadMsgs, events] = await Promise.all([
      query('SELECT COUNT(*) FROM students WHERE school_id=$1 AND is_active=true', [schoolId]),
      query('SELECT COUNT(*), COALESCE(SUM(salary + allowances),0) as total_salary FROM employees WHERE school_id=$1 AND status=$2', [schoolId, 'active']),
      query('SELECT COUNT(*) FROM buses WHERE school_id=$1 AND is_active=true', [schoolId]),
      query(`SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(paid_amount),0) as collected FROM fees WHERE school_id=$1`, [schoolId]),
      query(`SELECT status, COUNT(*) as count FROM attendance WHERE school_id=$1 AND date=$2 AND person_type='student' GROUP BY status`, [schoolId, today]),
      query(`SELECT COUNT(*) FROM messages WHERE school_id=$1 AND to_user_id=(SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1) AND is_read=false`, [schoolId]),
      query(`SELECT COUNT(*) FROM events WHERE school_id=$1 AND start_date >= CURRENT_DATE AND start_date <= CURRENT_DATE + INTERVAL '30 days'`, [schoolId]),
    ])

    const attMap = Object.fromEntries(
      attendance.rows.map((r: any) => [r.status, parseInt(r.count)])
    )

    res.json({
      students:      parseInt(students.rows[0].count),
      employees:     parseInt(employees.rows[0].count),
      totalSalary:   parseFloat(employees.rows[0].total_salary),
      buses:         parseInt(buses.rows[0].count),
      feesTotal:     parseFloat(fees.rows[0].total),
      feesCollected: parseFloat(fees.rows[0].collected),
      attendance: {
        present: attMap['present'] || 0,
        absent:  attMap['absent']  || 0,
        late:    attMap['late']    || 0,
        excused: attMap['excused'] || 0,
      },
      unreadMessages:  parseInt(unreadMsgs.rows[0].count),
      upcomingEvents:  parseInt(events.rows[0].count),
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
