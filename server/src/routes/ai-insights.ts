import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('AI-Insights')

router.use(authenticateToken)
router.use(requireRole('super_admin', 'admin', 'teacher', 'accountant', 'hr_manager'))

// GET /api/ai-insights — comprehensive AI-generated insights
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!

    const [
      gradeDistribution,
      atRiskStudents,
      attendanceTrend,
      feeInsights,
      topSubjects,
      absenteePatterns,
      performanceByClass,
      conductStats,
    ] = await Promise.all([

      // Grade distribution for insight
      query(`
        SELECT
          COUNT(*) FILTER (WHERE score >= 90) as excellent,
          COUNT(*) FILTER (WHERE score >= 75 AND score < 90) as good,
          COUNT(*) FILTER (WHERE score >= 60 AND score < 75) as average,
          COUNT(*) FILTER (WHERE score >= 50 AND score < 60) as weak,
          COUNT(*) FILTER (WHERE score < 50) as failing,
          ROUND(AVG(score)::numeric, 1) as avg_score,
          COUNT(DISTINCT student_id) as total_students
        FROM grades WHERE school_id = $1
      `, [schoolId]),

      // At-risk students (low grades + high absence)
      query(`
        SELECT
          s.id, s.name, s.student_number as student_code,
          c.name as class_name,
          COALESCE(ROUND(AVG(g.score)::numeric, 1), 0) as avg_grade,
          COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_days,
          COUNT(a.id) FILTER (WHERE a.status = 'late') as late_days,
          COUNT(a.id) as total_records,
          CASE
            WHEN COALESCE(ROUND(AVG(g.score)::numeric,1),0) < 50
              AND COUNT(a.id) FILTER (WHERE a.status='absent') > 10 THEN 'critical'
            WHEN COALESCE(ROUND(AVG(g.score)::numeric,1),0) < 60
              OR COUNT(a.id) FILTER (WHERE a.status='absent') > 7 THEN 'warning'
            ELSE 'normal'
          END as risk_level
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN grades g ON g.student_id = s.id AND g.school_id = $1
        LEFT JOIN attendance a ON a.person_id = s.id AND a.school_id = $1
        WHERE s.school_id = $1 AND s.status = 'active'
        GROUP BY s.id, s.name, s.student_number, c.name
        HAVING
          COALESCE(ROUND(AVG(g.score)::numeric,1),0) < 60
          OR COUNT(a.id) FILTER (WHERE a.status='absent') > 5
        ORDER BY risk_level DESC, avg_grade ASC
        LIMIT 20
      `, [schoolId]),

      // Attendance trend (last 8 weeks)
      query(`
        SELECT
          DATE_TRUNC('week', date) as week,
          COUNT(*) FILTER (WHERE status='present') as present,
          COUNT(*) FILTER (WHERE status='absent') as absent,
          COUNT(*) FILTER (WHERE status='late') as late,
          COUNT(*) as total,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE status='present') / NULLIF(COUNT(*),0), 1
          ) as rate
        FROM attendance
        WHERE school_id = $1 AND date >= NOW() - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', date)
        ORDER BY week ASC
      `, [schoolId]),

      // Fee collection insights
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status='paid') as paid_count,
          COUNT(*) FILTER (WHERE status='unpaid') as pending_count,
          COUNT(*) FILTER (WHERE status='unpaid' AND due_date < CURRENT_DATE) as overdue_count,
          COALESCE(SUM(paid_amount),0) as collected,
          COALESCE(SUM(amount - paid_amount) FILTER (WHERE status != 'paid'),0) as outstanding,
          COALESCE(SUM(amount),0) as total,
          ROUND(
            100.0 * SUM(paid_amount) / NULLIF(SUM(amount),0), 1
          ) as collection_rate
        FROM fees WHERE school_id = $1
      `, [schoolId]),

      // Top/bottom performing subjects
      query(`
        SELECT
          sub.name as subject_name,
          COUNT(g.id) as total_grades,
          ROUND(AVG(g.score)::numeric, 1) as avg_score,
          COUNT(*) FILTER (WHERE g.score >= 75) as passing,
          COUNT(*) FILTER (WHERE g.score < 50) as failing
        FROM grades g
        JOIN subjects sub ON sub.id = g.subject_id
        WHERE g.school_id = $1
        GROUP BY sub.name
        HAVING COUNT(g.id) >= 3
        ORDER BY avg_score DESC
        LIMIT 10
      `, [schoolId]),

      // Absence patterns by day of week
      query(`
        SELECT
          EXTRACT(DOW FROM date) as day_num,
          TO_CHAR(date, 'Day') as day_name,
          COUNT(*) FILTER (WHERE status='absent') as absent_count,
          COUNT(*) as total_count,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE status='absent') / NULLIF(COUNT(*),0), 1
          ) as absence_rate
        FROM attendance
        WHERE school_id = $1 AND date >= NOW() - INTERVAL '90 days'
        GROUP BY EXTRACT(DOW FROM date), TO_CHAR(date,'Day')
        ORDER BY absence_rate DESC
      `, [schoolId]),

      // Performance by class
      query(`
        SELECT
          c.name as class_name,
          COUNT(DISTINCT s.id) as student_count,
          ROUND(AVG(g.score)::numeric, 1) as avg_grade,
          COUNT(*) FILTER (WHERE g.score >= 75) as passing,
          COUNT(*) FILTER (WHERE g.score < 50) as failing
        FROM classes c
        JOIN students s ON s.class_id = c.id AND s.school_id = $1 AND s.status = 'active'
        LEFT JOIN grades g ON g.student_id = s.id AND g.school_id = $1
        WHERE c.school_id = $1 AND s.status = 'active'
        GROUP BY c.name
        HAVING COUNT(g.id) > 0
        ORDER BY avg_grade DESC
      `, [schoolId]),

      // Conduct stats
      query(`
        SELECT
          record_type as type,
          COUNT(*) as count
        FROM conduct_records
        WHERE school_id = $1 AND created_at >= NOW() - INTERVAL '90 days'
        GROUP BY record_type
        ORDER BY count DESC
      `, [schoolId]),
    ])

    const gd  = gradeDistribution.rows[0] || {}
    const fi  = feeInsights.rows[0] || {}

    // ── Build AI-generated recommendations ─────────────────────────────────
    const insights: Array<{
      id: string; type: string; priority: string; title: string; body: string; metric?: string; icon: string
    }> = []

    const avgScore = parseFloat(gd.avg_score || 0)
    const failingPct = gd.total_students > 0 ? Math.round(parseInt(gd.failing) / parseInt(gd.total_students) * 100) : 0
    const collectionRate = parseFloat(fi.collection_rate || 100)
    const atRisk = atRiskStudents.rows.filter((s: any) => s.risk_level !== 'normal')

    // Grade-based insight
    if (failingPct > 20) {
      insights.push({ id: 'grade-fail', type: 'academic', priority: 'critical',
        title: 'نسبة رسوب مرتفعة',
        body: `${failingPct}% من الطلاب درجاتهم أقل من 50. يُنصح بمراجعة المناهج وتكثيف الدعم الأكاديمي.`,
        metric: `${failingPct}%`, icon: 'alert' })
    } else if (avgScore >= 80) {
      insights.push({ id: 'grade-good', type: 'academic', priority: 'positive',
        title: 'أداء أكاديمي ممتاز',
        body: `متوسط درجات الطلاب ${avgScore}% — نتيجة رائعة تعكس جهود الكادر التعليمي.`,
        metric: `${avgScore}%`, icon: 'star' })
    }

    // At-risk students
    const criticalCount = atRiskStudents.rows.filter((s: any) => s.risk_level === 'critical').length
    if (criticalCount > 0) {
      insights.push({ id: 'atrisk-critical', type: 'students', priority: 'critical',
        title: `${criticalCount} طالب في وضع حرج`,
        body: `هؤلاء الطلاب يعانون من تراجع أكاديمي حاد وغياب مرتفع. يحتاجون تدخلاً فورياً.`,
        metric: String(criticalCount), icon: 'users-alert' })
    } else if (atRisk.length > 0) {
      insights.push({ id: 'atrisk-warning', type: 'students', priority: 'warning',
        title: `${atRisk.length} طالب يحتاج متابعة`,
        body: `تسجيل ضعف في الأداء الأكاديمي أو الغياب المتكرر. يُنصح بالتواصل مع أولياء الأمور.`,
        metric: String(atRisk.length), icon: 'warning' })
    }

    // Fee collection
    if (collectionRate < 70) {
      insights.push({ id: 'fees-low', type: 'financial', priority: 'warning',
        title: 'نسبة تحصيل رسوم منخفضة',
        body: `تم تحصيل ${collectionRate}% فقط من الرسوم. المتأخرات = ${parseFloat(fi.outstanding || 0).toLocaleString()} ريال.`,
        metric: `${collectionRate}%`, icon: 'money' })
    } else if (collectionRate >= 90) {
      insights.push({ id: 'fees-good', type: 'financial', priority: 'positive',
        title: 'تحصيل ممتاز للرسوم',
        body: `نسبة تحصيل ${collectionRate}% — أداء مالي قوي يدعم استدامة المؤسسة.`,
        metric: `${collectionRate}%`, icon: 'money-check' })
    }

    // Attendance trend
    const attWeeks = attendanceTrend.rows
    if (attWeeks.length >= 2) {
      const last  = parseFloat(attWeeks[attWeeks.length - 1]?.rate || 0)
      const prev  = parseFloat(attWeeks[attWeeks.length - 2]?.rate || 0)
      const delta = last - prev
      if (delta < -5) {
        insights.push({ id: 'att-drop', type: 'attendance', priority: 'warning',
          title: 'تراجع في نسبة الحضور',
          body: `انخفضت نسبة الحضور بمقدار ${Math.abs(delta).toFixed(1)}% عن الأسبوع الماضي. تحقق من الأسباب.`,
          metric: `${last}%`, icon: 'attendance' })
      } else if (last >= 95) {
        insights.push({ id: 'att-great', type: 'attendance', priority: 'positive',
          title: 'نسبة حضور ممتازة',
          body: `نسبة حضور هذا الأسبوع ${last}% — مؤشر إيجابي على الالتزام المدرسي.`,
          metric: `${last}%`, icon: 'check' })
      }
    }

    // Subject weakness
    const weakSubjects = topSubjects.rows.filter((s: any) => parseFloat(s.avg_score) < 60)
    if (weakSubjects.length > 0) {
      insights.push({ id: 'subject-weak', type: 'academic', priority: 'warning',
        title: `${weakSubjects.length} مادة تحتاج تدخلاً`,
        body: `المواد التالية بحاجة لمراجعة: ${weakSubjects.map((s: any) => s.subject_name).join('، ')}`,
        metric: `${weakSubjects.length} مادة`, icon: 'book' })
    }

    // Absence day pattern
    const worstDay = absenteePatterns.rows[0]
    if (worstDay && parseFloat(worstDay.absence_rate) > 15) {
      const dayLabels: Record<string, string> = { '0': 'الأحد', '1': 'الاثنين', '2': 'الثلاثاء', '3': 'الأربعاء', '4': 'الخميس', '5': 'الجمعة', '6': 'السبت' }
      const dayName = dayLabels[String(worstDay.day_num)] || worstDay.day_name?.trim()
      insights.push({ id: 'absence-pattern', type: 'attendance', priority: 'info',
        title: `نمط غياب في ${dayName}`,
        body: `${dayName} يسجل أعلى نسبة غياب (${worstDay.absence_rate}%). قد يكون مرتبطًا بجدول الأنشطة.`,
        metric: `${worstDay.absence_rate}%`, icon: 'calendar' })
    }

    res.json({
      insights,
      data: {
        gradeDistribution: gradeDistribution.rows[0],
        atRiskStudents: atRiskStudents.rows,
        attendanceTrend: attendanceTrend.rows,
        feeInsights: feeInsights.rows[0],
        topSubjects: topSubjects.rows,
        absenteePatterns: absenteePatterns.rows,
        performanceByClass: performanceByClass.rows,
        conductStats: conductStats.rows,
      }
    })
  } catch (err) {
    log.error('AI insights failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
