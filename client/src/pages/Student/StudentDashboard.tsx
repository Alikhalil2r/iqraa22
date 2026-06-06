import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { Link } from 'react-router-dom'

export default function StudentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => api.get('/student/dashboard').then(r => r.data),
  })

  if (isLoading) return <div className="py-20 text-center text-gray-400">جاري التحميل...</div>
  if (!data?.child) return <div className="card text-center py-12 text-gray-500">لا يوجد طالب مرتبط بهذا الحساب</div>

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-black text-gray-800">{data.child.name}</h2>
        <p className="text-sm text-gray-500">{data.child.class_name} — {data.child.student_number}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-black text-emerald-600">{data.stats?.avgGrade || '0'}</p>
          <p className="text-xs text-gray-400">متوسط الدرجات</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-black text-amber-600">{data.stats?.pendingHomework || 0}</p>
          <p className="text-xs text-gray-400">واجبات معلقة</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Link to="/student/grades" className="btn-primary flex-1 text-center text-sm">الدرجات</Link>
        <Link to="/student/homework" className="btn-secondary flex-1 text-center text-sm">الواجبات</Link>
      </div>
    </div>
  )
}
