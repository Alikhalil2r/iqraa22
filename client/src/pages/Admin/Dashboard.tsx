import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, feesApi as feesApiClient, eventsApi } from '../../api/client'
import PerformanceWidget from './PerformanceWidget'
import PlatformWidget from '../../components/PlatformWidget'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Link } from 'react-router-dom'
import {
  Users, GraduationCap, Bus, MessageSquare, UserCheck, TrendingUp,
  AlertCircle, Calendar, BarChart3, DollarSign, ArrowLeft, Clock,
  Newspaper, BookOpen, Star, RefreshCw, CheckCircle, Zap,
  CalendarDays, AlertTriangle, CreditCard, School, FileText, Target
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { DashboardSkeleton } from '../../components/Skeleton'


function StatCard({ icon: Icon, label, value, sub, color, href, badge }: any) {
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
      {badge && <span className="text-[10px] font-black px-2 py-1 rounded-xl" style={{background:color+'15',color}}>{badge}</span>}
      {href && !badge && <ArrowLeft size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

function AlertBanner({ icon: Icon, message, color, href }: any) {
  const content = (
    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{background:color+'08', borderColor:color+'30'}}>
      <Icon size={16} style={{color}} className="flex-shrink-0"/>
      <p className="text-sm flex-1 font-bold" style={{color}}>{message}</p>
      {href && <ArrowLeft size={14} style={{color}}/>}
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

export default function Dashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
    refetchInterval: 60000
  })
  const { data: activityData } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.recentActivity().then(r => r.data)
  })
  const { data: feesData } = useQuery({
    queryKey: ['fees-stats-dash'],
    queryFn: () => feesApiClient.list().then(r => r.data)
  })

  const locale = lang === 'ar' ? 'ar-OM' : 'en-US'
  const today = new Date().toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const hour = new Date().getHours()
  const greeting = hour < 12
    ? t('dash.greeting.morning')
    : hour < 17
    ? t('dash.greeting.afternoon')
    : t('dash.greeting.evening')

  const weeklyData = React.useMemo(() => {
    if (!data?.weeklyAttendance) return []
    const map: Record<string, any> = {}
    data.weeklyAttendance.forEach((r: any) => {
      if (!map[r.date]) map[r.date] = {
        date: new Date(r.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        students: 0, employees: 0, absent: 0
      }
      if (r.person_type === 'student'  && r.status === 'present') map[r.date].students  += parseInt(r.count)
      if (r.person_type === 'employee' && r.status === 'present') map[r.date].employees += parseInt(r.count)
      if (r.status === 'absent') map[r.date].absent += parseInt(r.count)
    })
    return Object.values(map).slice(-7)
  }, [data?.weeklyAttendance, locale])

  const attS = data?.todayAttendance?.students  || {}
  const attE = data?.todayAttendance?.employees || {}
  const sPres = attS.present || 0, sAbs = attS.absent || 0, sLate = attS.late || 0
  const ePres = attE.present || 0, eAbs = attE.absent || 0
  const sTotal = sPres + sAbs + sLate
  const sPct = sTotal > 0 ? Math.round(sPres / sTotal * 100) : 0

  const pieData = [
    { name: t('status.present'), value: sPres, color: '#10b981' },
    { name: t('status.absent'),  value: sAbs,  color: '#ef4444' },
    { name: t('status.late'),    value: sLate, color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const fStats = feesData?.stats || {}
  const fCollected = parseFloat(fStats.collected || 0)
  const fTotal = parseFloat(fStats.total_amount || 0)
  const fPct = fTotal > 0 ? Math.round(fCollected / fTotal * 100) : 0
  const fOverdue = parseInt(fStats.overdue_count || 0)
  const fPending = parseFloat(fStats.pending || 0)

  const alerts = React.useMemo(() => {
    const list: any[] = []
    if ((data?.messages?.unread || 0) > 0)
      list.push({
        icon: MessageSquare,
        message: lang === 'ar'
          ? `لديك ${data.messages.unread} رسائل غير مقروءة`
          : `You have ${data.messages.unread} unread messages`,
        color: '#ef4444',
        href: '/admin/messages'
      })
    if (sAbs > 5)
      list.push({
        icon: AlertTriangle,
        message: lang === 'ar'
          ? `${sAbs} طالب غائب اليوم — يستحق المتابعة`
          : `${sAbs} students absent today — follow up recommended`,
        color: '#f59e0b',
        href: '/admin/attendance'
      })
    if (fOverdue > 0)
      list.push({
        icon: AlertCircle,
        message: lang === 'ar'
          ? `${fOverdue} فاتورة رسوم متأخرة السداد`
          : `${fOverdue} overdue fee invoices`,
        color: '#f97316',
        href: '/admin/fees'
      })
    return list
  }, [data, sAbs, fOverdue, lang])

  const insights = React.useMemo(() => {
    const list: { type: 'success'|'warning'|'info', icon: any, text: string, sub: string, href: string }[] = []
    if (!data) return list
    if (sPct >= 90)
      list.push({
        type: 'success', icon: CheckCircle,
        text: lang === 'ar' ? `نسبة حضور ممتازة اليوم (${sPct}%)` : `Excellent attendance today (${sPct}%)`,
        sub:  lang === 'ar' ? 'استمر في متابعة الحضور اليومي' : 'Keep monitoring daily attendance',
        href: '/admin/attendance'
      })
    else if (sPct > 0 && sPct < 75)
      list.push({
        type: 'warning', icon: AlertTriangle,
        text: lang === 'ar' ? `حضور الطلاب منخفض اليوم (${sPct}%)` : `Low student attendance today (${sPct}%)`,
        sub:  lang === 'ar' ? 'راجع سجل الغياب واتخذ الإجراء المناسب' : 'Review absence records and take action',
        href: '/admin/attendance'
      })
    if (fTotal > 0 && fPct >= 85)
      list.push({
        type: 'success', icon: CheckCircle,
        text: lang === 'ar' ? `تحصيل الرسوم جيد جداً (${fPct}%)` : `Fee collection is excellent (${fPct}%)`,
        sub:  lang === 'ar'
          ? `تم جمع ${fCollected.toLocaleString()} OMR من أصل ${fTotal.toLocaleString()} OMR`
          : `Collected ${fCollected.toLocaleString()} OMR of ${fTotal.toLocaleString()} OMR`,
        href: '/admin/fees'
      })
    else if (fTotal > 0 && fPct < 50)
      list.push({
        type: 'warning', icon: AlertCircle,
        text: lang === 'ar' ? `نسبة تحصيل الرسوم منخفضة (${fPct}%)` : `Low fee collection rate (${fPct}%)`,
        sub:  lang === 'ar' ? 'راجع المتأخرين وأرسل لهم تذكيراً' : 'Review late payers and send reminders',
        href: '/admin/fees'
      })
    const totalStudents = data.students?.total || 0
    if (totalStudents > 0)
      list.push({
        type: 'info', icon: Star,
        text: lang === 'ar'
          ? `${totalStudents} طالب مسجل في المنظومة`
          : `${totalStudents} students enrolled in the system`,
        sub: lang === 'ar'
          ? `${data.employees?.total || 0} موظف — المنظومة تعمل بكامل طاقتها`
          : `${data.employees?.total || 0} staff — system running at full capacity`,
        href: '/admin/students'
      })
    return list.slice(0, 3)
  }, [data, sPct, fPct, fTotal, fCollected, lang])

  const quickActions = [
    { to: '/admin/students',   icon: GraduationCap, labelKey: 'nav.students',   color: '#6366f1' },
    { to: '/admin/attendance', icon: UserCheck,     labelKey: 'nav.attendance', color: '#10b981' },
    { to: '/admin/grades',     icon: BookOpen,      labelKey: 'nav.grades',     color: '#0ea5e9' },
    { to: '/admin/fees',       icon: DollarSign,    labelKey: 'nav.fees',       color: '#f59e0b' },
    { to: '/admin/messages',   icon: MessageSquare, labelKey: 'nav.messages',   color: '#ef4444' },
    { to: '/admin/reports',    icon: BarChart3,     labelKey: 'nav.reports',    color: '#8b5cf6' },
    { to: '/admin/teacher',    icon: School,        labelKey: 'nav.teacher',    color: '#0891b2' },
    { to: '/admin/id-cards',   icon: CreditCard,    labelKey: 'nav.idCards',    color: '#7c3aed' },
  ]

  const activityTypeLabel = (type: string) => {
    if (lang === 'ar') return type === 'news' ? 'خبر' : type === 'event' ? 'فعالية' : 'رسالة'
    return type === 'news' ? 'News' : type === 'event' ? 'Event' : 'Message'
  }

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">{greeting}، {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all"
            title={t('dash.refresh')}>
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-700">{t('dash.systemOnline')}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => <AlertBanner key={a.message} {...a} />)}
        </div>
      )}

      {/* Main Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label={t('dash.totalStudents')}  value={data?.students?.total  || 0} sub={t('dash.totalStudentsSub')} color="#6366f1" href="/admin/students" />
        <StatCard icon={Users}         label={t('dash.employees')}       value={data?.employees?.total || 0} sub={t('dash.employeesSub')}      color="#8b5cf6" href="/admin/employees" />
        <StatCard icon={Bus}           label={t('dash.buses')}           value={data?.buses?.total     || 0} sub={t('dash.busesSub')}          color="#3b82f6" href="/admin/buses" />
        <StatCard icon={DollarSign}    label={t('dash.salary')}          value={(data?.salary?.total   || 0).toLocaleString()} sub={t('dash.salarySub')} color="#f59e0b" />
      </div>

      {/* Main Stats Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card" style={{ borderTop: '3px solid #10b981' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">{t('dash.studentAttendance')}</p>
          <p className="text-3xl font-black text-green-600">{sPres}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {sAbs > 0  && <span className="badge-danger">{sAbs} {t('dash.absent')}</span>}
            {sLate > 0 && <span className="badge-warning">{sLate} {t('dash.late')}</span>}
          </div>
          {sTotal > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{t('dash.attendanceRate')}</span>
                <span className="font-black text-green-600">{sPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${sPct}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="card" style={{ borderTop: '3px solid #6366f1' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">{t('dash.employeeAttendance')}</p>
          <p className="text-3xl font-black text-indigo-600">{ePres}</p>
          <div className="flex gap-2 mt-2">
            {eAbs > 0 && <span className="badge-danger">{eAbs} {t('dash.absent')}</span>}
          </div>
          {(ePres + eAbs) > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{t('dash.attendanceRate')}</span>
                <span className="font-black text-indigo-600">{Math.round(ePres/(ePres+eAbs)*100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round(ePres/(ePres+eAbs)*100)}%` }} />
              </div>
            </div>
          )}
        </div>
        <Link to="/admin/messages" className="card hover:shadow-md transition-all" style={{ borderTop: '3px solid #ef4444' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">{t('dash.unreadMessages')}</p>
          <p className="text-3xl font-black text-red-500">{data?.messages?.unread || 0}</p>
          <p className="text-[10px] text-gray-400 mt-2">{t('dash.unreadMessagesSub')}</p>
          <div className="mt-3 flex items-center gap-1 text-red-400 text-xs font-bold">
            <MessageSquare size={12}/> {t('dash.viewMessages')}
          </div>
        </Link>
        <Link to="/admin/events" className="card hover:shadow-md transition-all" style={{ borderTop: '3px solid #0ea5e9' }}>
          <p className="text-xs text-gray-400 font-bold mb-1">{t('dash.upcomingEvents')}</p>
          <p className="text-3xl font-black text-sky-600">{data?.events?.upcoming || 0}</p>
          <p className="text-[10px] text-gray-400 mt-2">{t('dash.thisMonth')}</p>
          <div className="mt-3 flex items-center gap-1 text-sky-400 text-xs font-bold">
            <Calendar size={12}/> {t('dash.calendar')}
          </div>
        </Link>
      </div>

      {/* Fees Summary */}
      {fTotal > 0 && (
        <div className="card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-black text-gray-700 flex items-center gap-2">
              <DollarSign size={16} className="text-green-600"/>
              {t('dash.feeSummary')}
            </h3>
            <Link to="/admin/fees" className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1">
              {t('dash.feeDetails')}<ArrowLeft size={12}/>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { l: t('dash.feeTotal'),     v: fTotal.toLocaleString()     + ' OMR', c: '#6366f1' },
              { l: t('dash.feeCollected'), v: fCollected.toLocaleString() + ' OMR', c: '#10b981' },
              { l: t('dash.feePending'),   v: fPending.toLocaleString()   + ' OMR', c: '#f59e0b' },
            ].map(s => (
              <div key={s.l} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="font-black text-lg" style={{color:s.c}}>{s.v}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-bold">{t('dash.feeRate')}</span>
            <span className="text-sm font-black text-green-600">{fPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all" style={{width:`${fPct}%`}}/>
          </div>
          {fOverdue > 0 && (
            <div className="mt-3 flex items-center gap-2 text-orange-600 text-xs font-bold bg-orange-50 rounded-xl p-2">
              <AlertCircle size={13}/>
              {lang === 'ar' ? `${fOverdue} فاتورة متأخرة السداد` : `${fOverdue} overdue invoices`}
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 size={16} style={{ color: 'var(--color-primary)' }} />
            {t('dash.weeklyChart')}
          </h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
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
                <Area type="monotone" dataKey="students"  name={t('nav.students')}  stroke="#10b981" fill="url(#gs)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="employees" name={t('nav.employees')} stroke="#6366f1" fill="url(#ge)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-gray-400 gap-2">
              <BarChart3 size={32} className="text-gray-200" />
              <p className="text-sm">{lang === 'ar' ? 'لا توجد بيانات حضور بعد' : 'No attendance data yet'}</p>
              <Link to="/admin/attendance" className="text-xs text-blue-500 hover:underline">
                {lang === 'ar' ? 'تسجيل الحضور الآن' : 'Record attendance now'}
              </Link>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <UserCheck size={16} style={{ color: 'var(--color-primary)' }} />
            {t('dash.attendanceDist')}
          </h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
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
                    <span className="text-[10px] text-gray-400">({sTotal>0?Math.round(d.value/sTotal*100):0}%)</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-gray-400 gap-2">
              <AlertCircle size={28} className="text-gray-300" />
              <p className="text-xs text-center">
                {lang === 'ar' ? 'لم يُسجَّل الحضور اليوم بعد' : 'No attendance recorded today'}
              </p>
              <Link to="/admin/attendance" className="text-xs text-blue-500 hover:underline">
                {lang === 'ar' ? 'تسجيل الآن' : 'Record now'}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2">
          <Zap size={14} className="text-yellow-500"/>
          {t('dash.quickAccess')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map(q => (
            <Link key={q.to} to={q.to}
              className="card flex flex-col items-center gap-2 hover:shadow-md transition-all group !py-4 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: q.color + '15' }}>
                <q.icon size={20} style={{ color: q.color }} />
              </div>
              <span className="font-bold text-gray-700 text-xs">{t(q.labelKey)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform Business Widget */}
      <PlatformWidget />

      {/* Performance Widget */}
      <PerformanceWidget />

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="card" style={{ borderTop: '3px solid #a855f7' }}>
          <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2">
            <Star size={15} className="text-amber-500" />
            {t('dash.smartInsights')}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 mr-auto">AI</span>
          </h3>
          <div className="space-y-2.5">
            {insights.map((ins, i) => {
              const colors = {
                success: { bg:'#ecfdf5', border:'#6ee7b7', icon:'#10b981', text:'#065f46' },
                warning: { bg:'#fffbeb', border:'#fcd34d', icon:'#f59e0b', text:'#92400e' },
                info:    { bg:'#eff6ff', border:'#93c5fd', icon:'#3b82f6', text:'#1e3a8a' },
              }[ins.type]
              return (
                <Link key={ins.href} to={ins.href}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm group"
                  style={{ background: colors.bg, borderColor: colors.border }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.icon + '20' }}>
                    <ins.icon size={16} style={{ color: colors.icon }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black" style={{ color: colors.text }}>{ins.text}</p>
                    <p className="text-[10px] mt-0.5 opacity-70" style={{ color: colors.text }}>{ins.sub}</p>
                  </div>
                  <ArrowLeft size={14} className="flex-shrink-0 mt-1 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: colors.text }} />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {(activityData?.activity?.length || 0) > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--color-primary)' }} />
            {t('dash.recentActivity')}
          </h3>
          <div className="space-y-2">
            {activityData.activity.slice(0, 6).map((item: any, i: number) => {
              const isNews  = item.type === 'news'
              const isEvent = item.type === 'event'
              const bg        = isNews ? '#e0f2fe' : isEvent ? '#ede9fe' : '#fef3c7'
              const iconColor = isNews ? 'text-sky-600' : isEvent ? 'text-purple-600' : 'text-amber-600'
              return (
                <div key={item.title + item.created_at} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    {isNews  ? <Newspaper     size={15} className={iconColor} /> :
                     isEvent ? <Calendar      size={15} className={iconColor} /> :
                               <MessageSquare size={15} className={iconColor} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{item.title}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(item.created_at).toLocaleDateString(locale, {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: bg }}>
                    {activityTypeLabel(item.type)}
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
