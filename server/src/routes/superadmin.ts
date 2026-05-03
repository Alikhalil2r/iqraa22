import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/stats', async (_req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM schools)::int                        AS total_schools,
        (SELECT COUNT(*) FROM students WHERE status='active')::int AS total_students,
        (SELECT COUNT(*) FROM employees WHERE status='active')::int AS total_employees,
        (SELECT COUNT(*) FROM users)::int                          AS total_users,
        (SELECT COUNT(*) FROM messages)::int                       AS total_messages,
        (SELECT COUNT(*) FROM fees WHERE status='paid')::int       AS total_paid_fees,
        (SELECT COALESCE(SUM(paid_amount),0) FROM fees)::numeric   AS total_revenue
    `)
    res.json({ stats: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/schools', async (_req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT
        s.*,
        (SELECT COUNT(*)::int FROM students WHERE school_id=s.id AND status='active')   AS students_count,
        (SELECT COUNT(*)::int FROM employees WHERE school_id=s.id AND status='active')  AS employees_count,
        (SELECT COUNT(*)::int FROM users WHERE school_id=s.id)                          AS users_count,
        (SELECT COUNT(*)::int FROM messages WHERE school_id=s.id)                       AS messages_count,
        (SELECT COALESCE(SUM(paid_amount),0)::numeric FROM fees WHERE school_id=s.id)  AS revenue
      FROM schools s
      ORDER BY s.created_at DESC
    `)
    res.json({ schools: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/schools', async (req: AuthRequest, res) => {
  try {
    const { name, nameEn, tagline, address, phone, email, website, logoUrl } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })
    const result = await query(`
      INSERT INTO schools (name, name_en, tagline, address, phone, email, website, logo_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [name, nameEn || null, tagline || null, address || null, phone || null, email || null, website || null, logoUrl || null])
    res.status(201).json({ school: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/schools/:id', async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM schools WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

export default router
