import { Router } from 'express'
import { query } from '../db'
import { withTransaction } from '../db/transaction'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { createLogger } from '../utils/logger'
import { platformPublicLimiter, ticketMsgLimiter, ticketLookupLimiter, ticketRateLimiter } from '../middleware/rateLimiter'
import { sanitizeHtml, sanitizeExternalUrl } from '../middleware/validate'

// ── Input sanitizer (strip HTML tags, trim, limit length) ─────────────────
const sanitize = (v: unknown, maxLen = 2000): string =>
  String(v ?? '').replace(/<[^>]*>/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim().slice(0, maxLen)
const sanitizeEmail = (v: unknown): string =>
  String(v ?? '').toLowerCase().trim().replace(/[^a-z0-9@._+-]/g, '').slice(0, 254)

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

// GET /api/platform/track/:ticket — public ticket lookup (requires email for verification)
router.get('/track/:ticket', ticketLookupLimiter, async (req, res) => {
  try {
    const email = sanitizeEmail(req.query.email)

    // Validate ticket number format (TKT-YYYY-NNNNN) to prevent injection/enumeration
    if (!/^TKT-\d{4}-\d{5}$/.test(req.params.ticket)) {
      return res.status(400).json({ error: 'رقم التذكرة غير صالح' })
    }

    const row = await query(
      `SELECT r.id, r.ticket_number, r.client_name, r.client_email, r.client_phone,
              r.service_type, r.title, r.description, r.status, r.priority,
              r.budget_min, r.budget_max, r.expected_date, r.created_at, r.updated_at,
              r.client_rating, r.client_feedback, r.resolved_at
       FROM service_requests r
       WHERE r.ticket_number=$1`, [req.params.ticket])

    // Always return 404 even if email is wrong (prevent ticket existence enumeration)
    if (!row.rows[0]) return res.status(404).json({ error: 'التذكرة غير موجودة أو البريد غير صحيح' })
    const ticket = row.rows[0]

    // Email is REQUIRED for security — must match exactly
    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب للتحقق من هويتك' })
    if (ticket.client_email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({ error: 'التذكرة غير موجودة أو البريد غير صحيح' })
    }

    // Get messages (non-internal only for public)
    const [msgs, hist] = await Promise.all([
      query(
        `SELECT id, sender_type, sender_name, content, created_at FROM ticket_messages
         WHERE request_id=$1 AND is_internal=false ORDER BY created_at ASC`, [ticket.id]),
      query(
        `SELECT field, old_value, new_value, note, created_at FROM ticket_history
         WHERE request_id=$1 ORDER BY created_at ASC`, [ticket.id])
    ])

    // Strip internal email from response (client already authenticated via it)
    const { client_email: _hidden, ...safeTicket } = ticket
    res.json({ ...safeTicket, messages: msgs.rows, history: hist.rows })
  } catch (err) {
    log.error('Track ticket', { error: (err as Error).message })
    res.status(500).json({ error: 'تعذّر تحميل التذكرة. حاول مجدداً.' })
  }
})

// POST /api/platform/track/:ticket/message — client adds a message
router.post('/track/:ticket/message', ticketMsgLimiter, async (req, res) => {
  try {
    const email   = sanitizeEmail(req.body.email)
    const name    = sanitize(req.body.name, 200)
    const content = sanitize(req.body.content, 3000)

    if (!content?.trim()) return res.status(400).json({ error: 'المحتوى مطلوب' })
    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' })

    if (!/^TKT-\d{4}-\d{5}$/.test(req.params.ticket)) {
      return res.status(400).json({ error: 'رقم التذكرة غير صالح' })
    }

    const row = await query(`SELECT id, client_email FROM service_requests WHERE ticket_number=$1`, [req.params.ticket])
    if (!row.rows[0]) return res.status(404).json({ error: 'التذكرة غير موجودة أو البريد غير صحيح' })
    const ticket = row.rows[0]
    if (ticket.client_email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({ error: 'التذكرة غير موجودة أو البريد غير صحيح' })
    }

    const msg = await query(
      `INSERT INTO ticket_messages (request_id, sender_type, sender_name, sender_email, content)
       VALUES ($1,'client',$2,$3,$4)
       RETURNING id, sender_type, sender_name, content, created_at`,
      [ticket.id, name || 'العميل', email, content]
    )
    await query(`UPDATE service_requests SET updated_at=NOW() WHERE id=$1`, [ticket.id])
    res.json(msg.rows[0])
  } catch (err) {
    log.error('Ticket message failed', { error: (err as Error).message })
    res.status(500).json({ error: 'تعذّر إرسال الرسالة. حاول مجدداً.' })
  }
})

// POST /api/platform/track/:ticket/rate — client rates the service (with limiter)
router.post('/track/:ticket/rate', ticketRateLimiter, async (req, res) => {
  try {
    const email    = sanitizeEmail(req.body.email)
    const rating   = parseInt(String(req.body.rating))
    const feedback = sanitize(req.body.feedback, 1000)

    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' })
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'التقييم يجب أن يكون بين 1 و 5' })

    if (!/^TKT-\d{4}-\d{5}$/.test(req.params.ticket)) {
      return res.status(400).json({ error: 'رقم التذكرة غير صالح' })
    }

    const row = await query(`SELECT id, client_email FROM service_requests WHERE ticket_number=$1`, [req.params.ticket])
    if (!row.rows[0]) return res.status(404).json({ error: 'التذكرة غير موجودة أو البريد غير صحيح' })
    if (row.rows[0].client_email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({ error: 'التذكرة غير موجودة أو البريد غير صحيح' })
    }

    await query(
      `UPDATE service_requests SET client_rating=$1, client_feedback=$2 WHERE id=$3`,
      [rating, feedback || null, row.rows[0].id]
    )
    res.json({ ok: true })
  } catch (err) {
    log.error('Ticket rating failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/platform/request — submit service request (PUBLIC, no auth)
router.post('/request', platformPublicLimiter, async (req, res) => {
  try {
    const client_name    = sanitize(req.body.client_name, 200)
    const client_email   = sanitizeEmail(req.body.client_email)
    const client_phone   = sanitize(req.body.client_phone, 50)
    const client_company = sanitize(req.body.client_company, 200)
    const service_type   = sanitize(req.body.service_type, 50)
    const title          = sanitize(req.body.title, 300)
    const description    = sanitize(req.body.description, 5000)
    const { budget_min, budget_max, expected_date } = req.body
    if (!client_name || !client_email || !title) return res.status(400).json({ error: 'الاسم والبريد والعنوان مطلوبة' })
    if (!/\S+@\S+\.\S+/.test(client_email)) return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح' })

    const year = new Date().getFullYear()
    const seq  = String(Math.floor(10000 + Math.random() * 90000))
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

router.use('/admin', authenticateToken, requireRole('super_admin'))

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
    const authReq = req as AuthRequest
    const { status, priority, admin_notes, assigned_to } = req.body
    // Get current status for history
    const current = await query(`SELECT status, priority FROM service_requests WHERE id=$1`, [req.params.id])
    const old = current.rows[0]
    const updates: string[] = ['updated_at=NOW()']
    const params: unknown[] = []
    if (status)      { params.push(status);      updates.push(`status=$${params.length}`) }
    if (priority)    { params.push(priority);    updates.push(`priority=$${params.length}`) }
    if (admin_notes !== undefined) { params.push(admin_notes); updates.push(`admin_notes=$${params.length}`) }
    if (assigned_to) { params.push(assigned_to); updates.push(`assigned_to=$${params.length}`) }
    params.push(req.params.id)
    const row = await query(`UPDATE service_requests SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`, params)
    // Log history
    if (old && status && old.status !== status) {
      await query(
        `INSERT INTO ticket_history (request_id, changed_by, field, old_value, new_value, note) VALUES ($1,$2,'status',$3,$4,$5)`,
        [req.params.id, authReq.user?.name || 'الإدارة', old.status, status,
         `تم تغيير الحالة إلى "${status === 'in_progress' ? 'قيد التنفيذ' : status === 'completed' ? 'مكتمل' : status === 'approved' ? 'موافق عليه' : status === 'rejected' ? 'مرفوض' : status === 'on_hold' ? 'معلّق' : status}"` ]
      )
    }
    if (old && priority && old.priority !== priority) {
      await query(
        `INSERT INTO ticket_history (request_id, changed_by, field, old_value, new_value, note) VALUES ($1,$2,'priority',$3,$4,$5)`,
        [req.params.id, authReq.user?.name || 'الإدارة', old.priority, priority,
         `تم تغيير الأولوية إلى "${priority === 'high' ? 'عالية' : priority === 'urgent' ? 'عاجل' : priority === 'low' ? 'منخفضة' : 'متوسطة'}"`]
      )
    }
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/tickets/:id/messages
router.get('/admin/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const msgs = await query(
      `SELECT * FROM ticket_messages WHERE request_id=$1 ORDER BY created_at ASC`,
      [req.params.id])
    res.json(msgs.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// POST /api/platform/admin/tickets/:id/messages
router.post('/admin/tickets/:id/messages', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthRequest
    const { content, sender_type = 'admin', sender_name, is_internal = false } = req.body
    if (!content?.trim()) return res.status(400).json({ error: 'المحتوى مطلوب' })
    const msg = await query(
      `INSERT INTO ticket_messages (request_id, sender_type, sender_name, content, is_internal)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, sender_type, sender_name || authReq.user?.name || 'الإدارة', content, is_internal]
    )
    await query(`UPDATE service_requests SET updated_at=NOW() WHERE id=$1`, [req.params.id])
    res.json(msg.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/tickets/:id/history
router.get('/admin/tickets/:id/history', authenticateToken, async (req, res) => {
  try {
    const hist = await query(
      `SELECT * FROM ticket_history WHERE request_id=$1 ORDER BY created_at ASC`,
      [req.params.id])
    res.json(hist.rows)
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
    const { status, progress, admin_notes, budget, paid, phase, end_date, description, technologies } = req.body
    const updates: string[] = ['updated_at=NOW()']
    const params: unknown[] = []
    if (status !== undefined)       { params.push(status);        updates.push(`status=$${params.length}`) }
    if (progress !== undefined)     { params.push(Math.max(0, Math.min(100, parseInt(progress)))); updates.push(`progress=$${params.length}`) }
    if (budget !== undefined)       { params.push(budget);        updates.push(`budget=$${params.length}`) }
    if (paid !== undefined)         { params.push(paid);          updates.push(`paid=$${params.length}`) }
    if (phase !== undefined)        { params.push(phase);         updates.push(`phase=$${params.length}`) }
    if (end_date !== undefined)     { params.push(end_date);      updates.push(`end_date=$${params.length}`) }
    if (admin_notes !== undefined)  { params.push(admin_notes);   updates.push(`admin_notes=$${params.length}`) }
    if (description !== undefined)  { params.push(description);   updates.push(`description=$${params.length}`) }
    if (technologies !== undefined) { params.push(technologies);  updates.push(`technologies=$${params.length}`) }
    params.push(req.params.id)
    const row = await query(`UPDATE projects SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`, params)
    if (!row.rows[0]) return res.status(404).json({ error: 'Project not found' })
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/new-count — lightweight badge endpoint
router.get('/admin/new-count', async (_req, res) => {
  try {
    const row = await query(`SELECT COUNT(*) as count FROM service_requests WHERE status='new'`)
    res.json({ count: parseInt(row.rows[0].count) })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/analytics
router.get('/admin/analytics', async (_req, res) => {
  try {
    const [byService, byStatus, monthly, topClients, avgResponse, revenueByMonth] = await Promise.all([
      query(`SELECT service_type, COUNT(*) as count FROM service_requests WHERE service_type IS NOT NULL GROUP BY service_type ORDER BY count DESC`),
      query(`SELECT status, COUNT(*) as count FROM service_requests GROUP BY status`),
      query(`
        SELECT
          TO_CHAR(m.month, 'MM/YYYY') as month,
          TO_CHAR(m.month, 'Mon YYYY') as month_label,
          COALESCE(r.requests, 0) as requests,
          COALESCE(p.projects, 0) as projects,
          COALESCE(r.completed, 0) as completed
        FROM (
          SELECT generate_series(
            DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
            DATE_TRUNC('month', NOW()),
            '1 month'
          ) as month
        ) m
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) as month,
                 COUNT(*) as requests,
                 COUNT(*) FILTER (WHERE status='completed') as completed
          FROM service_requests GROUP BY 1
        ) r ON r.month = m.month
        LEFT JOIN (
          SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as projects
          FROM projects GROUP BY 1
        ) p ON p.month = m.month
        ORDER BY m.month
      `),
      query(`
        SELECT c.name, c.company,
               COUNT(DISTINCT r.id) as request_count,
               COUNT(DISTINCT p.id) as project_count,
               COALESCE(SUM(p.paid), 0) as total_paid
        FROM business_clients c
        LEFT JOIN service_requests r ON r.client_id = c.id
        LEFT JOIN projects p ON p.client_id = c.id
        GROUP BY c.id, c.name, c.company
        ORDER BY total_paid DESC, request_count DESC
        LIMIT 5
      `),
      query(`
        SELECT
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::int as avg_hours
        FROM service_requests
        WHERE status != 'new' AND updated_at > created_at
      `),
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'MM/YYYY') as month,
               COALESCE(SUM(budget), 0) as budget,
               COALESCE(SUM(paid), 0) as paid
        FROM projects
        WHERE created_at > NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `),
    ])
    res.json({
      byService:      byService.rows,
      byStatus:       byStatus.rows,
      monthly:        monthly.rows,
      topClients:     topClients.rows,
      avgResponseHrs: avgResponse.rows[0]?.avg_hours || 0,
      revenueByMonth: revenueByMonth.rows,
    })
  } catch (err) {
    log.error('Analytics error', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/platform/admin/projects/:id
router.get('/admin/projects/:id', async (req, res) => {
  try {
    const row = await query(
      `SELECT p.*, c.name as client_name, c.company as client_company, c.email as client_email
       FROM projects p LEFT JOIN business_clients c ON c.id=p.client_id
       WHERE p.id=$1`, [req.params.id])
    if (!row.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/projects/:id/messages
router.get('/admin/projects/:id/messages', async (req, res) => {
  try {
    const rows = await query(
      `SELECT * FROM project_messages WHERE project_id=$1 ORDER BY created_at ASC LIMIT 200`,
      [req.params.id])
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// POST /api/platform/admin/projects/:id/messages
router.post('/admin/projects/:id/messages', async (req: AuthRequest, res) => {
  try {
    const { content, sender_name, is_internal } = req.body
    if (!content) return res.status(400).json({ error: 'المحتوى مطلوب' })
    const row = await query(
      `INSERT INTO project_messages (project_id, content, sender_name, is_internal)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, content, sender_name || req.user?.name || 'Admin', is_internal || false]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ─── Admin GET routes for content tables ──────────────────────────────────────

// GET /api/platform/admin/services — all services (active + inactive)
router.get('/admin/services', authenticateToken, async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM platform_services ORDER BY sort_order, created_at`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/portfolio — all portfolio items
router.get('/admin/portfolio', authenticateToken, async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM portfolio_items ORDER BY is_featured DESC, sort_order, created_at DESC`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/testimonials — all testimonials
router.get('/admin/testimonials', authenticateToken, async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM testimonials ORDER BY sort_order, created_at DESC`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/faq — all FAQ items
router.get('/admin/faq', authenticateToken, async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM faq_items ORDER BY sort_order, id`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/platform/admin/pricing — all pricing plans
router.get('/admin/pricing', authenticateToken, async (_req, res) => {
  try {
    const rows = await query(`SELECT * FROM pricing_plans ORDER BY sort_order, price`)
    res.json(rows.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ─── Full CRUD for content tables ─────────────────────────────────────────────

// Services
router.put('/admin/services/:id', async (req, res) => {
  try {
    const { title, title_en, description, icon, color, price_from, duration_days, category, features, is_active } = req.body
    const row = await query(
      `UPDATE platform_services SET title=$1,title_en=$2,description=$3,icon=$4,color=$5,price_from=$6,duration_days=$7,category=$8,features=$9,is_active=$10 WHERE id=$11 RETURNING *`,
      [title, title_en, description, icon, color, price_from||null, duration_days||null, category, JSON.stringify(features||[]), is_active!==false, req.params.id]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})
router.delete('/admin/services/:id', async (req, res) => {
  try { await query(`DELETE FROM platform_services WHERE id=$1`, [req.params.id]); res.json({ ok: true }) }
  catch { res.status(500).json({ error: 'Server error' }) }
})

// Portfolio
router.put('/admin/portfolio/:id', async (req, res) => {
  try {
    const { title, description, image_url, category, client_name, project_url, technologies, is_featured } = req.body
    const row = await query(
      `UPDATE portfolio_items SET title=$1,description=$2,image_url=$3,category=$4,client_name=$5,project_url=$6,technologies=$7,is_featured=$8 WHERE id=$9 RETURNING *`,
      [title, description, image_url, category, client_name, project_url, technologies, is_featured||false, req.params.id]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})
router.delete('/admin/portfolio/:id', async (req, res) => {
  try { await query(`DELETE FROM portfolio_items WHERE id=$1`, [req.params.id]); res.json({ ok: true }) }
  catch { res.status(500).json({ error: 'Server error' }) }
})

// Testimonials
router.put('/admin/testimonials/:id', async (req, res) => {
  try {
    const { client_name, client_position, company, content, rating, is_featured } = req.body
    const row = await query(
      `UPDATE testimonials SET client_name=$1,client_position=$2,company=$3,content=$4,rating=$5,is_featured=$6 WHERE id=$7 RETURNING *`,
      [client_name, client_position, company, content, rating||5, is_featured!==false, req.params.id]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})
router.delete('/admin/testimonials/:id', async (req, res) => {
  try { await query(`DELETE FROM testimonials WHERE id=$1`, [req.params.id]); res.json({ ok: true }) }
  catch { res.status(500).json({ error: 'Server error' }) }
})

// FAQ
router.post('/admin/faq', async (req, res) => {
  try {
    const { question, answer, sort_order, is_active } = req.body
    const row = await query(
      `INSERT INTO faq_items (question,answer,sort_order,is_active) VALUES ($1,$2,$3,$4) RETURNING *`,
      [question, answer, sort_order||0, is_active!==false]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})
router.put('/admin/faq/:id', async (req, res) => {
  try {
    const { question, answer, sort_order, is_active } = req.body
    const row = await query(
      `UPDATE faq_items SET question=$1,answer=$2,sort_order=$3,is_active=$4 WHERE id=$5 RETURNING *`,
      [question, answer, sort_order||0, is_active!==false, req.params.id]
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})
router.delete('/admin/faq/:id', async (req, res) => {
  try { await query(`DELETE FROM faq_items WHERE id=$1`, [req.params.id]); res.json({ ok: true }) }
  catch { res.status(500).json({ error: 'Server error' }) }
})

// Pricing
router.post('/admin/pricing', async (req, res) => {
  try {
    const { name, price, currency, period, description, features, is_popular, color } = req.body
    const row = await query(
      `INSERT INTO pricing_plans (name,price,currency,period,description,features,is_popular,color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, price||0, currency||'OMR', period||'مشروع', description, JSON.stringify(features||[]), is_popular||false, color||'#8b5cf6']
    )
    res.json(row.rows[0])
  } catch { res.status(500).json({ error: 'Server error' }) }
})
router.put('/admin/pricing/:id', async (req, res) => {
  try {
    const { name, price, currency, period, description, features, is_popular, color } = req.body
    const row = await query(
      `UPDATE pricing_plans SET name=$1,price=$2,currency=$3,period=$4,description=$5,features=$6,is_popular=$7,color=$8 WHERE id=$9 RETURNING *`,
      [name, price||0, currency||'OMR', period||'مشروع', description, JSON.stringify(features||[]), is_popular||false, color||'#8b5cf6', req.params.id]
    )
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
    const safeContent = content ? sanitizeHtml(content) : null
    const safeExcerpt = excerpt ? sanitizeHtml(excerpt) : null
    const row = await query(
      `INSERT INTO blog_posts (title,slug,excerpt,content,image_url,category,tags,author_name,status,published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, slug, safeExcerpt, safeContent, sanitizeExternalUrl(image_url) || null, category || null, JSON.stringify(tags || []), req.user?.name || 'Admin', status || 'draft', published_at]
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

// Blog PUT / DELETE
router.put('/admin/blog/:id', authenticateToken, async (_req, res) => {
  const req = _req as AuthRequest
  try {
    const { title, slug, excerpt, content, image_url, category, tags, status } = req.body
    const published_at = status === 'published' ? new Date() : null
    const safeContent = content ? sanitizeHtml(content) : null
    const safeExcerpt = excerpt ? sanitizeHtml(excerpt) : null
    const row = await query(
      `UPDATE blog_posts SET title=$1,slug=$2,excerpt=$3,content=$4,image_url=$5,category=$6,tags=$7,status=$8,published_at=COALESCE($9,published_at) WHERE id=$10 RETURNING *`,
      [title, slug, safeExcerpt, safeContent, sanitizeExternalUrl(image_url) || null, category||null, JSON.stringify(tags||[]), status||'draft', published_at, req.params.id]
    )
    res.json(row.rows[0])
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'الرابط مستخدم بالفعل' })
    res.status(500).json({ error: 'Server error' })
  }
})
router.delete('/admin/blog/:id', async (req, res) => {
  try { await query(`DELETE FROM blog_posts WHERE id=$1`, [req.params.id]); res.json({ ok: true }) }
  catch { res.status(500).json({ error: 'Server error' }) }
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
