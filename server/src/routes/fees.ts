import { Router } from 'express'
import { query } from '../db'
import { withTransaction } from '../db/transaction'
import { authenticateToken, AuthRequest, requireRole, FINANCE_ROLES } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'
import { notifyParentOfStudent } from '../utils/parentNotify'

const router = Router()
router.use(authenticateToken)
const log = createLogger('FEES')

router.get('/', requireRole(...FINANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { status, studentId, academicYear, term, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let q = `
      SELECT f.id, f.fee_type, f.description, f.amount, f.paid_amount, f.due_date,
             f.paid_date, f.payment_method, f.status, f.academic_year, f.term,
             f.reference_number, f.notes, f.created_at,
             s.name as student_name, s.student_number, s.class_name
      FROM fees f
      LEFT JOIN students s ON s.id = f.student_id
      WHERE f.school_id = $1`
    const params: unknown[] = [schoolId]
    if (status)       { params.push(status);      q += ` AND f.status = $${params.length}` }
    if (studentId)    { params.push(studentId);   q += ` AND f.student_id = $${params.length}` }
    if (academicYear) { params.push(academicYear); q += ` AND f.academic_year = $${params.length}` }
    if (term)         { params.push(term);         q += ` AND f.term = $${params.length}` }
    q += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)

    const [result, stats] = await Promise.all([
      query(q, params),
      query(`
        SELECT COUNT(*) as total,
          COALESCE(SUM(amount),0) as total_amount,
          COALESCE(SUM(paid_amount),0) as collected,
          COALESCE(SUM(amount - paid_amount),0) as pending,
          SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END) as paid_count,
          SUM(CASE WHEN status='unpaid' THEN 1 ELSE 0 END) as unpaid_count,
          SUM(CASE WHEN status='partial' THEN 1 ELSE 0 END) as partial_count,
          SUM(CASE WHEN due_date < CURRENT_DATE AND status != 'paid' THEN 1 ELSE 0 END) as overdue_count
        FROM fees WHERE school_id = $1`, [schoolId])
    ])

    res.json({ fees: result.rows, total: result.rowCount, stats: stats.rows[0] })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/stats', requireRole(...FINANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const stats = await query(`
      SELECT COUNT(*) as total,
        COALESCE(SUM(amount),0) as total_amount,
        COALESCE(SUM(paid_amount),0) as collected,
        COALESCE(SUM(amount - paid_amount),0) as pending,
        COALESCE(SUM(CASE WHEN due_date < CURRENT_DATE AND status!='paid' THEN (amount-paid_amount) ELSE 0 END),0) as overdue
      FROM fees WHERE school_id=$1`, [schoolId])
    res.json(stats.rows[0])
  } catch (err) {
    log.error('GET /stats failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', writeLimiter, requireRole('admin', 'accountant'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { studentId, feeType, description, amount, paidAmount, dueDate, paidDate,
            paymentMethod, status, academicYear, term, referenceNumber, notes } = req.body
    if (!studentId || !feeType || !amount) {
      return res.status(400).json({ error: 'studentId، feeType، amount مطلوبة' })
    }

    const result = await withTransaction(async (client) => {
      const studentCheck = await client.query(
        'SELECT id FROM students WHERE id=$1 AND school_id=$2', [studentId, schoolId]
      )
      if (!studentCheck.rows[0]) throw Object.assign(new Error('Student not found'), { status: 404 })

      return client.query(`
        INSERT INTO fees (school_id, student_id, fee_type, description, amount, paid_amount, due_date,
          paid_date, payment_method, status, academic_year, term, reference_number, notes, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
        [schoolId, studentId, feeType, description, parseFloat(amount),
         parseFloat(paidAmount) || 0, dueDate || null, paidDate || null,
         paymentMethod || null, status || 'unpaid', academicYear || null,
         term || null, referenceNumber || null, notes || null, userId]
      )
    })

    const fee = result.rows[0]
    log.info('Fee created', { schoolId, studentId, amount })
    if (fee.status === 'unpaid' || fee.status === 'partial') {
      await notifyParentOfStudent(
        schoolId, studentId,
        'رسوم دراسية جديدة',
        `${feeType}: ${parseFloat(amount)} ر.ع${fee.due_date ? ` — الاستحقاق ${fee.due_date}` : ''}`,
        'fee', '/parent/fees'
      )
    }
    res.status(201).json({ fee })
  } catch (err: any) {
    log.error('POST / failed', { error: err.message })
    if (err.status === 404) return res.status(404).json({ error: 'الطالب غير موجود' })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', writeLimiter, requireRole('admin', 'accountant'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { studentId, feeType, description, amount, paidAmount, dueDate, paidDate,
            paymentMethod, status, academicYear, term, referenceNumber, notes } = req.body
    const result = await query(`
      UPDATE fees SET student_id=$1, fee_type=$2, description=$3, amount=$4, paid_amount=$5,
        due_date=$6, paid_date=$7, payment_method=$8, status=$9, academic_year=$10,
        term=$11, reference_number=$12, notes=$13
      WHERE id=$14 AND school_id=$15 RETURNING *`,
      [studentId, feeType, description, parseFloat(amount), parseFloat(paidAmount) || 0,
       dueDate || null, paidDate || null, paymentMethod || null, status || 'unpaid',
       academicYear || null, term || null, referenceNumber || null, notes || null,
       req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    const fee = result.rows[0]
    if (fee.status === 'paid') {
      await notifyParentOfStudent(
        schoolId, fee.student_id,
        'تم تأكيد الدفع',
        `${fee.fee_type}: تم سداد ${parseFloat(fee.paid_amount)} ر.ع`,
        'fee', '/parent/fees'
      )
    } else if (fee.status === 'unpaid' || fee.status === 'partial') {
      await notifyParentOfStudent(
        schoolId, fee.student_id,
        'تحديث الرسوم',
        `${fee.fee_type}: المتبقي ${(parseFloat(fee.amount) - parseFloat(fee.paid_amount || 0)).toFixed(2)} ر.ع`,
        'fee', '/parent/fees'
      )
    }
    res.json({ fee })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM fees WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    log.info('Fee deleted', { feeId: req.params.id })
    res.json({ ok: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
