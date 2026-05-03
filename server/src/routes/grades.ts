import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('GRADES')

function letterGrade(pct: number): string {
  if (pct >= 95) return 'A+'
  if (pct >= 90) return 'A'
  if (pct >= 85) return 'B+'
  if (pct >= 80) return 'B'
  if (pct >= 75) return 'C+'
  if (pct >= 70) return 'C'
  if (pct >= 65) return 'D+'
  if (pct >= 60) return 'D'
  return 'F'
}

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { studentId, classId, term, academicYear, subjectName, page = '1', limit = '200' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let sql = `SELECT g.id, g.subject_name, g.class_name, g.academic_year, g.term,
                      g.score, g.max_score, g.grade_letter, g.percentage, g.status,
                      g.teacher_notes, g.exam_date, g.created_at,
                      s.name as student_name, s.class_name as student_class
               FROM grades g JOIN students s ON s.id=g.student_id
               WHERE g.school_id=$1`
    const params: unknown[] = [schoolId]
    let i = 2
    if (studentId)    { sql += ` AND g.student_id=$${i}`;                  params.push(studentId);    i++ }
    if (term)         { sql += ` AND g.term=$${i}`;                         params.push(term);         i++ }
    if (academicYear) { sql += ` AND g.academic_year=$${i}`;               params.push(academicYear); i++ }
    if (subjectName)  { sql += ` AND g.subject_name ILIKE $${i}`;           params.push(`%${String(subjectName).slice(0, 100)}%`); i++ }
    sql += ` ORDER BY s.name, g.subject_name LIMIT $${i} OFFSET $${i + 1}`
    params.push(parseInt(String(limit)), offset)
    const result = await query(sql, params)
    res.json({ grades: result.rows })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const d = req.body
    if (!d.studentId || !d.subjectName) {
      return res.status(400).json({ error: 'بيانات الدرجة ناقصة' })
    }
    const studentCheck = await query('SELECT id FROM students WHERE id=$1 AND school_id=$2', [d.studentId, schoolId])
    if (!studentCheck.rows[0]) return res.status(404).json({ error: 'الطالب غير موجود' })

    const score    = parseFloat(d.score)    || 0
    const maxScore = parseFloat(d.maxScore) || 100
    const pct      = maxScore > 0 ? (score / maxScore * 100) : 0
    const result = await query(`
      INSERT INTO grades (school_id,student_id,subject_id,subject_name,class_name,academic_year,term,
        score,max_score,grade_letter,percentage,status,teacher_notes,recorded_by,exam_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [schoolId, d.studentId, d.subjectId, d.subjectName, d.className, d.academicYear, d.term,
       score, maxScore, letterGrade(pct), pct.toFixed(2),
       pct >= 50 ? 'pass' : 'fail', d.teacherNotes?.slice(0, 1000), userId, d.examDate]
    )
    log.info('Grade added', { studentId: d.studentId, subject: d.subjectName })
    res.status(201).json({ grade: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authenticateToken, writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const score    = parseFloat(d.score)    || 0
    const maxScore = parseFloat(d.maxScore) || 100
    const pct      = maxScore > 0 ? (score / maxScore * 100) : 0
    const result = await query(`
      UPDATE grades SET subject_name=$1,class_name=$2,academic_year=$3,term=$4,score=$5,
        max_score=$6,grade_letter=$7,percentage=$8,status=$9,teacher_notes=$10,exam_date=$11
      WHERE id=$12 AND school_id=$13 RETURNING *`,
      [d.subjectName, d.className, d.academicYear, d.term, score, maxScore,
       letterGrade(pct), pct.toFixed(2), pct >= 50 ? 'pass' : 'fail',
       d.teacherNotes?.slice(0, 1000), d.examDate,
       req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ grade: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticateToken, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM grades WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/subjects', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT subject_name FROM grades WHERE school_id=$1 ORDER BY subject_name',
      [req.user!.schoolId]
    )
    res.json({ subjects: result.rows.map((r: any) => r.subject_name) })
  } catch (err) {
    log.error('GET /subjects failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/report/:studentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [student, grades] = await Promise.all([
      query('SELECT id, name, student_number, class_name FROM students WHERE id=$1 AND school_id=$2',
        [req.params.studentId, schoolId]),
      query(`SELECT subject_name, score, max_score, grade_letter, percentage, status, term, academic_year
             FROM grades WHERE student_id=$1 AND school_id=$2 ORDER BY subject_name`,
        [req.params.studentId, schoolId])
    ])
    if (!student.rows[0]) return res.status(404).json({ error: 'الطالب غير موجود' })
    const avg = grades.rows.length > 0
      ? (grades.rows.reduce((sum: number, g: any) => sum + parseFloat(g.percentage), 0) / grades.rows.length).toFixed(2)
      : '0'
    res.json({ student: student.rows[0], grades: grades.rows, average: avg })
  } catch (err) {
    log.error('GET /report/:studentId failed', { id: req.params.studentId, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
