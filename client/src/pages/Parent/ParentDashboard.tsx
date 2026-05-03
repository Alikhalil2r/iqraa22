import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { Link } from 'react-router-dom'
import {
  BookOpen, CalendarCheck, MessageSquare, Calendar, AlertCircle,
  Bell, Bus, TrendingUp, Award, Clock, CheckCircle, XCircle,
  ChevronLeft, BarChart2, Star, ArrowUp, ArrowDown
} from 'lucide-react'

function MiniDonut({ present, absent, late, excused }: { present: number; absent: number; late: number; excused: number }) {
  const total = present + absent + late + excused || 1
  const pct = Math.round(present / total * 100)
  const radius = 28, stroke = 7, circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct / 100)
  const color = pct >= 90 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px]"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"/><span className="text-gray-500">{present} حاضر</span></div>
        <div className="flex items-center gap-1.5 text-[10px]"><span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/><span className="text-gray-500">{absent} غائب</span></div>
        {late > 0 && <div className="flex items-center gap-1.5 text-[10px]"><span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"/><span className="text-gray-500">{late} متأخر</span></div>}
      </div>
    </div>
  )
}

function GradeBar({ subject, grade, max = 100 }: { subject: string; grade: number; max?: number }) {
  const pct = Math.min(100, grade / max * 100)
  const color = grade >= 90 ? '#10b981' : grade >= 75 ? '#3b82f6' : grade >= 60 ? '#f59e0b' : '#ef4444'
  const label = grade >= 90 ? 'ممتاز' : grade >= 75 ? 'جيد جداً' : grade >= 60 ? 'جيد' : 'ضعيف'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 font-bold w-24 truncate flex-shrink-0">{subject}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-black w-10 text-right" style={{ color }}>{grade}%</span>
      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0" style={{ background: color + '15', color }}>{label}</span>
    </div>
  )
}

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
      <p className="text-gray-400 mt-2 text-sm">تواصل مع إدارة المدرسة لربط حسابك بملف الطالب</p>
    </div>
  )

  const { child, stats } = data
  const attMonth = stats.attendanceMonth || {}
  const totalDays = (attMonth.present || 0) + (attMonth.absent || 0) + (attMonth.late || 0) + (attMonth.excused || 0)
  const attRate = totalDays > 0 ? Math.round((attMonth.present || 0) / totalDays * 100) : 0

  const gradeAvg = parseFloat(stats.gradeAvg) || 0
  const gradeColor = gradeAvg >= 90 ? '#10b981' : gradeAvg >= 75 ? '#3b82f6' : gradeAvg >= 60 ? '#f59e0b' : '#ef4444'
  const gradeLabel = gradeAvg >= 90 ? 'ممتاز' : gradeAvg >= 75 ? 'جيد جداً' : gradeAvg >= 60 ? 'جيد' : 'ضعيف'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="rounded-3xl text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="p-6 relative">
          <p className="text-white/70 text-xs mb-1">بوابة أولياء الأمور</p>
          <h1 className="text-2xl font-black mb-4">متابعة الطالب: {child.name}</h1>
          <div className="flex flex-wrap gap-2.5">
            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5">
              <p className="text-white/60 text-[9px] uppercase tracking-wider">الفصل</p>
              <p className="font-black text-sm">{child.class_name || '—'}</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5">
              <p className="text-white/60 text-[9px] uppercase tracking-wider">رقم الطالب</p>
              <p className="font-black text-sm font-mono">{child.student_number || '—'}</p>
            </div>
            {child.bus_number && (
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Bus size={14} className="text-white/70" />
                <p className="font-black text-sm">حافلة {child.bus_number}</p>
              </div>
            )}
            <div className={`backdrop-blur rounded-2xl px-4 py-2.5 ${
              stats.todayStatus === 'present' ? 'bg-green-500/30' :
              stats.todayStatus === 'absent' ? 'bg-red-500/30' :
              stats.todayStatus === 'late' ? 'bg-amber-500/30' : 'bg-white/10'
            }`}>
              <p className="text-white/60 text-[9px] uppercase tracking-wider">حضور اليوم</p>
              <p className="font-black text-sm">
                {stats.todayStatus === 'present' ? '✅ حاضر' :
                 stats.todayStatus === 'absent' ? '❌ غائب' :
                 stats.todayStatus === 'late' ? '⏰ متأخر' : 'غير مسجل'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/parent/grades" className="card hover:shadow-md transition-all group border-b-2 border-blue-400 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold mb-0.5">متوسط الدرجات</p>
          <p className="text-3xl font-black" style={{ color: gradeColor }}>{gradeAvg || '—'}%</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md" style={{ background: gradeColor + '15', color: gradeColor }}>{gradeLabel}</span>
            <span className="text-[9px] text-gray-400">{stats.gradeCount} مادة</span>
          </div>
        </Link>
        <Link to="/parent/attendance" className="card hover:shadow-md transition-all group border-b-2 border-green-400 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-green-50 group-hover:bg-green-100 transition-colors">
            <CalendarCheck size={20} className="text-green-600" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold mb-0.5">نسبة الحضور</p>
          <p className={`text-3xl font-black ${attRate >= 90 ? 'text-green-600' : attRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{attRate}%</p>
          <p className="text-[9px] text-gray-400 mt-1">{totalDays} يوم مسجل هذا الشهر</p>
        </Link>
        <Link to="/parent/messages" className="card hover:shadow-md transition-all group border-b-2 border-amber-400 hover:-translate-y-0.5 relative">
          {stats.unreadMessages > 0 && (
            <span className="absolute top-3 left-3 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {stats.unreadMessages}
            </span>
          )}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-amber-50 group-hover:bg-amber-100 transition-colors">
            <MessageSquare size={20} className="text-amber-600" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold mb-0.5">الرسائل</p>
          <p className="text-3xl font-black text-amber-600">{stats.unreadMessages || 0}</p>
          <p className="text-[9px] text-gray-400 mt-1">{stats.unreadMessages > 0 ? 'رسائل غير مقروءة' : 'لا توجد رسائل جديدة'}</p>
        </Link>
        <Link to="/parent/schedule" className="card hover:shadow-md transition-all group border-b-2 border-purple-400 hover:-translate-y-0.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-purple-50 group-hover:bg-purple-100 transition-colors">
            <Clock size={20} className="text-purple-600" />
          </div>
          <p className="text-[10px] text-gray-400 font-bold mb-0.5">الجدول الدراسي</p>
          <p className="text-3xl font-black text-purple-600">
            {new Date().toLocaleDateString('ar-OM', { weekday: 'short' })}
          </p>
          <p className="text-[9px] text-gray-400 mt-1">اضغط لعرض الجدول</p>
        </Link>
      </div>

      {/* Two-column detail view */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Attendance breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-700 flex items-center gap-2">
              <BarChart2 size={16} style={{ color: 'var(--color-primary)' }} />
              الحضور هذا الشهر
            </h3>
            <Link to="/parent/attendance" className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
              التفاصيل <ChevronLeft size={12} />
            </Link>
          </div>
          <MiniDonut
            present={attMonth.present || 0}
            absent={attMonth.absent || 0}
            late={attMonth.late || 0}
            excused={attMonth.excused || 0}
          />
          {attRate < 80 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-red-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={13} />
                نسبة الحضور منخفضة — يُرجى التواصل مع الإدارة
              </p>
            </div>
          )}
          {attRate >= 90 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-2xl">
              <p className="text-green-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle size={13} />
                ممتاز! الطالب منتظم في حضوره
              </p>
            </div>
          )}
        </div>

        {/* Grades breakdown */}
        {stats.recentGrades?.length > 0 ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-700 flex items-center gap-2">
                <Award size={16} style={{ color: 'var(--color-accent)' }} />
                آخر الدرجات
              </h3>
              <Link to="/parent/grades" className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
                عرض الكل <ChevronLeft size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentGrades.slice(0, 5).map((g: any, i: number) => (
                <GradeBar key={g.id ?? g.subject_name ?? i} subject={g.subject_name || g.subject} grade={Math.round(parseFloat(g.score || g.grade) || 0)} max={parseFloat(g.max_score) || 100} />
              ))}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-700 flex items-center gap-2">
                <TrendingUp size={16} style={{ color: 'var(--color-accent)' }} />
                ملخص الأداء
              </h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'متوسط الدرجات', value: `${gradeAvg}%`, color: gradeColor, icon: <BookOpen size={14} /> },
                { label: 'حضور الشهر', value: `${attRate}%`, color: attRate >= 90 ? '#10b981' : attRate >= 70 ? '#f59e0b' : '#ef4444', icon: <CalendarCheck size={14} /> },
                { label: 'عدد المواد', value: `${stats.gradeCount || 0} مادة`, color: '#6366f1', icon: <Star size={14} /> },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '15', color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-bold">{item.label}</p>
                  </div>
                  <p className="font-black text-sm" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming events */}
      {stats.upcomingEvents?.length > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            فعاليات قادمة
            <span className="text-[10px] font-black px-2 py-0.5 rounded-xl bg-emerald-50 text-emerald-600">{stats.upcomingEvents.length}</span>
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {stats.upcomingEvents.map((ev: any) => {
              const d = new Date(ev.start_date)
              const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return (
                <div key={ev.id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm"
                    style={{ background: ev.color || 'var(--color-primary)' }}>
                    <span className="text-[9px] opacity-80">{d.toLocaleDateString('ar-OM', { month: 'short' })}</span>
                    <span className="text-lg leading-tight">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{ev.title}</p>
                    <p className="text-[10px] text-gray-400">{d.toLocaleDateString('ar-OM', { weekday: 'long' })}</p>
                  </div>
                  {diff <= 7 && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 ${diff <= 1 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {diff === 0 ? 'اليوم' : diff === 1 ? 'غداً' : `${diff} أيام`}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notifications */}
      {stats.notifications?.length > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <Bell size={16} style={{ color: 'var(--color-accent)' }} />
            الإشعارات
            {stats.notifications.filter((n: any) => !n.is_read).length > 0 && (
              <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-xl font-black">
                {stats.notifications.filter((n: any) => !n.is_read).length} جديد
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {stats.notifications.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-3 p-3.5 rounded-2xl transition-all ${!n.is_read ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-blue-100' : 'bg-white border border-gray-100'}`}>
                  <Bell size={14} className={!n.is_read ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800">{n.title}</p>
                  {n.body && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('ar-OM', { weekday: 'short', month: 'long', day: 'numeric' })}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: '/parent/grades', label: 'النتائج والدرجات', icon: <BookOpen size={18} />, color: '#3b82f6', bg: 'bg-blue-50' },
          { to: '/parent/attendance', label: 'سجل الحضور', icon: <CalendarCheck size={18} />, color: '#10b981', bg: 'bg-green-50' },
          { to: '/parent/messages', label: 'التواصل مع الإدارة', icon: <MessageSquare size={18} />, color: '#f59e0b', bg: 'bg-amber-50' },
          { to: '/parent/schedule', label: 'الجدول الأسبوعي', icon: <Clock size={18} />, color: '#8b5cf6', bg: 'bg-purple-50' },
        ].map(l => (
          <Link key={l.to} to={l.to}
            className={`${l.bg} rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 group`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform" style={{ color: l.color }}>
              {l.icon}
            </div>
            <span className="font-bold text-sm text-gray-700">{l.label}</span>
            <ChevronLeft size={14} className="mr-auto text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
