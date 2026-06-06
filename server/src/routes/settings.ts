import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { body } from 'express-validator'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { validate, validatePasswordStrength, sanitizeCSS, sanitizeMapEmbed } from '../middleware/validate'
import { registerLimiter, writeLimiter } from '../middleware/rateLimiter'
import { MANAGED_USER_ROLES, SETTINGS_ROLES } from '../middleware/auth'

const router = Router()

const SETTINGS_SELECT = `
  id, school_id, about_text, vision, mission, principal_name, principal_message,
  principal_image, hero_image, primary_color, primary_dark, primary_light,
  accent_color, accent_dark, logo_url, show_parent_portal, show_jobs,
  smtp_host, smtp_port, smtp_user, smtp_from, email_absence_alert,
  email_grade_notification, email_fee_reminder, notify_parent_absence,
  notify_parent_grades, custom_css, updated_at,
  founded_year, license_number, city, region, country, phone2, email2, fax, map_embed,
  values_text, objectives, principal_title, principal_email, principal_phone,
  instagram, twitter, facebook, youtube, snapchat, tiktok, whatsapp, banner_color,
  students_count, teachers_count, classrooms_count, years_experience, office_hours
`

router.get('/', authenticateToken, requireRole(...SETTINGS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const school = await query(
      `SELECT id, name, name_en, tagline, address, phone, email, website, logo_url, status, plan
       FROM schools WHERE id=$1`,
      [schoolId]
    )
    const settings = await query(
      `SELECT ${SETTINGS_SELECT} FROM school_settings WHERE school_id=$1`,
      [schoolId]
    )
    const settingsRow = settings.rows[0] || {}
    if (settingsRow) {
      const hasSmtpPass = !!(await query('SELECT 1 FROM school_settings WHERE school_id=$1 AND smtp_pass IS NOT NULL', [schoolId])).rows[0]
      settingsRow.smtp_pass_set = hasSmtpPass
    }
    res.json({ school: school.rows[0], settings: settingsRow })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    const s = (v: unknown, max: number) => String(v ?? '').slice(0, max)

    await query(`
      UPDATE schools SET name=$1,name_en=$2,tagline=$3,address=$4,phone=$5,email=$6,website=$7,logo_url=$8
      WHERE id=$9`,
      [s(d.name, 200), s(d.nameEn, 200), s(d.tagline, 300), s(d.address, 500), s(d.phone, 50),
       s(d.email, 100), s(d.website, 200), d.logoUrl || null, schoolId]
    )

    const fields = [
      s(d.aboutText, 5000), s(d.vision, 2000), s(d.mission, 2000),
      s(d.principalName, 100), s(d.principalMessage, 3000), d.principalImage || null,
      d.showParentPortal !== false, d.showJobs !== false, d.heroImage || null,
      s(d.foundedYear, 10), s(d.licenseNumber, 100), s(d.city, 100), s(d.region, 100), s(d.country, 100),
      s(d.phone2, 50), s(d.email2, 100), s(d.fax, 50), sanitizeMapEmbed(d.mapEmbed),
      s(d.values, 3000), s(d.objectives, 3000),
      s(d.principalTitle, 200), s(d.principalEmail, 200), s(d.principalPhone, 50),
      s(d.instagram, 300), s(d.twitter, 300), s(d.facebook, 300), s(d.youtube, 300),
      s(d.snapchat, 300), s(d.tiktok, 300), s(d.whatsapp, 50),
      s(d.bannerColor, 20), s(d.studentsCount, 20), s(d.teachersCount, 20),
      s(d.classroomsCount, 20), s(d.yearsExperience, 20), s(d.officeHours, 200),
    ]

    const existing = await query('SELECT id FROM school_settings WHERE school_id=$1', [schoolId])
    if (existing.rows[0]) {
      await query(`
        UPDATE school_settings SET
          about_text=$1, vision=$2, mission=$3, principal_name=$4, principal_message=$5, principal_image=$6,
          show_parent_portal=$7, show_jobs=$8, hero_image=$9,
          founded_year=$10, license_number=$11, city=$12, region=$13, country=$14,
          phone2=$15, email2=$16, fax=$17, map_embed=$18,
          values_text=$19, objectives=$20,
          principal_title=$21, principal_email=$22, principal_phone=$23,
          instagram=$24, twitter=$25, facebook=$26, youtube=$27, snapchat=$28, tiktok=$29, whatsapp=$30,
          banner_color=$31, students_count=$32, teachers_count=$33, classrooms_count=$34, years_experience=$35,
          office_hours=$36, updated_at=NOW()
        WHERE school_id=$37`,
        [...fields, schoolId]
      )
    } else {
      await query(`
        INSERT INTO school_settings (
          school_id, about_text, vision, mission, principal_name, principal_message, principal_image,
          show_parent_portal, show_jobs, hero_image,
          founded_year, license_number, city, region, country, phone2, email2, fax, map_embed,
          values_text, objectives, principal_title, principal_email, principal_phone,
          instagram, twitter, facebook, youtube, snapchat, tiktok, whatsapp,
          banner_color, students_count, teachers_count, classrooms_count, years_experience, office_hours
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37)`,
        [schoolId, ...fields]
      )
    }
    res.json({ success: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// Color validation helper
function isValidColor(c: unknown): boolean {
  if (typeof c !== 'string') return false
  return /^#[0-9A-Fa-f]{6}$/.test(c) || /^#[0-9A-Fa-f]{3}$/.test(c)
}

router.put('/theme', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { primaryColor, primaryDark, primaryLight, accentColor, accentDark, customCss } = req.body
    const colors = [primaryColor, primaryDark, primaryLight, accentColor, accentDark]
    if (colors.some(c => c !== undefined && c !== null && !isValidColor(c))) {
      return res.status(400).json({ error: 'قيمة اللون غير صالحة، يجب أن تكون بصيغة #RRGGBB' })
    }
    const safeCss = customCss ? sanitizeCSS(customCss) : null
    const existing = await query('SELECT id FROM school_settings WHERE school_id=$1', [schoolId])
    if (existing.rows[0]) {
      await query(`
        UPDATE school_settings SET primary_color=$1,primary_dark=$2,primary_light=$3,
          accent_color=$4,accent_dark=$5,custom_css=$6,updated_at=NOW()
        WHERE school_id=$7`,
        [primaryColor, primaryDark, primaryLight, accentColor, accentDark, safeCss, schoolId]
      )
    } else {
      await query(`
        INSERT INTO school_settings (school_id,primary_color,primary_dark,primary_light,accent_color,accent_dark,custom_css)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [schoolId, primaryColor, primaryDark, primaryLight, accentColor, accentDark, safeCss]
      )
    }
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/users', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id,name,username,role,email,phone,avatar,is_active,last_login,created_at
       FROM users WHERE school_id=$1 ORDER BY name`,
      [req.user!.schoolId]
    )
    res.json({ users: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/users',
  authenticateToken,
  requireRole('admin'),
  registerLimiter,
  validate([
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('الاسم مطلوب'),
    body('username').trim().isLength({ min: 3, max: 50 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('اسم المستخدم يجب أن يحتوي على حروف وأرقام فقط'),
    body('password').isLength({ min: 8, max: 128 }).withMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    body('role').isIn([...MANAGED_USER_ROLES]).withMessage('نوع المستخدم غير صالح'),
  ]),
  async (req: AuthRequest, res) => {
    try {
      const { schoolId } = req.user!
      const { name, username, password, role, email, phone } = req.body
      const passError = validatePasswordStrength(password)
      if (passError) return res.status(400).json({ error: passError })
      const hash = await bcrypt.hash(password, 12)
      const result = await query(`
        INSERT INTO users (school_id,name,username,password_hash,role,email,phone)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,username,role,email,phone,is_active,created_at`,
        [schoolId, name, username.toLowerCase(), hash, role, email?.slice(0, 100), phone?.slice(0, 20)]
      )
      res.status(201).json({ user: result.rows[0] })
    } catch (err: any) {
      if (err.code === '23505') return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' })
      res.status(500).json({ error: 'Server error' })
    }
  }
)

router.put('/users/:id', authenticateToken, requireRole('admin'), writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, role, isActive, password } = req.body
    if (req.params.id === req.user!.id && isActive === false) {
      return res.status(400).json({ error: 'لا يمكنك تعطيل حسابك الخاص' })
    }
    if (!MANAGED_USER_ROLES.includes(role)) return res.status(400).json({ error: 'نوع المستخدم غير صالح' })
    if (password) {
      const passError = validatePasswordStrength(password)
      if (passError) return res.status(400).json({ error: passError })
      const hash = await bcrypt.hash(password, 12)
      await query('UPDATE users SET password_hash=$1 WHERE id=$2 AND school_id=$3', [hash, req.params.id, req.user!.schoolId])
    }
    await query(
      `UPDATE users SET name=$1,email=$2,phone=$3,role=$4,is_active=$5 WHERE id=$6 AND school_id=$7`,
      [name?.slice(0, 100), email?.slice(0, 100), phone?.slice(0, 20), role, isActive, req.params.id, req.user!.schoolId]
    )
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/users/:id', authenticateToken, requireRole('admin'), writeLimiter, async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user!.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' })
    await query('DELETE FROM users WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
