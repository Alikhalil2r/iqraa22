import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const userId   = req.user!.id
    const today    = new Date().toISOString().split('T')[0]

    const [studentsR, gradesR, scheduleR, eventsR] = await Promise.all([
      query('SELECT COUNT(*) FROM students WHERE school_id=$1 AND status=$2', [schoolId, 'active']),
      query('SELECT COUNT(*) FROM grades WHERE school_id=$1', [schoolId]),
      query('SELECT COUNT(*) FROM schedule WHERE school_id=$1', [schoolId]),
      query(`SELECT COUNT(*) FROM events WHERE school_id=$1 AND start_date >= $2`, [schoolId, today]),
    ])

    const gradesStats = await query(`
      SELECT
        AVG(CASE WHEN max_score > 0 THEN score / max_score * 100 ELSE 0 END) as avg_pct,
        COUNT(CASE WHEN max_score > 0 AND score / max_score * 100 >= 50 THEN 1 END) as passed,
        COUNT(*) as total
      FROM grades WHERE school_id=$1
    `, [schoolId])

    res.json({
      students:  parseInt(studentsR.rows[0].count),
      grades:    parseInt(gradesR.rows[0].count),
      schedule:  parseInt(scheduleR.rows[0].count),
      events:    parseInt(eventsR.rows[0].count),
      avgGrade:  Math.round(parseFloat(gradesStats.rows[0]?.avg_pct || 0)),
      passed:    parseInt(gradesStats.rows[0]?.passed || 0),
      total:     parseInt(gradesStats.rows[0]?.total || 0),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/my-classes', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const result   = await query(
      'SELECT DISTINCT class_name, COUNT(*) as student_count FROM students WHERE school_id=$1 AND status=$2 GROUP BY class_name ORDER BY class_name',
      [schoolId, 'active']
    )
    res.json({ classes: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/subject-performance', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const result   = await query(`
      SELECT
        subject_name,
        ROUND(AVG(CASE WHEN max_score > 0 THEN score / max_score * 100 ELSE 0 END)::numeric, 1) as avg_pct,
        COUNT(*) as total,
        COUNT(CASE WHEN max_score > 0 AND score / max_score * 100 >= 50 THEN 1 END) as passed
      FROM grades WHERE school_id=$1 AND subject_name IS NOT NULL
      GROUP BY subject_name ORDER BY avg_pct DESC
    `, [schoolId])
    res.json({ performance: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
