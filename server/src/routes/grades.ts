import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

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
    if (subjectName) { sql += ` AND g.subject_name ILIKE $${i}`; params.push(`%${subjectName}%`); i++ }
    sql += ' ORDER BY s.name, g.subject_name'
    const result = await query(sql, params)
    res.json({ grades: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const d = req.body
    const pct = d.maxScore > 0 ? (d.score / d.maxScore * 100) : 0
    const result = await query(`
      INSERT INTO grades (school_id,student_id,subject_id,subject_name,class_name,academic_year,term,
        score,max_score,grade_letter,percentage,status,teacher_notes,recorded_by,exam_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [schoolId, d.studentId, d.subjectId, d.subjectName, d.className, d.academicYear, d.term,
       d.score, d.maxScore||100, letterGrade(pct), pct.toFixed(2),
       pct >= 50 ? 'pass' : 'fail', d.teacherNotes, userId, d.examDate]
    )
    res.status(201).json({ grade: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const pct = d.maxScore > 0 ? (d.score / d.maxScore * 100) : 0
    const result = await query(`
      UPDATE grades SET subject_name=$1,class_name=$2,academic_year=$3,term=$4,score=$5,
        max_score=$6,grade_letter=$7,percentage=$8,status=$9,teacher_notes=$10,exam_date=$11
      WHERE id=$12 AND school_id=$13 RETURNING *`,
      [d.subjectName,d.className,d.academicYear,d.term,d.score,d.maxScore||100,
       letterGrade(pct),pct.toFixed(2),pct>=50?'pass':'fail',d.teacherNotes,d.examDate,
       req.params.id, req.user!.schoolId]
    )
    res.json({ grade: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM grades WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/report/:studentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { academicYear, term } = req.query
    let sql = `SELECT g.*, s.name as student_name, s.class_name, s.student_number
               FROM grades g JOIN students s ON s.id=g.student_id
               WHERE g.student_id=$1`
    const params: any[] = [req.params.studentId]
    if (academicYear) { sql += ' AND g.academic_year=$2'; params.push(academicYear) }
    if (term && params.length === 2) { sql += ' AND g.term=$3'; params.push(term) }
    sql += ' ORDER BY g.subject_name'
    const result = await query(sql, params)
    const grades = result.rows
    const avg = grades.length ? grades.reduce((s: number, g: any) => s + parseFloat(g.percentage), 0) / grades.length : 0
    res.json({
      grades,
      summary: {
        total: grades.length,
        average: avg.toFixed(2),
        passed: grades.filter((g: any) => g.status === 'pass').length,
        failed: grades.filter((g: any) => g.status === 'fail').length,
        letterGrade: letterGrade(avg)
      }
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
