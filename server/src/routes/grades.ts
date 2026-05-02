import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()

function letterGrade(pct: number) {
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
    const { studentId, classId, term, academicYear, subjectName } = req.query
    let sql = `SELECT g.*, s.name as student_name, s.class_name as student_class
               FROM grades g JOIN students s ON s.id=g.student_id
               WHERE g.school_id=$1`
    const params: any[] = [schoolId]
    let i = 2
    if (studentId) { sql += ` AND g.student_id=$${i}`; params.push(studentId); i++ }
    if (term) { sql += ` AND g.term=$${i}`; params.push(term); i++ }
    if (academicYear) { sql += ` AND g.academic_year=$${i}`; params.push(academicYear); i++ }
    if (subjectName) { sql += ` AND g.subject_name ILIKE $${i}`; params.push(`%${String(subjectName).slice(0, 100)}%`); i++ }
    sql += ' ORDER BY s.name, g.subject_name'
    const result = await query(sql, params)
    res.json({ grades: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const d = req.body
    if (!d.studentId || !d.subjectName) {
      return res.status(400).json({ error: 'بيانات الدرجة ناقصة' })
    }
    // Verify student belongs to this school
    const studentCheck = await query('SELECT id FROM students WHERE id=$1 AND school_id=$2', [d.studentId, schoolId])
    if (!studentCheck.rows[0]) return res.status(404).json({ error: 'الطالب غير موجود' })

    const score = parseFloat(d.score) || 0
    const maxScore = parseFloat(d.maxScore) || 100
    const pct = maxScore > 0 ? (score / maxScore * 100) : 0
    const result = await query(`
      INSERT INTO grades (school_id,student_id,subject_id,subject_name,class_name,academic_year,term,
        score,max_score,grade_letter,percentage,status,teacher_notes,recorded_by,exam_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [schoolId, d.studentId, d.subjectId, d.subjectName, d.className, d.academicYear, d.term,
       score, maxScore, letterGrade(pct), pct.toFixed(2),
       pct >= 50 ? 'pass' : 'fail', d.teacherNotes?.slice(0, 1000), userId, d.examDate]
    )
    res.status(201).json({ grade: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', authenticateToken, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const score = parseFloat(d.score) || 0
    const maxScore = parseFloat(d.maxScore) || 100
    const pct = maxScore > 0 ? (score / maxScore * 100) : 0
    const result = await query(`
      UPDATE grades SET subject_name=$1,class_name=$2,academic_year=$3,term=$4,score=$5,
        max_score=$6,grade_letter=$7,percentage=$8,status=$9,teacher_notes=$10,exam_date=$11
      WHERE id=$12 AND school_id=$13 RETURNING *`,
      [d.subjectName, d.className, d.academicYear, d.term, score, maxScore,
       letterGrade(pct), pct.toFixed(2), pct >= 50 ? 'pass' : 'fail',
       d.teacherNotes?.slice(0, 1000), d.examDate,
       req.params.id, req.user!.schoolId]
    )
    res.json({ grade: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', authenticateToken, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM grades WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// Report — school isolation enforced
router.get('/report/:studentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId, role, id: userId } = req.user!
    const { academicYear, term } = req.query

    // Parent can only view their own child
    if (role === 'parent') {
      const childCheck = await query(
        'SELECT id FROM students WHERE id=$1 AND school_id=$2 AND parent_id=$3',
        [req.params.studentId, schoolId, userId]
      )
      if (!childCheck.rows[0]) return res.status(403).json({ error: 'غير مصرح' })
    } else {
      // Admin/teacher must verify student belongs to their school
      const studentCheck = await query(
        'SELECT id FROM students WHERE id=$1 AND school_id=$2',
        [req.params.studentId, schoolId]
      )
      if (!studentCheck.rows[0]) return res.status(404).json({ error: 'الطالب غير موجود' })
    }

    let sql = `SELECT g.*, s.name as student_name, s.class_name, s.student_number
               FROM grades g JOIN students s ON s.id=g.student_id
               WHERE g.student_id=$1 AND g.school_id=$2`
    const params: any[] = [req.params.studentId, schoolId]
    let i = 3
    if (academicYear) { sql += ` AND g.academic_year=$${i}`; params.push(academicYear); i++ }
    if (term) { sql += ` AND g.term=$${i}`; params.push(term); i++ }
    sql += ' ORDER BY g.subject_name'
    const result = await query(sql, params)
    const grades = result.rows
    const avg = grades.length
      ? grades.reduce((s: number, g: any) => s + parseFloat(g.percentage), 0) / grades.length
      : 0
    res.json({
      grades,
      summary: {
        total: grades.length,
        average: avg.toFixed(2),
        passed: grades.filter((g: any) => g.status === 'pass').length,
        failed: grades.filter((g: any) => g.status === 'fail').length,
        letterGrade: letterGrade(avg),
      },
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
