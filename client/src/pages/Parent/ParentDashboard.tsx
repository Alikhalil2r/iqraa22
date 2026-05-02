import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarCheck, MessageSquare, Calendar, TrendingUp, AlertCircle, Bell, Bus } from 'lucide-react'

export default function ParentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['parent-dash'],
    queryFn: () => parentApi.dashboard().then(r => r.data),
    refetchInterval: 60000
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"/>
    </div>
  )

  if (!data?.child) return (
    <div className="text-center py-20">
      <AlertCircle size={48} className="mx-auto text-gray-300 mb-4"/>
      <h2 className="text-xl font-black text-gray-500">لم يتم ربط حسابك بطالب</h2>
      <p className="text-gray-400 mt-2">تواصل مع إدارة المدرسة لربط حسابك</p>
    </div>
  )

  const { child, stats } = data
  const attMonth = stats.attendanceMonth || {}
  const totalDays = (attMonth.present||0) + (attMonth.absent||0) + (attMonth.late||0)
  const attRate = totalDays > 0 ? Math.round((attMonth.present||0) / totalDays * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="rounded-3xl text-white p-6 relative overflow-hidden" style={{background:'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{background:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}/>
        <div className="relative">
          <p className="text-white/80 text-sm mb-1">مرحباً بك في بوابة أولياء الأمور</p>
          <h1 className="text-2xl font-black mb-4">متابعة {child.name}</h1>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5">
              <p className="text-white/70 text-[10px]">الفصل</p>
              <p className="font-black text-sm">{child.class_name}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5">
              <p className="text-white/70 text-[10px]">رقم الطالب</p>
              <p className="font-black text-sm">{child.student_number}</p>
            </div>
            {child.bus_number && (
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Bus size={14}/>
                <p className="font-black text-sm">حافلة {child.bus_number}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/parent/grades" className="card hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <BookOpen size={20} className="text-blue-600"/>
          </div>
          <p className="text-xs text-gray-400 font-bold mb-1">متوسط الدرجات</p>
          <p className="text-3xl font-black text-blue-600">{stats.gradeAvg}%</p>
          <p className="text-[10px] text-gray-400 mt-1">{stats.gradeCount} مادة</p>
        </Link>
        <Link to="/parent/attendance" className="card hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-green-50 group-hover:bg-green-100 transition-colors">
            <CalendarCheck size={20} className="text-green-600"/>
          </div>
          <p className="text-xs text-gray-400 font-bold mb-1">نسبة الحضور</p>
          <p className="text-3xl font-black text-green-600">{attRate}%</p>
          <p className="text-[10px] text-gray-400 mt-1">هذا الشهر</p>
        </Link>
        <Link to="/parent/messages" className="card hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-50 group-hover:bg-amber-100 transition-colors">
            <MessageSquare size={20} className="text-amber-600"/>
          </div>
          <p className="text-xs text-gray-400 font-bold mb-1">رسائل جديدة</p>
          <p className="text-3xl font-black text-amber-600">{stats.unreadMessages}</p>
          <p className="text-[10px] text-gray-400 mt-1">من الإدارة</p>
        </Link>
        <div className="card">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-purple-50">
            <Calendar size={20} className="text-purple-600"/>
          </div>
          <p className="text-xs text-gray-400 font-bold mb-1">حضور الشهر</p>
          <div className="flex gap-2 flex-wrap mt-1">
            <span className="badge-success">{attMonth.present||0} حاضر</span>
            <span className="badge-danger">{attMonth.absent||0} غائب</span>
            {(attMonth.late||0) > 0 && <span className="badge-warning">{attMonth.late} متأخر</span>}
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      {stats.upcomingEvents?.length > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><Calendar size={16} style={{color:'var(--color-primary)'}}/>فعاليات قادمة</h3>
          <div className="space-y-3">
            {stats.upcomingEvents.map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                  style={{background: ev.color || 'var(--color-primary)'}}>
                  {new Date(ev.start_date).getDate()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-sm">{ev.title}</p>
                  <p className="text-xs text-gray-400">{new Date(ev.start_date).toLocaleDateString('ar-OM', {weekday:'long', month:'long', day:'numeric'})}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {stats.notifications?.length > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><Bell size={16} style={{color:'var(--color-accent)'}}/>الإشعارات</h3>
          <div className="space-y-2">
            {stats.notifications.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl ${!n.is_read ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white flex-shrink-0">
                  <Bell size={14} className="text-amber-500"/>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('ar-OM')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
