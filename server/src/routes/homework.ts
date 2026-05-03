import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

// ─── Homework Assignments ─────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { className, status, upcoming } = req.query
    let q = `
      SELECT h.*,
             u.name as teacher_name,
             COUNT(hs.id) as submission_count,
             COUNT(CASE WHEN hs.status='submitted' OR hs.status='graded' THEN 1 END) as submitted_count,
             COUNT(CASE WHEN hs.status='graded' THEN 1 END) as graded_count,
             ROUND(AVG(CASE WHEN hs.score IS NOT NULL THEN hs.score END), 1) as avg_score
      FROM homework h
      LEFT JOIN users u ON u.id = h.created_by
      LEFT JOIN homework_submissions hs ON hs.homework_id = h.id
      WHERE h.school_id=$1
    `
    const params: any[] = [schoolId]
    if (className) { params.push(className); q += ` AND h.class_name=$${params.length}` }
    if (status) { params.push(status); q += ` AND h.status=$${params.length}` }
    if (upcoming === 'true') q += ` AND h.due_date >= CURRENT_DATE`
    q += ' GROUP BY h.id, u.name ORDER BY h.due_date DESC'
    const result = await query(q, params)
    const stats = await query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN status='active' THEN 1 END) as active,
             COUNT(CASE WHEN due_date < CURRENT_DATE AND status='active' THEN 1 END) as overdue,
             COUNT(DISTINCT class_name) as classes
      FROM homework WHERE school_id=$1
    `, [schoolId])
    res.json({ homework: result.rows, stats: stats.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { className, subjectName, title, description, dueDate, maxScore } = req.body
    if (!title || !dueDate) return res.status(400).json({ error: 'Title and due date required' })
    const result = await query(`
      INSERT INTO homework (school_id, class_name, subject_name, title, description, due_date, max_score, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [schoolId, className, subjectName, title, description, dueDate, parseInt(maxScore) || 10, userId])
    // Auto-create pending submissions for all students in the class
    if (className) {
      const students = await query(`SELECT id FROM students WHERE school_id=$1 AND class_name=$2 AND status='active'`, [schoolId, className])
      for (const s of students.rows)
        await query(`INSERT INTO homework_submissions (homework_id, student_id, status) VALUES ($1,$2,'pending') ON CONFLICT DO NOTHING`, [result.rows[0].id, s.id])
    }
    res.status(201).json({ homework: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { className, subjectName, title, description, dueDate, maxScore, status } = req.body
    const result = await query(`
      UPDATE homework SET class_name=COALESCE($1,class_name), subject_name=COALESCE($2,subject_name),
        title=COALESCE($3,title), description=COALESCE($4,description),
        due_date=COALESCE($5,due_date), max_score=COALESCE($6,max_score), status=COALESCE($7,status)
      WHERE id=$8 AND school_id=$9 RETURNING *
    `, [className, subjectName, title, description, dueDate, parseInt(maxScore) || null, status, req.params.id, schoolId])
    res.json({ homework: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    await query('UPDATE homework SET status=$1 WHERE id=$2 AND school_id=$3', ['archived', req.params.id, schoolId])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

// ─── Submissions ──────────────────────────────────────────────────────────────
router.get('/:id/submissions', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const result = await query(`
      SELECT hs.*, s.name as student_name, s.student_number, s.class_name
      FROM homework_submissions hs
      LEFT JOIN students s ON s.id = hs.student_id
      LEFT JOIN homework h ON h.id = hs.homework_id
      WHERE hs.homework_id=$1 AND h.school_id=$2
      ORDER BY s.name
    `, [req.params.id, schoolId])
    res.json({ submissions: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/submissions/:id/grade', async (req: AuthRequest, res) => {
  try {
    const { id: userId } = req.user!
    const { score, feedback } = req.body
    const result = await query(`
      UPDATE homework_submissions SET status='graded', score=$1, feedback=$2,
        graded_by=$3, graded_at=NOW(), submission_date=COALESCE(submission_date, CURRENT_DATE)
      WHERE id=$4 RETURNING *
    `, [score, feedback, userId, req.params.id])
    res.json({ submission: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/submissions/:id', async (req: AuthRequest, res) => {
  try {
    const { status, score, feedback } = req.body
    const result = await query(`
      UPDATE homework_submissions SET status=COALESCE($1,status), score=COALESCE($2,score),
        feedback=COALESCE($3,feedback), submission_date=COALESCE(submission_date, CURRENT_DATE)
      WHERE id=$4 RETURNING *
    `, [status, score, feedback, req.params.id])
    res.json({ submission: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

export default router
