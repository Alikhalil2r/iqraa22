import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import { sendTemplateEmail } from '../services/email'
import { sendSms } from '../services/sms'

const router = Router()

router.get('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const r = await query(
      `SELECT email_enabled, sms_enabled, whatsapp_enabled, phone FROM notification_preferences WHERE user_id=$1`,
      [req.user!.id]
    )
    res.json({ preferences: r.rows[0] || { email_enabled: true, sms_enabled: false, whatsapp_enabled: false } })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { emailEnabled, smsEnabled, whatsappEnabled, phone } = req.body
    await query(
      `INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, whatsapp_enabled, phone, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled=EXCLUDED.email_enabled,
         sms_enabled=EXCLUDED.sms_enabled,
         whatsapp_enabled=EXCLUDED.whatsapp_enabled,
         phone=EXCLUDED.phone,
         updated_at=NOW()`,
      [req.user!.id, emailEnabled ?? true, smsEnabled ?? false, whatsappEnabled ?? false, phone || null]
    )
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/test-email', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const email = req.body.email || (await query('SELECT email FROM users WHERE id=$1', [req.user!.id])).rows[0]?.email
    if (!email) return res.status(400).json({ error: 'لا يوجد بريد إلكتروني' })
    const result = await sendTemplateEmail(email, 'message', {
      fromName: 'إدارة المدرسة',
      subject: 'رسالة تجريبية',
      preview: 'هذه رسالة تجريبية من نظام إقرأ.',
      schoolName: 'مدرسة تجريبية',
    })
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/test-sms', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const phone = req.body.phone
    if (!phone) return res.status(400).json({ error: 'رقم الهاتف مطلوب' })
    const result = await sendSms(req.user!.id, phone, 'رسالة تجريبية من نظام إقرأ')
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
