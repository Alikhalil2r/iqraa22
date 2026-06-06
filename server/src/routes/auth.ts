import { Router } from 'express'
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'
import { body } from 'express-validator'
import { query } from '../db'
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth'
import { issueRefreshToken, verifyRefreshToken, revokeRefreshToken, refreshCookieName, refreshCookieOptions } from '../utils/refreshToken'
import { validate, validatePasswordStrength } from '../middleware/validate'
import { authLimiter, passwordChangeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const log = createLogger('AUTH')

const router = Router()

// ─── Login ───────────────────────────────────────────────────────────────────
router.post('/login',
  authLimiter,
  validate([
    body('username').trim().isLength({ min: 1, max: 50 }).withMessage('اسم المستخدم مطلوب'),
    body('password').isLength({ min: 1, max: 128 }).withMessage('كلمة المرور مطلوبة'),
  ]),
  async (req, res) => {
    try {
      const { username, password, role, totpCode } = req.body

      const result = await query(
        `SELECT u.id, u.school_id, u.username, u.name, u.role, u.password_hash,
                u.is_active, u.totp_enabled, u.totp_secret, u.avatar,
                s.name AS school_name, s.status AS school_status
         FROM users u
         JOIN schools s ON s.id = u.school_id
         WHERE u.username = $1 AND u.is_active = true`,
        [username.trim().toLowerCase()]
      )
      const user = result.rows[0]

      // Always run bcrypt compare to prevent timing attacks
      const dummyHash = '$2b$12$invalidhashfordummycomparison1234567890123456789012'
      const validPass = user
        ? await bcrypt.compare(password, user.password_hash)
        : await bcrypt.compare(password, dummyHash).then(() => false)

      if (!user || !validPass) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
      }

      const ADMIN_ROLES = ['super_admin','admin','teacher','accountant','librarian','hr_manager','guard']
      if (role === 'parent' && user.role !== 'parent') {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
      }
      if (role === 'admin' && !ADMIN_ROLES.includes(user.role)) {
        return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })
      }
      if (user.school_status === 'suspended' && user.role !== 'super_admin') {
        return res.status(403).json({ error: 'المدرسة موقوفة مؤقتاً' })
      }

      const ADMIN_2FA_ROLES = ['super_admin', 'admin']
      const require2FA = process.env.ADMIN_2FA_REQUIRED !== 'false' && process.env.DEMO_MODE !== 'true'
      if (require2FA && ADMIN_2FA_ROLES.includes(user.role) && !user.totp_enabled) {
        return res.status(403).json({
          error: 'المصادقة الثنائية إلزامية لحسابات الإدارة',
          requires2FASetup: true,
        })
      }

      if (user.totp_enabled) {
        if (!totpCode) {
          return res.status(401).json({ error: 'رمز المصادقة الثنائية مطلوب', requires2FA: true })
        }
        const totpValid = speakeasy.totp.verify({
          secret: user.totp_secret,
          encoding: 'base32',
          token: String(totpCode).replace(/\s/g, ''),
          window: 1,
        })
        if (!totpValid) {
          return res.status(401).json({ error: 'رمز المصادقة الثنائية غير صحيح' })
        }
      }

      await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

      const token = generateToken({
        id: user.id,
        schoolId: user.school_id,
        role: user.role,
        username: user.username,
        name: user.name,
      })

      const useCookie = process.env.AUTH_REFRESH_COOKIE === 'true'
      const refreshToken = await issueRefreshToken(user.id)
      if (useCookie) {
        res.cookie(refreshCookieName(), refreshToken, refreshCookieOptions())
      }

      res.json({
        token,
        refreshToken: useCookie ? undefined : refreshToken,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          schoolId: user.school_id,
          schoolName: user.school_name,
          avatar: user.avatar,
        },
      })
    } catch (err) {
      log.error('Login failed', { error: (err as Error).message })
      res.status(500).json({ error: 'Server error' })
    }
  }
)

// ─── Get current user (Prisma POC — #6) ───────────────────────────────────────
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { prisma } = await import('../db/prisma')
    const user = await prisma.user.findFirst({
      where: { id: req.user!.id, isActive: true },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        email: true,
        phone: true,
        avatar: true,
        schoolId: true,
        school: { select: { name: true } },
      },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        school_id: user.schoolId,
        school_name: user.school.name,
      },
    })
  } catch (err) {
    log.error('GET /me failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── Change password ──────────────────────────────────────────────────────────
router.put('/password',
  authenticateToken,
  passwordChangeLimiter,
  validate([
    body('oldPassword').isLength({ min: 1 }).withMessage('كلمة المرور القديمة مطلوبة'),
    body('newPassword').isLength({ min: 8, max: 128 }).withMessage('كلمة المرور الجديدة قصيرة جداً'),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { oldPassword, newPassword } = req.body

      const passError = validatePasswordStrength(newPassword)
      if (passError) return res.status(400).json({ error: passError })

      const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user!.id]
      )
      const user = result.rows[0]
      if (!user) return res.status(404).json({ error: 'User not found' })

      const valid = await bcrypt.compare(oldPassword, user.password_hash)
      if (!valid) return res.status(400).json({ error: 'كلمة المرور القديمة غير صحيحة' })

      const newHash = await bcrypt.hash(newPassword, 12)
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.id])
      res.json({ success: true })
    } catch {
      res.status(500).json({ error: 'Server error' })
    }
  }
)

// ─── Refresh access token (httpOnly cookie or body) ───────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.[refreshCookieName()] || req.body?.refreshToken
    if (!token) return res.status(401).json({ error: 'Refresh token required' })

    const verified = await verifyRefreshToken(token)
    if (!verified) return res.status(401).json({ error: 'Invalid refresh token' })

    const result = await query(
      `SELECT u.id, u.school_id, u.username, u.name, u.role, u.is_active, s.status AS school_status
       FROM users u JOIN schools s ON s.id = u.school_id WHERE u.id = $1`,
      [verified.userId]
    )
    const user = result.rows[0]
    if (!user?.is_active) return res.status(401).json({ error: 'Account inactive' })
    if (user.school_status === 'suspended' && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'School suspended' })
    }

    const accessToken = generateToken({
      id: user.id,
      schoolId: user.school_id,
      role: user.role,
      username: user.username,
      name: user.name,
    })
    res.json({ token: accessToken })
  } catch (err) {
    log.error('Refresh failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[refreshCookieName()] || req.body?.refreshToken
  if (token) await revokeRefreshToken(token)
  res.clearCookie(refreshCookieName(), { path: '/api/auth' })
  res.json({ success: true })
})

export default router
