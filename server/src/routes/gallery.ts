import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { category, published } = req.query
    let q = `SELECT * FROM gallery WHERE school_id=$1`
    const params: any[] = [req.user!.schoolId]
    if (category) { params.push(category); q += ` AND category=$${params.length}` }
    if (published !== undefined) { params.push(published === 'true'); q += ` AND is_published=$${params.length}` }
    q += ' ORDER BY created_at DESC'
    const result = await query(q, params)
    const cats = await query('SELECT DISTINCT category FROM gallery WHERE school_id=$1 AND category IS NOT NULL', [req.user!.schoolId])
    res.json({ gallery: result.rows, total: result.rowCount, categories: cats.rows.map((r: any) => r.category) })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, description, imageUrl, category, isPublished } = req.body
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' })
    const result = await query(`
      INSERT INTO gallery (school_id, title, description, image_url, category, is_published)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [schoolId, title || null, description || null, imageUrl, category || null, isPublished !== false])
    res.status(201).json({ item: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, description, imageUrl, category, isPublished } = req.body
    const result = await query(`
      UPDATE gallery SET title=$1, description=$2, image_url=$3, category=$4, is_published=$5
      WHERE id=$6 AND school_id=$7 RETURNING *
    `, [title || null, description || null, imageUrl, category || null, isPublished !== false, req.params.id, schoolId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ item: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM gallery WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
