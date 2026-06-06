import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { createLogger } from '../utils/logger'
import { isValidUUID } from '../middleware/validate'

const log = createLogger('SUBMISSIONS')
const router = Router()

router.use(authenticateToken, requireRole('super_admin', 'admin', 'hr_manager'))

// ── GET /api/submissions/contact ─────────────────────────────────────────────
router.get('/contact', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query
    const params: unknown[] = [req.user!.schoolId]
    let sql = `SELECT id, name, phone, email, subject, message, status, created_at
               FROM contact_submissions WHERE school_id=$1`
    if (status && typeof status === 'string') {
      params.push(status)
      sql += ` AND status=$${params.length}`
    }
    sql += ' ORDER BY created_at DESC LIMIT 200'
    const result = await query(sql, params)
    res.json({ submissions: result.rows })
  } catch (err) {
    log.error('GET /submissions/contact failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── PATCH /api/submissions/contact/:id ───────────────────────────────────────
router.patch('/contact/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    if (!isValidUUID(id)) return res.status(400).json({ error: 'معرف غير صالح' })
    const { status } = req.body
    const allowed = ['new', 'read', 'replied', 'archived']
    if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' })
    const result = await query(
      `UPDATE contact_submissions SET status=$1 WHERE id=$2 AND school_id=$3 RETURNING *`,
      [status, id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' })
    res.json({ submission: result.rows[0] })
  } catch (err) {
    log.error('PATCH /submissions/contact failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/submissions/jobs ──────────────────────────────────────────────────
router.get('/jobs', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query
    const params: unknown[] = [req.user!.schoolId]
    let sql = `SELECT id, job_id, job_title, applicant_name, email, phone, form_data, status, created_at
               FROM job_applications WHERE school_id=$1`
    if (status && typeof status === 'string') {
      params.push(status)
      sql += ` AND status=$${params.length}`
    }
    sql += ' ORDER BY created_at DESC LIMIT 200'
    const result = await query(sql, params)
    res.json({ applications: result.rows })
  } catch (err) {
    log.error('GET /submissions/jobs failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── PATCH /api/submissions/jobs/:id ────────────────────────────────────────────
router.patch('/jobs/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    if (!isValidUUID(id)) return res.status(400).json({ error: 'معرف غير صالح' })
    const { status } = req.body
    const allowed = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired', 'archived']
    if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' })
    const result = await query(
      `UPDATE job_applications SET status=$1 WHERE id=$2 AND school_id=$3 RETURNING *`,
      [status, id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' })
    res.json({ application: result.rows[0] })
  } catch (err) {
    log.error('PATCH /submissions/jobs failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/submissions/alumni ──────────────────────────────────────────────
router.get('/alumni', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query
    const params: unknown[] = [req.user!.schoolId]
    let sql = `SELECT id, name, graduation_year, job_title, city, email, phone, story, achievement, image_url, status, created_at
               FROM alumni_registrations WHERE school_id=$1`
    if (status && typeof status === 'string') {
      params.push(status)
      sql += ` AND status=$${params.length}`
    }
    sql += ' ORDER BY created_at DESC LIMIT 200'
    const result = await query(sql, params)
    res.json({ registrations: result.rows })
  } catch (err) {
    log.error('GET /submissions/alumni failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── PATCH /api/submissions/alumni/:id ──────────────────────────────────────────
router.patch('/alumni/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    if (!isValidUUID(id)) return res.status(400).json({ error: 'معرف غير صالح' })
    const { status } = req.body
    const allowed = ['pending', 'approved', 'rejected']
    if (!allowed.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' })
    const result = await query(
      `UPDATE alumni_registrations SET status=$1 WHERE id=$2 AND school_id=$3 RETURNING *`,
      [status, id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'غير موجود' })
    res.json({ registration: result.rows[0] })
  } catch (err) {
    log.error('PATCH /submissions/alumni failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/submissions/counts ───────────────────────────────────────────────
router.get('/counts', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const [contact, admissions, jobs, alumni] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM contact_submissions WHERE school_id=$1 AND status='new' AND subject NOT LIKE 'طلب تسجيل%'`, [schoolId]),
      query(`SELECT COUNT(*)::int AS c FROM contact_submissions WHERE school_id=$1 AND status='new' AND subject LIKE 'طلب تسجيل%'`, [schoolId]),
      query(`SELECT COUNT(*)::int AS c FROM job_applications WHERE school_id=$1 AND status='new'`, [schoolId]),
      query(`SELECT COUNT(*)::int AS c FROM alumni_registrations WHERE school_id=$1 AND status='pending'`, [schoolId]),
    ])
    res.json({
      contact: contact.rows[0]?.c || 0,
      admissions: admissions.rows[0]?.c || 0,
      jobs: jobs.rows[0]?.c || 0,
      alumni: alumni.rows[0]?.c || 0,
    })
  } catch (err) {
    log.error('GET /submissions/counts failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
