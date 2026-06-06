import { Router } from 'express'
import crypto from 'crypto'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('PAYMENTS')
const MOCK = process.env.PAYMENT_MOCK_MODE !== 'false'

async function getFeeForParent(feeId: string, parentId: string, schoolId: string) {
  const r = await query(
    `SELECT f.* FROM fees f
     JOIN students s ON s.id = f.student_id
     WHERE f.id=$1 AND f.school_id=$2 AND s.parent_id=$3`,
    [feeId, schoolId, parentId]
  )
  return r.rows[0]
}

// POST /api/payments/webhook — provider callback (no auth; verified by secret in prod)
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET
    if (!MOCK && secret && req.headers['x-webhook-secret'] !== secret) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { sessionId, externalSessionId, status = 'completed' } = req.body
    const r = await query(
      `SELECT * FROM payment_sessions WHERE id=$1 OR external_session_id=$2 LIMIT 1`,
      [sessionId, externalSessionId]
    )
    const session = r.rows[0]
    if (!session) return res.status(404).json({ error: 'Session not found' })
    if (session.status === 'completed') return res.json({ ok: true, already: true })

    if (status === 'completed' && session.fee_id) {
      await query(
        `UPDATE fees SET status='paid', paid_amount=amount, paid_date=CURRENT_DATE,
         payment_method=$1, reference_number=$2 WHERE id=$3`,
        [session.provider, session.external_session_id, session.fee_id]
      )
    }

    await query(
      `UPDATE payment_sessions SET status=$1, completed_at=NOW(),
       receipt_url=$2 WHERE id=$3`,
      [status, `/api/payments/receipt/${session.id}`, session.id]
    )

    res.json({ ok: true })
  } catch (err) {
    log.error('POST /webhook failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.use(authenticateToken)

// POST /api/payments/session — create payment session (Thawani/PayTabs mock)
router.post('/session', requireRole('parent'), async (req: AuthRequest, res) => {
  try {
    const { feeId, provider = 'thawani' } = req.body
    const fee = await getFeeForParent(feeId, req.user!.id, req.user!.schoolId)
    if (!fee) return res.status(404).json({ error: 'الفاتورة غير موجودة' })
    if (fee.status === 'paid') return res.status(400).json({ error: 'الفاتورة مدفوعة مسبقاً' })

    const remaining = Number(fee.amount) - Number(fee.paid_amount || 0)
    const sessionId = MOCK
      ? `mock_${provider}_${crypto.randomBytes(8).toString('hex')}`
      : `live_${provider}_pending`

    const session = await query(
      `INSERT INTO payment_sessions (school_id, fee_id, student_id, provider, external_session_id, amount, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7) RETURNING *`,
      [fee.school_id, fee.id, fee.student_id, provider, sessionId, remaining,
       JSON.stringify({ mock: MOCK, parentId: req.user!.id })]
    )

    const checkoutUrl = MOCK
      ? `${process.env.PUBLIC_URL || 'http://localhost:5000'}/parent/fees?mockPay=${session.rows[0].id}`
      : `https://checkout.${provider}.om/session/${sessionId}`

    res.json({
      sessionId: session.rows[0].id,
      externalSessionId: sessionId,
      checkoutUrl,
      amount: remaining,
      currency: 'OMR',
      provider,
      mock: MOCK,
    })
  } catch (err) {
    log.error('POST /session failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/payments/receipt/:id
router.get('/receipt/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const r = await query(
      `SELECT ps.*, f.fee_type, f.description, s.name AS student_name
       FROM payment_sessions ps
       LEFT JOIN fees f ON f.id = ps.fee_id
       LEFT JOIN students s ON s.id = ps.student_id
       WHERE ps.id=$1 AND ps.school_id=$2`,
      [req.params.id, req.user!.schoolId]
    )
    const row = r.rows[0]
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json({
      receipt: {
        id: row.id,
        amount: row.amount,
        currency: row.currency,
        provider: row.provider,
        status: row.status,
        feeType: row.fee_type,
        description: row.description,
        studentName: row.student_name,
        completedAt: row.completed_at,
        reference: row.external_session_id,
      },
    })
  } catch (err) {
    log.error('GET /receipt failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
