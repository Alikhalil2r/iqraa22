import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'

export default function StudentGrades() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student/grades').then(r => r.data),
  })

  if (isLoading) return <div className="py-20 text-center text-gray-400">جاري التحميل...</div>

  return (
    <div className="space-y-3">
      <h2 className="font-black text-gray-800">الدرجات</h2>
      {(data?.grades || []).length === 0 ? (
        <p className="text-gray-500 text-sm">لا توجد درجات</p>
      ) : (
        data.grades.map((g: any) => (
          <div key={g.id} className="card flex justify-between items-center">
            <div>
              <p className="font-bold">{g.subject_name}</p>
              <p className="text-xs text-gray-400">{g.term} — {g.academic_year}</p>
            </div>
            <span className="font-black text-emerald-600">{g.percentage}%</span>
          </div>
        ))
      )}
    </div>
  )
}
