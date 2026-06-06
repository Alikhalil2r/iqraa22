import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('PDF')

router.use(authenticateToken)
router.use(requireRole('super_admin', 'admin', 'teacher', 'accountant', 'hr_manager'))

function buildReportHtml(title: string, rows: Record<string, unknown>[], columns: string[]): string {
  const headers = columns.map(c => `<th style="border:1px solid #ccc;padding:6px">${c}</th>`).join('')
  const body = rows.map(r =>
    `<tr>${columns.map(c => `<td style="border:1px solid #ccc;padding:6px">${String(r[c] ?? '')}</td>`).join('')}</tr>`
  ).join('')
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8">
    <title>${title}</title><style>body{font-family:Tahoma,sans-serif;padding:24px}h1{font-size:18px}</style></head>
    <body><h1>${title}</h1><p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-OM')}</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table>
    </body></html>`
}

router.get('/students', async (req: AuthRequest, res) => {
  try {
    const r = await query(
      `SELECT name, student_number, class_name, status, parent_name FROM students
       WHERE school_id=$1 AND status='active' ORDER BY name LIMIT 500`,
      [req.user!.schoolId]
    )
    const html = buildReportHtml('كشف الطلاب', r.rows, ['name', 'student_number', 'class_name', 'status', 'parent_name'])
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', 'inline; filename="students-report.html"')
    res.send(html)
  } catch (err) {
    log.error('PDF students failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/attendance', async (req: AuthRequest, res) => {
  try {
    const r = await query(
      `SELECT s.name, s.class_name, a.date, a.status
       FROM attendance a JOIN students s ON s.id=a.person_id
       WHERE a.school_id=$1 AND a.person_type='student' AND a.date >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY a.date DESC LIMIT 500`,
      [req.user!.schoolId]
    )
    const html = buildReportHtml('تقرير الحضور', r.rows, ['name', 'class_name', 'date', 'status'])
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    log.error('PDF attendance failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
