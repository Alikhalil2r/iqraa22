import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole, AppRole, STAFF_ROLES } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'
import { isValidUUID } from '../middleware/validate'

const router = Router()
const log = createLogger('MESSAGES')

async function canMessageRecipient(schoolId: string, fromRole: AppRole, toUserId: string): Promise<boolean> {
  if (!isValidUUID(toUserId)) return false
  const r = await query(
    'SELECT id, role, school_id FROM users WHERE id=$1 AND is_active=true',
    [toUserId]
  )
  const recipient = r.rows[0]
  if (!recipient || recipient.school_id !== schoolId) return false
  const toRole = recipient.role as AppRole
  if (fromRole === 'parent') return ['admin', 'teacher'].includes(toRole)
  if (fromRole === 'teacher') return ['admin', 'teacher', 'parent'].includes(toRole)
  if (fromRole === 'guard' || fromRole === 'librarian') return ['admin'].includes(toRole)
  if (STAFF_ROLES.includes(fromRole)) return STAFF_ROLES.includes(toRole) || toRole === 'parent'
  return false
}

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId } = req.user!
    const { box, page = '1' } = req.query
    const limit = 100
    const offset = (parseInt(String(page)) - 1) * limit

    let sql = `
      SELECT m.id, m.subject, m.body, m.is_read, m.is_archived, m.created_at,
        m.from_user_id, m.to_user_id,
        fu.name as from_name, fu.role as from_role, fu.avatar as from_avatar,
        tu.name as to_name, tu.role as to_role,
        (SELECT COUNT(*) FROM messages r WHERE r.parent_message_id=m.id) as reply_count
      FROM messages m
      JOIN users fu ON fu.id=m.from_user_id
      JOIN users tu ON tu.id=m.to_user_id
      WHERE m.school_id=$1 AND m.parent_message_id IS NULL AND m.is_archived=false`
    const params: unknown[] = [schoolId]
    if (box === 'inbox')     { sql += ` AND m.to_user_id=$2`;   params.push(userId) }
    else if (box === 'sent') { sql += ` AND m.from_user_id=$2`; params.push(userId) }
    else                     { sql += ` AND (m.to_user_id=$2 OR m.from_user_id=$2)`; params.push(userId) }
    sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await query(sql, params)
    res.json({ messages: result.rows })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/unread/count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM messages WHERE to_user_id=$1 AND is_read=false AND school_id=$2',
      [req.user!.id, req.user!.schoolId]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    log.error('GET /unread/count failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/unread-count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM messages WHERE to_user_id=$1 AND is_read=false AND school_id=$2',
      [req.user!.id, req.user!.schoolId]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    log.error('GET /unread-count failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/broadcasts', authenticateToken, requireRole('admin', 'super_admin'), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.name as sent_by_name
       FROM broadcasts b
       LEFT JOIN users u ON u.id = b.sent_by
       WHERE b.school_id = $1
       ORDER BY b.created_at DESC
       LIMIT 50`,
      [req.user!.schoolId]
    )
    res.json({ broadcasts: result.rows })
  } catch (err) {
    log.error('GET /broadcasts failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/broadcast', authenticateToken, requireRole('admin', 'super_admin'), writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { title, body } = req.body
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'العنوان والنص مطلوبان' })
    }
    if (title.length > 300) return res.status(400).json({ error: 'العنوان طويل جداً' })
    if (body.length > 2000) return res.status(400).json({ error: 'النص طويل جداً' })

    const { id: sentBy, schoolId } = req.user!
    const parents = await query(
      `SELECT id FROM users WHERE school_id = $1 AND role = 'parent' AND is_active = true`,
      [schoolId]
    )
    const recipientCount = parents.rows.length

    const broadcast = await query(
      `INSERT INTO broadcasts (school_id, title, body, sent_by, recipient_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, body, recipient_count, created_at`,
      [schoolId, title.trim(), body.trim(), sentBy, recipientCount]
    )

    if (recipientCount > 0) {
      await query(
        `INSERT INTO notifications (school_id, user_id, title, body, type, link)
         SELECT $1, id, $2, $3, 'broadcast', '/parent/notifications'
         FROM users
         WHERE school_id = $1 AND role = 'parent' AND is_active = true`,
        [schoolId, title.trim(), body.trim()]
      )
    }

    log.info('Broadcast sent', { schoolId, recipientCount })
    res.status(201).json({ broadcast: broadcast.rows[0], sentTo: recipientCount })
  } catch (err) {
    log.error('POST /broadcast failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!isValidUUID(req.params.id)) {
      return res.status(404).json({ error: 'Not found' })
    }
    const { id: userId, schoolId } = req.user!
    const result = await query(`
      SELECT m.id, m.subject, m.body, m.is_read, m.created_at, m.from_user_id, m.to_user_id,
        fu.name as from_name, fu.role as from_role, tu.name as to_name
      FROM messages m
      JOIN users fu ON fu.id=m.from_user_id
      JOIN users tu ON tu.id=m.to_user_id
      WHERE m.id=$1 AND m.school_id=$2`, [req.params.id, schoolId])
    const msg = result.rows[0]
    if (!msg) return res.status(404).json({ error: 'Not found' })
    if (msg.from_user_id !== userId && msg.to_user_id !== userId) {
      return res.status(403).json({ error: 'غير مصرح' })
    }
    if (msg.to_user_id === userId && !msg.is_read) {
      await query('UPDATE messages SET is_read=true WHERE id=$1', [req.params.id])
    }
    const replies = await query(`
      SELECT m.id, m.body, m.created_at, fu.name as from_name, fu.role as from_role
      FROM messages m JOIN users fu ON fu.id=m.from_user_id
      WHERE m.parent_message_id=$1 AND m.school_id=$2 ORDER BY m.created_at ASC`,
      [req.params.id, schoolId])
    res.json({ message: msg, replies: replies.rows })
  } catch (err) {
    log.error('GET /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    const { toUserId, subject, body } = req.body

    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'الموضوع والنص مطلوبان' })
    }
    if (subject.length > 300) return res.status(400).json({ error: 'الموضوع طويل جداً' })
    if (body.length > 5000)   return res.status(400).json({ error: 'الرسالة طويلة جداً' })

    let targetId = toUserId
    if (!targetId) {
      const adminRes = await query(
        'SELECT id FROM users WHERE school_id=$1 AND role=$2 LIMIT 1',
        [schoolId, 'admin']
      )
      targetId = adminRes.rows[0]?.id
    }
    if (!targetId) return res.status(400).json({ error: 'لم يُحدَّد المستلم' })
    if (!(await canMessageRecipient(schoolId, req.user!.role, targetId))) {
      return res.status(403).json({ error: 'لا يمكنك مراسلة هذا المستخدم' })
    }

    const result = await query(`
      INSERT INTO messages (school_id, from_user_id, to_user_id, subject, body)
      VALUES ($1,$2,$3,$4,$5) RETURNING id, subject, created_at`,
      [schoolId, fromId, targetId, subject.trim().slice(0, 300), body.trim().slice(0, 5000)]
    )
    log.info('Message sent', { from: fromId, to: targetId })
    res.status(201).json({ message: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/reply', authenticateToken, writeLimiter, async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    const { body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'النص مطلوب' })
    if (body.length > 5000) return res.status(400).json({ error: 'الرد طويل جداً' })

    const parent = await query(
      'SELECT id, from_user_id, to_user_id, subject FROM messages WHERE id=$1 AND school_id=$2',
      [req.params.id, schoolId]
    )
    if (!parent.rows[0]) return res.status(404).json({ error: 'الرسالة غير موجودة' })

    const msg = parent.rows[0]
    if (msg.from_user_id !== fromId && msg.to_user_id !== fromId) {
      return res.status(403).json({ error: 'غير مصرح' })
    }

    const toId = msg.from_user_id === fromId ? msg.to_user_id : msg.from_user_id
    const result = await query(`
      INSERT INTO messages (school_id, from_user_id, to_user_id, subject, body, parent_message_id)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, body, created_at`,
      [schoolId, fromId, toId, `Re: ${msg.subject}`, body.trim().slice(0, 5000), req.params.id]
    )
    res.status(201).json({ reply: result.rows[0] })
  } catch (err) {
    log.error('POST /:id/reply failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE messages SET is_read=true WHERE id=$1 AND to_user_id=$2 AND school_id=$3',
      [req.params.id, req.user!.id, req.user!.schoolId]
    )
    res.json({ ok: true })
  } catch (err) {
    log.error('PUT /:id/read failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id/archive', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE messages SET is_archived=true WHERE id=$1 AND school_id=$2 AND (from_user_id=$3 OR to_user_id=$3)',
      [req.params.id, req.user!.schoolId, req.user!.id]
    )
    res.json({ ok: true })
  } catch (err) {
    log.error('PUT /:id/archive failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id FROM messages WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })

    const { role } = req.user!
    if (role !== 'admin' && role !== 'super_admin') {
      return res.status(403).json({ error: 'ليس لديك صلاحية الحذف' })
    }
    await query('DELETE FROM messages WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
