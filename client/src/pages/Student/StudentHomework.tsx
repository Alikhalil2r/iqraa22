import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

export default function StudentHomework() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-homework'],
    queryFn: () => api.get('/student/homework').then(r => r.data),
  })

  if (isLoading) return <div className="py-20 text-center text-gray-400">جاري التحميل...</div>

  return (
    <div className="space-y-3">
      <h2 className="font-black text-gray-800">الواجبات</h2>
      {(data?.homework || []).map((h: any) => (
        <div key={h.id} className="card">
          <p className="font-bold">{h.title}</p>
          <p className="text-xs text-gray-400">{h.subject_name} — استحقاق: {h.due_date ? new Date(h.due_date).toLocaleDateString('ar-OM') : '—'}</p>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${h.submission_status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {h.submission_status === 'submitted' ? 'مُسلّم' : 'معلق'}
          </span>
        </div>
      ))}
    </div>
  )
}
