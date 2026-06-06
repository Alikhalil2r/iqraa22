import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { useParentChild } from '../../context/ParentChildContext'
import { ClipboardList, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'لم يُسلَّم', color: 'text-amber-700', bg: 'bg-amber-50' },
  submitted: { label: 'مُسلَّم', color: 'text-blue-700', bg: 'bg-blue-50' },
  graded:    { label: 'مُقيَّم', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  late:      { label: 'متأخر', color: 'text-red-700', bg: 'bg-red-50' },
}

export default function ParentHomework() {
  const { childParams, selectedChildId } = useParentChild()
  const { data, isLoading } = useQuery({
    queryKey: ['parent-homework', selectedChildId],
    queryFn: () => parentApi.homework(childParams).then(r => r.data),
  })
  const items = data?.homework || []
  const stats = data?.stats || {}

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <ClipboardList size={22} style={{ color: 'var(--color-primary)' }} />
          الواجبات المنزلية
        </h1>
        <p className="text-sm text-gray-500 mt-1">متابعة واجبات طفلك وحالة التسليم</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'الإجمالي', value: stats.total || 0, color: 'text-gray-700' },
          { label: 'قيد الانتظار', value: stats.pending || 0, color: 'text-amber-600' },
          { label: 'مُسلَّمة', value: stats.submitted || 0, color: 'text-blue-600' },
          { label: 'مُقيَّمة', value: stats.graded || 0, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-bold">لا توجد واجبات حالياً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((hw: any) => {
            const st = STATUS[hw.status] || STATUS.pending
            const overdue = hw.status === 'pending' && hw.due_date && new Date(hw.due_date) < new Date()
            return (
              <div key={hw.id} className={`card border-r-4 ${overdue ? 'border-red-400' : 'border-blue-400'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{hw.subject_name || 'مادة'}</span>
                    <h3 className="font-black text-gray-800 mt-1">{hw.title}</h3>
                    {hw.teacher_name && <p className="text-[10px] text-gray-400 mt-0.5">👨‍🏫 {hw.teacher_name}</p>}
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${st.bg} ${st.color}`}>{st.label}</span>
                </div>
                {hw.description && <p className="text-sm text-gray-600 leading-relaxed mb-3">{hw.description}</p>}
                <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={12} /> التسليم: {hw.due_date ? new Date(hw.due_date).toLocaleDateString('ar-OM') : '—'}</span>
                  {hw.submission_date && <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> سُلِّم: {new Date(hw.submission_date).toLocaleDateString('ar-OM')}</span>}
                  {hw.score != null && <span className="font-black text-emerald-600">الدرجة: {hw.score}/{hw.max_score}</span>}
                  {overdue && <span className="flex items-center gap-1 text-red-600 font-bold"><AlertCircle size={12} /> متأخر</span>}
                </div>
                {hw.feedback && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">💬 {hw.feedback}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
