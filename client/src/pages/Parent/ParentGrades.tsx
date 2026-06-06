import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { useParentChild } from '../../context/ParentChildContext'
import { BookOpen, Award, TrendingUp, AlertTriangle, Printer } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

function gradeColor(pct: number) {
  if (pct >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-50', letter: 'A', hex: '#10b981' }
  if (pct >= 80) return { text: 'text-blue-600',    bg: 'bg-blue-50',    letter: 'B', hex: '#3b82f6' }
  if (pct >= 70) return { text: 'text-sky-600',     bg: 'bg-sky-50',     letter: 'C', hex: '#0ea5e9' }
  if (pct >= 60) return { text: 'text-amber-600',   bg: 'bg-amber-50',   letter: 'D', hex: '#f59e0b' }
  return           { text: 'text-red-600',           bg: 'bg-red-50',     letter: 'F', hex: '#ef4444' }
}

export default function ParentGrades() {
  const [term, setTerm] = useState('')
  const [year, setYear] = useState('2024-2025')
  const { theme } = useTheme()
  const { childParams, selectedChildId } = useParentChild()

  const { data, isLoading } = useQuery({
    queryKey: ['parent-grades', selectedChildId, term, year],
    queryFn: () => parentApi.grades({ ...childParams, term, academicYear: year }).then(r => r.data)
  })

  const { data: dashData } = useQuery({
    queryKey: ['parent-dash', selectedChildId],
    queryFn: () => parentApi.dashboard(childParams).then(r => r.data)
  })

  const grades = data?.grades || []
  const summary = data?.summary || {}
  const avg = parseFloat(summary.average || 0)
  const gc = gradeColor(avg)
  const childName = dashData?.child?.name || ''
  const className = dashData?.child?.class_name || ''

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return

    const schoolName = theme?.schoolName || 'المدرسة'
    const primaryColor = theme?.primaryColor || '#1e40af'
    const gradeLabel = avg >= 90 ? 'ممتاز' : avg >= 80 ? 'جيد جداً' : avg >= 70 ? 'جيد' : avg >= 60 ? 'مقبول' : avg >= 50 ? 'ضعيف' : 'راسب'
    const termLabel = term || 'جميع الفصول'
    const date = new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' })

    const rows = grades.map((g: any) => {
      const pct = parseFloat(g.percentage)
      const status = g.status === 'pass' ? 'ناجح' : 'راسب'
      const statusColor = g.status === 'pass' ? '#10b981' : '#ef4444'
      return `
        <tr>
          <td>${g.subject_name}</td>
          <td>${g.score || '—'}</td>
          <td>${g.max_score || 100}</td>
          <td style="font-weight:900;color:${pct>=75?'#10b981':pct>=60?'#f59e0b':'#ef4444'}">${pct.toFixed(1)}%</td>
          <td>${g.grade_letter || '—'}</td>
          <td style="color:${statusColor};font-weight:700">${status}</td>
        </tr>`
    }).join('')

    printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>كشف الدرجات - ${childName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Cairo',sans-serif; background:#f8fafc; color:#1e293b; padding:20px; }
    .page { max-width:720px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:${primaryColor}; color:white; padding:28px 32px; text-align:center; }
    .header h1 { font-size:22px; font-weight:900; margin-bottom:4px; }
    .header p { font-size:12px; opacity:.8; }
    .student-info { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding:20px 32px; background:#f8fafc; border-bottom:2px solid #e2e8f0; }
    .info-box { background:white; border-radius:10px; padding:12px 16px; border:1px solid #e2e8f0; }
    .info-box .label { font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:.5px; }
    .info-box .value { font-size:14px; font-weight:900; color:#1e293b; margin-top:4px; }
    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:20px 32px; }
    .stat { text-align:center; padding:12px; border-radius:10px; }
    .stat .num { font-size:24px; font-weight:900; }
    .stat .lbl { font-size:10px; color:#64748b; margin-top:2px; }
    table { width:100%; border-collapse:collapse; margin:0 32px; width:calc(100% - 64px); }
    th { background:${primaryColor}; color:white; padding:10px 14px; font-size:11px; font-weight:900; text-align:right; }
    td { padding:10px 14px; font-size:12px; border-bottom:1px solid #f1f5f9; text-align:right; }
    tr:nth-child(even) td { background:#f8fafc; }
    .footer { text-align:center; padding:20px; font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; margin-top:12px; }
    .avg-badge { display:inline-block; background:${gc.hex}22; color:${gc.hex}; font-size:28px; font-weight:900; padding:8px 20px; border-radius:12px; }
    @media print { body{background:white;padding:0;} .page{box-shadow:none;border-radius:0;} }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>${schoolName}</h1>
    <p>كشف الدرجات الدراسية — ${year}</p>
  </div>
  <div class="student-info">
    <div class="info-box"><div class="label">اسم الطالب</div><div class="value">${childName}</div></div>
    <div class="info-box"><div class="label">الفصل</div><div class="value">${className}</div></div>
    <div class="info-box"><div class="label">الفصل الدراسي</div><div class="value">${termLabel}</div></div>
  </div>
  <div class="summary">
    <div class="stat" style="background:#f0fdf4">
      <div class="num" style="color:#10b981">${summary.total || 0}</div>
      <div class="lbl">إجمالي المواد</div>
    </div>
    <div class="stat" style="background:#f0fdf4">
      <div class="num" style="color:#10b981">${summary.passed || 0}</div>
      <div class="lbl">مواد ناجحة</div>
    </div>
    <div class="stat" style="background:#fef2f2">
      <div class="num" style="color:#ef4444">${summary.failed || 0}</div>
      <div class="lbl">مواد راسبة</div>
    </div>
    <div class="stat" style="background:${gc.hex}11">
      <div class="avg-badge">${avg.toFixed(1)}%</div>
      <div class="lbl" style="margin-top:6px;font-weight:900;color:${gc.hex}">${gradeLabel}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>المادة</th><th>الدرجة</th><th>من</th><th>النسبة</th><th>التقدير</th><th>الحالة</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    تم إصدار هذا الكشف بتاريخ ${date} — ${schoolName}
  </div>
</div>
<script>window.onload=()=>{window.print();}</script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <BookOpen size={22} style={{ color: 'var(--color-accent)' }} />
            النتائج الدراسية
          </h1>
          <p className="text-sm text-gray-400 mt-1">درجات ونتائج جميع المواد</p>
        </div>
        {grades.length > 0 && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Printer size={15} className="text-blue-600" />
            طباعة الكشف
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input-field w-44 text-sm" value={term} onChange={e => setTerm(e.target.value)}>
          <option value="">كل الفصول</option>
          {['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث'].map(t =>
            <option key={t} value={t}>{t}</option>
          )}
        </select>
        <select className="input-field w-36 text-sm" value={year} onChange={e => setYear(e.target.value)}>
          {['2024-2025', '2023-2024', '2022-2023'].map(y =>
            <option key={y} value={y}>{y}</option>
          )}
        </select>
      </div>

      {/* Summary */}
      {grades.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`card text-center ${gc.bg}`}>
            <p className="text-xs text-gray-500 font-bold mb-2">المعدل العام</p>
            <p className={`text-4xl font-black ${gc.text}`}>{avg.toFixed(1)}%</p>
            <p className={`text-xl font-black ${gc.text} mt-1`}>{gc.letter}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-500 font-bold mb-2">إجمالي المواد</p>
            <p className="text-3xl font-black text-gray-800">{summary.total || 0}</p>
          </div>
          <div className="card text-center bg-green-50">
            <p className="text-xs text-gray-500 font-bold mb-2">المواد الناجحة</p>
            <p className="text-3xl font-black text-green-600">{summary.passed || 0}</p>
          </div>
          <div className="card text-center bg-red-50">
            <p className="text-xs text-gray-500 font-bold mb-2">المواد الراسبة</p>
            <p className="text-3xl font-black text-red-500">{summary.failed || 0}</p>
          </div>
        </div>
      )}

      {/* Grades list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
        </div>
      ) : grades.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-bold">لا توجد نتائج لهذه الفترة</p>
          <p className="text-sm mt-1">جرّب تغيير الفصل الدراسي أو السنة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grades.map((grade: any) => {
            const pct = parseFloat(grade.percentage)
            const gc2 = gradeColor(pct)
            return (
              <div key={grade.id} className="card flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${gc2.bg}`}>
                  <span className={`text-xl font-black ${gc2.text}`}>{grade.grade_letter}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-800">{grade.subject_name}</h4>
                  <p className="text-xs text-gray-400">{grade.term || '—'} — {grade.academic_year}</p>
                  {grade.teacher_notes && (
                    <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">{grade.teacher_notes}</p>
                  )}
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-2xl font-black ${gc2.text}`}>{pct.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400 text-center">{grade.score}/{grade.max_score}</p>
                </div>
                <div className="w-24 flex flex-col items-end gap-1.5">
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                  <span className={grade.status === 'pass' ? 'badge-success' : 'badge-danger'}>
                    {grade.status === 'pass' ? 'ناجح' : 'راسب'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
