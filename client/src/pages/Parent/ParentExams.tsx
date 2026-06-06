import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { useParentChild } from '../../context/ParentChildContext'
import { FileText, Download, Calendar } from 'lucide-react'

export default function ParentExams() {
  const { childParams } = useParentChild()
  const { data, isLoading } = useQuery({
    queryKey: ['parent-exams', childParams],
    queryFn: () => parentApi.exams(childParams).then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
    </div>
  )

  const exams = data?.exams || []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <FileText size={22} style={{ color: 'var(--color-primary)' }} />
          الاختبارات والنتائج الرسمية
        </h1>
        <p className="text-sm text-gray-500 mt-1">جدول الاختبارات وكشوف النتائج</p>
      </div>

      {exams.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-bold">لا توجد اختبارات مسجلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam: any) => (
            <div key={exam.id} className="card">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-black text-gray-800">{exam.title || exam.exam_type}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('ar-OM') : '—'}
                    {exam.subject_name && ` — ${exam.subject_name}`}
                  </p>
                </div>
                {exam.status && (
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-blue-50 text-blue-700">{exam.status}</span>
                )}
              </div>
              {exam.max_score != null && (
                <p className="text-sm mt-2 text-gray-600">
                  الدرجة: <strong>{exam.score ?? '—'}</strong> / {exam.max_score}
                </p>
              )}
              <button
                type="button"
                className="mt-3 text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                onClick={() => window.print()}
              >
                <Download size={14} /> طباعة كشف رسمي
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
