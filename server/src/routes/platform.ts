import { Router } from 'express'
import { query } from '../db'
import { withTransaction } from '../db/transaction'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('Platform')

// ─── PUBLIC endpoints (no auth) ──────────────────────────────────────────────

// GET /api/platform/services
router.get('/services', async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM platform_services WHERE is_active=true ORDER BY sort_order, created_at`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/portfolio
router.get('/portfolio', async (req, res) => {
  try {
    const category = req.query.category as string
    const params: unknown[] = []
    let where = ''
    if (category && category !== 'all') { params.push(category); where = `WHERE category = $1` }
    const rows = await query(`SELECT * FROM portfolio_items ${where} ORDER BY is_featured DESC, sort_order, created_at DESC`, params)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/testimonials
router.get('/testimonials', async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM testimonials WHERE is_featured=true ORDER BY sort_order, created_at DESC`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/faq
router.get('/faq', async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM faq_items WHERE is_active=true ORDER BY sort_order, id`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/pricing
router.get('/pricing', async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM pricing_plans WHERE is_active=true ORDER BY sort_order, price`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/blog
router.get('/blog', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(20, parseInt(req.query.limit as string) || 6)
    const offset = (page - 1) * limit
    const category = req.query.category as string
    const params: unknown[] = ['published']
    let where = `WHERE status=$1`
    if (category) { params.push(category); where += ` AND category=$${params.length}` }
    const [rows, cnt] = await Promise.all([
      query(`SELECT id,title,slug,excerpt,image_url,category,tags,author_name,published_at,views FROM blog_posts ${where} ORDER BY published_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
      query(`SELECT COUNT(*) FROM blog_posts ${where}`, params)
    ])
    res.json({ posts: rows.rows, total: parseInt(cnt.rows[0].count), page, pages: Math.ceil(parseInt(cnt.rows[0].count) / limit) })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/blog/:slug
router.get('/blog/:slug', async (req, res) => {
  try {
    const row = await query(`SELECT * FROM blog_posts WHERE slug=$1 AND status='published'`, [req.params.slug])
    if (!row.rows[0]) return res.status(404).json({ error: 'Post not found' })
    await query(`UPDATE blog_posts SET views=views+1 WHERE id=$1`, [row.rows[0].id])
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/settings
router.get('/settings', async (_req, res) => {
  try {
    const rows = await query(`SELECT key, value, type FROM company_settings`)
    const settings: Record<string, string> = {}
    rows.rows.forEach((r: any) => { settings[r.key] = r.value })
    res.json(settings)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// POST /api/platform/request — submit service request (PUBLIC, no auth)
router.post('/request', async (req, res) => {
  try {
    const { client_name, client_email, client_phone, client_company, service_type, title, description, budget_min, budget_max, expected_date } = req.body
    if (!client_name || !client_email || !title) return res.status(400).json({ error: 'الاسم والبريد والعنوان مطلوبة' })

    const year = new Date().getFullYear()
    const seq  = Date.now().toString().slice(-5)
    const ticket_number = `TKT-${year}-${seq}`

    const result = await withTransaction(async (client) => {
      // Upsert client
      let clientId: string | null = null
      if (client_email) {
        const existing = await client.query(`SELECT id FROM business_clients WHERE email=$1`, [client_email])
        if (existing.rows[0]) {
          clientId = existing.rows[0].id
        } else {
          const newClient = await client.query(
            `INSERT INTO business_clients (name,email,phone,company) VALUES ($1,$2,$3,$4) RETURNING id`,
            [client_name, client_email, client_phone || null, client_company || null]
          )
          clientId = newClient.rows[0].id
        }
      }
      const req2 = await client.query(
        `INSERT INTO service_requests (ticket_number,client_id,client_name,client_email,client_phone,client_company,service_type,title,description,budget_min,budget_max,expected_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [ticket_number, clientId, client_name, client_email, client_phone || null, client_company || null, service_type || null, title, description || null, budget_min || null, budget_max || null, expected_date || null]
      )
      return req2.rows[0]
    })
    res.json({ ok: true, ticket: result.ticket_number, id: result.id })
  } catch (err) {
    log.error('Service request failed', { error: (err as Error).message })
    res.status(500).json({ error: 'فشل إرسال الطلب. الرجاء المحاولة مجدداً.' })
  }
})

// ─── ADMIN endpoints (require auth) ──────────────────────────────────────────

router.use('/admin', authenticateToken, requireRole('super_admin', 'admin'))

// GET /api/platform/admin/stats — dashboard stats
router.get('/admin/stats', async (_req, res) => {
  try {
    const [requests, clients, projects, revenue] = await Promise.all([
      query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status='new') as new_count,
        COUNT(*) FILTER (WHERE status='in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status='completed') as completed
        FROM service_requests`),
      query(`SELECT COUNT(*) as total FROM business_clients WHERE status='active'`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='in_progress') as active FROM projects`),
      query(`SELECT COALESCE(SUM(budget),0) as total, COALESCE(SUM(paid),0) as paid FROM projects`),
    ])
    res.json({
      requests: requests.rows[0],
      clients:  parseInt(clients.rows[0].total),
      projects: projects.rows[0],
      revenue:  revenue.rows[0],
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/requests
router.get('/admin/requests', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit  = Math.min(50, parseInt(req.query.limit as string) || 20)
    const offset = (page - 1) * limit
    const status = req.query.status as string
    const params: unknown[] = []
    let where = ''
    if (status && status !== 'all') { params.push(status); where = `WHERE r.status=$1` }
    const [rows, cnt] = await Promise.all([
      query(`SELECT r.*, u.name as assigned_name FROM service_requests r LEFT JOIN users u ON u.id=r.assigned_to ${where} ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
      query(`SELECT COUNT(*) FROM service_requests r ${where}`, params)
    ])
    res.json({ requests: rows.rows, total: parseInt(cnt.rows[0].count), page, pages: Math.ceil(parseInt(cnt.rows[0].count) / limit) })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// PATCH /api/platform/admin/requests/:id
router.patch('/admin/requests/:id', async (req, res) => {
  try {
    const { status, priority, admin_notes, assigned_to } = req.body
    const updates: string[] = ['updated_at=NOW()']
    const params: unknown[] = []
    if (status)      { params.push(status);      updates.push(`status=$${params.length}`) }
    if (priority)    { params.push(priority);    updates.push(`priority=$${params.length}`) }
    if (admin_notes !== undefined) { params.push(admin_notes); updates.push(`admin_notes=$${params.length}`) }
    if (assigned_to) { params.push(assigned_to); updates.push(`assigned_to=$${params.length}`) }
    params.push(req.params.id)
    const row = await query(`UPDATE service_requests SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`, params)
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/clients
router.get('/admin/clients', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit  = Math.min(50, parseInt(req.query.limit as string) || 20)
    const offset = (page - 1) * limit
    const search = req.query.search as string
    const params: unknown[] = []
    let where = ''
    if (search) { params.push(`%${search}%`); where = `WHERE (c.name ILIKE $1 OR c.email ILIKE $1 OR c.company ILIKE $1)` }
    const [rows, cnt] = await Promise.all([
      query(`SELECT c.*, (SELECT COUNT(*) FROM service_requests r WHERE r.client_id=c.id) as request_count,
             (SELECT COUNT(*) FROM projects p WHERE p.client_id=c.id) as project_count
             FROM business_clients c ${where} ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`, params),
      query(`SELECT COUNT(*) FROM business_clients c ${where}`, params)
    ])
    res.json({ clients: rows.rows, total: parseInt(cnt.rows[0].count), page, pages: Math.ceil(parseInt(cnt.rows[0].count) / limit) })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/projects
router.get('/admin/projects', async (req, res) => {
  try {
    const status = req.query.status as string
    const params: unknown[] = []
    let where = ''
    if (status && status !== 'all') { params.push(status); where = `WHERE p.status=$1` }
    const rows = await query(
      `SELECT p.*, c.name as client_name, c.company as client_company
       FROM projects p LEFT JOIN business_clients c ON c.id=p.client_id
       ${where} ORDER BY p.created_at DESC LIMIT 50`, params)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// POST /api/platform/admin/projects — create project from request or directly
router.post('/admin/projects', async (req, res) => {
  try {
    const { request_id, client_id, title, description, budget, start_date, end_date, technologies } = req.body
    if (!title) return res.status(400).json({ error: 'العنوان مطلوب' })
    const seq = Date.now().toString().slice(-5)
    const project_number = `PRJ-${new Date().getFullYear()}-${seq}`
    const row = await query(
      `INSERT INTO projects (project_number,request_id,client_id,title,description,budget,start_date,end_date,technologies)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [project_number, request_id || null, client_id || null, title, description || null, budget || null, start_date || null, end_date || null, technologies || null]
    )
    if (request_id) await query(`UPDATE service_requests SET status='approved' WHERE id=$1`, [request_id])
    res.json(row.rows[0])
  } catch (err) {
    log.error('Create project', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/platform/admin/projects/:id
router.patch('/admin/projects/:id', async (req, res) => {
  try {
    const { status, progress, admin_notes, budget, paid } = req.body
    const updates: string[] = ['updated_at=NOW()']
    const params: unknown[] = []
    if (status !== undefined)   { params.push(status);   updates.push(`status=$${params.length}`) }
    if (progress !== undefined) { params.push(progress); updates.push(`progress=$${params.length}`) }
    if (budget !== undefined)   { params.push(budget);   updates.push(`budget=$${params.length}`) }
    if (paid !== undefined)     { params.push(paid);     updates.push(`paid=$${params.length}`) }
    params.push(req.params.id)
    const row = await query(`UPDATE projects SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`, params)
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ─── Blog admin ───────────────────────────────────────────────────────────────

router.get('/admin/blog', authenticateToken, async (_req, res) => {
  try {
    const rows = await query(`SELECT id,title,slug,category,status,views,published_at,created_at FROM blog_posts ORDER BY created_at DESC LIMIT 50`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/admin/blog', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, slug, excerpt, content, image_url, category, tags, status } = req.body
    if (!title || !slug) return res.status(400).json({ error: 'العنوان والرابط مطلوبان' })
    const published_at = status === 'published' ? new Date() : null
    const row = await query(
      `INSERT INTO blog_posts (title,slug,excerpt,content,image_url,category,tags,author_name,status,published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, slug, excerpt || null, content || null, image_url || null, category || null, JSON.stringify(tags || []), req.user?.name || 'Admin', status || 'draft', published_at]
    )
    res.json(row.rows[0])
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'الرابط مستخدم بالفعل' })
    res.status(500).json({ error: 'Server error' })
  }
})

// ─── Content admin ────────────────────────────────────────────────────────────

// Services CRUD
router.post('/admin/services', async (req, res) => {
  try {
    const { title, title_en, description, icon, color, price_from, duration_days, category, features } = req.body
    const row = await query(
      `INSERT INTO platform_services (title,title_en,description,icon,color,price_from,duration_days,category,features)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, title_en, description, icon, color, price_from || null, duration_days || null, category, JSON.stringify(features || [])]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// Testimonials CRUD
router.post('/admin/testimonials', async (req, res) => {
  try {
    const { client_name, client_position, company, content, rating } = req.body
    const row = await query(
      `INSERT INTO testimonials (client_name,client_position,company,content,rating) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [client_name, client_position, company, content, rating || 5]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// Portfolio CRUD
router.post('/admin/portfolio', async (req, res) => {
  try {
    const { title, description, image_url, category, client_name, project_url, technologies, is_featured } = req.body
    const row = await query(
      `INSERT INTO portfolio_items (title,description,image_url,category,client_name,project_url,technologies,is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, image_url, category, client_name, project_url, technologies, is_featured || false]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// Company settings update
router.put('/admin/settings', async (req, res) => {
  try {
    const settings = req.body as Record<string, string>
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        query(`INSERT INTO company_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2`, [key, value])
      )
    )
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
