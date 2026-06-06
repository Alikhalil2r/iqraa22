import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { withTransaction } from '../db/transaction'
import { createLogger } from '../utils/logger'
import { logAudit } from './audit'

const router = Router()
const log = createLogger('Billing')

const PLAN_CONFIG: Record<string, { price: number; maxStudents: number; maxEmployees: number; label: string }> = {
  free:       { price: 0,  maxStudents: 50,   maxEmployees: 10,  label: 'مجاني' },
  basic:      { price: 29, maxStudents: 200,  maxEmployees: 30,  label: 'الأساسي' },
  pro:        { price: 79, maxStudents: 5000, maxEmployees: 500, label: 'الاحترافي' },
  enterprise: { price: 0,  maxStudents: 5000, maxEmployees: 500, label: 'المؤسسي' },
}

router.use(authenticateToken)
router.use(requireRole('super_admin', 'admin'))

// GET /api/billing — school plan + invoices
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [school, invoices] = await Promise.all([
      query(`SELECT id, name, plan, plan_expires_at, max_students, max_employees FROM schools WHERE id=$1`, [schoolId]),
      query(`SELECT * FROM invoices WHERE school_id=$1 ORDER BY created_at DESC LIMIT 20`, [schoolId]),
    ])
    res.json({ school: school.rows[0], invoices: invoices.rows })
  } catch (err) {
    log.error('billing fetch failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/billing/invoice — create invoice (super_admin or admin)
router.post('/invoice', requireRole('super_admin', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, name: userName, role } = req.user!
    const { plan, amount, currency = 'OMR', due_date, notes } = req.body

    if (!plan || !amount) return res.status(400).json({ error: 'الخطة والمبلغ مطلوبان' })

    const year = new Date().getFullYear()
    const countRow = await query(`SELECT COUNT(*) FROM invoices WHERE school_id=$1 AND EXTRACT(YEAR FROM created_at)=$2`, [schoolId, year])
    const seq = (parseInt(countRow.rows[0].count) + 1).toString().padStart(4, '0')
    const invoiceNumber = `INV-${year}-${seq}`

    const result = await withTransaction(async (client) => {
      const inv = await client.query(
        `INSERT INTO invoices (school_id, invoice_number, plan, amount, currency, due_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [schoolId, invoiceNumber, plan, amount, currency, due_date || null, notes || null]
      )
      return inv.rows[0]
    })

    await logAudit({
      schoolId, userId, userName, userRole: role,
      action: 'CREATE_INVOICE', entityType: 'invoice', entityId: result.id,
      description: `فاتورة جديدة ${invoiceNumber} - ${plan} - ${amount} ${currency}`,
      ip: req.ip,
    })

    res.json(result)
  } catch (err) {
    log.error('Create invoice failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/billing/invoice/:id/pay — mark invoice as paid
router.patch('/invoice/:id/pay', requireRole('super_admin', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, name: userName, role } = req.user!
    const inv = await query(
      `UPDATE invoices SET status='paid', paid_at=NOW() WHERE id=$1 AND school_id=$2 RETURNING *`,
      [req.params.id, schoolId]
    )
    if (!inv.rows[0]) return res.status(404).json({ error: 'الفاتورة غير موجودة' })

    await logAudit({
      schoolId, userId, userName, userRole: role,
      action: 'PAY_INVOICE', entityType: 'invoice', entityId: req.params.id,
      description: `تم سداد الفاتورة ${inv.rows[0].invoice_number}`,
      ip: req.ip,
    })

    res.json(inv.rows[0])
  } catch (err) {
    log.error('Pay invoice failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/billing/usage — current usage stats
router.get('/usage', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [school, students, employees] = await Promise.all([
      query(`SELECT plan, max_students, max_employees, plan_expires_at FROM schools WHERE id=$1`, [schoolId]),
      query(`SELECT COUNT(*) FROM students WHERE school_id=$1 AND status='active'`, [schoolId]),
      query(`SELECT COUNT(*) FROM employees WHERE school_id=$1 AND status='active'`, [schoolId]),
    ])
    res.json({
      plan: school.rows[0]?.plan || 'basic',
      planExpiresAt: school.rows[0]?.plan_expires_at,
      maxStudents: school.rows[0]?.max_students || 500,
      maxEmployees: school.rows[0]?.max_employees || 100,
      currentStudents: parseInt(students.rows[0]?.count || 0),
      currentEmployees: parseInt(employees.rows[0]?.count || 0),
    })
  } catch (err) {
    log.error('Usage fetch failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/billing/plan — تغيير خطة الاشتراك وإنشاء فاتورة
router.patch('/plan', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, name: userName, role } = req.user!
    const { plan, billingCycle = 'monthly' } = req.body
    const cfg = PLAN_CONFIG[plan]
    if (!cfg) return res.status(400).json({ error: 'خطة غير صالحة' })
    if (plan === 'enterprise') return res.status(400).json({ error: 'تواصل مع المبيعات للخطة المؤسسية' })

    const amount = cfg.price === 0 ? 0 : (billingCycle === 'yearly' ? Math.round(cfg.price * 12 * 0.8) : cfg.price)
    const expires = new Date()
    expires.setMonth(expires.getMonth() + (billingCycle === 'yearly' ? 12 : 1))

    const result = await withTransaction(async (client) => {
      await client.query(
        `UPDATE schools SET plan=$1, max_students=$2, max_employees=$3, plan_expires_at=$4 WHERE id=$5`,
        [plan, cfg.maxStudents, cfg.maxEmployees, expires, schoolId]
      )
      if (amount > 0) {
        const year = new Date().getFullYear()
        const countRow = await client.query(
          `SELECT COUNT(*) FROM invoices WHERE school_id=$1 AND EXTRACT(YEAR FROM created_at)=$2`,
          [schoolId, year]
        )
        const seq = (parseInt(countRow.rows[0].count) + 1).toString().padStart(4, '0')
        const invoiceNumber = `INV-${year}-${seq}`
        const due = new Date()
        due.setDate(due.getDate() + 14)
        await client.query(
          `INSERT INTO invoices (school_id, invoice_number, plan, amount, currency, due_date, notes, status)
           VALUES ($1,$2,$3,$4,'OMR',$5,$6,'pending')`,
          [schoolId, invoiceNumber, plan, amount, due.toISOString().slice(0, 10), `ترقية إلى ${cfg.label}`]
        )
      }
      return cfg
    })

    await logAudit({
      schoolId, userId, userName, userRole: role,
      action: 'CHANGE_PLAN', entityType: 'school', entityId: schoolId!,
      description: `تغيير الخطة إلى ${result.label}`,
      ip: req.ip,
    })

    res.json({ success: true, plan, label: result.label, amount })
  } catch (err) {
    log.error('Change plan failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/billing/cancel — إلغاء الاشتراك (العودة للمجاني)
router.post('/cancel', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, name: userName, role } = req.user!
    const cfg = PLAN_CONFIG.free
    await query(
      `UPDATE schools SET plan='free', max_students=$1, max_employees=$2, plan_expires_at=NULL WHERE id=$3`,
      [cfg.maxStudents, cfg.maxEmployees, schoolId]
    )
    await logAudit({
      schoolId, userId, userName, userRole: role,
      action: 'CANCEL_PLAN', entityType: 'school', entityId: schoolId!,
      description: 'إلغاء الاشتراك والعودة للخطة المجانية',
      ip: req.ip,
    })
    res.json({ success: true, plan: 'free' })
  } catch (err) {
    log.error('Cancel plan failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
