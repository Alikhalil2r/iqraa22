import { Router } from 'express'
import { query } from '../db'

const router = Router()

// Get school info + theme (public, no auth)
router.get('/school', async (req, res) => {
  try {
    // Use first school (can be extended to per-subdomain)
    const schoolResult = await query('SELECT * FROM schools LIMIT 1')
    const school = schoolResult.rows[0]
    if (!school) return res.json({ school: null, theme: null })

    const settingsResult = await query('SELECT * FROM school_settings WHERE school_id=$1', [school.id])
    const settings = settingsResult.rows[0] || {}

    res.json({
      school: {
        ...school,
        aboutText: settings.about_text,
        vision: settings.vision,
        mission: settings.mission,
        principalName: settings.principal_name,
        principalMessage: settings.principal_message,
        principalImage: settings.principal_image,
        heroImage: settings.hero_image,
      },
      theme: {
        primaryColor: settings.primary_color || '#1e40af',
        primaryDark: settings.primary_dark || '#1e3a8a',
        primaryLight: settings.primary_light || '#3b82f6',
        accentColor: settings.accent_color || '#f59e0b',
        accentDark: settings.accent_dark || '#d97706',
        logoUrl: settings.logo_url || school.logo_url,
        schoolName: school.name,
        schoolNameEn: school.name_en,
        tagline: school.tagline,
        showParentPortal: settings.show_parent_portal,
        showJobs: settings.show_jobs,
        customCss: settings.custom_css,
      }
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/news', async (req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ news: [] })
    const result = await query(
      `SELECT id,title,summary,image_url,category,publish_date,views FROM news
       WHERE school_id=$1 AND is_published=true ORDER BY publish_date DESC LIMIT 20`,
      [school.id]
    )
    res.json({ news: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/staff', async (req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ staff: [] })
    const result = await query(
      'SELECT * FROM staff_public WHERE school_id=$1 ORDER BY sort_order, name',
      [school.id]
    )
    res.json({ staff: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/achievements', async (req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ achievements: [] })
    const result = await query(
      'SELECT * FROM achievements WHERE school_id=$1 AND is_published=true ORDER BY achievement_date DESC LIMIT 20',
      [school.id]
    )
    res.json({ achievements: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/gallery', async (req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ gallery: [] })
    const result = await query(
      'SELECT * FROM gallery WHERE school_id=$1 AND is_published=true ORDER BY created_at DESC',
      [school.id]
    )
    res.json({ gallery: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/events', async (req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.json({ events: [] })
    const result = await query(
      `SELECT * FROM events WHERE school_id=$1 AND is_public=true AND end_date >= NOW()
       ORDER BY start_date LIMIT 10`,
      [school.id]
    )
    res.json({ events: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
