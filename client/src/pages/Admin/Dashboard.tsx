import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  Users, GraduationCap, Bus, MessageSquare, UserCheck, TrendingUp,
  AlertCircle, Calendar, BarChart3, DollarSign, ArrowLeft, Clock,
  Newspaper, BookOpen, Star, RefreshCw
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { DashboardSkeleton } from '../../components/Skeleton'

function StatCard({ icon: Icon, label, value, sub, color, href }: any) {
  const content = (
    <div className="stat-card hover:shadow-lg transition-all cursor-pointer group border-r-4" style={{ borderRightColor: color }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {href && <ArrowLeft size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
    refetchInterval: 60000
  })
  const { data: activityData } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.recentActivity().then(r => r.data)
  })

  const today = new Date().toLocaleDateString('ar-OM', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const weeklyData = React.useMemo(() => {
    if (!data?.weeklyAttendance) return []
    const map: Record<string, any> = {}
    data.weeklyAttendance.forEach((r: any) => {
      if (!map[r.date]) map[r.date] = {
        date: new Date(r.date).toLocaleDateString('ar', { day: 'numeric', month: 'short' }),
        students: 0, employees: 0
      }
      if (r.person_type === 'student'  && r.status === 'present') map[r.date].students  += parseInt(r.count)
      if (r.person_type === 'employee' && r.status === 'present') map[r.date].employees += parseInt(r.count)
    })
    return Object.values(map).slice(-7)
  }, [data?.weeklyAttendance])

  const attS = data?.todayAttendance?.students  || {}
  const attE = data?.todayAttendance?.employees || {}
  const sPres = attS.present || 0, sAbs = attS.absent || 0, sLate = attS.late || 0
  const ePres = attE.present || 0, eAbs = attE.absent || 0

  const pieData = [
    { name: 'حاضر',  value: sPres, color: '#10b981' },
    { name: 'غائب',  value: sAbs,  color: '#ef4444' },
    { name: 'متأخر', value: sLate, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">لوحة المعلومات</h1>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all"
            title="تحديث البيانات"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-700">النظام يعمل</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="إجمالي الطلاب"      value={data?.students?.total  || 0} sub="طالب مسجل"          color="#6366f1" href="/admin/students" />
        <StatCard icon={Users}         label="الموظفون النشطون"    value={data?.employees?.total || 0} sub="موظف"               color="#8b5cf6" href="/admin/employees" />
        <StatCard icon={Bus}           label="الحافلات"            value={data?.buses?.total     || 0} sub="حافلة نشطة"         color="#3b82f6" href="/admin/buses" />
        <StatCard icon={DollarSign}    label="إجمالي الرواتب"      value={(data?.salary?.total   || 0).toLocaleString()} sub="ريال شهرياً" color="#f59e0b" />
      </div>

      {/* Today's attendance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card group hover:shadow-md transition-all" style={{ borderTop: '3px solid #10b981' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">حضور الطلاب اليوم</p>
          <p className="text-3xl font-black text-green-600">{sPres}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="badge-danger">{sAbs} غائب</span>
            <span className="badge-warning">{sLate} متأخر</span>
          </div>
          {(sPres + sAbs + sLate) > 0 && (
            <div className="mt-2 progress-bar">
              <div className="progress-bar-fill bg-green-500" style={{ width: `${(sPres / (sPres + sAbs + sLate)) * 100}%` }} />
            </div>
          )}
        </div>
        <div className="card group hover:shadow-md transition-all" style={{ borderTop: '3px solid #6366f1' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">حضور الموظفين اليوم</p>
          <p className="text-3xl font-black text-indigo-600">{ePres}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge-danger">{eAbs} غائب</span>
          </div>
        </div>
        <Link to="/admin/messages" className="card hover:shadow-md transition-all" style={{ borderTop: '3px solid #ef4444' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">رسائل غير مقروءة</p>
          <p className="text-3xl font-black text-red-500">{data?.messages?.unread || 0}</p>
          <p className="text-[10px] text-gray-400 mt-2">رسالة من أولياء الأمور</p>
        </Link>
        <Link to="/admin/events" className="card hover:shadow-md transition-all" style={{ borderTop: '3px solid #0ea5e9' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">فعاليات قادمة</p>
          <p className="text-3xl font-black text-sky-600">{data?.events?.upcoming || 0}</p>
          <p className="text-[10px] text-gray-400 mt-2">هذا الشهر</p>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} style={{ color: 'var(--color-primary)' }} />
            حضور آخر 7 أيام
          </h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="students"  name="الطلاب"    stroke="#10b981" fill="url(#gs)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="employees" name="الموظفون"  stroke="#6366f1" fill="url(#ge)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-gray-400 gap-2">
              <BarChart3 size={32} className="text-gray-200" />
              <p className="text-sm">لا توجد بيانات حضور بعد</p>
              <Link to="/admin/attendance" className="text-xs text-blue-500 hover:underline">تسجيل الحضور</Link>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <UserCheck size={16} style={{ color: 'var(--color-primary)' }} />
            توزيع الحضور اليوم
          </h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 12, border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                    <span className="text-xs font-black text-gray-800">{d.value}</span>
                    <span className="text-[10px] text-gray-400">
                      ({Math.round(d.value / (sPres + sAbs + sLate) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-gray-400 gap-2">
              <AlertCircle size={28} className="text-gray-300" />
              <p className="text-xs text-center">لم يُسجَّل الحضور اليوم بعد</p>
              <Link to="/admin/attendance" className="text-xs text-blue-500 hover:underline">تسجيل الآن</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/admin/students',  icon: GraduationCap, label: 'إضافة طالب',    color: '#6366f1' },
          { to: '/admin/attendance', icon: UserCheck,    label: 'تسجيل الحضور',  color: '#10b981' },
          { to: '/admin/grades',    icon: BookOpen,      label: 'رصد الدرجات',   color: '#0ea5e9' },
          { to: '/admin/reports',   icon: TrendingUp,    label: 'عرض التقارير',  color: '#f59e0b' },
        ].map(q => (
          <Link key={q.to} to={q.to}
            className="card flex items-center gap-3 hover:shadow-md transition-all group !py-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: q.color + '18' }}>
              <q.icon size={18} style={{ color: q.color }} />
            </div>
            <span className="font-bold text-gray-700 text-sm">{q.label}</span>
            <ArrowLeft size={14} className="mr-auto text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      {(activityData?.activity?.length || 0) > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--color-primary)' }} />
            آخر الأنشطة
          </h3>
          <div className="space-y-2">
            {activityData.activity.slice(0, 6).map((item: any, i: number) => {
              const isNews    = item.type === 'news'
              const isEvent   = item.type === 'event'
              const bg        = isNews ? '#e0f2fe' : isEvent ? '#ede9fe' : '#fef3c7'
              const iconColor = isNews ? 'text-sky-600'    : isEvent ? 'text-purple-600' : 'text-amber-600'
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    {isNews  ? <Newspaper size={15} className={iconColor} /> :
                     isEvent ? <Calendar  size={15} className={iconColor} /> :
                               <MessageSquare size={15} className={iconColor} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString('ar-OM')}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full`} style={{ background: bg }}>
                    {isNews ? 'خبر' : isEvent ? 'فعالية' : 'رسالة'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
