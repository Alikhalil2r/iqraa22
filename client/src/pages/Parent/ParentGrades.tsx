import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { BookOpen, Award, TrendingUp, AlertTriangle, Download } from 'lucide-react'

function gradeColor(pct: number) {
  if (pct >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-50', letter: 'A' }
  if (pct >= 80) return { text: 'text-blue-600', bg: 'bg-blue-50', letter: 'B' }
  if (pct >= 70) return { text: 'text-sky-600', bg: 'bg-sky-50', letter: 'C' }
  if (pct >= 60) return { text: 'text-amber-600', bg: 'bg-amber-50', letter: 'D' }
  return { text: 'text-red-600', bg: 'bg-red-50', letter: 'F' }
}

export default function ParentGrades() {
  const [term, setTerm] = useState('')
  const [year, setYear] = useState('2024-2025')

  const { data, isLoading } = useQuery({
    queryKey: ['parent-grades', term, year],
    queryFn: () => parentApi.grades({ term, academicYear: year }).then(r => r.data)
  })

  const grades = data?.grades || []
  const summary = data?.summary || {}
  const avg = parseFloat(summary.average || 0)
  const gc = gradeColor(avg)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><BookOpen size={22}/>النتائج الدراسية</h1>
          <p className="text-sm text-gray-400 mt-1">درجات ونتائج جميع المواد</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input-field w-44 text-sm" value={term} onChange={e=>setTerm(e.target.value)}>
          <option value="">كل الفصول</option>
          {['الفصل الأول','الفصل الثاني','الفصل الثالث'].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input-field w-36 text-sm" value={year} onChange={e=>setYear(e.target.value)}>
          {['2024-2025','2023-2024','2022-2023'].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary */}
      {grades.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`card text-center ${gc.bg}`}>
            <p className="text-xs text-gray-500 font-bold mb-2">المعدل العام</p>
            <p className={`text-4xl font-black ${gc.text}`}>{avg.toFixed(1)}%</p>
            <p className={`text-2xl font-black ${gc.text} mt-1`}>{gc.letter}</p>
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
        <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"/></div>
      ) : grades.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-200"/>
          <p className="font-bold">لا توجد نتائج لهذه الفترة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grades.map((grade: any) => {
            const pct = parseFloat(grade.percentage)
            const gc = gradeColor(pct)
            return (
              <div key={grade.id} className="card flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${gc.bg}`}>
                  <span className={`text-xl font-black ${gc.text}`}>{grade.grade_letter}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-800">{grade.subject_name}</h4>
                  <p className="text-xs text-gray-400">{grade.term} — {grade.academic_year}</p>
                  {grade.teacher_notes && <p className="text-xs text-gray-500 mt-1 italic">{grade.teacher_notes}</p>}
                </div>
                <div className="text-left flex-shrink-0">
                  <p className={`text-2xl font-black ${gc.text}`}>{pct.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400 text-center">{grade.score}/{grade.max_score}</p>
                </div>
                <div className="w-24 flex flex-col items-end gap-1">
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background: pct>=80?'#10b981':pct>=60?'#f59e0b':'#ef4444'}}/>
                  </div>
                  <span className={grade.status==='pass'?'badge-success':'badge-danger'}>{grade.status==='pass'?'ناجح':'راسب'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
