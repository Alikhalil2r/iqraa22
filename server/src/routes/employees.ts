import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('EMPLOYEES')

const EMP_COLUMNS = `id, employee_number, name, name_en, gender, date_of_birth, nationality,
  position, department, employee_type, status, join_date, end_date,
  email, phone, address, qualification, specialization, salary, allowances,
  photo, notes, created_at`

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { search, department, status, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let sql = `SELECT ${EMP_COLUMNS} FROM employees WHERE school_id=$1`
    const params: unknown[] = [schoolId]
    let i = 2
    if (search)     { sql += ` AND (name ILIKE $${i} OR employee_number ILIKE $${i} OR position ILIKE $${i})`; params.push(`%${String(search).slice(0,100)}%`); i++ }
    if (department) { sql += ` AND department=$${i}`; params.push(String(department).slice(0,50)); i++ }
    if (status)     { sql += ` AND status=$${i}`;     params.push(String(status).slice(0,20));     i++ }
    sql += ` ORDER BY name LIMIT $${i} OFFSET $${i + 1}`
    params.push(parseInt(String(limit)), offset)

    const [result, depts] = await Promise.all([
      query(sql, params),
      query('SELECT DISTINCT department FROM employees WHERE school_id=$1 AND department IS NOT NULL ORDER BY department', [schoolId])
    ])
    res.json({
      employees: result.rows,
      total: result.rowCount,
      departments: depts.rows.map((r: any) => r.department)
    })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT ${EMP_COLUMNS} FROM employees WHERE id=$1 AND school_id=$2`,
      [req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ employee: result.rows[0] })
  } catch (err) {
    log.error('GET /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, writeLimiter, requireRole('admin', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    if (!d.name) return res.status(400).json({ error: 'الاسم مطلوب' })
    const result = await query(`
      INSERT INTO employees (school_id,employee_number,name,name_en,gender,date_of_birth,nationality,
        position,department,employee_type,status,join_date,end_date,email,phone,address,
        qualification,specialization,salary,allowances,photo,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING ${EMP_COLUMNS}`,
      [schoolId, d.employeeNumber, d.name, d.nameEn, d.gender, d.dateOfBirth || null,
       d.nationality, d.position, d.department, d.employeeType || d.employmentType || 'full-time',
       d.status || 'active', d.joinDate || null, d.endDate || null,
       d.email, d.phone, d.address, d.qualification, d.specialization,
       parseFloat(d.salary) || 0, parseFloat(d.allowances) || 0,
       d.photo, d.notes?.slice(0, 2000)]
    )
    log.info('Employee created', { empId: result.rows[0].id, name: d.name })
    res.status(201).json({ employee: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authenticateToken, writeLimiter, requireRole('admin', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    if (!d.name) return res.status(400).json({ error: 'الاسم مطلوب' })
    const result = await query(`
      UPDATE employees SET employee_number=$1,name=$2,name_en=$3,gender=$4,date_of_birth=$5,
        nationality=$6,position=$7,department=$8,employee_type=$9,status=$10,join_date=$11,
        end_date=$12,email=$13,phone=$14,address=$15,qualification=$16,specialization=$17,
        salary=$18,allowances=$19,photo=$20,notes=$21
      WHERE id=$22 AND school_id=$23 RETURNING ${EMP_COLUMNS}`,
      [d.employeeNumber, d.name, d.nameEn, d.gender, d.dateOfBirth || null,
       d.nationality, d.position, d.department, d.employeeType || d.employmentType || 'full-time',
       d.status || 'active', d.joinDate || null, d.endDate || null,
       d.email, d.phone, d.address, d.qualification, d.specialization,
       parseFloat(d.salary) || 0, parseFloat(d.allowances) || 0,
       d.photo, d.notes?.slice(0, 2000),
       req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ employee: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const check = await query('SELECT id FROM employees WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    if (!check.rows[0]) return res.status(404).json({ error: 'Not found' })
    await query('DELETE FROM employees WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    log.info('Employee deleted', { empId: req.params.id })
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
