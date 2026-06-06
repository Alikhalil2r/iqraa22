import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import {
  BarChart3, Users, GraduationCap, Download, TrendingUp, Award, AlertTriangle,
  Activity, Briefcase, BookOpen, Printer, DollarSign, UserPlus, FileSpreadsheet
} from 'lucide-react'
import { reportsApi, settingsApi } from '../../api/client'
import { exportToCSV } from '../../components/ExportButton'
import { printTable } from '../../utils/printExport'
import { REPORT_COLORS, TOOLTIP_STYLE, gradeLabel, attendanceColor, feeStatusLabel, formatOMR, formatPct } from '../../utils/reportUtils'

type TabType = 'overview' | 'attendance' | 'grades' | 'students' | 'fees' | 'hr'

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
        <span className="text-sm font-bold">جارٍ تحميل البيانات...</span>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="card flex items-start gap-3 !py-4 border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: color + '15', color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold truncate">{label}</p>
        <p className="text-2xl font-black leading-tight" style={{ color }}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card border border-gray-100/80 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-black text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

const TABS: { id: TabType; label: string; icon: typeof Activity }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: Activity },
  { id: 'attendance', label: 'الحضور', icon: Users },
  { id: 'grades', label: 'الدرجات', icon: GraduationCap },
  { id: 'students', label: 'الطلاب', icon: UserPlus },
  { id: 'fees', label: 'الرسوم', icon: DollarSign },
  { id: 'hr', label: 'الموارد البشرية', icon: Briefcase },
]

export default function Reports() {
  const [tab, setTab] = useState<TabType>('overview')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [personType, setPersonType] = useState('student')
  const [feeStatus, setFeeStatus] = useState('')

  const { data: theme } = useQuery({ queryKey: ['theme'], queryFn: () => settingsApi.theme().then(r => r.data) })
  const schoolName = theme?.school_name || 'المدرسة'
  const primaryColor = theme?.primary_color || '#6366f1'
  const printOpts = { schoolName, primaryColor }

  const summaryQuery = useQuery({ queryKey: ['report-summary'], queryFn: () => reportsApi.summary().then(r => r.data) })
  const attQuery = useQuery({
    queryKey: ['report-att', startDate, endDate, personType],
    queryFn: () => reportsApi.attendance({ startDate, endDate, personType }).then(r => r.data),
  })
  const gradesQuery = useQuery({ queryKey: ['report-grades'], queryFn: () => reportsApi.grades().then(r => r.data) })
  const studentsQuery = useQuery({ queryKey: ['report-students'], queryFn: () => reportsApi.students().then(r => r.data) })
  const feesQuery = useQuery({
    queryKey: ['report-fees', feeStatus],
    queryFn: () => reportsApi.fees(feeStatus ? { status: feeStatus } : undefined).then(r => r.data),
  })
  const hrQuery = useQuery({ queryKey: ['report-hr'], queryFn: () => reportsApi.hr().then(r => r.data) })

  const attReport = attQuery.data?.report || []
  const gradesReport = gradesQuery.data?.report || []
  const feesReport = feesQuery.data?.report || []
  const hrEmployees = hrQuery.data?.employees || []

  const avgAtt = attReport.length ? (attReport.reduce((s: number, r: any) => s + parseFloat(r.attendance_rate || 0), 0) / attReport.length).toFixed(1) : '—'
  const avgGrade = gradesReport.length ? (gradesReport.reduce((s: number, r: any) => s + parseFloat(r.avg_grade || 0), 0) / gradesReport.length).toFixed(1) : '—'
  const totalEmps = (hrQuery.data?.byStatus || []).reduce((s: number, r: any) => s + parseInt(r.count), 0)
  const activeEmps = (hrQuery.data?.byStatus || []).find((r: any) => r.status === 'active')?.count || 0

  const exportConfig = useMemo(() => {
    const map: Record<TabType, { fn: () => void; disabled: boolean } | null> = {
      overview: null,
      attendance: {
        fn: () => exportToCSV(attReport, [
          { key: 'name', label: 'الاسم' }, { key: 'group_name', label: 'المجموعة' },
          { key: 'present_days', label: 'حضور' }, { key: 'absent_days', label: 'غياب' },
          { key: 'late_days', label: 'تأخر' }, { key: 'attendance_rate', label: 'النسبة %' },
        ], `تقرير_الحضور_${personType === 'student' ? 'الطلاب' : 'الموظفين'}`),
        disabled: !attReport.length,
      },
      grades: {
        fn: () => exportToCSV(gradesReport, [
          { key: 'student_name', label: 'الطالب' }, { key: 'class_name', label: 'الفصل' },
          { key: 'avg_grade', label: 'المتوسط %' }, { key: 'passed', label: 'ناجح' }, { key: 'failed', label: 'راسب' },
        ], 'تقرير_الدرجات'),
        disabled: !gradesReport.length,
      },
      students: {
        fn: () => exportToCSV(studentsQuery.data?.students || [], [
          { key: 'name', label: 'الاسم' }, { key: 'student_number', label: 'الرقم' },
          { key: 'class_name', label: 'الفصل' }, { key: 'gender', label: 'الجنس' }, { key: 'status', label: 'الحالة' },
        ], 'تقرير_الطلاب'),
        disabled: !(studentsQuery.data?.students?.length),
      },
      fees: {
        fn: () => exportToCSV(feesReport, [
          { key: 'student_name', label: 'الطالب' }, { key: 'class_name', label: 'الفصل' },
          { key: 'fee_type', label: 'نوع الرسوم' }, { key: 'amount', label: 'المبلغ' },
          { key: 'paid_amount', label: 'المدفوع' }, { key: 'remaining', label: 'المتبقي' }, { key: 'status', label: 'الحالة' },
        ], 'تقرير_الرسوم'),
        disabled: !feesReport.length,
      },
      hr: {
        fn: () => exportToCSV(hrEmployees, [
          { key: 'name', label: 'الاسم' }, { key: 'position', label: 'المنصب' },
          { key: 'department', label: 'القسم' }, { key: 'employee_type', label: 'نوع العقد' },
          { key: 'salary', label: 'الراتب' }, { key: 'status', label: 'الحالة' },
        ], 'تقرير_الموظفين'),
        disabled: !hrEmployees.length,
      },
    }
    return map
  }, [attReport, gradesReport, feesReport, hrEmployees, studentsQuery.data, personType])

  const handlePrint = () => {
    if (tab === 'attendance') {
      printTable('تقرير الحضور والغياب', `${startDate} — ${endDate}`, [
        { header: 'الاسم', key: 'name' }, { header: 'المجموعة', key: 'group_name' },
        { header: 'حضور', key: 'present_days' }, { header: 'غياب', key: 'absent_days' },
        { header: 'تأخر', key: 'late_days' }, { header: 'النسبة %', key: 'attendance_rate' },
      ], attReport, printOpts)
    } else if (tab === 'grades') {
      printTable('تقرير النتائج الدراسية', 'ملخص درجات الطلاب', [
        { header: 'الطالب', key: 'student_name' }, { header: 'الفصل', key: 'class_name' },
        { header: 'المتوسط %', key: 'avg_grade' }, { header: 'ناجح', key: 'passed' }, { header: 'راسب', key: 'failed' },
      ], gradesReport, printOpts)
    } else if (tab === 'students') {
      printTable('تقرير الطلاب المسجلين', `إجمالي ${studentsQuery.data?.total || 0} طالب`, [
        { header: 'الاسم', key: 'name' }, { header: 'الرقم', key: 'student_number' },
        { header: 'الفصل', key: 'class_name' }, { header: 'الجنس', key: 'gender' },
      ], studentsQuery.data?.students || [], printOpts)
    } else if (tab === 'fees') {
      printTable('تقرير الرسوم المالية', `المحصل: ${formatOMR(feesQuery.data?.totals?.total_collected)}`, [
        { header: 'الطالب', key: 'student_name' }, { header: 'الفصل', key: 'class_name' },
        { header: 'نوع الرسوم', key: 'fee_type' }, { header: 'المبلغ', key: 'amount' },
        { header: 'المدفوع', key: 'paid_amount' }, { header: 'المتبقي', key: 'remaining' }, { header: 'الحالة', key: 'status' },
      ], feesReport, printOpts)
    } else if (tab === 'hr') {
      printTable('تقرير الموارد البشرية', `إجمالي ${totalEmps} موظف`, [
        { header: 'الاسم', key: 'name' }, { header: 'المنصب', key: 'position' },
        { header: 'القسم', key: 'department' }, { header: 'الراتب', key: 'salary' }, { header: 'الحالة', key: 'status' },
      ], hrEmployees, printOpts)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <TrendingUp size={24} /> التقارير والإحصائيات
            </h1>
            <p className="text-sm opacity-90 mt-1">تحليل شامل — حضور، درجات، رسوم، طلاب، وموارد بشرية</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} disabled={tab === 'overview' || exportConfig[tab]?.disabled}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-bold disabled:opacity-40 transition-all">
              <Printer size={15} /> طباعة PDF
            </button>
            <button onClick={() => exportConfig[tab]?.fn()} disabled={tab === 'overview' || exportConfig[tab]?.disabled}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sm font-black disabled:opacity-40 transition-all"
              style={{ color: primaryColor }}>
              <Download size={15} /> CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-full overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${tab === t.id ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            style={tab === t.id ? { background: primaryColor } : {}}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard icon={<Users size={16} />} label="الطلاب النشطون" value={summaryQuery.data?.students ?? '—'} color="#6366f1" />
            <KpiCard icon={<Briefcase size={16} />} label="الموظفون النشطون" value={summaryQuery.data?.employees ?? '—'} color="#3b82f6" />
            <KpiCard icon={<Activity size={16} />} label="معدل الحضور" value={formatPct(summaryQuery.data?.attendanceRate)} color="#10b981" sub="30 يوم" />
            <KpiCard icon={<GraduationCap size={16} />} label="متوسط الدرجات" value={formatPct(summaryQuery.data?.avgGrade)} color="#f59e0b" />
            <KpiCard icon={<DollarSign size={16} />} label="المحصل" value={formatOMR(summaryQuery.data?.fees?.total_collected)} color="#14b8a6" sub={`${summaryQuery.data?.fees?.pending_count || 0} مستحق`} />
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
            <SectionCard title="أعلى الطلاب حضوراً" subtitle="أفضل 10 طلاب">
              {attQuery.isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...attReport].sort((a: any, b: any) => parseFloat(b.attendance_rate) - parseFloat(a.attendance_rate)).slice(0, 10)} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'Cairo' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [formatPct(v), 'الحضور']} />
                    <Bar dataKey="attendance_rate" fill={primaryColor} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
            <SectionCard title="توزيع الطلاب حسب الفصل" subtitle="عدد الطلاب في كل فصل">
              {studentsQuery.isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={studentsQuery.data?.byClass || []} dataKey="count" nameKey="class_name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}
                      label={(p: any) => `${p.class_name}: ${p.count}`}>
                      {(studentsQuery.data?.byClass || []).map((_: any, i: number) => <Cell key={i} fill={REPORT_COLORS[i % REPORT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
            <SectionCard title="حالة الرسوم" subtitle="توزيع المدفوعات">
              {feesQuery.isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={feesQuery.data?.byStatus || []} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="status" tickFormatter={(v) => feeStatusLabel(v).label} tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="عدد السجلات" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
            <SectionCard title="ملخص سريع">
              <div className="space-y-2">
                {[
                  { l: 'طلاب بحضور أقل من 80%', v: attReport.filter((r: any) => parseFloat(r.attendance_rate) < 80).length, c: '#ef4444', icon: <AlertTriangle size={14} /> },
                  { l: 'طلاب متفوقون (+90%)', v: gradesReport.filter((r: any) => parseFloat(r.avg_grade) >= 90).length, c: '#10b981', icon: <Award size={14} /> },
                  { l: 'رسوم مستحقة', v: summaryQuery.data?.fees?.pending_count || 0, c: '#f59e0b', icon: <DollarSign size={14} /> },
                  { l: 'موظفون في إجازة', v: (hrQuery.data?.byStatus || []).find((r: any) => r.status === 'on-leave')?.count || 0, c: '#0ea5e9', icon: <BookOpen size={14} /> },
                ].map(s => (
                  <div key={s.l} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-700">{s.icon}{s.l}</span>
                    <span className="text-xl font-black" style={{ color: s.c }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-600">من</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field w-40" />
              <span className="text-sm font-bold text-gray-600">إلى</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field w-40" />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[['student', 'الطلاب'], ['employee', 'الموظفون']].map(([v, l]) => (
                <button key={v} onClick={() => setPersonType(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${personType === v ? 'text-white' : 'text-gray-500'}`}
                  style={personType === v ? { background: primaryColor } : {}}>{l}</button>
              ))}
            </div>
          </div>
          {!attQuery.isLoading && attReport.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'إجمالي الأشخاص', value: attReport.length, color: '#6366f1' },
                { label: 'متوسط الحضور', value: avgAtt + '%', color: '#10b981' },
                { label: 'أيام الغياب', value: attReport.reduce((s: number, r: any) => s + parseInt(r.absent_days || 0), 0), color: '#ef4444' },
                { label: 'التأخر', value: attReport.reduce((s: number, r: any) => s + parseInt(r.late_days || 0), 0), color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="card flex items-center gap-3 !py-3">
                  <div className="w-2 h-10 rounded-full" style={{ background: s.color }} />
                  <div><p className="text-xs text-gray-400 font-bold">{s.label}</p><p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p></div>
                </div>
              ))}
            </div>
          )}
          <SectionCard title="معدلات الحضور" subtitle="أعلى 15 شخصاً">
            {attQuery.isLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[...attReport].sort((a: any, b: any) => parseFloat(b.attendance_rate) - parseFloat(a.attendance_rate)).slice(0, 15)} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'Cairo' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="attendance_rate" fill={primaryColor} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
          <div className="card overflow-x-auto !p-0">
            <div className="p-5 border-b border-gray-100 flex justify-between"><h3 className="font-black">التقرير التفصيلي</h3><span className="text-xs text-gray-400">{attReport.length} سجل</span></div>
            {attQuery.isLoading ? <LoadingSpinner /> : (
              <table className="w-full">
                <thead className="bg-gray-50"><tr>{['الاسم', 'المجموعة', 'حضور', 'غياب', 'تأخر', 'النسبة'].map(h => <th key={h} className="table-header text-xs">{h}</th>)}</tr></thead>
                <tbody>
                  {attReport.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">لا توجد بيانات</td></tr> :
                    attReport.map((r: any) => {
                      const rate = parseFloat(r.attendance_rate || 0)
                      return (
                        <tr key={r.person_id || r.name} className="table-row">
                          <td className="table-cell font-bold">{r.name}</td>
                          <td className="table-cell text-xs text-gray-500">{r.group_name || '—'}</td>
                          <td className="table-cell"><span className="badge-success">{r.present_days}</span></td>
                          <td className="table-cell"><span className="badge-danger">{r.absent_days}</span></td>
                          <td className="table-cell"><span className="badge-warning">{r.late_days}</span></td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(rate, 100)}%`, background: attendanceColor(rate) }} /></div>
                              <span className="text-xs font-black" style={{ color: attendanceColor(rate) }}>{rate.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'grades' && (
        <div className="space-y-4">
          {gradesQuery.isLoading ? <LoadingSpinner /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'إجمالي الطلاب', value: gradesReport.length, color: '#6366f1' },
                  { label: 'متوسط الدرجات', value: avgGrade + '%', color: '#3b82f6' },
                  { label: 'ناجحون', value: gradesReport.filter((r: any) => parseFloat(r.avg_grade) >= 50).length, color: '#10b981' },
                  { label: 'يحتاجون دعم', value: gradesReport.filter((r: any) => parseFloat(r.avg_grade) < 50).length, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="card flex items-center gap-3 !py-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + '15', color: s.color }}><GraduationCap size={15} /></div>
                    <div><p className="text-xs text-gray-400 font-bold">{s.label}</p><p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p></div>
                  </div>
                ))}
              </div>
              <SectionCard title="توزيع المتوسطات">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[...gradesReport].sort((a: any, b: any) => parseFloat(b.avg_grade) - parseFloat(a.avg_grade)).slice(0, 12)} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="student_name" tick={{ fontSize: 9, fontFamily: 'Cairo' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="avg_grade" fill={primaryColor} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
              <div className="card overflow-x-auto !p-0">
                <div className="p-5 border-b"><h3 className="font-black">تفاصيل الطلاب</h3></div>
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['#', 'الطالب', 'الفصل', 'المتوسط', 'ناجح', 'راسب', 'التقدير'].map(h => <th key={h} className="table-header text-xs">{h}</th>)}</tr></thead>
                  <tbody>
                    {gradesReport.map((r: any, i: number) => {
                      const avg = parseFloat(r.avg_grade || 0)
                      const gl = gradeLabel(avg)
                      return (
                        <tr key={r.student_id || r.student_name} className="table-row">
                          <td className="table-cell text-xs text-gray-400">{i + 1}</td>
                          <td className="table-cell font-bold">{r.student_name}</td>
                          <td className="table-cell text-xs">{r.class_name}</td>
                          <td className="table-cell font-black" style={{ color: gl.color }}>{r.avg_grade}%</td>
                          <td className="table-cell"><span className="badge-success text-xs">{r.passed}</span></td>
                          <td className="table-cell"><span className={r.failed > 0 ? 'badge-danger text-xs' : 'badge-gray text-xs'}>{r.failed}</span></td>
                          <td className="table-cell"><span className="text-xs font-black" style={{ color: gl.color }}>{gl.ar}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'students' && (
        <div className="space-y-4">
          {studentsQuery.isLoading ? <LoadingSpinner /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <KpiCard icon={<UserPlus size={16} />} label="إجمالي الطلاب النشطين" value={studentsQuery.data?.total || 0} color="#6366f1" />
                <KpiCard icon={<BookOpen size={16} />} label="عدد الفصول" value={(studentsQuery.data?.byClass || []).length} color="#10b981" />
                <KpiCard icon={<Users size={16} />} label="ذكور / إناث" value={`${(studentsQuery.data?.byGender || []).find((g: any) => g.gender === 'M')?.count || 0} / ${(studentsQuery.data?.byGender || []).find((g: any) => g.gender === 'F')?.count || 0}`} color="#f59e0b" />
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <SectionCard title="الطلاب حسب الفصل">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={studentsQuery.data?.byClass || []} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="class_name" tick={{ fontSize: 9, fontFamily: 'Cairo' }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
                <SectionCard title="حالة التسجيل">
                  <div className="space-y-2">
                    {(studentsQuery.data?.byStatus || []).map((r: any, i: number) => (
                      <div key={r.status} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-bold">{r.status === 'active' ? 'نشط' : r.status}</span>
                        <span className="font-black" style={{ color: REPORT_COLORS[i] }}>{r.count}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
              <div className="card overflow-x-auto !p-0">
                <div className="p-5 border-b flex justify-between"><h3 className="font-black">قائمة الطلاب</h3><FileSpreadsheet size={16} className="text-gray-300" /></div>
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['#', 'الاسم', 'الرقم', 'الفصل', 'الجنس'].map(h => <th key={h} className="table-header text-xs">{h}</th>)}</tr></thead>
                  <tbody>
                    {(studentsQuery.data?.students || []).map((s: any, i: number) => (
                      <tr key={s.id} className="table-row">
                        <td className="table-cell text-xs text-gray-400">{i + 1}</td>
                        <td className="table-cell font-bold">{s.name}</td>
                        <td className="table-cell text-xs font-mono">{s.student_number || '—'}</td>
                        <td className="table-cell text-xs">{s.class_name || '—'}</td>
                        <td className="table-cell text-xs">{s.gender === 'M' ? 'ذكر' : s.gender === 'F' ? 'أنثى' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'fees' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-3 items-center">
            <span className="text-sm font-bold text-gray-600">تصفية الحالة:</span>
            {[['', 'الكل'], ['paid', 'مدفوع'], ['unpaid', 'غير مدفوع'], ['partial', 'جزئي']].map(([v, l]) => (
              <button key={v} onClick={() => setFeeStatus(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${feeStatus === v ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                style={feeStatus === v ? { background: primaryColor } : {}}>{l}</button>
            ))}
          </div>
          {feesQuery.isLoading ? <LoadingSpinner /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'إجمالي المستحق', value: formatOMR(feesQuery.data?.totals?.total_due), color: '#6366f1' },
                  { label: 'المحصل', value: formatOMR(feesQuery.data?.totals?.total_collected), color: '#10b981' },
                  { label: 'المتبقي', value: formatOMR(feesQuery.data?.totals?.outstanding), color: '#ef4444' },
                  { label: 'سجلات معلقة', value: feesQuery.data?.totals?.pending_count || 0, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="card !py-3"><p className="text-xs text-gray-400 font-bold">{s.label}</p><p className="text-lg font-black mt-1" style={{ color: s.color }}>{s.value}</p></div>
                ))}
              </div>
              <SectionCard title="الرسوم حسب النوع">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={feesQuery.data?.byType || []} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fee_type" tick={{ fontSize: 9, fontFamily: 'Cairo' }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="total" name="المستحق" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="collected" name="المحصل" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>
              <div className="card overflow-x-auto !p-0">
                <div className="p-5 border-b"><h3 className="font-black">تفاصيل الرسوم</h3></div>
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['الطالب', 'الفصل', 'النوع', 'المبلغ', 'المدفوع', 'المتبقي', 'الحالة'].map(h => <th key={h} className="table-header text-xs">{h}</th>)}</tr></thead>
                  <tbody>
                    {feesReport.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا توجد رسوم</td></tr> :
                      feesReport.map((f: any) => {
                        const st = feeStatusLabel(f.status)
                        return (
                          <tr key={f.id} className="table-row">
                            <td className="table-cell font-bold">{f.student_name}</td>
                            <td className="table-cell text-xs">{f.class_name}</td>
                            <td className="table-cell text-xs">{f.fee_type}</td>
                            <td className="table-cell">{formatOMR(f.amount)}</td>
                            <td className="table-cell text-green-600 font-bold">{formatOMR(f.paid_amount)}</td>
                            <td className="table-cell text-red-500 font-bold">{formatOMR(f.remaining)}</td>
                            <td className="table-cell"><span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: st.color + '18', color: st.color }}>{st.label}</span></td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'hr' && (
        <div className="space-y-4">
          {hrQuery.isLoading ? <LoadingSpinner /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'إجمالي الموظفين', value: totalEmps, color: '#6366f1' },
                  { label: 'نشط', value: activeEmps, color: '#10b981' },
                  { label: 'إجازة', value: (hrQuery.data?.byStatus || []).find((r: any) => r.status === 'on-leave')?.count || 0, color: '#f59e0b' },
                  { label: 'غير نشط', value: (hrQuery.data?.byStatus || []).find((r: any) => r.status === 'inactive')?.count || 0, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} className="card flex items-center gap-3 !py-3">
                    <div className="w-2 h-10 rounded-full" style={{ background: s.color }} />
                    <div><p className="text-xs text-gray-400 font-bold">{s.label}</p><p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p></div>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <SectionCard title="الموظفون حسب القسم">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={hrQuery.data?.byDepartment || []} dataKey="count" nameKey="department" cx="50%" cy="50%" outerRadius={85} innerRadius={40} paddingAngle={3}
                        label={(p: any) => `${p.department}: ${p.count}`}>
                        {(hrQuery.data?.byDepartment || []).map((_: any, i: number) => <Cell key={i} fill={REPORT_COLORS[i % REPORT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                </SectionCard>
                <SectionCard title="الرواتب حسب القسم">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={hrQuery.data?.bySalary || []} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="department" tick={{ fontSize: 9, fontFamily: 'Cairo' }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [formatOMR(v), 'إجمالي']} />
                      <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>
              </div>
              <div className="card overflow-x-auto !p-0">
                <div className="p-5 border-b"><h3 className="font-black">كشف الموظفين الكامل</h3></div>
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>{['الاسم', 'المنصب', 'القسم', 'الراتب', 'الحالة', 'الهاتف'].map(h => <th key={h} className="table-header text-xs">{h}</th>)}</tr></thead>
                  <tbody>
                    {hrEmployees.map((e: any) => (
                      <tr key={e.id} className="table-row">
                        <td className="table-cell font-bold">{e.name}</td>
                        <td className="table-cell text-xs">{e.position || '—'}</td>
                        <td className="table-cell text-xs">{e.department || '—'}</td>
                        <td className="table-cell font-bold text-emerald-600">{formatOMR(e.salary)}</td>
                        <td className="table-cell"><span className={e.status === 'active' ? 'badge-success' : 'badge-warning'}>{e.status === 'active' ? 'نشط' : e.status}</span></td>
                        <td className="table-cell text-xs">{e.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
