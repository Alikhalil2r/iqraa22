import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db'
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' })

    const result = await query(
      `SELECT u.*, s.name as school_name FROM users u
       JOIN schools s ON s.id = u.school_id
       WHERE u.username = $1 AND u.is_active = true`,
      [username.trim()]
    )
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })

    const validPass = await bcrypt.compare(password, user.password_hash)
    if (!validPass) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' })

    if (role && role !== user.role && !(role === 'admin' && user.role === 'teacher')) {
      return res.status(403).json({ error: 'نوع المستخدم غير مطابق' })
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

    const token = generateToken({
      id: user.id,
      schoolId: user.school_id,
      role: user.role,
      username: user.username,
      name: user.name
    })

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        schoolId: user.school_id,
        schoolName: user.school_name,
        avatar: user.avatar
      }
    })
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.username, u.role, u.email, u.phone, u.avatar, u.school_id,
              s.name as school_name
       FROM users u JOIN schools s ON s.id = u.school_id
       WHERE u.id = $1`,
      [req.user!.id]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id])
    const user = result.rows[0]
    const valid = await bcrypt.compare(oldPassword, user.password_hash)
    if (!valid) return res.status(400).json({ error: 'كلمة المرور القديمة غير صحيحة' })
    const newHash = await bcrypt.hash(newPassword, 12)
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.id])
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
