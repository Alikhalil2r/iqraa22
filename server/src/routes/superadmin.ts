import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import { testEmailConfig } from '../services/email'
import crypto from 'crypto'

const router = Router()
router.use(authenticateToken)

router.get('/stats', async (_req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM schools)::int                              AS total_schools,
        (SELECT COUNT(*) FROM schools WHERE status='active')::int       AS active_schools,
        (SELECT COUNT(*) FROM schools WHERE status='trial')::int        AS trial_schools,
        (SELECT COUNT(*) FROM schools WHERE status='suspended')::int    AS suspended_schools,
        (SELECT COUNT(*) FROM students WHERE status='active')::int      AS total_students,
        (SELECT COUNT(*) FROM employees WHERE status='active')::int     AS total_employees,
        (SELECT COUNT(*) FROM users)::int                               AS total_users,
        (SELECT COUNT(*) FROM messages)::int                            AS total_messages,
        (SELECT COUNT(*) FROM fees WHERE status='paid')::int            AS total_paid_fees,
        (SELECT COALESCE(SUM(paid_amount),0) FROM fees)::numeric        AS total_revenue,
        (SELECT COUNT(*) FROM schools WHERE plan='pro')::int            AS pro_schools,
        (SELECT COUNT(*) FROM schools WHERE plan='enterprise')::int     AS enterprise_schools
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
        (SELECT COALESCE(SUM(paid_amount),0)::numeric FROM fees WHERE school_id=s.id)  AS revenue,
        (SELECT u.username FROM users u WHERE u.school_id=s.id AND u.role='admin' LIMIT 1) AS admin_username
      FROM schools s
      ORDER BY s.created_at DESC
    `)
    res.json({ schools: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/schools/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const schoolResult = await query(`
      SELECT s.*,
        (SELECT COUNT(*)::int FROM students WHERE school_id=s.id AND status='active')  AS students_count,
        (SELECT COUNT(*)::int FROM employees WHERE school_id=s.id AND status='active') AS employees_count,
        (SELECT COUNT(*)::int FROM users WHERE school_id=s.id)                         AS users_count,
        (SELECT COALESCE(SUM(paid_amount),0)::numeric FROM fees WHERE school_id=s.id) AS revenue
      FROM schools s WHERE s.id=$1
    `, [id])
    if (!schoolResult.rows[0]) return res.status(404).json({ error: 'School not found' })

    const usersResult = await query(
      `SELECT id, username, name, role, created_at FROM users WHERE school_id=$1 ORDER BY created_at`, [id]
    )
    res.json({ school: schoolResult.rows[0], users: usersResult.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/schools', async (req: AuthRequest, res) => {
  try {
    const { name, nameEn, tagline, address, phone, email, website, logoUrl, plan, notes } = req.body
    if (!name) return res.status(400).json({ error: 'name required' })

    const schoolResult = await query(`
      INSERT INTO schools (name, name_en, tagline, address, phone, email, website, logo_url, plan, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'trial',$10) RETURNING *
    `, [name, nameEn||null, tagline||null, address||null, phone||null, email||null, website||null, logoUrl||null, plan||'basic', notes||null])

    const school = schoolResult.rows[0]

    await query(`
      INSERT INTO school_settings (school_id) VALUES ($1)
      ON CONFLICT (school_id) DO NOTHING
    `, [school.id])

    const rawPass = crypto.randomBytes(5).toString('hex')
    const bcrypt = await import('bcryptjs')
    const hashed = await bcrypt.default.hash(rawPass, 10)
    const adminUsername = name.replace(/\s+/g, '').toLowerCase().slice(0, 12) + '_admin'

    await query(`
      INSERT INTO users (school_id, username, password_hash, name, role)
      VALUES ($1,$2,$3,$4,'admin')
    `, [school.id, adminUsername, hashed, `مدير ${name}`])

    res.status(201).json({
      school,
      credentials: { username: adminUsername, password: rawPass },
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/schools/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['active','suspended','trial'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    await query('UPDATE schools SET status=$1 WHERE id=$2', [status, id])
    res.json({ ok: true, status })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/schools/:id/plan', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { plan, planExpiresAt } = req.body
    if (!['basic','pro','enterprise'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' })
    await query('UPDATE schools SET plan=$1, plan_expires_at=$2 WHERE id=$3', [plan, planExpiresAt||null, id])
    res.json({ ok: true, plan })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/schools/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { name, nameEn, tagline, address, phone, email, website, logoUrl, notes } = req.body
    await query(`
      UPDATE schools SET name=$1,name_en=$2,tagline=$3,address=$4,phone=$5,email=$6,website=$7,logo_url=$8,notes=$9
      WHERE id=$10
    `, [name,nameEn||null,tagline||null,address||null,phone||null,email||null,website||null,logoUrl||null,notes||null,id])
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/schools/:id', async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM schools WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/schools/:id/email-test', async (req: AuthRequest, res) => {
  try {
    const result = await testEmailConfig(req.params.id)
    res.json(result)
  } catch (err) { res.status(500).json({ ok: false, error: 'Server error' }) }
})

router.put('/schools/:id/email-settings', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { smtpHost, smtpPort, smtpUser, smtpPass, emailFromName, emailEnabled,
            notifyAbsence, notifyGrades, notifyFees } = req.body
    await query(`
      UPDATE school_settings SET
        smtp_host=$1, smtp_port=$2, smtp_user=$3, smtp_pass=$4,
        email_from_name=$5, email_enabled=$6,
        notify_absence=$7, notify_grades=$8, notify_fees=$9
      WHERE school_id=$10
    `, [smtpHost||null, smtpPort||587, smtpUser||null, smtpPass||null,
        emailFromName||'نظام المدرسة', !!emailEnabled,
        notifyAbsence!==false, notifyGrades!==false, notifyFees!==false, id])
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

export default router
