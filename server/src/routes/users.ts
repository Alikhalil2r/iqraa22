import { Router } from 'express'
import { body } from 'express-validator'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { validate, validatePasswordStrength } from '../middleware/validate'
import { registerLimiter, writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const log = createLogger('USERS')

const router = Router()
router.use(authenticateToken)

// أدوار يمكن للمدير إنشاؤها وتعديلها
const MANAGED_ROLES = ['admin', 'teacher', 'accountant', 'librarian', 'hr_manager', 'guard', 'parent'] as const
type ManagedRole = typeof MANAGED_ROLES[number]

function isManagedRole(role: unknown): role is ManagedRole {
  return typeof role === 'string' && (MANAGED_ROLES as readonly string[]).includes(role)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUUID(v: unknown): v is string { return typeof v === 'string' && UUID_RE.test(v) }

// ── GET /api/users ─────────────────────────────────────────────────────────────
router.get('/', requireRole('super_admin', 'admin', 'hr_manager', 'accountant'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, role: callerRole } = req.user!
    const role = req.query.role as string | undefined

    if (role && !isManagedRole(role)) return res.status(400).json({ error: 'Role filter غير مسموح' })
    // المحاسب يرى أولياء الأمور فقط عند التصفية
    if (callerRole === 'accountant' && role && role !== 'parent') {
      return res.status(403).json({ error: 'المحاسب يمكنه عرض حسابات أولياء الأمور فقط' })
    }
    if (callerRole === 'accountant' && !role) {
      const result = await query(
        `SELECT id, name, username, role, email, phone, is_active, last_login, created_at
         FROM users WHERE school_id=$1 AND role='parent' ORDER BY name`,
        [schoolId]
      )
      return res.json({ users: result.rows, total: result.rowCount })
    }

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

// ── GET /api/users/:id/teaching-profile ───────────────────────────────────────
router.get('/:id/teaching-profile', requireRole('super_admin', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    if (!isUUID(req.params.id)) return res.status(400).json({ error: 'معرف غير صالح' })

    const user = await query('SELECT id, name, role FROM users WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    if (!user.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' })
    if (user.rows[0].role !== 'teacher') return res.status(400).json({ error: 'هذا المستخدم ليس معلماً' })

    const [homeroom, subjects, schedule] = await Promise.all([
      query(`SELECT id, name FROM classes WHERE school_id=$1 AND teacher_id=$2`, [schoolId, req.params.id]),
      query(`SELECT id, name, class_id FROM subjects WHERE school_id=$1 AND teacher_id=$2 ORDER BY name`, [schoolId, req.params.id]),
      query(`SELECT id, subject_name, class_id, day_of_week, start_time, end_time, room
             FROM schedule WHERE school_id=$1 AND teacher_id=$2 ORDER BY day_of_week, start_time`, [schoolId, req.params.id]),
    ])

    const allClasses = await query(`SELECT id, name FROM classes WHERE school_id=$1 ORDER BY name`, [schoolId])

    res.json({
      teacher: user.rows[0],
      homeroomClass: homeroom.rows[0] || null,
      subjects: subjects.rows,
      schedule: schedule.rows,
      classes: allClasses.rows,
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── PUT /api/users/:id/teaching-profile ───────────────────────────────────────
router.put('/:id/teaching-profile',
  requireRole('super_admin', 'admin'),
  writeLimiter,
  async (req: AuthRequest, res) => {
    try {
      const { schoolId } = req.user!
      if (!isUUID(req.params.id)) return res.status(400).json({ error: 'معرف غير صالح' })

      const user = await query('SELECT id, name, role FROM users WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
      if (!user.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' })
      if (user.rows[0].role !== 'teacher') return res.status(400).json({ error: 'هذا المستخدم ليس معلماً' })

      const teacherId = req.params.id
      const teacherName = user.rows[0].name
      const { homeroomClassId, subjects: subjectList } = req.body as {
        homeroomClassId?: string | null
        subjects?: { name: string; classId?: string }[]
      }

      // إزالة الفصل الرئيسي السابق
      await query(`UPDATE classes SET teacher_id=NULL WHERE school_id=$1 AND teacher_id=$2`, [schoolId, teacherId])
      if (homeroomClassId && isUUID(homeroomClassId)) {
        await query(`UPDATE classes SET teacher_id=$1 WHERE id=$2 AND school_id=$3`, [teacherId, homeroomClassId, schoolId])
      }

      // إعادة تعيين المواد
      await query(`UPDATE subjects SET teacher_id=NULL WHERE school_id=$1 AND teacher_id=$2`, [schoolId, teacherId])
      if (Array.isArray(subjectList)) {
        for (const sub of subjectList) {
          if (!sub?.name?.trim()) continue
          const existing = await query(
            `SELECT id FROM subjects WHERE school_id=$1 AND name=$2 AND ($3::uuid IS NULL OR class_id=$3) LIMIT 1`,
            [schoolId, sub.name.trim(), sub.classId || null]
          )
          if (existing.rows[0]) {
            await query(`UPDATE subjects SET teacher_id=$1 WHERE id=$2`, [teacherId, existing.rows[0].id])
          } else {
            await query(
              `INSERT INTO subjects (school_id, name, class_id, teacher_id) VALUES ($1,$2,$3,$4)`,
              [schoolId, sub.name.trim(), sub.classId || null, teacherId]
            )
          }
        }
      }

      // ربط حصص الجدول بنفس المعلم (حسب اسم المعلم أو المواد المعيّنة)
      await query(
        `UPDATE schedule SET teacher_id=$1, teacher_name=$2
         WHERE school_id=$3 AND (teacher_id=$1 OR teacher_name ILIKE $4)`,
        [teacherId, teacherName, schoolId, `%${teacherName.split('—')[0].trim().slice(0, 20)}%`]
      )

      // ربط سجل الموظف إن وُجد
      await query(
        `UPDATE employees SET user_id=$1 WHERE school_id=$2 AND name ILIKE $3 AND user_id IS NULL`,
        [teacherId, schoolId, `%${teacherName.replace(/معلم تجريبي\s*—?\s*/i, '').trim().slice(0, 15)}%`]
      )

      log.info('Teaching profile updated', { teacherId, by: req.user!.username })
      res.json({ ok: true })
    } catch (err: any) {
      log.error('PUT teaching-profile failed', { error: err.message })
      res.status(500).json({ error: 'Server error' })
    }
  }
)

// ── POST /api/users ───────────────────────────────────────────────────────────
router.post('/',
  requireRole('super_admin', 'admin'),
  registerLimiter,
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('الاسم مطلوب (2-100 حرف)'),
    body('username').trim().isLength({ min: 3, max: 50 }).withMessage('اسم المستخدم يجب أن يكون 3-50 حرفاً'),
    body('password').isLength({ min: 8, max: 128 }).withMessage('كلمة المرور يجب أن تكون 8-128 حرف'),
    body('role').custom(v => {
      if (!isManagedRole(v)) throw new Error(`الدور غير مسموح: ${v}`)
      return true
    }),
    body('email').optional({ nullable: true }).isEmail().withMessage('البريد الإلكتروني غير صالح'),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { schoolId } = req.user!
      const { name, username, password, role, email, phone, studentIds } = req.body

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
      const newUser = result.rows[0]
      if (role === 'parent' && Array.isArray(studentIds)) {
        for (const sid of studentIds) {
          if (isUUID(sid)) {
            await query(`UPDATE students SET parent_id=$1 WHERE id=$2 AND school_id=$3`, [newUser.id, sid, schoolId])
          }
        }
      }
      log.info('User created', { by: req.user!.username, newUser: username, role })
      res.status(201).json({ user: newUser })
    } catch (err: any) {
      if (err.code === '23505') return res.status(409).json({ error: 'اسم المستخدم مستخدم بالفعل' })
      log.error('POST /users failed', { error: err.message })
      res.status(500).json({ error: 'Server error' })
    }
  }
)

// ── PUT /api/users/:id ───────────────────────────────────────────────────────
router.put('/:id',
  requireRole('super_admin', 'admin'),
  writeLimiter,
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('الاسم مطلوب'),
    body('role').custom(v => {
      if (v !== undefined && !isManagedRole(v)) throw new Error(`الدور غير مسموح: ${v}`)
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

      const target = await query('SELECT role FROM users WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
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

      if (role && isManagedRole(role)) {
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

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete('/:id',
  requireRole('super_admin', 'admin'),
  writeLimiter,
  async (req: AuthRequest, res) => {
    try {
      const { schoolId, id: currentUserId } = req.user!
      if (!isUUID(req.params.id)) return res.status(400).json({ error: 'معرف غير صالح' })
      if (req.params.id === currentUserId) {
        return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي' })
      }

      const target = await query('SELECT role FROM users WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
      if (!target.rows[0]) return res.status(404).json({ error: 'المستخدم غير موجود' })
      if (target.rows[0].role === 'super_admin' && req.user!.role !== 'super_admin') {
        return res.status(403).json({ error: 'لا يمكن حذف حساب super_admin' })
      }

      const linked = await query('SELECT COUNT(*) FROM students WHERE parent_id=$1', [req.params.id])
      if (parseInt(linked.rows[0].count) > 0) {
        return res.status(400).json({ error: 'لا يمكن حذف ولي أمر مرتبط بطلاب — فك الربط أولاً' })
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
