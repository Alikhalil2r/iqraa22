import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole, TEACHING_ROLES } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
router.use(authenticateToken)
const log = createLogger('EXAMS')

router.get('/', requireRole(...TEACHING_ROLES, 'parent'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { academicYear, term, className } = req.query
    let q = `SELECT id, subject_name, class_name, exam_date, start_time, end_time,
               room, exam_type, academic_year, term, notes, max_score, created_at
             FROM exams WHERE school_id=$1`
    const params: unknown[] = [schoolId]
    if (academicYear) { params.push(academicYear);           q += ` AND academic_year=$${params.length}` }
    if (term)         { params.push(term);                   q += ` AND term=$${params.length}` }
    if (className)    { params.push(`%${className}%`);       q += ` AND class_name ILIKE $${params.length}` }
    q += ' ORDER BY exam_date, start_time LIMIT 500'
    const result = await query(q, params)
    res.json({ exams: result.rows, total: result.rowCount })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { subjectName, className, examDate, startTime, endTime, room,
            examType, academicYear, term, notes, maxScore } = req.body
    if (!subjectName || !examDate) return res.status(400).json({ error: 'المادة والتاريخ مطلوبان' })
    const result = await query(`
      INSERT INTO exams (school_id, subject_name, class_name, exam_date, start_time, end_time,
        room, exam_type, academic_year, term, notes, max_score)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [schoolId, subjectName, className || null, examDate, startTime || null, endTime || null,
       room || null, examType || 'written', academicYear || '2024-2025',
       term || 'الفصل الأول', notes?.slice(0, 1000) || null, parseInt(maxScore) || 100]
    )
    log.info('Exam created', { examId: result.rows[0].id })
    res.status(201).json({ exam: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', writeLimiter, requireRole('admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { subjectName, className, examDate, startTime, endTime, room,
            examType, academicYear, term, notes, maxScore } = req.body
    const result = await query(`
      UPDATE exams SET subject_name=$1, class_name=$2, exam_date=$3, start_time=$4, end_time=$5,
        room=$6, exam_type=$7, academic_year=$8, term=$9, notes=$10, max_score=$11
      WHERE id=$12 AND school_id=$13 RETURNING *`,
      [subjectName, className || null, examDate, startTime || null, endTime || null,
       room || null, examType || 'written', academicYear || '2024-2025',
       term || 'الفصل الأول', notes?.slice(0, 1000) || null, parseInt(maxScore) || 100,
       req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ exam: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM exams WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
