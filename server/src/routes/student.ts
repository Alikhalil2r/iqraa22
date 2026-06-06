import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()

router.use(authenticateToken)
router.use(requireRole('parent'))

async function getStudentForParent(parentId: string, schoolId: string, studentId?: string) {
  if (studentId) {
    const r = await query(
      `SELECT id, name, name_en, student_number, class_name, photo, academic_year
       FROM students WHERE parent_id=$1 AND school_id=$2 AND id=$3 AND status='active'`,
      [parentId, schoolId, studentId]
    )
    return r.rows[0]
  }
  const r = await query(
    `SELECT id, name, name_en, student_number, class_name, photo, academic_year
     FROM students WHERE parent_id=$1 AND school_id=$2 AND status='active' ORDER BY name LIMIT 1`,
    [parentId, schoolId]
  )
  return r.rows[0]
}

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const child = await getStudentForParent(req.user!.id, req.user!.schoolId, req.query.studentId as string)
    if (!child) return res.json({ child: null, stats: {} })

    const [grades, homework, schedule] = await Promise.all([
      query(`SELECT subject_name, score, max_score, percentage, grade_letter, term FROM grades
             WHERE student_id=$1 ORDER BY created_at DESC LIMIT 8`, [child.id]),
      query(`SELECT h.id, h.title, h.due_date, h.subject_name, hs.status AS submission_status
             FROM homework h LEFT JOIN homework_submissions hs ON hs.homework_id=h.id AND hs.student_id=$1
             WHERE h.class_id IN (SELECT class_id FROM students WHERE id=$1) AND h.status='active'
             ORDER BY h.due_date LIMIT 10`, [child.id]),
      query(`SELECT day_of_week, period, subject_name, start_time, end_time, room
             FROM schedule WHERE class_id IN (SELECT class_id FROM students WHERE id=$1)
             ORDER BY day_of_week, period`, [child.id]),
    ])

    res.json({
      child,
      grades: grades.rows,
      homework: homework.rows,
      schedule: schedule.rows,
      stats: {
        avgGrade: grades.rows.length
          ? (grades.rows.reduce((a: number, g: { percentage: number }) => a + Number(g.percentage || 0), 0) / grades.rows.length).toFixed(1)
          : '0',
        pendingHomework: homework.rows.filter((h: { submission_status: string | null }) => !h.submission_status || h.submission_status === 'pending').length,
      },
    })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/grades', async (req: AuthRequest, res) => {
  try {
    const child = await getStudentForParent(req.user!.id, req.user!.schoolId, req.query.studentId as string)
    if (!child) return res.json({ grades: [] })
    const r = await query(
      `SELECT * FROM grades WHERE student_id=$1 ORDER BY academic_year DESC, term, subject_name`,
      [child.id]
    )
    res.json({ child, grades: r.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/homework', async (req: AuthRequest, res) => {
  try {
    const child = await getStudentForParent(req.user!.id, req.user!.schoolId, req.query.studentId as string)
    if (!child) return res.json({ homework: [] })
    const r = await query(
      `SELECT h.*, hs.status AS submission_status, hs.submission_date, hs.attachment_url
       FROM homework h
       LEFT JOIN homework_submissions hs ON hs.homework_id=h.id AND hs.student_id=$1
       WHERE h.class_id IN (SELECT class_id FROM students WHERE id=$1) AND h.status='active'
       ORDER BY h.due_date`,
      [child.id]
    )
    res.json({ child, homework: r.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/schedule', async (req: AuthRequest, res) => {
  try {
    const child = await getStudentForParent(req.user!.id, req.user!.schoolId, req.query.studentId as string)
    if (!child) return res.json({ schedule: [] })
    const r = await query(
      `SELECT * FROM schedule WHERE class_id IN (SELECT class_id FROM students WHERE id=$1)
       ORDER BY day_of_week, period`,
      [child.id]
    )
    res.json({ child, schedule: r.rows })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
