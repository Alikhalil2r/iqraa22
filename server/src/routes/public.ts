import { Router } from 'express'
import { query } from '../db'
import { createLogger } from '../utils/logger'
import { publicFormLimiter } from '../middleware/rateLimiter'

const log = createLogger('PUBLIC')
const router = Router()

const sanitize = (v: unknown, maxLen = 2000): string =>
  String(v ?? '').replace(/<[^>]*>/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim().slice(0, maxLen)
const sanitizeEmail = (v: unknown): string =>
  String(v ?? '').toLowerCase().trim().replace(/[^a-z0-9@._+-]/g, '').slice(0, 254)

async function getDefaultSchoolId(): Promise<string | null> {
  const r = await query('SELECT id FROM schools LIMIT 1')
  return r.rows[0]?.id || null
}

async function getSchoolBySlug(slug: string): Promise<string | null> {
  const r = await query(`SELECT id FROM schools WHERE slug=$1 AND status='active' LIMIT 1`, [slug])
  return r.rows[0]?.id || null
}

// ── GET /api/public/school/:slug — multi-tenant public API (#17) ───────────
router.get('/school/:slug', async (req, res) => {
  try {
    const schoolId = await getSchoolBySlug(req.params.slug)
    if (!schoolId) return res.status(404).json({ error: 'School not found' })

    const schoolResult = await query(
      `SELECT id, name, name_en, tagline, tagline_en, logo_url, address, phone, email, website, slug
       FROM schools WHERE id=$1`,
      [schoolId]
    )
    const school = schoolResult.rows[0]
    const settingsResult = await query(
      `SELECT primary_color, primary_dark, primary_light, accent_color, accent_dark,
              logo_url, show_parent_portal, show_jobs, founded_year, office_hours
       FROM school_settings WHERE school_id=$1`,
      [schoolId]
    )
    const s = settingsResult.rows[0] || {}
    res.json({
      school: {
        id: school.id,
        slug: school.slug,
        name: school.name,
        nameEn: school.name_en,
        tagline: school.tagline,
        address: school.address,
        phone: school.phone,
        email: school.email,
      },
      theme: {
        primaryColor: s.primary_color || '#065f46',
        primaryDark: s.primary_dark || '#064e3b',
        primaryLight: s.primary_light || '#10b981',
        accentColor: s.accent_color || '#fbbf24',
        showParentPortal: s.show_parent_portal ?? true,
        showJobs: s.show_jobs ?? true,
      },
    })
  } catch (err) {
    log.error('GET /school/:slug failed', { slug: req.params.slug, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/school ─────────────────────────────────────────────────
// Explicit columns only — never SELECT * on schools (may contain internal fields)
router.get('/school', async (_req, res) => {
  try {
    const schoolResult = await query(
      `SELECT id, name, name_en, tagline, tagline_en, logo_url, address, phone, email, website
       FROM schools LIMIT 1`
    )
    const school = schoolResult.rows[0]
    if (!school) {
      return res.json({
        school: {
          name: 'مدرسة النور العالمية',
          nameEn: 'Al-Noor International School',
          tagline: 'نور العلم يضيء المستقبل — موقع تجريبي',
          address: 'حي القرم، مسقط، سلطنة عُمان',
          phone: '+968 24 500 000',
          email: 'info@alnoor-school.demo',
          establishedYear: '2012',
          officeHours: 'الأحد – الخميس | 7:00 ص – 2:30 م',
          stats: { students: '850+', teachers: '65+', classrooms: '42', years: '14+' },
          social: {
            instagram: 'https://instagram.com/alnoor.demo',
            twitter: 'https://twitter.com/alnoor.demo',
            facebook: 'https://facebook.com/alnoor.demo',
            youtube: 'https://youtube.com/@alnoor.demo',
            whatsapp: '96899000111',
          },
        },
        theme: {
          primaryColor: '#065f46', primaryDark: '#064e3b', primaryLight: '#10b981',
          accentColor: '#fbbf24', accentDark: '#f59e0b',
          schoolName: 'مدرسة النور العالمية',
          schoolNameEn: 'Al-Noor International School',
          tagline: 'نور العلم يضيء المستقبل',
          showParentPortal: true, showJobs: true,
        },
      })
    }

    const settingsResult = await query(
      `SELECT about_text, about_text_en, vision, vision_en, mission, mission_en,
              principal_name, principal_message, principal_message_en, principal_image,
              hero_image, primary_color, primary_dark, primary_light, accent_color, accent_dark,
              logo_url, show_parent_portal, show_jobs, custom_css,
              founded_year, map_embed, office_hours, office_hours_en, values_text, objectives,
              students_count, teachers_count, classrooms_count, years_experience,
              instagram, twitter, facebook, youtube, snapchat, tiktok, whatsapp
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
        taglineEn: school.tagline_en,
        address: school.address,
        phone: school.phone,
        email: school.email,
        website: school.website,
        establishedYear: s.founded_year || '2015',
        logoUrl: school.logo_url,
        aboutText: s.about_text,
        aboutTextEn: s.about_text_en,
        vision: s.vision,
        visionEn: s.vision_en,
        mission: s.mission,
        missionEn: s.mission_en,
        principalName: s.principal_name,
        principalMessage: s.principal_message,
        principalMessageEn: s.principal_message_en,
        principalImage: s.principal_image,
        heroImage: s.hero_image,
        mapEmbed: s.map_embed,
        officeHours: s.office_hours || 'الأحد – الخميس | 7:00 ص – 2:30 م',
        officeHoursEn: s.office_hours_en || 'Sun – Thu | 7:00 AM – 2:30 PM',
        values: s.values_text,
        objectives: s.objectives,
        stats: {
          students: s.students_count || '500+',
          teachers: s.teachers_count || '40+',
          classrooms: s.classrooms_count || '25+',
          years: s.years_experience || '10+',
        },
        social: {
          instagram: s.instagram || 'https://instagram.com/alnoor.demo',
          twitter: s.twitter || 'https://twitter.com/alnoor.demo',
          facebook: s.facebook || 'https://facebook.com/alnoor.demo',
          youtube: s.youtube || 'https://youtube.com/@alnoor.demo',
          snapchat: s.snapchat, tiktok: s.tiktok,
          whatsapp: s.whatsapp || '96899000111',
        },
      },
      theme: {
        primaryColor:  s.primary_color  || '#065f46',
        primaryDark:   s.primary_dark   || '#064e3b',
        primaryLight:  s.primary_light  || '#10b981',
        accentColor:   s.accent_color   || '#f59e0b',
        accentDark:    s.accent_dark    || '#d97706',
        logoUrl:       s.logo_url       || school.logo_url,
        schoolName:    school.name,
        schoolNameEn:  school.name_en,
        tagline:       school.tagline,
        taglineEn:     school.tagline_en,
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
      `SELECT id, title, title_en, summary, summary_en, image_url, category, category_en,
              publish_date, views, is_featured
       FROM news WHERE school_id=$1 AND is_published=true
       ORDER BY publish_date DESC LIMIT 20`,
      [school.id]
    )
    res.json({ news: result.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/news/:id ────────────────────────────────────────────────
router.get('/news/:id', async (req, res) => {
  try {
    const school = (await query('SELECT id FROM schools LIMIT 1')).rows[0]
    if (!school) return res.status(404).json({ error: 'الخبر غير موجود' })
    const result = await query(
      `UPDATE news SET views = COALESCE(views, 0) + 1
       WHERE id = $1 AND school_id = $2 AND is_published = true
       RETURNING id, title, title_en, summary, summary_en, content, content_en,
                 image_url, category, category_en, publish_date, views, is_featured`,
      [req.params.id, school.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'الخبر غير موجود' })
    res.json({ news: result.rows[0] })
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
      `SELECT id, title, title_en, description, description_en, image_url, category, category_en, achievement_date, student_name, class_name
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
      `SELECT id, title, title_en, description, description_en, image_url, category, category_en, created_at
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
      `SELECT id, title, title_en, event_type, start_date, end_date, location, description, description_en, color
       FROM events WHERE school_id=$1 AND is_public=true AND end_date >= NOW()
       ORDER BY start_date LIMIT 10`,
      [school.id]
    )
    res.json({ events: result.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/alerts ───────────────────────────────────────────────────
router.get('/alerts', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ alerts: [] })
    const result = await query(
      `SELECT id, message, message_en, alert_type, sort_order, created_at
       FROM public_alerts
       WHERE school_id=$1 AND is_active=true
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY sort_order, created_at DESC LIMIT 5`,
      [schoolId]
    )
    res.json({ alerts: result.rows })
  } catch (err) {
    log.error('GET /public/alerts failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/faqs ─────────────────────────────────────────────────────
router.get('/faqs', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ faqs: [] })
    const result = await query(
      `SELECT id, question, question_en, answer, answer_en, sort_order FROM public_faqs
       WHERE school_id=$1 AND is_published=true ORDER BY sort_order, created_at`,
      [schoolId]
    )
    res.json({ faqs: result.rows })
  } catch (err) {
    log.error('GET /public/faqs failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/jobs ─────────────────────────────────────────────────────
router.get('/jobs', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ jobs: [] })
    const result = await query(
      `SELECT id, title, department, job_type, deadline, requirements, description, is_active, created_at
       FROM job_postings
       WHERE school_id=$1 AND is_active=true
         AND (deadline IS NULL OR deadline >= CURRENT_DATE)
       ORDER BY created_at DESC`,
      [schoolId]
    )
    res.json({ jobs: result.rows })
  } catch (err) {
    log.error('GET /public/jobs failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/alumni ───────────────────────────────────────────────────
router.get('/alumni', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ alumni: [] })
    const result = await query(
      `SELECT id, name, graduation_year, job_title, city, story, achievement, image_url, created_at
       FROM alumni_registrations
       WHERE school_id=$1 AND status='approved'
       ORDER BY graduation_year DESC, name`,
      [schoolId]
    )
    res.json({ alumni: result.rows })
  } catch (err) {
    log.error('GET /public/alumni failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/public/contact ─────────────────────────────────────────────────
router.post('/contact', publicFormLimiter, async (req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.status(503).json({ error: 'المدرسة غير متاحة حالياً' })

    const name    = sanitize(req.body.name, 200)
    const phone   = sanitize(req.body.phone, 50)
    const email   = sanitizeEmail(req.body.email)
    const subject = sanitize(req.body.subject, 200)
    const message = sanitize(req.body.message, 5000)

    if (!name || !email || !message) return res.status(400).json({ error: 'الاسم والبريد والرسالة مطلوبة' })
    if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })

    const result = await query(
      `INSERT INTO contact_submissions (school_id, name, phone, email, subject, message)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
      [schoolId, name, phone || null, email, subject || null, message]
    )
    const id = result.rows[0].id as string
    const ref = `MSG-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
    res.json({
      ok: true, id, ref,
      message: 'تم إرسال رسالتك بنجاح',
      sla: 'سنرد عليك خلال 24 ساعة عمل',
    })
  } catch (err) {
    log.error('POST /public/contact failed', { error: (err as Error).message })
    res.status(500).json({ error: 'فشل إرسال الرسالة. حاول مجدداً.' })
  }
})

// ── POST /api/public/admission ───────────────────────────────────────────────
router.post('/admission', publicFormLimiter, async (req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.status(503).json({ error: 'المدرسة غير متاحة حالياً' })

    const parentName  = sanitize(req.body.parentName || req.body.parent_name, 200)
    const studentName = sanitize(req.body.studentName || req.body.student_name, 200)
    const grade       = sanitize(req.body.grade, 100)
    const phone       = sanitize(req.body.phone, 50)
    const email       = sanitizeEmail(req.body.email)
    const notes       = sanitize(req.body.notes, 2000)

    if (!parentName || !studentName || !grade || !phone || !email) {
      return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب تعبئتها' })
    }
    if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })

    const message = [
      `طلب تسجيل وقبول`,
      `اسم الطالب: ${studentName}`,
      `الصف المطلوب: ${grade}`,
      `هاتف ولي الأمر: ${phone}`,
      notes ? `ملاحظات: ${notes}` : '',
    ].filter(Boolean).join('\n')

    const result = await query(
      `INSERT INTO contact_submissions (school_id, name, phone, email, subject, message)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
      [schoolId, parentName, phone, email, `طلب تسجيل وقبول — ${grade}`, message]
    )
    const id = result.rows[0].id as string
    const ref = `ADM-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
    res.json({
      ok: true, id, ref,
      message: 'تم إرسال طلب التسجيل بنجاح',
      sla: 'سنتواصل معكم خلال 3–5 أيام عمل',
    })
  } catch (err) {
    log.error('POST /public/admission failed', { error: (err as Error).message })
    res.status(500).json({ error: 'فشل إرسال طلب التسجيل. حاول مجدداً.' })
  }
})

// ── POST /api/public/jobs/apply ──────────────────────────────────────────────
router.post('/jobs/apply', publicFormLimiter, async (req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.status(503).json({ error: 'المدرسة غير متاحة حالياً' })

    const jobId    = req.body.job_id || null
    const jobTitle = sanitize(req.body.job_title || req.body.jobTitle, 300)
    const name     = sanitize(req.body.name, 200)
    const email    = sanitizeEmail(req.body.email)
    const phone    = sanitize(req.body.phone, 50)
    const formData = req.body.form_data || req.body

    if (!jobTitle || !name || !email) return res.status(400).json({ error: 'الوظيفة والاسم والبريد مطلوبة' })
    if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })

    if (jobId) {
      const jobCheck = await query(
        `SELECT id FROM job_postings WHERE id=$1 AND school_id=$2 AND is_active=true`,
        [jobId, schoolId]
      )
      if (!jobCheck.rows[0]) return res.status(400).json({ error: 'الوظيفة غير متاحة' })
    }

    const safeForm: Record<string, string> = {}
    for (const [k, v] of Object.entries(formData)) {
      if (typeof v === 'string' || typeof v === 'number') safeForm[k] = sanitize(v, 2000)
    }

    const result = await query(
      `INSERT INTO job_applications (school_id, job_id, job_title, applicant_name, email, phone, form_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
      [schoolId, jobId, jobTitle, name, email, phone || null, JSON.stringify(safeForm)]
    )
    res.json({ ok: true, id: result.rows[0].id, message: 'تم إرسال طلبك بنجاح' })
  } catch (err) {
    log.error('POST /public/jobs/apply failed', { error: (err as Error).message })
    res.status(500).json({ error: 'فشل إرسال الطلب. حاول مجدداً.' })
  }
})

// ── POST /api/public/alumni/register ─────────────────────────────────────────
router.post('/alumni/register', publicFormLimiter, async (req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.status(503).json({ error: 'المدرسة غير متاحة حالياً' })

    const name  = sanitize(req.body.name, 200)
    const email = sanitizeEmail(req.body.email)
    const phone = sanitize(req.body.phone, 50)
    const job   = sanitize(req.body.job || req.body.job_title, 300)
    const city  = sanitize(req.body.city, 200)
    const story = sanitize(req.body.story, 5000)
    const achievement = sanitize(req.body.achievement, 500)
    const year  = parseInt(String(req.body.year || req.body.graduation_year), 10)

    if (!name || !email || !job || !story) return res.status(400).json({ error: 'الاسم والبريد والوظيفة والقصة مطلوبة' })
    if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })
    if (!year || year < 1990 || year > new Date().getFullYear()) return res.status(400).json({ error: 'سنة التخرج غير صحيحة' })

    const result = await query(
      `INSERT INTO alumni_registrations (school_id, name, graduation_year, job_title, city, email, phone, story, achievement)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at`,
      [schoolId, name, year, job, city || null, email, phone || null, story, achievement || null]
    )
    res.json({ ok: true, id: result.rows[0].id, message: 'تم إرسال بياناتك بنجاح وسيتم مراجعتها' })
  } catch (err) {
    log.error('POST /public/alumni/register failed', { error: (err as Error).message })
    res.status(500).json({ error: 'فشل إرسال البيانات. حاول مجدداً.' })
  }
})

// ── GET /api/public/videos ───────────────────────────────────────────────────
router.get('/videos', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ videos: [] })
    const result = await query(
      `SELECT id, title, video_url, category, description, sort_order FROM public_videos
       WHERE school_id=$1 AND is_published=true ORDER BY sort_order, created_at DESC`,
      [schoolId]
    )
    res.json({ videos: result.rows })
  } catch (err) {
    log.error('GET /public/videos failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/articles ─────────────────────────────────────────────────
router.get('/articles', async (req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ articles: [] })
    const { type } = req.query
    let sql = `SELECT id, article_type, author_name, grade, subject, title, content, category, publish_date
               FROM public_articles WHERE school_id=$1 AND is_published=true`
    const params: unknown[] = [schoolId]
    if (type) { params.push(type); sql += ` AND article_type=$${params.length}` }
    sql += ' ORDER BY publish_date DESC, sort_order'
    const result = await query(sql, params)
    res.json({ articles: result.rows })
  } catch (err) {
    log.error('GET /public/articles failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/teams ────────────────────────────────────────────────────
router.get('/teams', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ teams: [] })
    const result = await query(
      `SELECT id, name, category, members_count, description, achievements, image_url, color_gradient
       FROM school_teams WHERE school_id=$1 AND is_published=true ORDER BY sort_order, name`,
      [schoolId]
    )
    res.json({ teams: result.rows })
  } catch (err) {
    log.error('GET /public/teams failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/hall-of-fame ─────────────────────────────────────────────
router.get('/hall-of-fame', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ entries: [] })
    const result = await query(
      `SELECT id, name, grade, year, achievement, category, rank, image_url, description
       FROM hall_of_fame WHERE school_id=$1 AND is_published=true ORDER BY year DESC, rank, sort_order`,
      [schoolId]
    )
    res.json({ entries: result.rows })
  } catch (err) {
    log.error('GET /public/hall-of-fame failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// ── GET /api/public/learning-support ─────────────────────────────────────────
router.get('/learning-support', async (_req, res) => {
  try {
    const schoolId = await getDefaultSchoolId()
    if (!schoolId) return res.json({ about: '', services: [], specialists: [], articles: [], gallery: [] })
    const [settings, services, specialists, articles, gallery] = await Promise.all([
      query('SELECT about_text FROM learning_support_settings WHERE school_id=$1', [schoolId]),
      query(`SELECT id, title, icon, description FROM ls_services WHERE school_id=$1 AND is_published=true ORDER BY sort_order`, [schoolId]),
      query(`SELECT id, name, role, image_url, bio FROM ls_specialists WHERE school_id=$1 AND is_published=true ORDER BY sort_order`, [schoolId]),
      query(`SELECT id, title, content, publish_date FROM ls_articles WHERE school_id=$1 AND is_published=true ORDER BY publish_date DESC`, [schoolId]),
      query(`SELECT id, title, image_url FROM ls_gallery WHERE school_id=$1 AND is_published=true ORDER BY sort_order`, [schoolId]),
    ])
    res.json({
      about: settings.rows[0]?.about_text || '',
      services: services.rows,
      specialists: specialists.rows,
      articles: articles.rows,
      gallery: gallery.rows,
    })
  } catch (err) {
    log.error('GET /public/learning-support failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
