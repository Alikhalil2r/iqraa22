import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole, STAFF_ROLES } from '../middleware/auth'
import { createLogger } from '../utils/logger'
import { writeLimiter } from '../middleware/rateLimiter'

const router = Router()
const log = createLogger('EVENTS')

router.get('/', authenticateToken, requireRole(...STAFF_ROLES), async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, event_type, start_date, end_date, location, color, is_public, created_at
       FROM events WHERE school_id=$1 ORDER BY start_date DESC LIMIT 200`,
      [req.user!.schoolId]
    )
    res.json({ events: result.rows })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const d = req.body
    if (!d.title || !d.startDate) return res.status(400).json({ error: 'العنوان والتاريخ مطلوبان' })
    const result = await query(`
      INSERT INTO events (school_id,title,description,event_type,start_date,end_date,location,color,is_public,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [schoolId, d.title, d.description, d.eventType, d.startDate, d.endDate,
       d.location, d.color || '#3b82f6', d.isPublic !== false, userId]
    )
    log.info('Event created', { eventId: result.rows[0].id })
    res.status(201).json({ event: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authenticateToken, writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const result = await query(`
      UPDATE events SET title=$1,description=$2,event_type=$3,start_date=$4,end_date=$5,
        location=$6,color=$7,is_public=$8
      WHERE id=$9 AND school_id=$10 RETURNING *`,
      [d.title, d.description, d.eventType, d.startDate, d.endDate,
       d.location, d.color, d.isPublic, req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ event: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticateToken, writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM events WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
