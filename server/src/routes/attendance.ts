import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()

const ALLOWED_STATUSES = ['present', 'absent', 'late', 'excused']
const ALLOWED_PERSON_TYPES = ['student', 'employee']

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { date, personType, classId } = req.query
    let sql = `
      SELECT a.*,
        CASE WHEN a.person_type='student' THEN s.name ELSE e.name END as person_name,
        CASE WHEN a.person_type='student' THEN s.class_name ELSE e.department END as group_name
      FROM attendance a
      LEFT JOIN students s ON s.id=a.person_id AND a.person_type='student'
      LEFT JOIN employees e ON e.id=a.person_id AND a.person_type='employee'
      WHERE a.school_id=$1`
    const params: any[] = [schoolId]
    let i = 2
    if (date) { sql += ` AND a.date=$${i}`; params.push(date); i++ }
    if (personType && ALLOWED_PERSON_TYPES.includes(String(personType))) {
      sql += ` AND a.person_type=$${i}`; params.push(personType); i++
    }
    if (classId) { sql += ` AND s.class_id=$${i}`; params.push(classId); i++ }
    sql += ' ORDER BY person_name'
    const result = await query(sql, params)
    res.json({ attendance: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { personType, personId, date, status, checkInTime, checkOutTime, notes } = req.body

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'حالة الحضور غير صالحة' })
    }
    if (!personType || !ALLOWED_PERSON_TYPES.includes(personType)) {
      return res.status(400).json({ error: 'نوع الشخص غير صالح' })
    }
    if (!personId || !date) {
      return res.status(400).json({ error: 'بيانات ناقصة' })
    }

    const result = await query(`
      INSERT INTO attendance (school_id,person_type,person_id,date,status,check_in_time,check_out_time,notes,recorded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (person_type,person_id,date) DO UPDATE
      SET status=EXCLUDED.status, check_in_time=EXCLUDED.check_in_time,
          check_out_time=EXCLUDED.check_out_time, notes=EXCLUDED.notes
      RETURNING *`,
      [schoolId, personType, personId, date, status, checkInTime, checkOutTime, notes?.slice(0, 500), userId]
    )
    res.status(201).json({ attendance: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/bulk', authenticateToken, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { records } = req.body
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'بيانات الحضور مطلوبة' })
    }
    if (records.length > 200) {
      return res.status(400).json({ error: 'الحد الأقصى 200 سجل في المرة الواحدة' })
    }

    const results = []
    for (const r of records) {
      if (!ALLOWED_STATUSES.includes(r.status)) continue
      const result = await query(`
        INSERT INTO attendance (school_id,person_type,person_id,date,status,recorded_by)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (person_type,person_id,date) DO UPDATE SET status=EXCLUDED.status
        RETURNING *`,
        [schoolId, r.personType, r.personId, r.date, r.status, userId]
      )
      results.push(result.rows[0])
    }
    res.json({ attendance: results, count: results.length })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { personType, startDate, endDate } = req.query
    const safeType = personType && ALLOWED_PERSON_TYPES.includes(String(personType)) ? personType : 'student'
    const result = await query(`
      SELECT date, status, COUNT(*) as count
      FROM attendance WHERE school_id=$1
        AND person_type=$2
        AND date BETWEEN $3 AND $4
      GROUP BY date, status ORDER BY date DESC`,
      [schoolId, safeType,
       startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
       endDate || new Date().toISOString().split('T')[0]]
    )
    res.json({ stats: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
