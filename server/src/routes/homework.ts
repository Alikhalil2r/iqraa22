import { Router } from 'express'
import { query } from '../db'
import { withTransaction } from '../db/transaction'
import { authenticateToken, AuthRequest, requireRole, TEACHING_ROLES } from '../middleware/auth'
import { getTeacherScope } from '../utils/teacherScope'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'
import { notifyParentsInClass, notifyParentOfStudent } from '../utils/parentNotify'

const router = Router()
router.use(authenticateToken)
const log = createLogger('HOMEWORK')

router.get('/', requireRole(...TEACHING_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    const { className, status, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))
    let q = `SELECT h.*, u.name as teacher_name,
      COUNT(hs.id) as submission_count,
      COUNT(CASE WHEN hs.status IN ('submitted','graded','late') THEN 1 END) as submitted_count
      FROM homework h LEFT JOIN users u ON u.id=h.created_by
      LEFT JOIN homework_submissions hs ON hs.homework_id=h.id
      WHERE h.school_id=$1`
    const params: unknown[] = [schoolId]
    if (role === 'teacher') {
      const scope = await getTeacherScope(schoolId, userId)
      if (scope.classNames.length === 0) return res.json({ homework: [], stats: {}, total: 0 })
      params.push(scope.classNames)
      q += ` AND h.class_name = ANY($${params.length})`
    }
    if (className) { params.push(className); q += ` AND h.class_name=$${params.length}` }
    if (status) { params.push(status); q += ` AND h.status=$${params.length}` }
    q += ` GROUP BY h.id, u.name ORDER BY h.due_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)
    const [rows, stats] = await Promise.all([
      query(q, params),
      query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='active' THEN 1 END) as active FROM homework WHERE school_id=$1`, [schoolId]),
    ])
    res.json({ homework: rows.rows, stats: stats.rows[0], total: rows.rowCount })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { className, subjectName, title, description, dueDate, maxScore } = req.body
    if (!title || !dueDate) return res.status(400).json({ error: 'العنوان وتاريخ التسليم مطلوبان' })
    const result = await withTransaction(async (client) => {
      const hw = await client.query(
        `INSERT INTO homework (school_id,class_name,subject_name,title,description,due_date,max_score,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [schoolId, className || null, subjectName || null, title.slice(0, 300), description?.slice(0, 3000),
         dueDate, parseInt(String(maxScore)) || 10, userId]
      )
      if (className) {
        const students = await client.query(
          `SELECT id FROM students WHERE school_id=$1 AND class_name=$2 AND status='active'`,
          [schoolId, className]
        )
        for (const s of students.rows) {
          await client.query(
            `INSERT INTO homework_submissions (homework_id, student_id, status) VALUES ($1,$2,'pending') ON CONFLICT DO NOTHING`,
            [hw.rows[0].id, s.id]
          )
        }
      }
      return hw.rows[0]
    })
    if (className) {
      await notifyParentsInClass(schoolId, className, 'واجب جديد', `${subjectName || 'مادة'}: ${title}`, 'homework', '/parent/homework')
    }
    res.status(201).json({ homework: result })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, description, dueDate, maxScore, status } = req.body
    const result = await query(
      `UPDATE homework SET title=COALESCE($1,title), description=COALESCE($2,description),
       due_date=COALESCE($3,due_date), max_score=COALESCE($4,max_score), status=COALESCE($5,status)
       WHERE id=$6 AND school_id=$7 RETURNING *`,
      [title?.slice(0, 300), description?.slice(0, 3000), dueDate, maxScore ? parseInt(String(maxScore)) : null, status, req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ homework: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    await query(`UPDATE homework SET status='archived' WHERE id=$1 AND school_id=$2`, [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id/submissions', requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const result = await query(
      `SELECT hs.*, s.name as student_name, s.student_number, s.class_name
       FROM homework_submissions hs JOIN homework h ON h.id=hs.homework_id
       JOIN students s ON s.id=hs.student_id
       WHERE hs.homework_id=$1 AND h.school_id=$2 ORDER BY s.name`,
      [req.params.id, schoolId]
    )
    res.json({ submissions: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/submissions/:id/grade', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { score, feedback, status } = req.body
    const result = await query(
      `UPDATE homework_submissions SET score=$1, feedback=$2, status=COALESCE($3,'graded'),
       graded_by=$4, graded_at=NOW(), submission_date=COALESCE(submission_date, CURRENT_DATE)
       WHERE id=$5 AND homework_id IN (SELECT id FROM homework WHERE school_id=$6) RETURNING *`,
      [score !== undefined ? parseInt(String(score)) : null, feedback?.slice(0, 2000), status, userId, req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    const info = await query(
      `SELECT h.school_id, h.title, h.subject_name, hs.student_id FROM homework_submissions hs
       JOIN homework h ON h.id=hs.homework_id WHERE hs.id=$1`,
      [req.params.id]
    )
    const row = info.rows[0]
    if (row) {
      await notifyParentOfStudent(row.school_id, row.student_id, 'تم تقييم الواجب',
        `${row.subject_name || 'مادة'}: ${row.title} — الدرجة ${score}`, 'homework', '/parent/homework')
    }
    res.json({ submission: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/submissions/:id', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    const { status, score, feedback } = req.body
    const owned = await query(
      `SELECT hs.id, h.class_name FROM homework_submissions hs JOIN homework h ON h.id=hs.homework_id
       WHERE hs.id=$1 AND h.school_id=$2`, [req.params.id, schoolId])
    if (!owned.rows[0]) return res.status(404).json({ error: 'Not found' })
    if (role === 'teacher') {
      const scope = await getTeacherScope(schoolId, userId)
      if (!scope.classNames.includes(owned.rows[0].class_name)) {
        return res.status(403).json({ error: 'لا يمكنك تعديل واجبات خارج نطاقك' })
      }
    }
    const result = await query(
      `UPDATE homework_submissions SET status=COALESCE($1,status), score=COALESCE($2,score),
       feedback=COALESCE($3,feedback), submission_date=COALESCE(submission_date, CURRENT_DATE)
       WHERE id=$4 RETURNING *`,
      [status, score !== undefined ? parseFloat(String(score)) : null, feedback?.slice(0, 2000), req.params.id]
    )
    res.json({ submission: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
