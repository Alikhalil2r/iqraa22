import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('REPORTS')

router.get('/summary', authenticateToken, requireRole('super_admin', 'admin', 'teacher', 'accountant', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [students, employees, attendance, grades, fees] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM students WHERE school_id=$1 AND status='active'`, [schoolId]),
      query(`SELECT COUNT(*)::int AS total FROM employees WHERE school_id=$1 AND status='active'`, [schoolId]),
      query(`
        SELECT ROUND(COUNT(CASE WHEN status='present' THEN 1 END)::numeric / NULLIF(COUNT(*),0) * 100, 1) AS rate
        FROM attendance WHERE school_id=$1 AND person_type='student' AND date >= CURRENT_DATE - INTERVAL '30 days'`, [schoolId]),
      query(`SELECT ROUND(AVG(percentage)::numeric, 1) AS avg FROM grades WHERE school_id=$1`, [schoolId]),
      query(`
        SELECT
          COALESCE(SUM(amount),0)::float AS total_due,
          COALESCE(SUM(paid_amount),0)::float AS total_collected,
          COUNT(CASE WHEN status IN ('unpaid','partial') THEN 1 END)::int AS pending_count
        FROM fees WHERE school_id=$1`, [schoolId]),
    ])
    res.json({
      students: students.rows[0]?.total || 0,
      employees: employees.rows[0]?.total || 0,
      attendanceRate: attendance.rows[0]?.rate || 0,
      avgGrade: grades.rows[0]?.avg || 0,
      fees: fees.rows[0] || { total_due: 0, total_collected: 0, pending_count: 0 },
    })
  } catch (err) {
    log.error('GET /summary failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/attendance-summary', authenticateToken, requireRole('super_admin', 'admin', 'teacher', 'hr_manager', 'guard'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { startDate, endDate, personType, classId } = req.query
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    const end = endDate || new Date().toISOString().split('T')[0]
    const type = personType || 'student'

    let sql = `
      SELECT
        a.person_id,
        CASE WHEN a.person_type='student' THEN s.name ELSE e.name END as name,
        CASE WHEN a.person_type='student' THEN s.class_name ELSE e.department END as group_name,
        COUNT(CASE WHEN a.status='present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status='late' THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status='excused' THEN 1 END) as excused_days,
        COUNT(*) as total_days,
        ROUND(COUNT(CASE WHEN a.status IN ('present','late') THEN 1 END)::numeric / NULLIF(COUNT(*),0) * 100, 1) as attendance_rate
      FROM attendance a
      LEFT JOIN students s ON s.id=a.person_id AND a.person_type='student'
      LEFT JOIN employees e ON e.id=a.person_id AND a.person_type='employee'
      WHERE a.school_id=$1 AND a.person_type=$2 AND a.date BETWEEN $3 AND $4`
    const params: unknown[] = [schoolId, type, start, end]
    if (classId && type === 'student') {
      sql += ` AND s.class_id=$5`
      params.push(classId)
    }
    sql += `
      GROUP BY a.person_id, a.person_type,
        CASE WHEN a.person_type='student' THEN s.name ELSE e.name END,
        CASE WHEN a.person_type='student' THEN s.class_name ELSE e.department END
      ORDER BY attendance_rate ASC`
    const result = await query(sql, params)
    res.json({ report: result.rows, period: { start, end } })
  } catch (err) {
    log.error('GET /attendance-summary failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/grades-summary', authenticateToken, requireRole('super_admin', 'admin', 'teacher'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { academicYear, term, classId } = req.query
    let sql = `
      SELECT s.id as student_id, s.name as student_name, s.class_name, s.student_number,
        ROUND(AVG(g.percentage)::numeric, 1) as avg_grade,
        COUNT(g.id) as subject_count,
        COUNT(CASE WHEN g.status='pass' OR g.percentage >= 50 THEN 1 END) as passed,
        COUNT(CASE WHEN g.status='fail' OR (g.percentage IS NOT NULL AND g.percentage < 50) THEN 1 END) as failed
      FROM students s LEFT JOIN grades g ON g.student_id=s.id AND g.school_id=s.school_id
      WHERE s.school_id=$1 AND s.status='active'`
    const params: unknown[] = [schoolId]
    let i = 2
    if (academicYear) { sql += ` AND (g.academic_year=$${i} OR g.academic_year IS NULL)`; params.push(academicYear); i++ }
    if (term) { sql += ` AND (g.term=$${i} OR g.term IS NULL)`; params.push(term); i++ }
    if (classId) { sql += ` AND s.class_id=$${i}`; params.push(classId); i++ }
    sql += ' GROUP BY s.id, s.name, s.class_name, s.student_number HAVING COUNT(g.id) > 0 ORDER BY avg_grade DESC NULLS LAST'
    const result = await query(sql, params)
    res.json({ report: result.rows })
  } catch (err) {
    log.error('GET /grades-summary failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/students-summary', authenticateToken, requireRole('super_admin', 'admin', 'teacher', 'accountant', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [byClass, byGender, byStatus, list] = await Promise.all([
      query(`SELECT class_name, COUNT(*)::int AS count FROM students WHERE school_id=$1 AND class_name IS NOT NULL GROUP BY class_name ORDER BY class_name`, [schoolId]),
      query(`SELECT COALESCE(gender,'unknown') AS gender, COUNT(*)::int AS count FROM students WHERE school_id=$1 GROUP BY gender`, [schoolId]),
      query(`SELECT status, COUNT(*)::int AS count FROM students WHERE school_id=$1 GROUP BY status`, [schoolId]),
      query(`
        SELECT id, name, student_number, class_name, gender, status, date_of_birth
        FROM students WHERE school_id=$1 AND status='active'
        ORDER BY class_name, name LIMIT 500`, [schoolId]),
    ])
    res.json({
      byClass: byClass.rows,
      byGender: byGender.rows,
      byStatus: byStatus.rows,
      students: list.rows,
      total: list.rowCount,
    })
  } catch (err) {
    log.error('GET /students-summary failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/fees-summary', authenticateToken, requireRole('super_admin', 'admin', 'accountant'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { academicYear, status } = req.query
    let listSql = `
      SELECT f.id, f.fee_type, f.description, f.amount, f.paid_amount, f.due_date, f.status, f.academic_year, f.term,
        s.name AS student_name, s.class_name, s.student_number,
        (f.amount - COALESCE(f.paid_amount,0)) AS remaining
      FROM fees f JOIN students s ON s.id=f.student_id
      WHERE f.school_id=$1`
    const params: unknown[] = [schoolId]
    let i = 2
    if (academicYear) { listSql += ` AND f.academic_year=$${i}`; params.push(academicYear); i++ }
    if (status) { listSql += ` AND f.status=$${i}`; params.push(status); i++ }
    listSql += ' ORDER BY f.due_date DESC NULLS LAST, s.name'

    const [byStatus, byType, totals, list] = await Promise.all([
      query(`SELECT status, COUNT(*)::int AS count, COALESCE(SUM(amount),0)::float AS total FROM fees WHERE school_id=$1 GROUP BY status`, [schoolId]),
      query(`SELECT fee_type, COUNT(*)::int AS count, COALESCE(SUM(amount),0)::float AS total, COALESCE(SUM(paid_amount),0)::float AS collected FROM fees WHERE school_id=$1 GROUP BY fee_type ORDER BY total DESC`, [schoolId]),
      query(`
        SELECT
          COALESCE(SUM(amount),0)::float AS total_due,
          COALESCE(SUM(paid_amount),0)::float AS total_collected,
          COALESCE(SUM(amount - COALESCE(paid_amount,0)),0)::float AS outstanding,
          COUNT(CASE WHEN status='paid' THEN 1 END)::int AS paid_count,
          COUNT(CASE WHEN status IN ('unpaid','partial') THEN 1 END)::int AS pending_count
        FROM fees WHERE school_id=$1`, [schoolId]),
      query(listSql, params),
    ])
    res.json({
      byStatus: byStatus.rows,
      byType: byType.rows,
      totals: totals.rows[0],
      report: list.rows,
    })
  } catch (err) {
    log.error('GET /fees-summary failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/hr-summary', authenticateToken, requireRole('super_admin', 'admin', 'hr_manager'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const [byDept, bySalary, byStatus, byType, list] = await Promise.all([
      query(`SELECT department, COUNT(*)::int AS count FROM employees WHERE school_id=$1 AND department IS NOT NULL GROUP BY department ORDER BY count DESC`, [schoolId]),
      query(`SELECT department, ROUND(SUM(salary)::numeric,2) AS total, ROUND(AVG(salary)::numeric,2) AS avg FROM employees WHERE school_id=$1 GROUP BY department ORDER BY total DESC`, [schoolId]),
      query(`SELECT status, COUNT(*)::int AS count FROM employees WHERE school_id=$1 GROUP BY status`, [schoolId]),
      query(`SELECT employee_type, COUNT(*)::int AS count FROM employees WHERE school_id=$1 GROUP BY employee_type`, [schoolId]),
      query(`
        SELECT id, name, employee_number, position, department, employee_type, status, salary, join_date, phone, email
        FROM employees WHERE school_id=$1 ORDER BY department, name`, [schoolId]),
    ])
    res.json({
      byDepartment: byDept.rows,
      bySalary: bySalary.rows,
      byStatus: byStatus.rows,
      byType: byType.rows,
      employees: list.rows,
    })
  } catch (err) {
    log.error('GET /hr-summary failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
