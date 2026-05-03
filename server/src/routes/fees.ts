import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { status, studentId, academicYear, term } = req.query
    let q = `
      SELECT f.*, s.name as student_name, s.student_number, s.class_name
      FROM fees f
      LEFT JOIN students s ON s.id = f.student_id
      WHERE f.school_id = $1
    `
    const params: any[] = [schoolId]
    if (status) { params.push(status); q += ` AND f.status = $${params.length}` }
    if (studentId) { params.push(studentId); q += ` AND f.student_id = $${params.length}` }
    if (academicYear) { params.push(academicYear); q += ` AND f.academic_year = $${params.length}` }
    if (term) { params.push(term); q += ` AND f.term = $${params.length}` }
    q += ' ORDER BY f.created_at DESC'
    const result = await query(q, params)

    const stats = await query(`
      SELECT
        COUNT(*) as total,
        SUM(amount) as total_amount,
        SUM(paid_amount) as collected,
        SUM(amount - paid_amount) as pending,
        SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'paid' THEN 1 ELSE 0 END) as overdue_count
      FROM fees WHERE school_id = $1
    `, [schoolId])

    res.json({ fees: result.rows, total: result.rowCount, stats: stats.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const stats = await query(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(paid_amount), 0) as collected,
        COALESCE(SUM(amount - paid_amount), 0) as pending,
        SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'paid' THEN 1 ELSE 0 END) as overdue_count
      FROM fees WHERE school_id = $1
    `, [schoolId])
    res.json({ stats: stats.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId, userId } = req.user!
    const { studentId, feeType, description, amount, paidAmount, dueDate, paidDate, paymentMethod, status, academicYear, term, referenceNumber, notes } = req.body
    if (!studentId || !feeType || !amount) return res.status(400).json({ error: 'student, feeType, amount required' })
    const result = await query(`
      INSERT INTO fees (school_id, student_id, fee_type, description, amount, paid_amount, due_date, paid_date,
        payment_method, status, academic_year, term, reference_number, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `, [schoolId, studentId, feeType, description, amount, paidAmount||0, dueDate||null, paidDate||null,
        paymentMethod||null, status||'unpaid', academicYear||null, term||null, referenceNumber||null, notes||null, userId])
    res.status(201).json({ fee: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { id } = req.params
    const { studentId, feeType, description, amount, paidAmount, dueDate, paidDate, paymentMethod, status, academicYear, term, referenceNumber, notes } = req.body
    const result = await query(`
      UPDATE fees SET student_id=$1, fee_type=$2, description=$3, amount=$4, paid_amount=$5, due_date=$6, paid_date=$7,
        payment_method=$8, status=$9, academic_year=$10, term=$11, reference_number=$12, notes=$13
      WHERE id=$14 AND school_id=$15 RETURNING *
    `, [studentId, feeType, description, amount, paidAmount||0, dueDate||null, paidDate||null,
        paymentMethod||null, status||'unpaid', academicYear||null, term||null, referenceNumber||null, notes||null, id, schoolId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ fee: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    await query('DELETE FROM fees WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
