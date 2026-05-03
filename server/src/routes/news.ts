import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('NEWS')

const ALLOWED_CATEGORIES = ['academic', 'events', 'achievements', 'general', 'sports', 'arts'] as const

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { search, category, page = '1', limit = '50' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let sql = `SELECT n.id, n.title, n.summary, n.image_url, n.category, n.is_published,
                      n.is_featured, n.publish_date, n.created_at, u.name as author_name
               FROM news n LEFT JOIN users u ON u.id=n.author_id WHERE n.school_id=$1`
    const params: unknown[] = [schoolId]
    let i = 2
    if (search) { sql += ` AND n.title ILIKE $${i}`; params.push(`%${String(search).slice(0, 100)}%`); i++ }
    if (category && ALLOWED_CATEGORIES.includes(String(category) as any)) {
      sql += ` AND n.category=$${i}`; params.push(category); i++
    }
    sql += ` ORDER BY n.created_at DESC LIMIT $${i} OFFSET $${i + 1}`
    params.push(parseInt(String(limit)), offset)
    const result = await query(sql, params)
    res.json({ news: result.rows })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const d = req.body
    if (!d.title) return res.status(400).json({ error: 'العنوان مطلوب' })
    const result = await query(`
      INSERT INTO news (school_id,title,summary,content,image_url,category,is_published,is_featured,publish_date,author_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [schoolId, d.title.slice(0, 200), d.summary?.slice(0, 500), d.content?.slice(0, 50000),
       d.imageUrl, d.category, d.isPublished !== false, d.isFeatured || false,
       d.publishDate || new Date(), userId]
    )
    log.info('News created', { newsId: result.rows[0].id })
    res.status(201).json({ news: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authenticateToken, writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const result = await query(`
      UPDATE news SET title=$1,summary=$2,content=$3,image_url=$4,category=$5,
        is_published=$6,is_featured=$7,publish_date=$8
      WHERE id=$9 AND school_id=$10 RETURNING *`,
      [d.title?.slice(0, 200), d.summary?.slice(0, 500), d.content?.slice(0, 50000),
       d.imageUrl, d.category, d.isPublished, d.isFeatured, d.publishDate,
       req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ news: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM news WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    log.info('News deleted', { newsId: req.params.id })
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
