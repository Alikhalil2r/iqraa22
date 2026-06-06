import { Router } from 'express'
import { query } from '../db'
import { withTransaction } from '../db/transaction'
import { authenticateToken, AuthRequest, requireRole, STAFF_ROLES } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('ATTENDANCE')

const ALLOWED_STATUSES     = ['present', 'absent', 'late', 'excused'] as const
const ALLOWED_PERSON_TYPES = ['student', 'employee'] as const

router.get('/', authenticateToken, requireRole(...STAFF_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { date, personType, classId } = req.query
    let sql = `
      SELECT a.id, a.person_type, a.person_id, a.date, a.status,
             a.check_in_time, a.check_out_time, a.notes, a.created_at,
             CASE WHEN a.person_type='student' THEN s.name ELSE e.name END as person_name,
             CASE WHEN a.person_type='student' THEN s.class_name ELSE e.department END as group_name
      FROM attendance a
      LEFT JOIN students s ON s.id=a.person_id AND a.person_type='student'
      LEFT JOIN employees e ON e.id=a.person_id AND a.person_type='employee'
      WHERE a.school_id=$1`
    const params: unknown[] = [schoolId]
    let i = 2
    if (date) { sql += ` AND a.date=$${i}`; params.push(date); i++ }
    if (personType && ALLOWED_PERSON_TYPES.includes(String(personType) as any)) {
      sql += ` AND a.person_type=$${i}`; params.push(personType); i++
    }
    if (classId) { sql += ` AND s.class_id=$${i}`; params.push(classId); i++ }
    sql += ' ORDER BY person_name LIMIT 500'
    const result = await query(sql, params)
    res.json({ attendance: result.rows })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, writeLimiter, requireRole('admin', 'teacher', 'guard'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { personType, personId, date, status, checkInTime, checkOutTime, notes } = req.body

    if (!ALLOWED_STATUSES.includes(status))          return res.status(400).json({ error: 'حالة الحضور غير صالحة' })
    if (!personType || !ALLOWED_PERSON_TYPES.includes(personType)) return res.status(400).json({ error: 'نوع الشخص غير صالح' })
    if (!personId || !date)                          return res.status(400).json({ error: 'بيانات ناقصة' })

    const result = await query(`
      INSERT INTO attendance (school_id,person_type,person_id,date,status,check_in_time,check_out_time,notes,recorded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (person_type,person_id,date) DO UPDATE
      SET status=EXCLUDED.status, check_in_time=EXCLUDED.check_in_time,
          check_out_time=EXCLUDED.check_out_time, notes=EXCLUDED.notes
      RETURNING *`,
      [schoolId, personType, personId, date, status, checkInTime || null,
       checkOutTime || null, notes?.slice(0, 500), userId]
    )
    res.status(201).json({ attendance: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/bulk', authenticateToken, writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { records } = req.body
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'بيانات الحضور مطلوبة' })
    }
    if (records.length > 200) {
      return res.status(400).json({ error: 'الحد الأقصى 200 سجل في المرة الواحدة' })
    }

    const validRecords = records.filter(r =>
      ALLOWED_STATUSES.includes(r.status) && ALLOWED_PERSON_TYPES.includes(r.personType)
    )
    if (validRecords.length === 0) {
      return res.status(400).json({ error: 'لا توجد سجلات صالحة' })
    }

    const results = await withTransaction(async (client) => {
      const inserted = []
      for (const r of validRecords) {
        const result = await client.query(`
          INSERT INTO attendance (school_id,person_type,person_id,date,status,recorded_by)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (person_type,person_id,date) DO UPDATE SET status=EXCLUDED.status
          RETURNING *`,
          [schoolId, r.personType, r.personId, r.date, r.status, userId]
        )
        inserted.push(result.rows[0])
      }
      return inserted
    })

    log.info('Bulk attendance saved', { count: results.length, schoolId })
    res.json({ attendance: results, count: results.length })
  } catch (err) {
    log.error('POST /bulk failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/stats', authenticateToken, requireRole(...STAFF_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { personType, startDate, endDate } = req.query
    const safeType = personType && ALLOWED_PERSON_TYPES.includes(String(personType) as any)
      ? String(personType) : 'student'
    const result = await query(`
      SELECT date, status, COUNT(*) as count
      FROM attendance WHERE school_id=$1 AND person_type=$2
        AND date BETWEEN $3 AND $4
      GROUP BY date, status ORDER BY date DESC`,
      [schoolId, safeType,
       startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
       endDate   || new Date().toISOString().split('T')[0]]
    )
    res.json({ stats: result.rows })
  } catch (err) {
    log.error('GET /stats failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
