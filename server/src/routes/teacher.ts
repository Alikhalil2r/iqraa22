import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { getTeacherScope, isTeacherRole } from '../utils/teacherScope'

const router = Router()
router.use(authenticateToken)
router.use(requireRole('super_admin', 'admin', 'teacher'))

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const userId = req.user!.id
    const role = req.user!.role
    const todayDow = new Date().getDay()

    const scope = isTeacherRole(role)
      ? await getTeacherScope(schoolId, userId)
      : null

    let studentCount = 0
    let gradesCount = 0
    let scheduleCount = 0
    let avgGrade = 0
    let passed = 0
    let total = 0

    if (scope && isTeacherRole(role)) {
      const stuScope = scope.classIds.length || scope.classNames.length
        ? await query(
            `SELECT COUNT(*) FROM students s WHERE s.school_id=$1 AND s.status='active'
             AND (${[
               scope.classIds.length ? `s.class_id = ANY($2::uuid[])` : null,
               scope.classNames.length ? `s.class_name = ANY($${scope.classIds.length ? 3 : 2}::text[])` : null,
             ].filter(Boolean).join(' OR ')})`,
            [
              schoolId,
              ...(scope.classIds.length ? [scope.classIds] : []),
              ...(scope.classNames.length ? [scope.classNames] : []),
            ]
          )
        : { rows: [{ count: '0' }] }

      const gradeFilter = scope.classNames.length || scope.subjectNames.length
        ? await query(
            `SELECT COUNT(*) as cnt,
              AVG(CASE WHEN max_score > 0 THEN score / max_score * 100 ELSE 0 END) as avg_pct,
              COUNT(CASE WHEN max_score > 0 AND score / max_score * 100 >= 50 THEN 1 END) as passed
             FROM grades WHERE school_id=$1
             AND (${[
               scope.classNames.length ? `class_name = ANY($2::text[])` : null,
               scope.subjectNames.length ? `subject_name = ANY($${scope.classNames.length ? 3 : 2}::text[])` : null,
               `recorded_by = $${2 + (scope.classNames.length ? 1 : 0) + (scope.subjectNames.length ? 1 : 0)}`,
             ].filter(Boolean).join(' OR ')})`,
            [
              schoolId,
              ...(scope.classNames.length ? [scope.classNames] : []),
              ...(scope.subjectNames.length ? [scope.subjectNames] : []),
              userId,
            ]
          )
        : { rows: [{ cnt: '0', avg_pct: 0, passed: 0 }] }

      const sched = await query(
        `SELECT COUNT(*) FROM schedule WHERE school_id=$1 AND teacher_id=$2`,
        [schoolId, userId]
      )

      studentCount = parseInt(stuScope.rows[0]?.count || '0')
      gradesCount = parseInt(gradeFilter.rows[0]?.cnt || '0')
      scheduleCount = parseInt(sched.rows[0]?.count || '0')
      avgGrade = Math.round(parseFloat(gradeFilter.rows[0]?.avg_pct || '0'))
      passed = parseInt(gradeFilter.rows[0]?.passed || '0')
      total = gradesCount
    } else {
      const [studentsR, gradesR, scheduleR, gradesStats] = await Promise.all([
        query('SELECT COUNT(*) FROM students WHERE school_id=$1 AND status=$2', [schoolId, 'active']),
        query('SELECT COUNT(*) FROM grades WHERE school_id=$1', [schoolId]),
        query('SELECT COUNT(*) FROM schedule WHERE school_id=$1', [schoolId]),
        query(`
          SELECT AVG(CASE WHEN max_score > 0 THEN score / max_score * 100 ELSE 0 END) as avg_pct,
                 COUNT(CASE WHEN max_score > 0 AND score / max_score * 100 >= 50 THEN 1 END) as passed,
                 COUNT(*) as total
          FROM grades WHERE school_id=$1`, [schoolId]),
      ])
      studentCount = parseInt(studentsR.rows[0].count)
      gradesCount = parseInt(gradesR.rows[0].count)
      scheduleCount = parseInt(scheduleR.rows[0].count)
      avgGrade = Math.round(parseFloat(gradesStats.rows[0]?.avg_pct || '0'))
      passed = parseInt(gradesStats.rows[0]?.passed || '0')
      total = parseInt(gradesStats.rows[0]?.total || '0')
    }

    const todaySchedule = isTeacherRole(role)
      ? (await query(
          `SELECT s.*, c.name as class_name_db FROM schedule s
           LEFT JOIN classes c ON c.id=s.class_id
           WHERE s.school_id=$1 AND s.teacher_id=$2 AND s.day_of_week=$3
           ORDER BY s.start_time`,
          [schoolId, userId, todayDow]
        )).rows.map(r => ({
          ...r,
          day_name: DAY_NAMES[r.day_of_week] || '',
        }))
      : []

    res.json({
      students: studentCount,
      grades: gradesCount,
      schedule: scheduleCount,
      avgGrade,
      passed,
      total,
      todaySchedule,
      scoped: isTeacherRole(role),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/my-classes', async (req: AuthRequest, res) => {
  try {
    const schoolId = req.user!.schoolId
    const userId = req.user!.id
    const role = req.user!.role

    if (!isTeacherRole(role)) {
      const result = await query(
        `SELECT c.id, c.name as class_name, COUNT(s.id)::int as student_count
         FROM classes c
         LEFT JOIN students s ON s.class_id=c.id AND s.status='active'
         WHERE c.school_id=$1 GROUP BY c.id, c.name ORDER BY c.name`,
        [schoolId]
      )
      return res.json({ classes: result.rows })
    }

    const scope = await getTeacherScope(schoolId, userId)
    if (!scope.classIds.length && !scope.classNames.length) {
      return res.json({ classes: [], message: 'لم يُعيَّن بعد على فصول — تواصل مع الإدارة' })
    }

    const result = await query(
      `SELECT c.id, COALESCE(c.name, s.class_name) as class_name, COUNT(s.id)::int as student_count
       FROM students s
       LEFT JOIN classes c ON c.id=s.class_id
       WHERE s.school_id=$1 AND s.status='active'
       AND (${[
         scope.classIds.length ? `s.class_id = ANY($2::uuid[])` : null,
         scope.classNames.length ? `s.class_name = ANY($${scope.classIds.length ? 3 : 2}::text[])` : null,
       ].filter(Boolean).join(' OR ')})
       GROUP BY c.id, s.class_name ORDER BY class_name`,
      [
        schoolId,
        ...(scope.classIds.length ? [scope.classIds] : []),
        ...(scope.classNames.length ? [scope.classNames] : []),
      ]
    )
    res.json({ classes: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/my-schedule', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    let q = `SELECT s.*, c.name as class_name_db FROM schedule s
             LEFT JOIN classes c ON c.id=s.class_id WHERE s.school_id=$1`
    const params: unknown[] = [schoolId]
    if (isTeacherRole(role)) {
      params.push(userId)
      q += ` AND s.teacher_id=$${params.length}`
    }
    q += ' ORDER BY s.day_of_week, s.start_time'
    const result = await query(q, params)
    res.json({ schedule: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/subject-performance', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    const scope = isTeacherRole(role) ? await getTeacherScope(schoolId, userId) : null

    let q = `
      SELECT subject_name,
        ROUND(AVG(CASE WHEN max_score > 0 THEN score / max_score * 100 ELSE 0 END)::numeric, 1) as avg_pct,
        COUNT(*)::int as total,
        COUNT(CASE WHEN max_score > 0 AND score / max_score * 100 >= 50 THEN 1 END)::int as passed
      FROM grades WHERE school_id=$1 AND subject_name IS NOT NULL`
    const params: unknown[] = [schoolId]

    if (scope && isTeacherRole(role)) {
      const filters: string[] = [`recorded_by = $${params.length + 1}`]
      params.push(userId)
      if (scope.classNames.length) {
        params.push(scope.classNames)
        filters.push(`class_name = ANY($${params.length}::text[])`)
      }
      if (scope.subjectNames.length) {
        params.push(scope.subjectNames)
        filters.push(`subject_name = ANY($${params.length}::text[])`)
      }
      q += ` AND (${filters.join(' OR ')})`
    }
    q += ' GROUP BY subject_name ORDER BY avg_pct DESC'

    const result = await query(q, params)
    res.json({ performance: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
