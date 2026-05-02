import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { search, category } = req.query
    let sql = `SELECT n.*, u.name as author_name FROM news n LEFT JOIN users u ON u.id=n.author_id WHERE n.school_id=$1`
    const params: any[] = [schoolId]
    let i = 2
    if (search) { sql += ` AND n.title ILIKE $${i}`; params.push(`%${search}%`); i++ }
    if (category) { sql += ` AND n.category=$${i}`; params.push(category); i++ }
    sql += ' ORDER BY n.created_at DESC'
    const result = await query(sql, params)
    res.json({ news: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const d = req.body
    const result = await query(`
      INSERT INTO news (school_id,title,summary,content,image_url,category,is_published,is_featured,publish_date,author_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [schoolId, d.title, d.summary, d.content, d.imageUrl, d.category, d.isPublished!==false, d.isFeatured||false, d.publishDate||new Date(), userId]
    )
    res.status(201).json({ news: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const result = await query(`
      UPDATE news SET title=$1,summary=$2,content=$3,image_url=$4,category=$5,is_published=$6,is_featured=$7,publish_date=$8
      WHERE id=$9 AND school_id=$10 RETURNING *`,
      [d.title, d.summary, d.content, d.imageUrl, d.category, d.isPublished, d.isFeatured, d.publishDate, req.params.id, req.user!.schoolId]
    )
    res.json({ news: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM news WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
