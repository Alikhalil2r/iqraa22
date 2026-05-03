import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid
} from 'recharts'
import {
  TrendingUp, DollarSign, Users, Inbox, Target, Zap,
  Clock, Award, ArrowUp, ArrowDown, BarChart3
} from 'lucide-react'

const SERVICE_COLORS: Record<string, string> = {
  web: '#8b5cf6', mobile: '#06b6d4', design: '#f59e0b',
  ai: '#10b981', cloud: '#3b82f6', marketing: '#ec4899', other: '#6b7280'
}
const SERVICE_LABELS: Record<string, string> = {
  web: 'مواقع ويب', mobile: 'تطبيقات جوال', design: 'تصميم UI/UX',
  ai: 'ذكاء اصطناعي', cloud: 'حوسبة سحابية', marketing: 'تسويق رقمي', other: 'أخرى'
}
const STATUS_COLORS: Record<string, string> = {
  new: '#8b5cf6', in_progress: '#f59e0b', completed: '#10b981',
  cancelled: '#ef4444', approved: '#3b82f6'
}

function KpiCard({ icon: Icon, label, value, sub, color, trend }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUp size={11}/> : <ArrowDown size={11}/>} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-800 mb-0.5">{value}</p>
      <p className="text-xs font-bold text-gray-400">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-3 text-xs text-white shadow-xl">
      <p className="font-bold mb-1.5 text-gray-300">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-black">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function PlatformAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => adminApi.get('/api/platform/admin/stats'),
    refetchInterval: 30000
  })

  const { data: analytics } = useQuery({
    queryKey: ['platform-analytics'],
    queryFn: () => adminApi.get('/api/platform/admin/analytics'),
    refetchInterval: 60000
  })

  const reqByService    = analytics?.byService      || []
  const reqByStatus     = analytics?.byStatus       || []
  const monthlyTrend    = analytics?.monthly        || []
  const topClients      = analytics?.topClients     || []
  const avgResponseHrs  = analytics?.avgResponseHrs || 0
  const revenueByMonth  = analytics?.revenueByMonth || []

  const kpis = [
    {
      icon: Inbox,      label: 'إجمالي الطلبات',   color: '#8b5cf6',
      value: stats?.requests?.total || 0,
      sub: `${stats?.requests?.new_count || 0} جديد · ${stats?.requests?.in_progress || 0} قيد العمل`
    },
    {
      icon: Users,      label: 'العملاء النشطون',  color: '#06b6d4',
      value: stats?.clients || 0,
      sub: 'عميل مسجل في المنصة'
    },
    {
      icon: Target,     label: 'المشاريع النشطة',  color: '#10b981',
      value: stats?.projects?.active || 0,
      sub: `${stats?.projects?.total || 0} إجمالي · ${stats?.requests?.completed || 0} مكتمل`
    },
    {
      icon: DollarSign, label: 'إجمالي الإيرادات', color: '#f59e0b',
      value: `${Number(stats?.revenue?.total || 0).toLocaleString()} ﷼`,
      sub: `محصّل: ${Number(stats?.revenue?.paid || 0).toLocaleString()} ﷼`
    },
    {
      icon: Clock,      label: 'متوسط وقت الاستجابة', color: '#3b82f6',
      value: avgResponseHrs > 0 ? `${avgResponseHrs} س` : '—',
      sub: 'من الاستلام للتحديث الأول'
    },
    {
      icon: Zap,        label: 'معدل التحويل',      color: '#ec4899',
      value: stats?.requests?.total > 0
        ? `${Math.round((parseInt(stats?.projects?.total || 0) / parseInt(stats?.requests?.total)) * 100)}%`
        : '0%',
      sub: 'من الطلبات إلى مشاريع فعلية'
    },
  ]

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <BarChart3 size={24} className="text-violet-600"/> تحليلات المنصة
          </h1>
          <p className="text-sm text-gray-500 mt-1">إحصائيات شاملة لأداء منصة اكسبو التقنية</p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
          آخر تحديث: {new Date().toLocaleTimeString('ar-SA')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((k, i) => <KpiCard key={i} {...k}/>)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Requests Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-600"/> اتجاه الطلبات الشهري
          </h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="requests" name="الطلبات" stroke="#8b5cf6" fill="url(#reqGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }}/>
                <Area type="monotone" dataKey="projects" name="المشاريع" stroke="#06b6d4" fill="none" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#06b6d4' }}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp size={36} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">ستظهر البيانات بعد تراكم الطلبات</p>
              </div>
            </div>
          )}
        </div>

        {/* By Service Type Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-amber-500"/> توزيع حسب الخدمة
          </h3>
          {reqByService.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={reqByService} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="service_type" label={({ name, percent }) => `${SERVICE_LABELS[name] || name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {reqByService.map((entry: any, i: number) => (
                    <Cell key={i} fill={SERVICE_COLORS[entry.service_type] || '#6b7280'}/>
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, SERVICE_LABELS[n] || n]}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Target size={36} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">لا توجد طلبات بعد</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500"/> الطلبات حسب الحالة
          </h3>
          {reqByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reqByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={80}
                  tickFormatter={(v) => ({ new: '🆕 جديد', in_progress: '⚙️ قيد العمل', completed: '✅ مكتمل', cancelled: '❌ ملغي', approved: '✔️ موافق' }[v] || v)}
                />
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="count" name="العدد" radius={[0, 8, 8, 0]}>
                  {reqByStatus.map((e: any, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[e.status] || '#6b7280'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Clock size={36} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">لا توجد بيانات بعد</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <Award size={18} className="text-emerald-500"/> أبرز العملاء
          </h3>
          {topClients.length > 0 ? (
            <div className="space-y-3">
              {topClients.map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.request_count} طلب · {c.project_count} مشروع</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-sm font-black text-emerald-600">{Number(c.total_paid || 0).toLocaleString()} ﷼</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Users size={36} className="mx-auto mb-2 opacity-30"/>
                <p className="text-sm">لا يوجد عملاء بعد</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart Row */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign size={18} className="text-amber-500"/> الإيرادات الشهرية (ميزانية vs محصّل)
        </h3>
        {revenueByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="budget" name="الميزانية" fill="#e0e7ff" radius={[6,6,0,0]}/>
              <Bar dataKey="paid"   name="المحصّل"   fill="#10b981" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <DollarSign size={36} className="mx-auto mb-2 opacity-30"/>
              <p className="text-sm">ستظهر بيانات الإيرادات بعد إنشاء المشاريع</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'معدل التحويل', value: stats?.requests?.total > 0 ? `${Math.round((stats?.projects?.total / stats?.requests?.total) * 100)}%` : '0%', icon: Target, color: '#8b5cf6', desc: 'من الطلبات إلى مشاريع' },
          { label: 'متوسط قيمة المشروع', value: stats?.projects?.total > 0 ? `${Math.round(stats?.revenue?.total / stats?.projects?.total).toLocaleString()} ﷼` : '0 ﷼', icon: DollarSign, color: '#10b981', desc: 'لكل مشروع' },
          { label: 'معدل الإنجاز', value: stats?.projects?.total > 0 ? `${Math.round((parseInt(stats?.requests?.completed || 0) / parseInt(stats?.requests?.total || 1)) * 100)}%` : '0%', icon: Award, color: '#f59e0b', desc: 'من المشاريع مكتملة' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '15' }}>
              <item.icon size={22} style={{ color: item.color }}/>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">{item.label}</p>
              <p className="text-2xl font-black text-gray-800">{item.value}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
