import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Users, BookOpen, DollarSign, Calendar, Star, Zap, RefreshCw,
  ChevronDown, ChevronUp, Award, BarChart3, Activity
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const API = (path: string) =>
  fetch(`/api${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json())

const TOOLTIP_STYLE = { fontFamily: 'Cairo', fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#0ea5e9','#8b5cf6','#ec4899','#14b8a6']

const PRIORITY_CONFIG = {
  critical: { bg:'#fef2f2', border:'#fecaca', icon:'#ef4444', badge:'bg-red-100 text-red-700',   label:'حرج' },
  warning:  { bg:'#fffbeb', border:'#fde68a', icon:'#f59e0b', badge:'bg-amber-100 text-amber-700', label:'تحذير' },
  positive: { bg:'#f0fdf4', border:'#bbf7d0', icon:'#10b981', badge:'bg-green-100 text-green-700', label:'إيجابي' },
  info:     { bg:'#eff6ff', border:'#bfdbfe', icon:'#3b82f6', badge:'bg-blue-100 text-blue-700',   label:'معلومة' },
}

const ICON_MAP: Record<string, any> = {
  alert: AlertTriangle, star: Star, 'users-alert': Users, warning: AlertTriangle,
  money: DollarSign, 'money-check': DollarSign, attendance: Calendar, check: CheckCircle,
  book: BookOpen, calendar: Calendar,
}

function InsightCard({ insight }: { insight: any }) {
  const cfg = PRIORITY_CONFIG[insight.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.info
  const IconComponent = ICON_MAP[insight.icon] || Activity
  return (
    <div className="rounded-2xl border p-4 flex gap-4 items-start transition-all hover:shadow-md"
      style={{ background: cfg.bg, borderColor: cfg.border }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.icon + '20', color: cfg.icon }}>
        <IconComponent size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-black text-gray-800 text-sm">{insight.title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${cfg.badge}`}>{cfg.label}</span>
          {insight.metric && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/60 text-gray-600">{insight.metric}</span>
          )}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{insight.body}</p>
      </div>
    </div>
  )
}

function AtRiskCard({ s, i }: { s: any; i: number }) {
  const [open, setOpen] = useState(false)
  const isCritical = s.risk_level === 'critical'
  return (
    <div className={`rounded-2xl border p-3 ${isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}>{i + 1}</div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 text-sm truncate">{s.name}</p>
          <p className="text-xs text-gray-500">{s.class_name || 'بدون فصل'}</p>
        </div>
        <div className="text-left flex-shrink-0 flex items-center gap-2">
          <div className="text-center">
            <p className={`text-sm font-black ${parseFloat(s.avg_grade) < 50 ? 'text-red-600' : 'text-amber-600'}`}>{s.avg_grade || '—'}%</p>
            <p className="text-[9px] text-gray-400">المعدل</p>
          </div>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-current/10 grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white/60 rounded-xl">
            <p className="text-sm font-black text-green-600">{s.avg_grade || '0'}%</p>
            <p className="text-[9px] text-gray-500">متوسط الدرجات</p>
          </div>
          <div className="text-center p-2 bg-white/60 rounded-xl">
            <p className="text-sm font-black text-red-600">{s.absent_days || 0}</p>
            <p className="text-[9px] text-gray-500">أيام الغياب</p>
          </div>
          <div className="text-center p-2 bg-white/60 rounded-xl">
            <p className="text-sm font-black text-amber-600">{s.late_days || 0}</p>
            <p className="text-[9px] text-gray-500">أيام التأخر</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AIInsights() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => API('/ai-insights'),
    staleTime: 5 * 60_000,
  })

  const insights: any[] = data?.insights || []
  const d = data?.data || {}

  const gradeChartData = d.gradeDistribution ? [
    { name: 'ممتاز', count: parseInt(d.gradeDistribution.excellent || 0), color: '#10b981' },
    { name: 'جيد جداً', count: parseInt(d.gradeDistribution.good || 0),  color: '#3b82f6' },
    { name: 'جيد',    count: parseInt(d.gradeDistribution.average || 0), color: '#f59e0b' },
    { name: 'ضعيف',   count: parseInt(d.gradeDistribution.weak || 0),    color: '#f97316' },
    { name: 'راسب',   count: parseInt(d.gradeDistribution.failing || 0), color: '#ef4444' },
  ] : []

  const attTrend = (d.attendanceTrend || []).map((r: any) => ({
    week: new Date(r.week).toLocaleDateString('ar', { month: 'short', day: 'numeric' }),
    rate: parseFloat(r.rate || 0),
    absent: parseInt(r.absent || 0),
  }))

  const atRisk = (d.atRiskStudents || []).filter((s: any) => s.risk_level !== 'normal')
  const criticals = atRisk.filter((s: any) => s.risk_level === 'critical')
  const warnings  = atRisk.filter((s: any) => s.risk_level === 'warning')

  const fi = d.feeInsights || {}
  const gd = d.gradeDistribution || {}

  return (
    <div className="space-y-6 animate-fadeUp">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={`bubble-ai-${i}`} className="absolute rounded-full bg-white"
              style={{ width: 80 + i*30, height: 80 + i*30, right: -30 + i*60, top: -30 + i*10, opacity: 0.2 }} />
          ))}
        </div>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Brain size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black">التحليل الذكي</h1>
              <p className="text-purple-200 text-sm mt-0.5">AI-Powered Academic & Operational Insights</p>
            </div>
          </div>
          <button onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all backdrop-blur">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            تحديث التحليل
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={`ai-skel-${i}`} className="card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'متوسط الدرجات', value: `${gd.avg_score || '—'}%`, icon: <Award size={18}/>, color: '#6366f1',
                sub: `${gd.total_students || 0} طالب` },
              { label: 'نسبة الحضور', value: attTrend.length ? `${attTrend[attTrend.length-1]?.rate}%` : '—',
                icon: <Calendar size={18}/>, color: '#10b981', sub: 'آخر أسبوع' },
              { label: 'تحصيل الرسوم', value: fi.collection_rate ? `${fi.collection_rate}%` : '—',
                icon: <DollarSign size={18}/>, color: '#f59e0b',
                sub: `${parseFloat(fi.outstanding || 0).toLocaleString()} ريال متأخر` },
              { label: 'طلاب بحاجة متابعة', value: String(atRisk.length),
                icon: <Users size={18}/>, color: '#ef4444', sub: `${criticals.length} حالة حرجة` },
            ].map((kpi) => (
              <div key={kpi.label} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: kpi.color + '18', color: kpi.color }}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold">{kpi.label}</p>
                  <p className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
                  <p className="text-[10px] text-gray-400">{kpi.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          {insights.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Zap size={16} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="font-black text-gray-800">توصيات ذكية</h2>
                  <p className="text-xs text-gray-400">مولّدة تلقائيًا بناءً على تحليل بيانات المدرسة</p>
                </div>
                <span className="mr-auto text-xs px-3 py-1 bg-purple-50 text-purple-700 font-black rounded-full">
                  {insights.length} توصية
                </span>
              </div>
              <div className="space-y-3">
                {insights.map((ins: any) => <InsightCard key={ins.id} insight={ins} />)}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Grade Distribution Chart */}
            <div className="card">
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-indigo-500" /> توزيع الدرجات
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={gradeChartData} barSize={32}>
                  <XAxis dataKey="name" tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
                  <YAxis tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" name="عدد الطلاب" radius={[8,8,0,0]}>
                    {gradeChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Trend */}
            <div className="card">
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> اتجاه الحضور (8 أسابيع)
              </h3>
              {attTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={attTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontFamily: 'Cairo', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontFamily: 'Cairo', fontSize: 10 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'نسبة الحضور']} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5}
                      dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} name="نسبة الحضور" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-300">
                  <div className="text-center"><Activity size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد بيانات حضور</p></div>
                </div>
              )}
            </div>

            {/* Top / Bottom subjects */}
            <div className="card">
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" /> أداء المواد
              </h3>
              <div className="space-y-2.5">
                {(d.topSubjects || []).slice(0, 7).map((s: any, i: number) => {
                  const avg = parseFloat(s.avg_score || 0)
                  const color = avg >= 80 ? '#10b981' : avg >= 60 ? '#f59e0b' : '#ef4444'
                  return (
                    <div key={s.subject_name} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-bold text-gray-700 truncate">{s.subject_name}</p>
                          <span className="text-xs font-black flex-shrink-0 ml-2" style={{ color }}>{avg}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(avg,100)}%`, background: color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {(d.topSubjects || []).length === 0 && <p className="text-gray-400 text-sm text-center py-8">لا توجد بيانات درجات</p>}
              </div>
            </div>

            {/* Performance by Class */}
            <div className="card">
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <Users size={16} className="text-purple-500" /> أداء الفصول
              </h3>
              {(d.performanceByClass || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={d.performanceByClass || []} barSize={24} layout="vertical">
                    <XAxis type="number" domain={[0,100]} tick={{ fontFamily:'Cairo', fontSize:10 }} />
                    <YAxis type="category" dataKey="class_name" width={70} tick={{ fontFamily:'Cairo', fontSize:10 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'المتوسط']} />
                    <Bar dataKey="avg_grade" name="متوسط الدرجات" radius={[0,8,8,0]}>
                      {(d.performanceByClass || []).map((_: any, i: number) => (
                        <Cell key={`cls-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-300">
                  <div className="text-center"><BarChart3 size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد بيانات</p></div>
                </div>
              )}
            </div>
          </div>

          {/* At-Risk Students */}
          {atRisk.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" /> الطلاب بحاجة لتدخل
                </h3>
                <div className="flex gap-2">
                  {criticals.length > 0 && <span className="text-xs px-3 py-1 bg-red-100 text-red-700 font-black rounded-full">{criticals.length} حرج</span>}
                  {warnings.length > 0 && <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 font-black rounded-full">{warnings.length} تحذير</span>}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {atRisk.slice(0, 12).map((s: any, i: number) => <AtRiskCard key={s.id} s={s} i={i} />)}
              </div>
            </div>
          )}

          {/* Absence Patterns */}
          {(d.absenteePatterns || []).length > 0 && (
            <div className="card">
              <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-amber-500" /> نمط الغياب حسب اليوم
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {(d.absenteePatterns || []).slice(0,5).map((p: any) => {
                  const dayLabels: Record<string,string> = {'0':'الأحد','1':'الاثنين','2':'الثلاثاء','3':'الأربعاء','4':'الخميس'}
                  const name = dayLabels[String(p.day_num)] || p.day_name?.trim()
                  const rate = parseFloat(p.absence_rate || 0)
                  const color = rate > 15 ? '#ef4444' : rate > 10 ? '#f59e0b' : '#10b981'
                  return (
                    <div key={name} className="text-center p-3 rounded-2xl bg-gray-50">
                      <p className="text-xs text-gray-500 font-bold mb-2">{name}</p>
                      <p className="text-xl font-black" style={{ color }}>{rate}%</p>
                      <p className="text-[9px] text-gray-400 mt-1">غياب</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
