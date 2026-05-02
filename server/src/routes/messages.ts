import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId } = req.user!
    const { box } = req.query
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
    const { id: userId, schoolId } = req.user!
    const result = await query(`
      SELECT m.*, fu.name as from_name, fu.role as from_role, tu.name as to_name
      FROM messages m
      JOIN users fu ON fu.id=m.from_user_id
      JOIN users tu ON tu.id=m.to_user_id
      WHERE m.id=$1 AND m.school_id=$2`, [req.params.id, schoolId])
    const msg = result.rows[0]
    if (!msg) return res.status(404).json({ error: 'Not found' })

    // Verify the requesting user is sender or recipient
    if (msg.from_user_id !== userId && msg.to_user_id !== userId) {
      return res.status(403).json({ error: 'غير مصرح' })
    }

    if (msg.to_user_id === userId && !msg.is_read) {
      await query('UPDATE messages SET is_read=true WHERE id=$1', [req.params.id])
    }

    const replies = await query(`
      SELECT m.*, fu.name as from_name, fu.role as from_role
      FROM messages m JOIN users fu ON fu.id=m.from_user_id
      WHERE m.parent_message_id=$1 AND m.school_id=$2 ORDER BY m.created_at ASC`,
      [req.params.id, schoolId])
    res.json({ message: msg, replies: replies.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    const { toUserId, subject, body } = req.body

    if (!subject || !body) {
      return res.status(400).json({ error: 'الموضوع والنص مطلوبان' })
    }

    let targetId = toUserId
    if (!targetId) {
      const adminResult = await query(
        `SELECT id FROM users WHERE school_id=$1 AND role='admin' LIMIT 1`,
        [schoolId]
      )
      targetId = adminResult.rows[0]?.id
    }

    if (!targetId) return res.status(400).json({ error: 'المستقبل غير موجود' })

    // Verify target belongs to same school
    const targetCheck = await query(
      'SELECT id FROM users WHERE id=$1 AND school_id=$2 AND is_active=true',
      [targetId, schoolId]
    )
    if (!targetCheck.rows[0]) return res.status(400).json({ error: 'المستقبل غير موجود' })

    const priority = ['normal', 'high', 'urgent'].includes(req.body.priority) ? req.body.priority : 'normal'
    const result = await query(`
      INSERT INTO messages (school_id,from_user_id,to_user_id,subject,body,priority)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [schoolId, fromId, targetId, subject.slice(0, 200), body.slice(0, 5000), priority]
    )

    await query(`
      INSERT INTO notifications (school_id,user_id,title,body,type,link)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, targetId, 'رسالة جديدة', `من: ${req.user!.name}`, 'message', '/admin/messages']
    )
    res.status(201).json({ message: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/:id/reply', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: fromId, schoolId } = req.user!
    if (!req.body.body) return res.status(400).json({ error: 'نص الرد مطلوب' })

    const parent = await query(
      'SELECT * FROM messages WHERE id=$1 AND school_id=$2',
      [req.params.id, schoolId]
    )
    if (!parent.rows[0]) return res.status(404).json({ error: 'Not found' })

    // Verify user is part of the conversation
    const p = parent.rows[0]
    if (p.from_user_id !== fromId && p.to_user_id !== fromId) {
      return res.status(403).json({ error: 'غير مصرح' })
    }

    const toId = p.from_user_id === fromId ? p.to_user_id : p.from_user_id
    const result = await query(`
      INSERT INTO messages (school_id,from_user_id,to_user_id,parent_message_id,subject,body)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [schoolId, fromId, toId, req.params.id,
       ('رد: ' + p.subject).slice(0, 200),
       req.body.body.slice(0, 5000)]
    )
    await query('UPDATE messages SET is_read=false WHERE id=$1', [req.params.id])
    res.status(201).json({ message: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query(
      'UPDATE messages SET is_read=true WHERE id=$1 AND to_user_id=$2 AND school_id=$3',
      [req.params.id, req.user!.id, req.user!.schoolId]
    )
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id: userId, schoolId, role } = req.user!
    const msg = await query('SELECT * FROM messages WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    if (!msg.rows[0]) return res.status(404).json({ error: 'Not found' })
    if (msg.rows[0].from_user_id !== userId && role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح' })
    }
    await query('DELETE FROM messages WHERE id=$1 OR parent_message_id=$1', [req.params.id])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ── Broadcast: admin sends to all parents ──────────────────────────────────
router.get('/broadcasts', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.name as sent_by_name
       FROM broadcasts b LEFT JOIN users u ON u.id=b.sent_by
       WHERE b.school_id=$1 ORDER BY b.created_at DESC LIMIT 50`,
      [req.user!.schoolId]
    )
    res.json({ broadcasts: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/broadcast', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { title, body } = req.body
    if (!title || !body) return res.status(400).json({ error: 'العنوان والنص مطلوبان' })
    const { schoolId, id: sentBy } = req.user!

    const parents = await query(
      `SELECT id FROM users WHERE school_id=$1 AND role='parent' AND is_active=true`,
      [schoolId]
    )

    if (parents.rows.length === 0) {
      return res.status(400).json({ error: 'لا يوجد أولياء أمور مسجلون' })
    }

    for (const parent of parents.rows) {
      await query(
        `INSERT INTO notifications (school_id, user_id, title, body, type)
         VALUES ($1, $2, $3, $4, 'broadcast')`,
        [schoolId, parent.id, title.slice(0, 300), body.slice(0, 2000)]
      )
    }

    const broadcast = await query(
      `INSERT INTO broadcasts (school_id, title, body, sent_by, recipient_count)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [schoolId, title.slice(0, 300), body.slice(0, 2000), sentBy, parents.rows.length]
    )

    res.status(201).json({ broadcast: broadcast.rows[0], sentTo: parents.rows.length })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

export default router
