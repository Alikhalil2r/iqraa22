import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { gradesApi, feesApi, studentsApi } from '../../api/client'
import { Link } from 'react-router-dom'
import { TrendingUp, Award, DollarSign, GraduationCap, ArrowLeft, Target } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, value / max * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-gray-500 font-bold w-20 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black text-gray-600 flex-shrink-0 w-8 text-left">{Math.round(pct)}%</span>
    </div>
  )
}

export default function PerformanceWidget() {
  const { data: gradesData } = useQuery({
    queryKey: ['perf-grades'],
    queryFn: () => gradesApi.list().then(r => r.data),
    staleTime: 120000
  })
  const { data: feesData } = useQuery({
    queryKey: ['perf-fees'],
    queryFn: () => feesApi.stats().then(r => r.data),
    staleTime: 120000
  })
  const { data: studentsData } = useQuery({
    queryKey: ['perf-students'],
    queryFn: () => studentsApi.list({ status: 'active' }).then(r => r.data),
    staleTime: 120000
  })

  const grades: any[] = gradesData?.grades || []
  const fStats: any = feesData?.stats || {}

  const subjectAvgs = React.useMemo(() => {
    const map: Record<string, number[]> = {}
    grades.forEach((g: any) => {
      const sub = g.subject_name || 'أخرى'
      const pct = (parseFloat(g.score) / (parseFloat(g.max_score) || 100)) * 100
      if (!map[sub]) map[sub] = []
      map[sub].push(pct)
    })
    return Object.entries(map)
      .map(([subject, pcts]) => ({
        subject: subject.length > 10 ? subject.slice(0, 10) + '...' : subject,
        avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5)
  }, [grades])

  const passRate = React.useMemo(() => {
    if (!grades.length) return 0
    const passed = grades.filter((g: any) => {
      const pct = (parseFloat(g.score) / (parseFloat(g.max_score) || 100)) * 100
      return pct >= 50
    }).length
    return Math.round(passed / grades.length * 100)
  }, [grades])

  const avgGrade = React.useMemo(() => {
    if (!grades.length) return 0
    const total = grades.reduce((s: number, g: any) => {
      return s + (parseFloat(g.score) / (parseFloat(g.max_score) || 100)) * 100
    }, 0)
    return Math.round(total / grades.length)
  }, [grades])

  const fCollected = parseFloat(fStats.collected || 0)
  const fTotal = parseFloat(fStats.total_amount || 0)
  const fPct = fTotal > 0 ? Math.round(fCollected / fTotal * 100) : 0
  const fOverdue = parseInt(fStats.overdue_count || 0)

  const radarData = [
    { subject: 'الحضور', A: 85 },
    { subject: 'الدرجات', A: avgGrade },
    { subject: 'النجاح', A: passRate },
    { subject: 'الرسوم', A: fPct },
    { subject: 'الطلاب', A: Math.min(100, (studentsData?.students?.length || 0) / 2) },
  ]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-800 flex items-center gap-2">
          <Target size={18} className="text-purple-500" /> أداء المؤسسة
        </h3>
        <Link to="/admin/reports" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
          تفاصيل <ArrowLeft size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-blue-50">
          <p className="text-xl font-black text-blue-700">{avgGrade}%</p>
          <p className="text-[10px] text-blue-500 font-bold mt-0.5">متوسط الدرجات</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-green-50">
          <p className="text-xl font-black text-green-700">{passRate}%</p>
          <p className="text-[10px] text-green-500 font-bold mt-0.5">معدل النجاح</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-50">
          <p className="text-xl font-black text-amber-700">{fPct}%</p>
          <p className="text-[10px] text-amber-500 font-bold mt-0.5">تحصيل الرسوم</p>
        </div>
      </div>

      {subjectAvgs.length > 0 && (
        <div className="space-y-2.5">
          {subjectAvgs.map((s, i) => (
            <MiniBar key={s.subject} label={s.subject} value={s.avg} max={100}
              color={s.avg >= 80 ? '#10b981' : s.avg >= 60 ? '#3b82f6' : '#f59e0b'} />
          ))}
        </div>
      )}

      {fOverdue > 0 && (
        <Link to="/admin/fees"
          className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors">
          <DollarSign size={14} />
          {fOverdue} فاتورة متأخرة — اضغط للمراجعة
          <ArrowLeft size={12} className="mr-auto" />
        </Link>
      )}
    </div>
  )
}
