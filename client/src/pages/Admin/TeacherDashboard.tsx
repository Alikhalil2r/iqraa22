import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { studentsApi, gradesApi, attendanceApi, scheduleApi } from '../../api/client'
import { Link } from 'react-router-dom'
import {
  GraduationCap, ClipboardCheck, BarChart3, Calendar, BookOpen,
  TrendingUp, Award, AlertTriangle, CheckCircle, Clock, Users,
  ChevronLeft, Star, Target, Activity, Zap, ArrowLeft
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts'

const API = (path: string) =>
  fetch(`/api${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json())

const GRADE_COLORS: Record<string, string> = {
  'ممتاز': '#10b981', 'جيد جداً': '#3b82f6', 'جيد': '#f59e0b', 'مقبول': '#f97316', 'ضعيف': '#ef4444'
}

function RingGauge({ value, max = 100, color, label, sub }: { value: number; max?: number; color: string; label: string; sub?: string }) {
  const pct = Math.min(100, value / max * 100)
  const r = 36, stroke = 8, circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      </div>
      <p className="text-xs font-black text-gray-700 text-center">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 text-center">{sub}</p>}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, href }: any) {
  const content = (
    <div className="card flex items-start gap-3 !py-4 hover:shadow-md transition-all cursor-pointer group border-r-4"
      style={{ borderRightColor: color }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18' }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-800">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {href && <ArrowLeft size={14} className="text-gray-300 group-hover:text-gray-500 mt-1 flex-shrink-0" />}
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { lang } = useLanguage()
  const [activeClass, setActiveClass] = useState<string>('all')

  const studentsQ = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => studentsApi.list({ status: 'active' }).then(r => r.data)
  })
  const gradesQ = useQuery({
    queryKey: ['teacher-grades'],
    queryFn: () => gradesApi.list().then(r => r.data)
  })
  const scheduleQ = useQuery({
    queryKey: ['teacher-schedule'],
    queryFn: () => scheduleApi.list().then(r => r.data)
  })

  const students: any[] = studentsQ.data?.students || []
  const grades: any[] = gradesQ.data?.grades || []
  const schedule: any[] = scheduleQ.data?.schedule || []

  const classes = Array.from(new Set(students.map((s: any) => s.class_name).filter(Boolean)))

  const filteredStudents = activeClass === 'all' ? students : students.filter(s => s.class_name === activeClass)

  const gradeStats = React.useMemo(() => {
    if (!grades.length) return { avg: 0, pass: 0, fail: 0, dist: [] }
    const scores = grades.map((g: any) => parseFloat(g.score) || 0)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const max = grades.map((g: any) => parseFloat(g.max_score) || 100)
    const pcts = scores.map((s, i) => (s / (max[i] || 100)) * 100)
    const pass = pcts.filter(p => p >= 50).length
    const dist = [
      { name: 'ممتاز', count: pcts.filter(p => p >= 90).length },
      { name: 'جيد جداً', count: pcts.filter(p => p >= 75 && p < 90).length },
      { name: 'جيد', count: pcts.filter(p => p >= 60 && p < 75).length },
      { name: 'مقبول', count: pcts.filter(p => p >= 50 && p < 60).length },
      { name: 'ضعيف', count: pcts.filter(p => p < 50).length },
    ]
    return { avg: Math.round(avg), pass, fail: grades.length - pass, dist }
  }, [grades])

  const todayDay = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][new Date().getDay()] || 'الأحد'
  const todaySchedule = schedule.filter((s: any) =>
    !s.day_of_week || s.day_of_week === todayDay || s.day_of_week === new Date().getDay()
  ).slice(0, 5)

  const subjectPerf = React.useMemo(() => {
    const map: Record<string, number[]> = {}
    grades.forEach((g: any) => {
      const sub = g.subject_name || 'أخرى'
      const pct = (parseFloat(g.score) / (parseFloat(g.max_score) || 100)) * 100
      if (!map[sub]) map[sub] = []
      map[sub].push(pct)
    })
    return Object.entries(map).map(([subject, pcts]) => ({
      subject,
      avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
    })).slice(0, 6)
  }, [grades])

  const topStudents = React.useMemo(() => {
    const map: Record<string, { name: string; scores: number[] }> = {}
    grades.forEach((g: any) => {
      const id = g.student_id || g.id
      const pct = (parseFloat(g.score) / (parseFloat(g.max_score) || 100)) * 100
      if (!map[id]) map[id] = { name: g.student_name || '—', scores: [] }
      map[id].scores.push(pct)
    })
    return Object.values(map)
      .map(s => ({ ...s, avg: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5)
  }, [grades])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور'

  return (
    <div className="space-y-6 animate-fadeUp">

      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #0ea5e9 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={`bubble-${i}`} className="absolute rounded-full bg-white"
              style={{ width: 60 + i * 20, height: 60 + i * 20, right: -20 + i * 40, top: -20 + i * 15, opacity: 0.3 }} />
          ))}
        </div>
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-100 text-sm font-bold mb-1">👨‍🏫 {greeting}،</p>
            <h1 className="text-2xl font-black">{user?.name}</h1>
            <p className="text-blue-100 mt-1 text-sm">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center min-w-[70px]">
              <p className="text-xl font-black">{students.length}</p>
              <p className="text-[10px] text-blue-100">طالب</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center min-w-[70px]">
              <p className="text-xl font-black">{classes.length}</p>
              <p className="text-[10px] text-blue-100">فصل</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center min-w-[70px]">
              <p className="text-xl font-black">{gradeStats.avg}%</p>
              <p className="text-[10px] text-blue-100">متوسط</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="إجمالي الطلاب" value={students.length}
          sub="طالب نشط" color="#3b82f6" href="/admin/students" />
        <StatCard icon={ClipboardCheck} label="نتائج مدخلة" value={grades.length}
          sub="درجة محفوظة" color="#10b981" href="/admin/grades" />
        <StatCard icon={Award} label="معدل النجاح" value={grades.length ? `${Math.round(gradeStats.pass / grades.length * 100)}%` : '—'}
          sub="من الطلاب ناجحون" color="#f59e0b" />
        <StatCard icon={Users} label="الفصول" value={classes.length}
          sub="فصل دراسي" color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Grade Distribution */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" /> توزيع الدرجات
            </h3>
            <Link to="/admin/grades" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              إدارة الدرجات <ArrowLeft size={12} />
            </Link>
          </div>
          {grades.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeStats.dist} barSize={36}>
                <XAxis dataKey="name" tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
                <YAxis tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
                <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" name="عدد الطلاب" radius={[8, 8, 0, 0]}>
                  {gradeStats.dist.map((entry, i) => (
                    <rect key={entry.name} fill={GRADE_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">لم يتم إدخال درجات بعد</p>
              </div>
            </div>
          )}
        </div>

        {/* Gauges */}
        <div className="card">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <Target size={18} className="text-purple-500" /> نظرة عامة
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <RingGauge
              value={gradeStats.avg} color="#3b82f6"
              label="متوسط الدرجات" sub={`${gradeStats.avg}/100`}
            />
            <RingGauge
              value={grades.length ? Math.round(gradeStats.pass / grades.length * 100) : 0}
              color="#10b981" label="نسبة النجاح"
            />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> ناجحون
              </span>
              <span className="font-black text-green-600">{gradeStats.pass}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> راسبون
              </span>
              <span className="font-black text-red-500">{gradeStats.fail}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" /> جدولي اليوم
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-black">{todayDay}</span>
            </h3>
            <Link to="/admin/schedule" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              الجدول الكامل <ArrowLeft size={12} />
            </Link>
          </div>
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.map((item: any, i) => (
                <div key={item.id ?? `sched-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ background: ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'][i % 5] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 truncate">{item.subject_name || item.subject}</p>
                    <p className="text-xs text-gray-500">{item.class_name} · {item.room ? `غرفة ${item.room}` : ''}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs font-black text-gray-600 dir-ltr">{item.start_time?.slice(0,5)} - {item.end_time?.slice(0,5)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">لا يوجد جدول لليوم</p>
                <Link to="/admin/schedule" className="text-xs text-blue-500 mt-1 inline-block font-bold hover:underline">
                  إضافة جدول
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Top Students */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <Star size={18} className="text-yellow-500" /> أوائل الطلاب
            </h3>
            <Link to="/admin/grades" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              كل الدرجات <ArrowLeft size={12} />
            </Link>
          </div>
          {topStudents.length > 0 ? (
            <div className="space-y-2.5">
              {topStudents.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fef3c7' : '#f9fafb',
                             color: i === 0 ? '#d97706' : i === 1 ? '#64748b' : i === 2 ? '#92400e' : '#6b7280' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-black text-gray-800 truncate">{s.name}</p>
                      <span className="text-xs font-black ml-2 flex-shrink-0"
                        style={{ color: s.avg >= 90 ? '#10b981' : s.avg >= 75 ? '#3b82f6' : '#f59e0b' }}>
                        {s.avg}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${s.avg}%`, background: s.avg >= 90 ? '#10b981' : s.avg >= 75 ? '#3b82f6' : '#f59e0b' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Award size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">لا توجد درجات بعد</p>
                <Link to="/admin/grades" className="text-xs text-blue-500 mt-1 inline-block font-bold hover:underline">
                  إدخال الدرجات
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subject Performance */}
      {subjectPerf.length > 0 && (
        <div className="card">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-indigo-500" /> أداء المواد الدراسية
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectPerf} layout="vertical" margin={{ right: 20 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontFamily: 'Cairo', fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="subject" width={90} tick={{ fontFamily: 'Cairo', fontSize: 11 }} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', fontSize: 12, borderRadius: 10 }}
                formatter={(v: any) => [`${v}%`, 'متوسط الدرجة']} />
              <Bar dataKey="avg" name="متوسط" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* My Students Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-black text-gray-800 flex items-center gap-2">
            <GraduationCap size={18} className="text-blue-500" /> طلابي
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-black">{filteredStudents.length}</span>
          </h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveClass('all')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${activeClass === 'all' ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              style={activeClass === 'all' ? { background: 'var(--color-primary)' } : {}}
            >
              الكل
            </button>
            {classes.map(cls => (
              <button key={cls}
                onClick={() => setActiveClass(cls)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${activeClass === cls ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={activeClass === cls ? { background: 'var(--color-primary)' } : {}}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>
        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right text-xs font-black text-gray-400 pb-3 pr-2">الطالب</th>
                  <th className="text-right text-xs font-black text-gray-400 pb-3">الفصل</th>
                  <th className="text-right text-xs font-black text-gray-400 pb-3">رقم الطالب</th>
                  <th className="text-right text-xs font-black text-gray-400 pb-3">الحالة</th>
                  <th className="text-right text-xs font-black text-gray-400 pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.slice(0, 10).map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                          style={{ background: 'var(--color-primary)' }}>
                          {s.name?.[0]}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 text-xs">{s.name}</p>
                          {s.name_en && <p className="text-gray-400 text-[10px]">{s.name_en}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg font-bold">{s.class_name || '—'}</span>
                    </td>
                    <td className="py-2.5 text-xs text-gray-500 font-bold">{s.student_number || '—'}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Link to={`/admin/students`}
                        className="text-[10px] text-blue-600 font-bold hover:underline">
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length > 10 && (
              <div className="text-center pt-3">
                <Link to="/admin/students" className="text-xs text-blue-600 font-bold hover:underline">
                  عرض كل الطلاب ({filteredStudents.length}) →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <GraduationCap size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">لا يوجد طلاب</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
          <Zap size={18} className="text-amber-500" /> إجراءات سريعة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'تسجيل الحضور', icon: ClipboardCheck, href: '/admin/attendance', color: '#10b981' },
            { label: 'إدخال الدرجات', icon: BarChart3, href: '/admin/grades', color: '#3b82f6' },
            { label: 'جدول الامتحانات', icon: Calendar, href: '/admin/exams', color: '#f59e0b' },
            { label: 'الجدول الدراسي', icon: BookOpen, href: '/admin/schedule', color: '#8b5cf6' },
          ].map(({ label, icon: Icon, href, color }) => (
            <Link key={href} to={href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-md transition-all text-center group"
              style={{ '--hover-bg': color + '10' } as any}
              onMouseEnter={e => (e.currentTarget.style.background = color + '08')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span className="text-xs font-black text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
