import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/attendance-summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { startDate, endDate, personType } = req.query
    const result = await query(`
      SELECT
        CASE WHEN a.person_type='student' THEN s.name ELSE e.name END as name,
        CASE WHEN a.person_type='student' THEN s.class_name ELSE e.department END as group_name,
        COUNT(CASE WHEN a.status='present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status='late' THEN 1 END) as late_days,
        COUNT(*) as total_days,
        ROUND(COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric / NULLIF(COUNT(*),0) * 100, 1) as attendance_rate
      FROM attendance a
      LEFT JOIN students s ON s.id=a.person_id AND a.person_type='student'
      LEFT JOIN employees e ON e.id=a.person_id AND a.person_type='employee'
      WHERE a.school_id=$1 AND a.person_type=$2 AND a.date BETWEEN $3 AND $4
      GROUP BY a.person_id, a.person_type, name, group_name
      ORDER BY attendance_rate ASC`,
      [schoolId, personType||'student', startDate||new Date(Date.now()-30*86400000).toISOString().split('T')[0], endDate||new Date().toISOString().split('T')[0]]
    )
    res.json({ report: result.rows })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/grades-summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { academicYear, term, classId } = req.query
    let sql = `
      SELECT s.name as student_name, s.class_name, s.student_number,
        ROUND(AVG(g.percentage)::numeric, 1) as avg_grade,
        COUNT(g.id) as subject_count,
        COUNT(CASE WHEN g.status='pass' THEN 1 END) as passed,
        COUNT(CASE WHEN g.status='fail' THEN 1 END) as failed
      FROM students s LEFT JOIN grades g ON g.student_id=s.id
      WHERE s.school_id=$1`
    const params: any[] = [schoolId]
    let i = 2
    if (academicYear) { sql += ` AND g.academic_year=$${i}`; params.push(academicYear); i++ }
    if (term) { sql += ` AND g.term=$${i}`; params.push(term); i++ }
    if (classId) { sql += ` AND s.class_id=$${i}`; params.push(classId); i++ }
    sql += ' GROUP BY s.id, s.name, s.class_name, s.student_number ORDER BY avg_grade DESC NULLS LAST'
    const result = await query(sql, params)
    res.json({ report: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/hr-summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [byDept, bySalary, byStatus, byType] = await Promise.all([
      query(`SELECT department, COUNT(*) as count FROM employees WHERE school_id=$1 AND department IS NOT NULL GROUP BY department`, [schoolId]),
      query(`SELECT department, SUM(salary) as total, AVG(salary) as avg FROM employees WHERE school_id=$1 GROUP BY department`, [schoolId]),
      query(`SELECT status, COUNT(*) as count FROM employees WHERE school_id=$1 GROUP BY status`, [schoolId]),
      query(`SELECT employee_type, COUNT(*) as count FROM employees WHERE school_id=$1 GROUP BY employee_type`, [schoolId]),
    ])
    res.json({
      byDepartment: byDept.rows,
      bySalary: bySalary.rows,
      byStatus: byStatus.rows,
      byType: byType.rows
    })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
