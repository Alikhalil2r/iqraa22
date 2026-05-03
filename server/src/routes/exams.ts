import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { academicYear, term, className } = req.query
    let q = `SELECT * FROM exams WHERE school_id=$1`
    const params: any[] = [req.user!.schoolId]
    if (academicYear) { params.push(academicYear); q += ` AND academic_year=$${params.length}` }
    if (term) { params.push(term); q += ` AND term=$${params.length}` }
    if (className) { params.push(`%${className}%`); q += ` AND class_name ILIKE $${params.length}` }
    q += ' ORDER BY exam_date, start_time'
    const result = await query(q, params)
    res.json({ exams: result.rows, total: result.rowCount })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { subjectName, className, examDate, startTime, endTime, room, examType, academicYear, term, notes, maxScore } = req.body
    if (!subjectName || !examDate) return res.status(400).json({ error: 'subjectName and examDate required' })
    const result = await query(`
      INSERT INTO exams (school_id, subject_name, class_name, exam_date, start_time, end_time, room, exam_type, academic_year, term, notes, max_score)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [schoolId, subjectName, className || null, examDate, startTime || null, endTime || null, room || null, examType || 'written', academicYear || '2024-2025', term || 'الفصل الأول', notes || null, maxScore || 100])
    res.status(201).json({ exam: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { subjectName, className, examDate, startTime, endTime, room, examType, academicYear, term, notes, maxScore } = req.body
    const result = await query(`
      UPDATE exams SET subject_name=$1, class_name=$2, exam_date=$3, start_time=$4, end_time=$5,
        room=$6, exam_type=$7, academic_year=$8, term=$9, notes=$10, max_score=$11
      WHERE id=$12 AND school_id=$13 RETURNING *
    `, [subjectName, className || null, examDate, startTime || null, endTime || null, room || null, examType || 'written', academicYear || '2024-2025', term || 'الفصل الأول', notes || null, maxScore || 100, req.params.id, schoolId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ exam: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM exams WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
