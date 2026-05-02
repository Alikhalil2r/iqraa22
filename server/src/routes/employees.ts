import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { search, department, status } = req.query
    let sql = 'SELECT * FROM employees WHERE school_id=$1'
    const params: any[] = [schoolId]
    let i = 2
    if (search) { sql += ` AND (name ILIKE $${i} OR employee_number ILIKE $${i} OR position ILIKE $${i})`; params.push(`%${search}%`); i++ }
    if (department) { sql += ` AND department = $${i}`; params.push(department); i++ }
    if (status) { sql += ` AND status = $${i}`; params.push(status); i++ }
    sql += ' ORDER BY name'
    const result = await query(sql, params)
    const depts = await query('SELECT DISTINCT department FROM employees WHERE school_id=$1 AND department IS NOT NULL ORDER BY department', [schoolId])
    res.json({ employees: result.rows, total: result.rowCount, departments: depts.rows.map((r:any)=>r.department) })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT * FROM employees WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ employee: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    const result = await query(`
      INSERT INTO employees (school_id,employee_number,name,name_en,gender,date_of_birth,nationality,
        position,department,employee_type,contract_type,join_date,end_date,salary,salary_currency,
        phone,email,address,qualification,specialization,status,photo,civil_id,passport_number,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING *`,
      [schoolId,d.employeeNumber,d.name,d.nameEn,d.gender,d.dateOfBirth,d.nationality,
       d.position,d.department,d.employeeType||'full-time',d.contractType,d.joinDate,d.endDate,
       d.salary,d.salaryCurrency||'OMR',d.phone,d.email,d.address,d.qualification,d.specialization,
       d.status||'active',d.photo,d.civilId,d.passportNumber,d.notes]
    )
    res.status(201).json({ employee: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const result = await query(`
      UPDATE employees SET name=$1,name_en=$2,gender=$3,date_of_birth=$4,nationality=$5,
        position=$6,department=$7,employee_type=$8,contract_type=$9,join_date=$10,end_date=$11,
        salary=$12,salary_currency=$13,phone=$14,email=$15,address=$16,qualification=$17,
        specialization=$18,status=$19,photo=$20,civil_id=$21,passport_number=$22,notes=$23,employee_number=$24
      WHERE id=$25 AND school_id=$26 RETURNING *`,
      [d.name,d.nameEn,d.gender,d.dateOfBirth,d.nationality,d.position,d.department,
       d.employeeType,d.contractType,d.joinDate,d.endDate,d.salary,d.salaryCurrency,
       d.phone,d.email,d.address,d.qualification,d.specialization,d.status,d.photo,
       d.civilId,d.passportNumber,d.notes,d.employeeNumber,req.params.id,req.user!.schoolId]
    )
    res.json({ employee: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM employees WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
