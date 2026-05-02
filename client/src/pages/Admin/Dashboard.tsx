import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  Users, GraduationCap, Bus, MessageSquare, UserCheck, TrendingUp,
  AlertCircle, Calendar, BarChart3, DollarSign, ArrowLeft, Clock
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function StatCard({ icon: Icon, label, value, sub, color, href }: any) {
  const content = (
    <div className="stat-card hover:shadow-md transition-all cursor-pointer group">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:color+'20'}}>
        <Icon size={22} style={{color}}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {href && <ArrowLeft size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors"/>}
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
    refetchInterval: 60000
  })
  const { data: activityData } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.recentActivity().then(r => r.data)
  })

  const today = new Date().toLocaleDateString('ar-OM', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  // Prepare weekly chart data
  const weeklyData = React.useMemo(() => {
    if (!data?.weeklyAttendance) return []
    const map: Record<string, any> = {}
    data.weeklyAttendance.forEach((r: any) => {
      if (!map[r.date]) map[r.date] = { date: new Date(r.date).toLocaleDateString('ar', {day:'numeric',month:'short'}), students: 0, employees: 0 }
      if (r.person_type === 'student' && r.status === 'present') map[r.date].students += parseInt(r.count)
      if (r.person_type === 'employee' && r.status === 'present') map[r.date].employees += parseInt(r.count)
    })
    return Object.values(map).slice(-7)
  }, [data?.weeklyAttendance])

  const attS = data?.todayAttendance?.students || {}
  const attE = data?.todayAttendance?.employees || {}
  const sPres = attS.present || 0, sAbs = attS.absent || 0, sLate = attS.late || 0
  const ePres = attE.present || 0, eAbs = attE.absent || 0

  const pieData = [
    { name: 'حاضر', value: sPres, color: '#10b981' },
    { name: 'غائب', value: sAbs, color: '#ef4444' },
    { name: 'متأخر', value: sLate, color: '#f59e0b' },
  ]

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">لوحة المعلومات</h1>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
          <span className="text-xs font-bold text-green-700">النظام يعمل بكفاءة</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="إجمالي الطلاب" value={data?.students?.total || 0} sub="طالب مسجل" color="#6366f1" href="/admin/students"/>
        <StatCard icon={Users} label="الموظفون النشطون" value={data?.employees?.total || 0} sub="موظف" color="#8b5cf6" href="/admin/employees"/>
        <StatCard icon={Bus} label="الحافلات" value={data?.buses?.total || 0} sub="حافلة نشطة" color="#3b82f6" href="/admin/buses"/>
        <StatCard icon={DollarSign} label="إجمالي الرواتب" value={(data?.salary?.total || 0).toLocaleString()} sub="ريال عُماني شهرياً" color="#f59e0b"/>
      </div>

      {/* Today */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card" style={{borderTop:'3px solid #10b981'}}>
          <p className="text-xs text-gray-400 font-bold mb-1">حضور الطلاب اليوم</p>
          <p className="text-3xl font-black text-green-600">{sPres}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge-danger">{sAbs} غائب</span>
            <span className="badge-warning">{sLate} متأخر</span>
          </div>
        </div>
        <div className="card" style={{borderTop:'3px solid #6366f1'}}>
          <p className="text-xs text-gray-400 font-bold mb-1">حضور الموظفين اليوم</p>
          <p className="text-3xl font-black text-indigo-600">{ePres}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge-danger">{eAbs} غائب</span>
          </div>
        </div>
        <Link to="/admin/messages" className="card hover:shadow-md transition-all" style={{borderTop:'3px solid #ef4444'}}>
          <p className="text-xs text-gray-400 font-bold mb-1">رسائل غير مقروءة</p>
          <p className="text-3xl font-black text-red-500">{data?.messages?.unread || 0}</p>
          <p className="text-[10px] text-gray-400 mt-2">رسالة من أولياء الأمور</p>
        </Link>
        <Link to="/admin/events" className="card hover:shadow-md transition-all" style={{borderTop:'3px solid #0ea5e9'}}>
          <p className="text-xs text-gray-400 font-bold mb-1">فعاليات قادمة</p>
          <p className="text-3xl font-black text-sky-600">{data?.events?.upcoming || 0}</p>
          <p className="text-[10px] text-gray-400 mt-2">هذا الشهر</p>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} style={{color:'var(--color-primary)'}}/>
            حضور الأسبوع الماضي
          </h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fontSize:10, fontFamily:'Cairo'}}/>
                <YAxis tick={{fontSize:10}}/>
                <Tooltip contentStyle={{fontFamily:'Cairo', fontSize:12, borderRadius:12}}/>
                <Area type="monotone" dataKey="students" name="الطلاب" stroke="#10b981" fill="url(#gs)" strokeWidth={2}/>
                <Area type="monotone" dataKey="employees" name="الموظفون" stroke="#6366f1" fill="url(#ge)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400">
              <p className="text-sm">لا توجد بيانات حضور حتى الآن</p>
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <UserCheck size={16} style={{color:'var(--color-primary)'}}/>
            توزيع حضور الطلاب
          </h3>
          {(sPres + sAbs + sLate) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{fontFamily:'Cairo', fontSize:12, borderRadius:12}}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:d.color}}/>
                    <span className="text-xs text-gray-600 flex-1">{d.name}</span>
                    <span className="text-xs font-black text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-gray-400 gap-2">
              <AlertCircle size={24}/>
              <p className="text-xs">لم يُسجَّل الحضور اليوم بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {activityData?.activity?.length > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={16} style={{color:'var(--color-primary)'}}/>
            آخر الأنشطة
          </h3>
          <div className="space-y-3">
            {activityData.activity.slice(0,5).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{background: item.type==='news'?'#e0f2fe':item.type==='event'?'#ede9fe':'#fef3c7'}}>
                  {item.type === 'news' ? <Newspaper size={14} className="text-sky-600"/> :
                   item.type === 'event' ? <Calendar size={14} className="text-purple-600"/> :
                   <MessageSquare size={14} className="text-amber-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString('ar-OM')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Newspaper({ size, className }: any) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
}
