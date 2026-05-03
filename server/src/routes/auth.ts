import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { body } from 'express-validator'
import { query } from '../db'
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth'
import { validate, validatePasswordStrength } from '../middleware/validate'
import { authLimiter } from '../middleware/rateLimiter'
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
      const { username, password, role } = req.body

      const result = await query(
        `SELECT u.*, s.name as school_name FROM users u
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

      await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

      const token = generateToken({
        id: user.id,
        schoolId: user.school_id,
        role: user.role,
        username: user.username,
        name: user.name,
      })

      res.json({
        token,
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

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.username, u.role, u.email, u.phone, u.avatar, u.school_id,
              s.name as school_name
       FROM users u JOIN schools s ON s.id = u.school_id
       WHERE u.id = $1 AND u.is_active = true`,
      [req.user!.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json({ user: result.rows[0] })
  } catch (err) {
    log.error('GET /me failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── Change password ──────────────────────────────────────────────────────────
router.put('/password',
  authenticateToken,
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

export default router
