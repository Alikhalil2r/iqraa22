import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const school = await query('SELECT * FROM schools WHERE id=$1', [schoolId])
    const settings = await query('SELECT * FROM school_settings WHERE school_id=$1', [schoolId])
    res.json({ school: school.rows[0], settings: settings.rows[0] || {} })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    await query(`
      UPDATE schools SET name=$1,name_en=$2,tagline=$3,address=$4,phone=$5,email=$6,website=$7
      WHERE id=$8`,
      [d.name, d.nameEn, d.tagline, d.address, d.phone, d.email, d.website, schoolId]
    )
    const existing = await query('SELECT id FROM school_settings WHERE school_id=$1', [schoolId])
    if (existing.rows[0]) {
      await query(`
        UPDATE school_settings SET about_text=$1,vision=$2,mission=$3,
          principal_name=$4,principal_message=$5,principal_image=$6,
          show_parent_portal=$7,show_jobs=$8,hero_image=$9,updated_at=NOW()
        WHERE school_id=$10`,
        [d.aboutText, d.vision, d.mission, d.principalName, d.principalMessage,
         d.principalImage, d.showParentPortal!==false, d.showJobs!==false, d.heroImage, schoolId]
      )
    } else {
      await query(`
        INSERT INTO school_settings (school_id,about_text,vision,mission,principal_name,principal_message,principal_image,show_parent_portal,show_jobs,hero_image)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [schoolId, d.aboutText, d.vision, d.mission, d.principalName, d.principalMessage,
         d.principalImage, d.showParentPortal!==false, d.showJobs!==false, d.heroImage]
      )
    }
    res.json({ success: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/theme', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { primaryColor, primaryDark, primaryLight, accentColor, accentDark, customCss } = req.body
    const existing = await query('SELECT id FROM school_settings WHERE school_id=$1', [schoolId])
    if (existing.rows[0]) {
      await query(`
        UPDATE school_settings SET primary_color=$1,primary_dark=$2,primary_light=$3,
          accent_color=$4,accent_dark=$5,custom_css=$6,updated_at=NOW()
        WHERE school_id=$7`,
        [primaryColor, primaryDark, primaryLight, accentColor, accentDark, customCss, schoolId]
      )
    } else {
      await query(`
        INSERT INTO school_settings (school_id,primary_color,primary_dark,primary_light,accent_color,accent_dark,custom_css)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [schoolId, primaryColor, primaryDark, primaryLight, accentColor, accentDark, customCss]
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

router.post('/users', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const bcrypt = require('bcryptjs')
    const { schoolId } = req.user!
    const { name, username, password, role, email, phone } = req.body
    const hash = await bcrypt.hash(password, 12)
    const result = await query(`
      INSERT INTO users (school_id,name,username,password_hash,role,email,phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,username,role,email,phone,is_active,created_at`,
      [schoolId, name, username, hash, role, email, phone]
    )
    res.status(201).json({ user: result.rows[0] })
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/users/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, role, isActive, password } = req.body
    if (password) {
      const bcrypt = require('bcryptjs')
      const hash = await bcrypt.hash(password, 12)
      await query('UPDATE users SET password_hash=$1 WHERE id=$2 AND school_id=$3', [hash, req.params.id, req.user!.schoolId])
    }
    await query(`UPDATE users SET name=$1,email=$2,phone=$3,role=$4,is_active=$5 WHERE id=$6 AND school_id=$7`,
      [name, email, phone, role, isActive, req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/users/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    if (req.params.id === req.user!.id) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' })
    await query('DELETE FROM users WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
