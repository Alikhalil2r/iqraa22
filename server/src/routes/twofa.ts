import { Router } from 'express'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import { totpLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'
import { logAudit } from './audit'

const router = Router()
const log = createLogger('2FA')

router.use(authenticateToken)

// POST /api/2fa/setup — generate TOTP secret + QR
router.post('/setup', totpLimiter, async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId, username, name } = req.user!

    const secret = speakeasy.generateSecret({
      name: `مدرستنا (${username || name})`,
      length: 20,
    })

    // Store secret temporarily (not enabled yet)
    await query(
      `UPDATE users SET totp_secret = $1, totp_enabled = false WHERE id = $2 AND school_id = $3`,
      [secret.base32, userId, schoolId]
    )

    const otpauthUrl = secret.otpauth_url!
    const qrDataUrl  = await QRCode.toDataURL(otpauthUrl)

    res.json({
      secret: secret.base32,
      qrCode: qrDataUrl,
      otpauthUrl,
    })
  } catch (err) {
    log.error('2FA setup failed', { error: (err as Error).message })
    res.status(500).json({ error: 'فشل إعداد المصادقة الثنائية' })
  }
})

// POST /api/2fa/verify — verify token and enable 2FA
router.post('/verify', totpLimiter, async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId, name } = req.user!
    const { token } = req.body

    if (!token) return res.status(400).json({ error: 'الرمز مطلوب' })

    const userRow = await query(
      `SELECT totp_secret FROM users WHERE id = $1 AND school_id = $2`,
      [userId, schoolId]
    )
    if (!userRow.rows[0]?.totp_secret) {
      return res.status(400).json({ error: 'لم يتم إعداد المصادقة الثنائية بعد' })
    }

    const verified = speakeasy.totp.verify({
      secret: userRow.rows[0].totp_secret,
      encoding: 'base32',
      token: String(token),
      window: 2,
    })

    if (!verified) return res.status(400).json({ error: 'الرمز غير صحيح. تحقق من الوقت على جهازك.' })

    await query(
      `UPDATE users SET totp_enabled = true WHERE id = $1 AND school_id = $2`,
      [userId, schoolId]
    )

    await logAudit({
      schoolId, userId, userName: name, userRole: req.user!.role,
      action: 'ENABLE_2FA', entityType: 'user', entityId: userId,
      description: 'تم تفعيل المصادقة الثنائية',
      ip: req.ip,
    })

    res.json({ ok: true, message: 'تم تفعيل المصادقة الثنائية بنجاح' })
  } catch (err) {
    log.error('2FA verify failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/2fa/disable — disable 2FA
router.post('/disable', totpLimiter, async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId, name } = req.user!
    const { token } = req.body

    const userRow = await query(
      `SELECT totp_secret, totp_enabled FROM users WHERE id = $1 AND school_id = $2`,
      [userId, schoolId]
    )
    const u = userRow.rows[0]
    if (!u?.totp_enabled) return res.status(400).json({ error: 'المصادقة الثنائية غير مفعلة' })

    const verified = speakeasy.totp.verify({
      secret: u.totp_secret,
      encoding: 'base32',
      token: String(token),
      window: 2,
    })
    if (!verified) return res.status(400).json({ error: 'الرمز غير صحيح' })

    await query(
      `UPDATE users SET totp_secret = NULL, totp_enabled = false WHERE id = $1`,
      [userId]
    )

    await logAudit({
      schoolId, userId, userName: name, userRole: req.user!.role,
      action: 'DISABLE_2FA', entityType: 'user', entityId: userId,
      description: 'تم إلغاء تفعيل المصادقة الثنائية',
      ip: req.ip,
    })

    res.json({ ok: true, message: 'تم إلغاء تفعيل المصادقة الثنائية' })
  } catch (err) {
    log.error('2FA disable failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/2fa/status — check current 2FA status for the logged user
router.get('/status', async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId } = req.user!
    const row = await query(
      `SELECT totp_enabled FROM users WHERE id = $1 AND school_id = $2`,
      [userId, schoolId]
    )
    res.json({ enabled: row.rows[0]?.totp_enabled ?? false })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
