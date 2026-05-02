import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId } = req.user!
    const { box } = req.query // inbox, sent, all
    let sql = `
      SELECT m.*,
        fu.name as from_name, fu.role as from_role, fu.avatar as from_avatar,
        tu.name as to_name, tu.role as to_role,
        (SELECT COUNT(*) FROM messages r WHERE r.parent_message_id=m.id) as reply_count
      FROM messages m
      JOIN users fu ON fu.id=m.from_user_id
      JOIN users tu ON tu.id=m.to_user_id
      WHERE m.school_id=$1 AND m.parent_message_id IS NULL AND m.is_archived=false`
    const params: any[] = [schoolId]
    if (box === 'inbox') { sql += ` AND m.to_user_id=$2`; params.push(userId) }
    else if (box === 'sent') { sql += ` AND m.from_user_id=$2`; params.push(userId) }
    else { sql += ` AND (m.to_user_id=$2 OR m.from_user_id=$2)`; params.push(userId) }
    sql += ' ORDER BY m.created_at DESC LIMIT 100'
    const result = await query(sql, params)
    res.json({ messages: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/unread/count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM messages WHERE to_user_id=$1 AND is_read=false AND school_id=$2',
      [req.user!.id, req.user!.schoolId]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: userId } = req.user!
    const result = await query(`
      SELECT m.*, fu.name as from_name, fu.role as from_role, tu.name as to_name
      FROM messages m JOIN users fu ON fu.id=m.from_user_id JOIN users tu ON tu.id=m.to_user_id
      WHERE m.id=$1`, [req.params.id])
    const msg = result.rows[0]
    if (!msg) return res.status(404).json({ error: 'Not found' })
    // Mark as read
    if (msg.to_user_id === userId && !msg.is_read) {
      await query('UPDATE messages SET is_read=true WHERE id=$1', [req.params.id])
    }
    // Get replies
    const replies = await query(`
      SELECT m.*, fu.name as from_name, fu.role as from_role
      FROM messages m JOIN users fu ON fu.id=m.from_user_id
      WHERE m.parent_message_id=$1 ORDER BY m.created_at ASC`, [req.params.id])
    res.json({ message: msg, replies: replies.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    const { toUserId, subject, body, priority } = req.body
    // Find admin if no specific target
    let targetId = toUserId
    if (!targetId) {
      const adminResult = await query(`SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1`, [schoolId])
      targetId = adminResult.rows[0]?.id
    }
    const result = await query(`
      INSERT INTO messages (school_id,from_user_id,to_user_id,subject,body,priority)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [schoolId, fromId, targetId, subject, body, priority||'normal']
    )
    // Create notification
    await query(`
      INSERT INTO notifications (school_id,user_id,title,body,type,link)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, targetId, 'رسالة جديدة', `من: ${req.user!.name}`, 'message', `/admin/messages`]
    )
    res.status(201).json({ message: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/:id/reply', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    const parent = await query('SELECT * FROM messages WHERE id=$1', [req.params.id])
    if (!parent.rows[0]) return res.status(404).json({ error: 'Not found' })
    const toId = parent.rows[0].from_user_id === fromId ? parent.rows[0].to_user_id : parent.rows[0].from_user_id
    const result = await query(`
      INSERT INTO messages (school_id,from_user_id,to_user_id,parent_message_id,subject,body)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [schoolId, fromId, toId, req.params.id, 'رد: ' + parent.rows[0].subject, req.body.body]
    )
    await query('UPDATE messages SET is_read=false WHERE id=$1', [req.params.id])
    res.status(201).json({ message: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query('UPDATE messages SET is_read=true WHERE id=$1 AND to_user_id=$2', [req.params.id, req.user!.id])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
