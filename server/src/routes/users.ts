import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { role } = req.query
    let q = `SELECT id, name, username, role, email, phone, is_active, last_login, created_at
             FROM users WHERE school_id=$1`
    const params: any[] = [schoolId]
    if (role) { params.push(role); q += ` AND role=$${params.length}` }
    q += ' ORDER BY name'
    const result = await query(q, params)
    res.json({ users: result.rows, total: result.rowCount })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { name, username, password, role, email, phone } = req.body
    if (!name || !username || !password || !role) return res.status(400).json({ error: 'name, username, password, role required' })
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash(password, 10)
    const result = await query(`
      INSERT INTO users (school_id, name, username, password_hash, role, email, phone)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, username, role, email, phone, is_active, created_at
    `, [schoolId, name, username, hash, role, email||null, phone||null])
    res.status(201).json({ user: result.rows[0] })
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { name, email, phone, role, isActive, password } = req.body
    let q = `UPDATE users SET name=$1, email=$2, phone=$3, role=$4, is_active=$5`
    const params: any[] = [name, email||null, phone||null, role, isActive !== undefined ? isActive : true]
    if (password) {
      const bcrypt = await import('bcryptjs')
      const hash = await bcrypt.hash(password, 10)
      params.push(hash)
      q += `, password_hash=$${params.length}`
    }
    params.push(req.params.id, schoolId)
    q += ` WHERE id=$${params.length-1} AND school_id=$${params.length} RETURNING id, name, username, role, email, is_active`
    const result = await query(q, params)
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ user: result.rows[0] })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    if (req.params.id === userId) return res.status(400).json({ error: 'لا يمكنك حذف حسابك الحالي' })
    await query('DELETE FROM users WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
