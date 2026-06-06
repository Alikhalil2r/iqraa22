import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

export default function StudentSchedule() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-schedule'],
    queryFn: () => api.get('/student/schedule').then(r => r.data),
  })

  if (isLoading) return <div className="py-20 text-center text-gray-400">جاري التحميل...</div>

  const byDay: Record<number, any[]> = {}
  for (const row of data?.schedule || []) {
    const d = Number(row.day_of_week)
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(row)
  }

  return (
    <div className="space-y-4">
      <h2 className="font-black text-gray-800">الجدول الدراسي</h2>
      {DAYS.map((label, i) => (
        <div key={i} className="card">
          <h3 className="font-bold text-sm mb-2">{label}</h3>
          {(byDay[i] || []).length === 0 ? (
            <p className="text-xs text-gray-400">لا حصص</p>
          ) : (
            <ul className="space-y-1">
              {byDay[i].map((s: any, idx: number) => (
                <li key={idx} className="text-sm flex justify-between">
                  <span>{s.subject_name}</span>
                  <span className="text-gray-400 text-xs">{s.start_time}–{s.end_time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
