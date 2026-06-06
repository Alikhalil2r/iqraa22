import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
const router = Router()
router.use(authenticateToken, requireRole('super_admin', 'admin'))
const s = (v: unknown, max = 5000) => String(v ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max)
const sid = (req: AuthRequest) => req.user!.schoolId

// ── Videos ───────────────────────────────────────────────────────────────────
router.get('/videos', async (req: AuthRequest, res) => {
  const r = await query(`SELECT * FROM public_videos WHERE school_id=$1 ORDER BY sort_order, created_at DESC`, [sid(req)])
  res.json({ videos: r.rows })
})
router.post('/videos', writeLimiter, async (req: AuthRequest, res) => {
  const { title, videoUrl, category, description, sortOrder, isPublished } = req.body
  if (!title || !videoUrl) return res.status(400).json({ error: 'العنوان والرابط مطلوبان' })
  const r = await query(
    `INSERT INTO public_videos (school_id,title,video_url,category,description,sort_order,is_published) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [sid(req), s(title, 300), s(videoUrl, 500), s(category, 100), s(description), sortOrder || 0, isPublished !== false]
  )
  res.status(201).json({ video: r.rows[0] })
})
router.delete('/videos/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM public_videos WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})

// ── Articles (student / teacher) ─────────────────────────────────────────────
router.get('/articles', async (req: AuthRequest, res) => {
  const { type } = req.query
  let sql = `SELECT * FROM public_articles WHERE school_id=$1`
  const params: unknown[] = [sid(req)]
  if (type) { params.push(type); sql += ` AND article_type=$${params.length}` }
  sql += ' ORDER BY publish_date DESC, sort_order'
  const r = await query(sql, params)
  res.json({ articles: r.rows })
})
router.post('/articles', writeLimiter, async (req: AuthRequest, res) => {
  const { articleType, authorName, grade, subject, title, content, category, publishDate, sortOrder, isPublished } = req.body
  if (!title || !content || !authorName) return res.status(400).json({ error: 'العنوان والمحتوى واسم الكاتب مطلوبة' })
  const type = articleType === 'teacher' ? 'teacher' : 'student'
  const r = await query(
    `INSERT INTO public_articles (school_id,article_type,author_name,grade,subject,title,content,category,publish_date,sort_order,is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [sid(req), type, s(authorName, 200), s(grade, 100), s(subject, 100), s(title, 300), s(content),
     s(category, 100), publishDate || null, sortOrder || 0, isPublished !== false]
  )
  res.status(201).json({ article: r.rows[0] })
})
router.delete('/articles/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM public_articles WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})

// ── School teams ─────────────────────────────────────────────────────────────
router.get('/teams', async (req: AuthRequest, res) => {
  const r = await query(`SELECT * FROM school_teams WHERE school_id=$1 ORDER BY sort_order, name`, [sid(req)])
  res.json({ teams: r.rows })
})
router.post('/teams', writeLimiter, async (req: AuthRequest, res) => {
  const { name, category, membersCount, description, achievements, imageUrl, colorGradient, sortOrder, isPublished } = req.body
  if (!name) return res.status(400).json({ error: 'اسم الفريق مطلوب' })
  const r = await query(
    `INSERT INTO school_teams (school_id,name,category,members_count,description,achievements,image_url,color_gradient,sort_order,is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [sid(req), s(name, 200), s(category, 100), membersCount || 0, s(description), s(achievements, 500),
     imageUrl || null, s(colorGradient, 100) || 'from-teal-500 to-teal-600', sortOrder || 0, isPublished !== false]
  )
  res.status(201).json({ team: r.rows[0] })
})
router.delete('/teams/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM school_teams WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})

// ── Hall of fame ─────────────────────────────────────────────────────────────
router.get('/hall-of-fame', async (req: AuthRequest, res) => {
  const r = await query(`SELECT * FROM hall_of_fame WHERE school_id=$1 ORDER BY year DESC, rank, sort_order`, [sid(req)])
  res.json({ entries: r.rows })
})
router.post('/hall-of-fame', writeLimiter, async (req: AuthRequest, res) => {
  const { name, grade, year, achievement, category, rank, imageUrl, description, sortOrder, isPublished } = req.body
  if (!name) return res.status(400).json({ error: 'الاسم مطلوب' })
  const r = await query(
    `INSERT INTO hall_of_fame (school_id,name,grade,year,achievement,category,rank,image_url,description,sort_order,is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [sid(req), s(name, 200), s(grade, 100), s(year, 10), s(achievement, 300), s(category, 100),
     rank || 1, imageUrl || null, s(description), sortOrder || 0, isPublished !== false]
  )
  res.status(201).json({ entry: r.rows[0] })
})
router.delete('/hall-of-fame/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM hall_of_fame WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})

// ── Learning support ─────────────────────────────────────────────────────────
router.get('/learning-support', async (req: AuthRequest, res) => {
  const schoolId = sid(req)
  const [settings, services, specialists, articles, gallery] = await Promise.all([
    query('SELECT * FROM learning_support_settings WHERE school_id=$1', [schoolId]),
    query('SELECT * FROM ls_services WHERE school_id=$1 ORDER BY sort_order', [schoolId]),
    query('SELECT * FROM ls_specialists WHERE school_id=$1 ORDER BY sort_order', [schoolId]),
    query('SELECT * FROM ls_articles WHERE school_id=$1 ORDER BY publish_date DESC', [schoolId]),
    query('SELECT * FROM ls_gallery WHERE school_id=$1 ORDER BY sort_order', [schoolId]),
  ])
  res.json({
    settings: settings.rows[0] || { about_text: '' },
    services: services.rows,
    specialists: specialists.rows,
    articles: articles.rows,
    gallery: gallery.rows,
  })
})
router.put('/learning-support/settings', writeLimiter, async (req: AuthRequest, res) => {
  const { aboutText } = req.body
  await query(
    `INSERT INTO learning_support_settings (school_id, about_text, updated_at) VALUES ($1,$2,NOW())
     ON CONFLICT (school_id) DO UPDATE SET about_text=$2, updated_at=NOW()`,
    [sid(req), s(aboutText, 3000)]
  )
  res.json({ success: true })
})
router.post('/learning-support/services', writeLimiter, async (req: AuthRequest, res) => {
  const { title, icon, description, sortOrder } = req.body
  const r = await query(
    `INSERT INTO ls_services (school_id,title,icon,description,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [sid(req), s(title, 200), s(icon, 20) || '📖', s(description), sortOrder || 0]
  )
  res.status(201).json({ service: r.rows[0] })
})
router.delete('/learning-support/services/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM ls_services WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})
router.post('/learning-support/specialists', writeLimiter, async (req: AuthRequest, res) => {
  const { name, role, imageUrl, bio, sortOrder } = req.body
  const r = await query(
    `INSERT INTO ls_specialists (school_id,name,role,image_url,bio,sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sid(req), s(name, 200), s(role, 200), imageUrl || null, s(bio), sortOrder || 0]
  )
  res.status(201).json({ specialist: r.rows[0] })
})
router.delete('/learning-support/specialists/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM ls_specialists WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})
router.post('/learning-support/articles', writeLimiter, async (req: AuthRequest, res) => {
  const { title, content, publishDate, sortOrder } = req.body
  const r = await query(
    `INSERT INTO ls_articles (school_id,title,content,publish_date,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [sid(req), s(title, 300), s(content), publishDate || null, sortOrder || 0]
  )
  res.status(201).json({ article: r.rows[0] })
})
router.delete('/learning-support/articles/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM ls_articles WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})
router.post('/learning-support/gallery', writeLimiter, async (req: AuthRequest, res) => {
  const { title, imageUrl, sortOrder } = req.body
  if (!imageUrl) return res.status(400).json({ error: 'رابط الصورة مطلوب' })
  const r = await query(
    `INSERT INTO ls_gallery (school_id,title,image_url,sort_order) VALUES ($1,$2,$3,$4) RETURNING *`,
    [sid(req), s(title, 200), imageUrl, sortOrder || 0]
  )
  res.status(201).json({ item: r.rows[0] })
})
router.delete('/learning-support/gallery/:id', writeLimiter, async (req: AuthRequest, res) => {
  await query('DELETE FROM ls_gallery WHERE id=$1 AND school_id=$2', [req.params.id, sid(req)])
  res.json({ success: true })
})

export default router
