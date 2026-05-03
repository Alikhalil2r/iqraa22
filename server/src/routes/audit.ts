import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('Audit')

router.use(authenticateToken)

// GET /api/audit — list audit logs with filters
router.get('/', requireRole('super_admin', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const page   = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit  = Math.min(100, parseInt(req.query.limit as string) || 50)
    const offset = (page - 1) * limit
    const action = req.query.action as string
    const userId = req.query.user_id as string
    const from   = req.query.from as string
    const to     = req.query.to   as string

    const conditions: string[] = ['a.school_id = $1']
    const params: unknown[] = [schoolId]
    let idx = 2

    if (action) { conditions.push(`a.action = $${idx++}`); params.push(action) }
    if (userId) { conditions.push(`a.user_id = $${idx++}`); params.push(userId) }
    if (from)   { conditions.push(`a.created_at >= $${idx++}`); params.push(from) }
    if (to)     { conditions.push(`a.created_at <= $${idx++} + INTERVAL '1 day'`); params.push(to) }

    const where = conditions.join(' AND ')

    const [rows, countRow] = await Promise.all([
      query(
        `SELECT a.id, a.user_id, a.user_name, a.user_role, a.action,
                a.entity_type, a.entity_id, a.description,
                a.ip_address, a.metadata, a.created_at
         FROM audit_logs a
         WHERE ${where}
         ORDER BY a.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*) FROM audit_logs a WHERE ${where}`, params),
    ])

    res.json({
      logs: rows.rows,
      total: parseInt(countRow.rows[0].count),
      page,
      pages: Math.ceil(parseInt(countRow.rows[0].count) / limit),
    })
  } catch (err) {
    log.error('Failed to fetch audit logs', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/audit/actions — distinct action types for filter dropdown
router.get('/actions', requireRole('super_admin', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const rows = await query(
      `SELECT DISTINCT action FROM audit_logs WHERE school_id = $1 ORDER BY action`,
      [schoolId]
    )
    res.json(rows.rows.map((r: any) => r.action))
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/audit/stats — summary stats
router.get('/stats', requireRole('super_admin', 'admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [today, week, byAction, byUser] = await Promise.all([
      query(`SELECT COUNT(*) FROM audit_logs WHERE school_id=$1 AND created_at >= NOW() - INTERVAL '1 day'`, [schoolId]),
      query(`SELECT COUNT(*) FROM audit_logs WHERE school_id=$1 AND created_at >= NOW() - INTERVAL '7 days'`, [schoolId]),
      query(`SELECT action, COUNT(*) as count FROM audit_logs WHERE school_id=$1 GROUP BY action ORDER BY count DESC LIMIT 8`, [schoolId]),
      query(`SELECT user_name, user_role, COUNT(*) as count FROM audit_logs WHERE school_id=$1 GROUP BY user_name, user_role ORDER BY count DESC LIMIT 5`, [schoolId]),
    ])
    res.json({
      today: parseInt(today.rows[0].count),
      week:  parseInt(week.rows[0].count),
      byAction: byAction.rows,
      byUser: byUser.rows,
    })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router

// ─── Helper to log audit entries from other routes ─────────────────────────
export async function logAudit(opts: {
  schoolId: string
  userId?: string
  userName?: string
  userRole?: string
  action: string
  entityType?: string
  entityId?: string
  description?: string
  ip?: string
  userAgent?: string
  metadata?: object
}) {
  try {
    await query(
      `INSERT INTO audit_logs (school_id, user_id, user_name, user_role, action, entity_type, entity_id, description, ip_address, user_agent, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [opts.schoolId, opts.userId, opts.userName, opts.userRole, opts.action,
       opts.entityType, opts.entityId, opts.description, opts.ip, opts.userAgent,
       JSON.stringify(opts.metadata || {})]
    )
  } catch {
    // Non-blocking — audit failure should never crash main request
  }
}
