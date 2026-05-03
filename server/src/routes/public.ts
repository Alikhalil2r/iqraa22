import { Router } from 'express'
import { query } from '../db'
import { createLogger } from '../utils/logger'

const log = createLogger('PUBLIC')
const router = Router()

// ── GET /api/public/school ─────────────────────────────────────────────────
// Explicit columns only — never SELECT * on schools (may contain internal fields)
router.get('/school', async (_req, res) => {
  try {
    const schoolResult = await query(
      `SELECT id, name, name_en, tagline, logo_url, address, phone, email, website
       FROM schools LIMIT 1`
    )
    const school = schoolResult.rows[0]
    if (!school) return res.json({ school: null, theme: null })

    const settingsResult = await query(
      `SELECT about_text, vision, mission, principal_name, principal_message, principal_image,
              hero_image, primary_color, primary_dark, primary_light, accent_color, accent_dark,
              logo_url, show_parent_portal, show_jobs, custom_css
       FROM school_settings WHERE school_id=$1`,
      [school.id]
    )
    const s = settingsResult.rows[0] || {}

    res.json({
      school: {
        id: school.id,
        name: school.name,
        nameEn: school.name_en,
        tagline: school.tagline,
        address: school.address,
        phone: school.phone,
        email: school.email,
        website: school.website,
        establishedYear: null,
        logoUrl: school.logo_url,
        aboutText: s.about_text,
        vision: s.vision,
        mission: s.mission,
        principalName: s.principal_name,
        principalMessage: s.principal_message,
        principalImage: s.principal_image,
        heroImage: s.hero_image,
      },
      theme: {
        primaryColor:  s.primary_color  || '#1e40af',
        primaryDark:   s.primary_dark   || '#1e3a8a',
        primaryLight:  s.primary_light  || '#3b82f6',
        accentColor:   s.accent_color   || '#f59e0b',
        accentDark:    s.accent_dark    || '#d97706',
        logoUrl:       s.logo_url       || school.logo_url,
        schoolName:    school.name,
        schoolNameEn:  school.name_en,
        tagline:       school.tagline,
        showParentPortal: s.show_parent_portal,
        showJobs:      s.show_jobs,
        customCss:     s.custom_css,
      }
    })
  } catch (err) {
    log.error('GET /public/school failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/news ────────────────────────────────────────────────────
router.get('/news', async (_req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ news: [] })
    const result = await query(
      `SELECT id, title, summary, image_url, category, publish_date, views
       FROM news WHERE school_id=$1 AND is_published=true
       ORDER BY publish_date DESC LIMIT 20`,
      [school.id]
    )
    res.json({ news: result.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/staff ───────────────────────────────────────────────────
router.get('/staff', async (_req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ staff: [] })
    const result = await query(
      `SELECT id, name, position, department, photo, bio, is_featured, sort_order
       FROM staff_public WHERE school_id=$1 ORDER BY sort_order, name`,
      [school.id]
    )
    res.json({ staff: result.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/achievements ────────────────────────────────────────────
router.get('/achievements', async (_req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ achievements: [] })
    const result = await query(
      `SELECT id, title, description, image_url, category, achievement_date, student_name, grade
       FROM achievements WHERE school_id=$1 AND is_published=true
       ORDER BY achievement_date DESC LIMIT 20`,
      [school.id]
    )
    res.json({ achievements: result.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/gallery ─────────────────────────────────────────────────
router.get('/gallery', async (_req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ gallery: [] })
    const result = await query(
      `SELECT id, title, image_url, category, created_at
       FROM gallery WHERE school_id=$1 AND is_published=true
       ORDER BY created_at DESC`,
      [school.id]
    )
    res.json({ gallery: result.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/events ──────────────────────────────────────────────────
router.get('/events', async (_req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ events: [] })
    const result = await query(
      `SELECT id, title, event_type, start_date, end_date, location, description
       FROM events WHERE school_id=$1 AND is_public=true AND end_date >= NOW()
       ORDER BY start_date LIMIT 10`,
      [school.id]
    )
    res.json({ events: result.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
