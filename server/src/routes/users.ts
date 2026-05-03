import { Router } from 'express'
import { body } from 'express-validator'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { validate, validatePasswordStrength } from '../middleware/validate'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const log = createLogger('USERS')

const router = Router()
router.use(authenticateToken)

// ── Role allowlist — prevents privilege escalation via role injection ─────────
const ALLOWED_ROLES = ['admin', 'teacher', 'accountant', 'librarian', 'hr_manager', 'guard'] as const
type AllowedRole = typeof ALLOWED_ROLES[number]

function isAllowedRole(role: unknown): role is AllowedRole {
  return typeof role === 'string' && (ALLOWED_ROLES as readonly string[]).includes(role)
}

// ── UUID basic format check ───────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUUID(v: unknown): v is string { return typeof v === 'string' && UUID_RE.test(v) }

// ── GET /api/users  (admin, hr_manager, super_admin can list users) ───────────
router.get('/', requireRole('super_admin', 'admin', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const role = req.query.role as string | undefined
    // Only allow known roles in filter to prevent injection via role param
    if (role && !isAllowedRole(role)) return res.status(400).json({ error: 'Role filter غير مسموح' })
    let q = `SELECT id, name, username, role, email, phone, is_active, last_login, created_at
             FROM users WHERE school_id=$1`
    const params: unknown[] = [schoolId]
    if (role) { params.push(role); q += ` AND role=$${params.length}` }
    q += ' ORDER BY name'
    const result = await query(q, params)
    res.json({ users: result.rows, total: result.rowCount })
  } catch (err) {
    log.error('GET /users failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/users  (admin/super_admin only — cannot create super_admin) ─────
router.post('/',
  requireRole('super_admin', 'admin'),
  writeLimiter,
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('الاسم مطلوب (2-100 حرف)'),
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('اسم المستخدم يجب أن يكون 3-50 حرفاً'),
    body('password').isLength({ min: 8, max: 128 }).withMessage('كلمة المرور يجب أن تكون 8-128 حرف'),
    body('role').custom(v => {
      if (!isAllowedRole(v)) throw new Error(`الدور غير مسموح: ${v}`)
      return true
    }),
    body('email').optional({ nullable: true }).isEmail().withMessage('البريد الإلكتروني غير صالح'),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { schoolId } = req.user!
      const { name, username, password, role, email, phone } = req.body

      const passError = validatePasswordStrength(password)
      if (passError) return res.status(400).json({ error: passError })

      const bcrypt = await import('bcryptjs')
      const hash = await bcrypt.hash(password, 12)

      const result = await query(
        `INSERT INTO users (school_id, name, username, password_hash, role, email, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, name, username, role, email, phone, is_active, created_at`,
        [schoolId, name.trim(), username.trim().toLowerCase(), hash, role, email || null, phone || null]
      )
      log.info('User created', { by: req.user!.username, newUser: username, role })
      res.status(201).json({ user: result.rows[0] })
    } catch (err: any) {
      if (err.code === '23505') return res.status(409).json({ error: 'اسم المستخدم مستخدم بالفعل' })
      log.error('POST /users failed', { error: err.message })
      res.status(500).json({ error: 'Server error' })
    }
  }
)

// ── PUT /api/users/:id  (admin/super_admin only) ─────────────────────────────
router.put('/:id',
  requireRole('super_admin', 'admin'),
  writeLimiter,
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('الاسم مطلوب'),
    body('role').custom(v => {
      if (v !== undefined && !isAllowedRole(v)) throw new Error(`الدور غير مسموح: ${v}`)
      return true
    }),
    body('email').optional({ nullable: true }).isEmail().withMessage('البريد الإلكتروني غير صالح'),
    body('password').optional().isLength({ min: 8, max: 128 }).withMessage('كلمة المرور قصيرة جداً'),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { schoolId } = req.user!
      if (!isUUID(req.params.id)) return res.status(400).json({ error: 'معرف غير صالح' })

      const { name, email, phone, role, isActive, password } = req.body

      // Prevent non-super_admin from editing super_admin accounts
      const target = await query(
        'SELECT role FROM users WHERE id=$1 AND school_id=$2',
        [req.params.id, schoolId]
      )
      if (!target.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' })
      if (target.rows[0].role === 'super_admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: 'لا يمكن تعديل حساب super_admin' })
      }

      if (password) {
        const passError = validatePasswordStrength(password)
        if (passError) return res.status(400).json({ error: passError })
      }

      let q = `UPDATE users SET name=$1, email=$2, phone=$3, is_active=$4`
      const params: unknown[] = [name.trim(), email || null, phone || null, isActive !== undefined ? isActive : true]

      // Only update role if provided and valid
      if (role && isAllowedRole(role)) {
        params.push(role)
        q += `, role=$${params.length}`
      }

      if (password) {
        const bcrypt = await import('bcryptjs')
        const hash = await bcrypt.hash(password, 12)
        params.push(hash)
        q += `, password_hash=$${params.length}`
      }

      params.push(req.params.id, schoolId)
      q += ` WHERE id=$${params.length - 1} AND school_id=$${params.length}
             RETURNING id, name, username, role, email, is_active`

      const result = await query(q, params)
      if (!result.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' })

      log.info('User updated', { by: req.user!.username, userId: req.params.id })
      res.json({ user: result.rows[0] })
    } catch (err: any) {
      log.error('PUT /users/:id failed', { error: err.message })
      res.status(500).json({ error: 'Server error' })
    }
  }
)

// ── DELETE /api/users/:id  (admin/super_admin only) ──────────────────────────
router.delete('/:id',
  requireRole('super_admin', 'admin'),
  async (req: AuthRequest, res) => {
    try {
      const { schoolId, id: currentUserId } = req.user!
      if (!isUUID(req.params.id)) return res.status(400).json({ error: 'معرف غير صالح' })
      if (req.params.id === currentUserId) {
        return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي' })
      }

      // Prevent deleting super_admin unless you are super_admin
      const target = await query(
        'SELECT role FROM users WHERE id=$1 AND school_id=$2',
        [req.params.id, schoolId]
      )
      if (!target.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' })
      if (target.rows[0].role === 'super_admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: 'لا يمكن حذف حساب super_admin' })
      }

      await query('DELETE FROM users WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
      log.info('User deleted', { by: req.user!.username, userId: req.params.id })
      res.json({ ok: true })
    } catch (err) {
      log.error('DELETE /users/:id failed', { error: (err as Error).message })
      res.status(500).json({ error: 'Server error' })
    }
  }
)

export default router
