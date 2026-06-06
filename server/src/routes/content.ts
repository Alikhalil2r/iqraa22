import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'
import { isValidUUID } from '../middleware/validate'

const router = Router()
const log = createLogger('CONTENT')
router.use(authenticateToken, requireRole('super_admin', 'admin'))

const sanitize = (v: unknown, max = 5000) => String(v ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max)

// ── Achievements ───────────────────────────────────────────────────────────────
router.get('/achievements', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM achievements WHERE school_id=$1 ORDER BY achievement_date DESC NULLS LAST, created_at DESC`,
      [req.user!.schoolId]
    )
    res.json({ achievements: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/achievements', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { title, description, imageUrl, category, achievementDate, studentName, className, isPublished } = req.body
    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' })
    const result = await query(
      `INSERT INTO achievements (school_id, title, description, image_url, category, achievement_date, student_name, class_name, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user!.schoolId, sanitize(title, 300), sanitize(description), imageUrl || null, sanitize(category, 100),
       achievementDate || null, sanitize(studentName, 200), sanitize(className, 100), isPublished !== false]
    )
    res.status(201).json({ achievement: result.rows[0] })
  } catch (err) { log.error('POST achievements', { error: (err as Error).message }); res.status(500).json({ error: 'Server error' }) }
})

router.put('/achievements/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'معرف غير صالح' })
    const { title, description, imageUrl, category, achievementDate, studentName, className, isPublished } = req.body
    const result = await query(
      `UPDATE achievements SET title=$1, description=$2, image_url=$3, category=$4, achievement_date=$5,
       student_name=$6, class_name=$7, is_published=$8 WHERE id=$9 AND school_id=$10 RETURNING *`,
      [sanitize(title, 300), sanitize(description), imageUrl || null, sanitize(category, 100), achievementDate || null,
       sanitize(studentName, 200), sanitize(className, 100), isPublished !== false, req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' })
    res.json({ achievement: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/achievements/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM achievements WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ── Public staff ───────────────────────────────────────────────────────────────
router.get('/staff', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM staff_public WHERE school_id=$1 ORDER BY sort_order, name`,
      [req.user!.schoolId]
    )
    res.json({ staff: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/staff', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { name, position, department, bio, photo, email, isFeatured, sortOrder } = req.body
    if (!name) return res.status(400).json({ error: 'الاسم مطلوب' })
    const result = await query(
      `INSERT INTO staff_public (school_id, name, position, department, bio, photo, email, is_featured, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user!.schoolId, sanitize(name, 200), sanitize(position, 200), sanitize(department, 200),
       sanitize(bio), photo || null, sanitize(email, 200), !!isFeatured, sortOrder || 0]
    )
    res.status(201).json({ staff: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/staff/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'معرف غير صالح' })
    const { name, position, department, bio, photo, email, isFeatured, sortOrder } = req.body
    const result = await query(
      `UPDATE staff_public SET name=$1, position=$2, department=$3, bio=$4, photo=$5, email=$6, is_featured=$7, sort_order=$8
       WHERE id=$9 AND school_id=$10 RETURNING *`,
      [sanitize(name, 200), sanitize(position, 200), sanitize(department, 200), sanitize(bio), photo || null,
       sanitize(email, 200), !!isFeatured, sortOrder || 0, req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' })
    res.json({ staff: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/staff/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM staff_public WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ── Public alerts ──────────────────────────────────────────────────────────────
router.get('/alerts', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM public_alerts WHERE school_id=$1 ORDER BY sort_order, created_at DESC`,
      [req.user!.schoolId]
    )
    res.json({ alerts: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/alerts', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { message, alertType, isActive, expiresAt, sortOrder } = req.body
    if (!message) return res.status(400).json({ error: 'نص التنبيه مطلوب' })
    const allowed = ['success', 'warning', 'danger', 'info', 'urgent']
    const type = allowed.includes(alertType) ? alertType : 'info'
    const result = await query(
      `INSERT INTO public_alerts (school_id, message, alert_type, is_active, expires_at, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.schoolId, sanitize(message), type, isActive !== false, expiresAt || null, sortOrder || 0]
    )
    res.status(201).json({ alert: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/alerts/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { message, alertType, isActive, expiresAt, sortOrder } = req.body
    const allowed = ['success', 'warning', 'danger', 'info', 'urgent']
    const type = allowed.includes(alertType) ? alertType : 'info'
    const result = await query(
      `UPDATE public_alerts SET message=$1, alert_type=$2, is_active=$3, expires_at=$4, sort_order=$5
       WHERE id=$6 AND school_id=$7 RETURNING *`,
      [sanitize(message), type, isActive !== false, expiresAt || null, sortOrder || 0, req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' })
    res.json({ alert: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/alerts/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM public_alerts WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ── Public FAQs ────────────────────────────────────────────────────────────────
router.get('/faqs', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT * FROM public_faqs WHERE school_id=$1 ORDER BY sort_order, created_at`,
      [req.user!.schoolId]
    )
    res.json({ faqs: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/faqs', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { question, answer, sortOrder, isPublished } = req.body
    if (!question || !answer) return res.status(400).json({ error: 'السؤال والجواب مطلوبان' })
    const result = await query(
      `INSERT INTO public_faqs (school_id, question, answer, sort_order, is_published) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user!.schoolId, sanitize(question, 500), sanitize(answer), sortOrder || 0, isPublished !== false]
    )
    res.status(201).json({ faq: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/faqs/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { question, answer, sortOrder, isPublished } = req.body
    const result = await query(
      `UPDATE public_faqs SET question=$1, answer=$2, sort_order=$3, is_published=$4 WHERE id=$5 AND school_id=$6 RETURNING *`,
      [sanitize(question, 500), sanitize(answer), sortOrder || 0, isPublished !== false, req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' })
    res.json({ faq: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/faqs/:id', writeLimiter, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM public_faqs WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
