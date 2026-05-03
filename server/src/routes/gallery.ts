import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
router.use(authenticateToken)
const log = createLogger('GALLERY')

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { category, published, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let q = `SELECT id, title, description, image_url, category, is_published, created_at
             FROM gallery WHERE school_id=$1`
    const params: unknown[] = [schoolId]
    if (category)             { params.push(category);           q += ` AND category=$${params.length}` }
    if (published !== undefined) { params.push(published === 'true'); q += ` AND is_published=$${params.length}` }
    q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)

    const [result, cats] = await Promise.all([
      query(q, params),
      query('SELECT DISTINCT category FROM gallery WHERE school_id=$1 AND category IS NOT NULL ORDER BY category', [schoolId])
    ])
    res.json({ gallery: result.rows, total: result.rowCount, categories: cats.rows.map((r: any) => r.category) })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, description, imageUrl, category, isPublished } = req.body
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl مطلوب' })
    const result = await query(`
      INSERT INTO gallery (school_id, title, description, image_url, category, is_published)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [schoolId, title || null, description || null, imageUrl, category || null, isPublished !== false]
    )
    log.info('Gallery item added', { itemId: result.rows[0].id })
    res.status(201).json({ item: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, description, imageUrl, category, isPublished } = req.body
    const result = await query(`
      UPDATE gallery SET title=$1, description=$2, image_url=$3, category=$4, is_published=$5
      WHERE id=$6 AND school_id=$7 RETURNING *`,
      [title || null, description || null, imageUrl, category || null, isPublished !== false,
       req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ item: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM gallery WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
