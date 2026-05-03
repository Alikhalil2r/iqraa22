import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
router.use(authenticateToken)
const log = createLogger('LEAVES')

router.get('/types', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const existing = await query('SELECT COUNT(*) FROM leave_types WHERE school_id=$1', [schoolId])
    if (parseInt(existing.rows[0].count) === 0) {
      const defaults = [
        ['إجازة سنوية', 'Annual Leave', 30, true, '#6366f1'],
        ['إجازة مرضية', 'Sick Leave', 15, true, '#ef4444'],
        ['إجازة طارئة', 'Emergency Leave', 5, false, '#f97316'],
        ['إجازة رسمية', 'Official Leave', 10, false, '#0ea5e9'],
        ['إجازة أمومة/أبوة', 'Parental Leave', 60, true, '#8b5cf6'],
        ['إجازة بدون راتب', 'Unpaid Leave', 30, false, '#6b7280'],
      ]
      for (const [name, nameEn, days, isPaid, color] of defaults)
        await query(
          `INSERT INTO leave_types (school_id,name,name_en,max_days_per_year,is_paid,color)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
          [schoolId, name, nameEn, days, isPaid, color]
        )
    }
    const types = await query(
      'SELECT id, name, name_en, max_days_per_year, is_paid, color FROM leave_types WHERE school_id=$1 ORDER BY name',
      [schoolId]
    )
    res.json({ types: types.rows })
  } catch (err) {
    log.error('GET /types failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { status, employeeId, year, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let q = `
      SELECT el.id, el.employee_id, el.leave_type_id, el.leave_type_name,
             el.start_date, el.end_date, el.days, el.reason, el.status,
             el.rejection_reason, el.approved_at, el.created_at,
             e.name as employee_name, e.employee_number, e.position, e.department,
             lt.name as leave_type_display, lt.color as leave_color, lt.is_paid,
             u.name as approved_by_name
      FROM employee_leaves el
      LEFT JOIN employees e  ON e.id  = el.employee_id
      LEFT JOIN leave_types lt ON lt.id = el.leave_type_id
      LEFT JOIN users u       ON u.id  = el.approved_by
      WHERE el.school_id=$1`
    const params: unknown[] = [schoolId]
    if (status)     { params.push(status);       q += ` AND el.status=$${params.length}` }
    if (employeeId) { params.push(employeeId);   q += ` AND el.employee_id=$${params.length}` }
    if (year)       { params.push(`${year}%`);   q += ` AND el.start_date::text LIKE $${params.length}` }
    q += ` ORDER BY el.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)

    const [result, stats] = await Promise.all([
      query(q, params),
      query(`
        SELECT COUNT(*) as total,
          COUNT(CASE WHEN status='pending'  THEN 1 END) as pending,
          COUNT(CASE WHEN status='approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status='rejected' THEN 1 END) as rejected,
          COALESCE(SUM(CASE WHEN status='approved' THEN days ELSE 0 END),0) as total_approved_days
        FROM employee_leaves WHERE school_id=$1`, [schoolId])
    ])
    res.json({ leaves: result.rows, stats: stats.rows[0] })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { employeeId, leaveTypeId, leaveTypeName, startDate, endDate, days, reason } = req.body
    if (!employeeId || !startDate || !endDate || !days)
      return res.status(400).json({ error: 'الموظف والتواريخ وعدد الأيام مطلوبة' })
    const result = await query(`
      INSERT INTO employee_leaves (school_id, employee_id, leave_type_id, leave_type_name, start_date, end_date, days, reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [schoolId, employeeId, leaveTypeId || null, leaveTypeName, startDate, endDate,
       parseInt(String(days)), reason?.slice(0, 1000)]
    )
    log.info('Leave request created', { leaveId: result.rows[0].id, employeeId })
    res.status(201).json({ leave: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id/approve', writeLimiter, requireRole('admin', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const result = await query(`
      UPDATE employee_leaves SET status='approved', approved_by=$1, approved_at=NOW()
      WHERE id=$2 AND school_id=$3 RETURNING *`,
      [userId, req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    const leave = result.rows[0]
    const today = new Date().toISOString().split('T')[0]
    if (leave.start_date <= today && leave.end_date >= today)
      await query(`UPDATE employees SET status='on-leave' WHERE id=$1`, [leave.employee_id])
    log.info('Leave approved', { leaveId: req.params.id })
    res.json({ leave: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id/approve failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id/reject', writeLimiter, requireRole('admin', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { rejectionReason } = req.body
    const result = await query(`
      UPDATE employee_leaves SET status='rejected', approved_by=$1, approved_at=NOW(), rejection_reason=$2
      WHERE id=$3 AND school_id=$4 RETURNING *`,
      [userId, rejectionReason?.slice(0, 500), req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    log.info('Leave rejected', { leaveId: req.params.id })
    res.json({ leave: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id/reject failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { leaveTypeName, startDate, endDate, days, reason, status } = req.body
    const result = await query(`
      UPDATE employee_leaves SET
        leave_type_name=COALESCE($1,leave_type_name),
        start_date=COALESCE($2,start_date), end_date=COALESCE($3,end_date),
        days=COALESCE($4,days), reason=COALESCE($5,reason), status=COALESCE($6,status)
      WHERE id=$7 AND school_id=$8 RETURNING *`,
      [leaveTypeName, startDate, endDate, days ? parseInt(String(days)) : null,
       reason?.slice(0, 1000), status, req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ leave: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await query(`UPDATE employee_leaves SET status='cancelled' WHERE id=$1 AND school_id=$2`,
      [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/balance/:employeeId', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const year = new Date().getFullYear()
    const used = await query(`
      SELECT lt.name, lt.color, lt.max_days_per_year, lt.is_paid,
             COALESCE(SUM(CASE WHEN el.status='approved' THEN el.days ELSE 0 END),0) as used_days
      FROM leave_types lt
      LEFT JOIN employee_leaves el ON el.leave_type_id=lt.id
        AND el.employee_id=$1
        AND EXTRACT(YEAR FROM el.start_date)=$2
        AND el.status='approved'
      WHERE lt.school_id=$3
      GROUP BY lt.id, lt.name, lt.color, lt.max_days_per_year, lt.is_paid`,
      [req.params.employeeId, year, schoolId]
    )
    res.json({ balance: used.rows })
  } catch (err) {
    log.error('GET /balance/:employeeId failed', { id: req.params.employeeId, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
