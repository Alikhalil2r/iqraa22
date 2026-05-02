import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { BarChart3, Users, GraduationCap, Download, TrendingUp, Award, CheckCircle, AlertTriangle, Activity, Briefcase, BookOpen } from 'lucide-react'
import { exportToCSV } from '../../components/ExportButton'

const API = (path: string) =>
  fetch(`/api${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json())

const DEPT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6']
const TOOLTIP_STYLE = { fontFamily: 'Cairo', fontSize: 12, borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }

type TabType = 'overview' | 'attendance' | 'grades' | 'hr'

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

function KpiCard({ icon, label, value, sub, color }: any) {
  return (
    <div className="card flex items-start gap-3 !py-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '18', color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-bold truncate">{label}</p>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Reports() {
  const [tab, setTab]             = useState<TabType>('overview')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
  const [endDate, setEndDate]     = useState(new Date().toISOString().split('T')[0])
  const [personType, setPersonType] = useState('student')

  const attQuery    = useQuery({ queryKey: ['report-att', startDate, endDate, personType],    queryFn: () => API(`/reports/attendance-summary?startDate=${startDate}&endDate=${endDate}&personType=${personType}`) })
  const gradesQuery = useQuery({ queryKey: ['report-grades'], queryFn: () => API('/reports/grades-summary') })
  const hrQuery     = useQuery({ queryKey: ['report-hr'],     queryFn: () => API('/reports/hr-summary') })

  const exportAttendance = () => exportToCSV(attQuery.data?.report || [], [
    { key: 'name', label: 'الاسم' }, { key: 'group_name', label: 'المجموعة' },
    { key: 'present_days', label: 'أيام الحضور' }, { key: 'absent_days', label: 'أيام الغياب' },
    { key: 'late_days', label: 'أيام التأخر' }, { key: 'attendance_rate', label: 'نسبة الحضور %' },
  ], `تقرير_الحضور_${personType === 'student' ? 'الطلاب' : 'الموظفين'}`)

  const exportGrades = () => exportToCSV(gradesQuery.data?.report || [], [
    { key: 'student_name', label: 'الطالب' }, { key: 'class_name', label: 'الفصل' },
    { key: 'avg_grade', label: 'متوسط الدرجات %' }, { key: 'passed', label: 'المواد الناجحة' }, { key: 'failed', label: 'المواد الراسبة' },
  ], 'تقرير_الدرجات')

  const exportHR = () => exportToCSV(hrQuery.data?.byDepartment || [], [
    { key: 'department', label: 'القسم' }, { key: 'count', label: 'عدد الموظفين' },
  ], 'تقرير_الموارد_البشرية')

  const attReport    = attQuery.data?.report || []
  const gradesReport = gradesQuery.data?.report || []
  const avgAtt     = attReport.length ? (attReport.reduce((s: number, r: any) => s + parseFloat(r.attendance_rate || 0), 0) / attReport.length).toFixed(1) : '—'
  const avgGrade   = gradesReport.length ? (gradesReport.reduce((s: number, r: any) => s + parseFloat(r.avg_grade || 0), 0) / gradesReport.length).toFixed(1) : '—'
  const totalEmps  = (hrQuery.data?.byStatus || []).reduce((s: number, r: any) => s + parseInt(r.count), 0)
  const activeEmps = (hrQuery.data?.byStatus || []).find((r: any) => r.status === 'active')?.count || 0

  const TABS: [TabType, string, any][] = [
    ['overview',    'نظرة عامة',       Activity],
    ['attendance',  'تقرير الحضور',    Users],
    ['grades',      'تقرير الدرجات',   GraduationCap],
    ['hr',          'الموارد البشرية', BarChart3],
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <TrendingUp size={22} style={{ color: 'var(--color-primary)' }} />
            التقارير والإحصائيات
          </h1>
          <p className="text-sm text-gray-400 mt-1">تحليل شامل لأداء المدرسة والبيانات الإدارية</p>
        </div>
        <button
          onClick={tab === 'attendance' ? exportAttendance : tab === 'grades' ? exportGrades : tab === 'hr' ? exportHR : () => {}}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all"
          disabled={tab === 'overview'}
        >
          <Download size={15} className="text-green-600" />
          تصدير CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit flex-wrap">
        {TABS.map(([v, l, Icon]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === v ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            style={tab === v ? { background: 'var(--color-primary)' } : {}}>
            <Icon size={14} />{l}
          </button>
        ))}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={<Users size={16}/>}        label="متوسط حضور الطلاب"    value={`${avgAtt}%`}    color="#6366f1" sub="آخر 30 يوم"/>
            <KpiCard icon={<GraduationCap size={16}/>} label="متوسط درجات الطلاب"   value={`${avgGrade}%`}  color="#10b981" sub="جميع المواد"/>
            <KpiCard icon={<Briefcase size={16}/>}    label="الموظفون النشطون"      value={activeEmps}       color="#3b82f6" sub={`من ${totalEmps} موظف`}/>
            <KpiCard icon={<BookOpen size={16}/>}     label="إجمالي الطلاب"         value={attReport.filter((r:any)=>personType==='student').length || gradesReport.length}  color="#f59e0b" sub="مسجلون"/>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Attendance by group chart */}
            <div className="card">
              <h3 className="font-black text-gray-700 mb-1">أعلى الطلاب حضوراً</h3>
              <p className="text-xs text-gray-400 mb-4">أفضل 10 طلاب حسب معدل الحضور</p>
              {attQuery.isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...attReport].sort((a:any,b:any)=>parseFloat(b.attendance_rate)-parseFloat(a.attendance_rate)).slice(0,10)} barSize={18}>
                    <XAxis dataKey="name" tick={{fontSize:9,fontFamily:'Cairo'}} />
                    <YAxis domain={[0,100]} tick={{fontSize:9}} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any) => [`${parseFloat(v as string).toFixed(1)}%`,'الحضور']}/>
                    <Bar dataKey="attendance_rate" name="نسبة الحضور" fill="var(--color-primary)" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Grades distribution */}
            <div className="card">
              <h3 className="font-black text-gray-700 mb-1">توزيع الدرجات</h3>
              <p className="text-xs text-gray-400 mb-4">أعلى 10 طلاب أكاديمياً</p>
              {gradesQuery.isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[...gradesReport].sort((a:any,b:any)=>parseFloat(b.avg_grade)-parseFloat(a.avg_grade)).slice(0,10)} barSize={18}>
                    <XAxis dataKey="student_name" tick={{fontSize:9,fontFamily:'Cairo'}} />
                    <YAxis domain={[0,100]} tick={{fontSize:9}}/>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[`${parseFloat(v as string).toFixed(1)}%`,'المتوسط']}/>
                    <Bar dataKey="avg_grade" name="متوسط الدرجات" fill="#10b981" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* HR Pie */}
            <div className="card">
              <h3 className="font-black text-gray-700 mb-1">توزيع الموظفين</h3>
              <p className="text-xs text-gray-400 mb-4">حسب القسم الوظيفي</p>
              {hrQuery.isLoading ? <LoadingSpinner /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={hrQuery.data?.byDepartment||[]} dataKey="count" nameKey="department" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={3}
                      label={(p:any) => `${p.department}: ${p.count}`}>
                      {(hrQuery.data?.byDepartment||[]).map((_:any,i:number)=><Cell key={i} fill={DEPT_COLORS[i%DEPT_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Quick stats */}
            <div className="card space-y-3">
              <h3 className="font-black text-gray-700 mb-2">ملخص سريع</h3>
              {[
                { l: 'الطلاب بحضور أقل من 80%', v: attReport.filter((r:any)=>parseFloat(r.attendance_rate)<80).length, c:'#ef4444', icon:<AlertTriangle size={14}/> },
                { l: 'الطلاب المتفوقون (أعلى 90%)', v: gradesReport.filter((r:any)=>parseFloat(r.avg_grade)>=90).length, c:'#10b981', icon:<Award size={14}/> },
                { l: 'الطلاب بحاجة دعم (أقل 50%)', v: gradesReport.filter((r:any)=>parseFloat(r.avg_grade)<50).length, c:'#f59e0b', icon:<AlertTriangle size={14}/> },
                { l: 'الموظفون في إجازة', v: (hrQuery.data?.byStatus||[]).find((r:any)=>r.status==='on-leave')?.count||0, c:'#0ea5e9', icon:<CheckCircle size={14}/> },
              ].map(s => (
                <div key={s.l} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700" style={{color:s.c}}>{s.icon}<span className="text-gray-700">{s.l}</span></div>
                  <span className="text-xl font-black" style={{color:s.c}}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance Report ──────────────────────────────────────────────── */}
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
              {[['student','الطلاب'],['employee','الموظفون']].map(([v,l])=>(
                <button key={v} onClick={()=>setPersonType(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${personType===v?'text-white':'text-gray-500'}`}
                  style={personType===v?{background:'var(--color-primary)'}:{}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {!attQuery.isLoading && attReport.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label:'إجمالي الأشخاص', value:attReport.length, color:'#6366f1' },
                { label:'متوسط الحضور', value:avgAtt+'%', color:'#10b981' },
                { label:'إجمالي أيام الغياب', value:attReport.reduce((s:number,r:any)=>s+parseInt(r.absent_days||0),0), color:'#ef4444' },
                { label:'إجمالي التأخر', value:attReport.reduce((s:number,r:any)=>s+parseInt(r.late_days||0),0), color:'#f59e0b' },
              ].map(s=>(
                <div key={s.label} className="card flex items-center gap-3 !py-3">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{background:s.color}}/>
                  <div>
                    <p className="text-xs text-gray-400 font-bold">{s.label}</p>
                    <p className="text-xl font-black" style={{color:s.color}}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h3 className="font-black text-gray-700 mb-4">معدلات حضور الأفراد</h3>
            {attQuery.isLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[...attReport].sort((a:any,b:any)=>parseFloat(b.attendance_rate)-parseFloat(a.attendance_rate)).slice(0,15)} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{fontSize:9,fontFamily:'Cairo'}}/>
                  <YAxis domain={[0,100]} tick={{fontSize:9}}/>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[`${parseFloat(v as string).toFixed(1)}%`,'الحضور']}/>
                  <Bar dataKey="attendance_rate" name="الحضور %" radius={[6,6,0,0]} fill="var(--color-primary)"/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card overflow-x-auto !p-0">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-700">تقرير الحضور التفصيلي</h3>
              <span className="text-xs text-gray-400">{attReport.length} شخص</span>
            </div>
            {attQuery.isLoading ? <LoadingSpinner /> : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['الاسم','المجموعة','أيام الحضور','أيام الغياب','التأخر','نسبة الحضور'].map(h=>(
                      <th key={h} className="table-header text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attReport.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">لا توجد بيانات للفترة المحددة</td></tr>
                  ) : attReport.map((r:any,i:number) => {
                    const rate = parseFloat(r.attendance_rate||0)
                    return (
                      <tr key={i} className="table-row">
                        <td className="table-cell font-bold text-gray-800">{r.name}</td>
                        <td className="table-cell text-gray-500 text-xs">{r.group_name||'—'}</td>
                        <td className="table-cell"><span className="badge-success">{r.present_days}</span></td>
                        <td className="table-cell"><span className="badge-danger">{r.absent_days}</span></td>
                        <td className="table-cell"><span className="badge-warning">{r.late_days}</span></td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
                              <div className="h-full rounded-full" style={{width:`${Math.min(rate,100)}%`,background:rate>=80?'#10b981':rate>=60?'#f59e0b':'#ef4444'}}/>
                            </div>
                            <span className={`text-xs font-black ${rate>=80?'text-green-600':rate>=60?'text-amber-600':'text-red-500'}`}>
                              {rate.toFixed(0)}%
                            </span>
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

      {/* ── Grades Report ──────────────────────────────────────────────────── */}
      {tab === 'grades' && (
        <div className="space-y-4">
          {gradesQuery.isLoading ? <LoadingSpinner /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(() => {
                  const passed = gradesReport.filter((r:any)=>parseFloat(r.avg_grade)>=50).length
                  const failed = gradesReport.length - passed
                  const excellent = gradesReport.filter((r:any)=>parseFloat(r.avg_grade)>=90).length
                  return [
                    { label:'إجمالي الطلاب', value:gradesReport.length, color:'#6366f1', icon:<GraduationCap size={15}/> },
                    { label:'متوسط الدرجات', value:avgGrade+'%', color:'#3b82f6', icon:<TrendingUp size={15}/> },
                    { label:'الناجحون', value:passed, color:'#10b981', icon:<Award size={15}/> },
                    { label:'يحتاجون دعم', value:failed, color:'#ef4444', icon:<AlertTriangle size={15}/> },
                  ].map(s=>(
                    <div key={s.label} className="card flex items-center gap-3 !py-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:s.color+'18',color:s.color}}>{s.icon}</div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold">{s.label}</p>
                        <p className="text-xl font-black" style={{color:s.color}}>{s.value}</p>
                      </div>
                    </div>
                  ))
                })()}
              </div>

              <div className="card">
                <h3 className="font-black text-gray-700 mb-4">توزيع متوسطات الدرجات (أعلى 12 طالباً)</h3>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={[...gradesReport].sort((a:any,b:any)=>parseFloat(b.avg_grade)-parseFloat(a.avg_grade)).slice(0,12)} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="student_name" tick={{fontSize:9,fontFamily:'Cairo'}}/>
                    <YAxis domain={[0,100]} tick={{fontSize:9}}/>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v:any)=>[`${parseFloat(v as string).toFixed(1)}%`,'المتوسط']}/>
                    <Bar dataKey="avg_grade" name="متوسط الدرجات" fill="var(--color-primary)" radius={[8,8,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card overflow-x-auto !p-0">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-black text-gray-700">تقرير الطلاب التفصيلي</h3>
                  <span className="text-xs text-gray-400">{gradesReport.length} طالب</span>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#','الطالب','الفصل','المتوسط','ناجح','راسب','التقدير'].map(h=>(
                        <th key={h} className="table-header text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gradesReport.map((r:any,i:number)=>{
                      const avg = parseFloat(r.avg_grade||0)
                      const grade = avg>=90?'ممتاز':avg>=80?'جيد جداً':avg>=70?'جيد':avg>=60?'مقبول':avg>=50?'ضعيف':'راسب'
                      const color = avg>=75?'text-green-600':avg>=60?'text-amber-600':'text-red-500'
                      return (
                        <tr key={i} className="table-row">
                          <td className="table-cell text-gray-400 text-xs w-8">{i+1}</td>
                          <td className="table-cell font-bold text-gray-800">{r.student_name}</td>
                          <td className="table-cell text-gray-500 text-xs">{r.class_name}</td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{width:`${Math.min(avg,100)}%`,background:avg>=75?'#10b981':avg>=60?'#f59e0b':'#ef4444'}}/>
                              </div>
                              <span className={`text-sm font-black ${color}`}>{r.avg_grade||'—'}%</span>
                            </div>
                          </td>
                          <td className="table-cell"><span className="badge-success text-xs">{r.passed}</span></td>
                          <td className="table-cell"><span className={r.failed>0?'badge-danger text-xs':'badge-gray text-xs'}>{r.failed}</span></td>
                          <td className="table-cell"><span className={`text-xs font-black ${color}`}>{grade}</span></td>
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

      {/* ── HR Report ──────────────────────────────────────────────────────── */}
      {tab === 'hr' && (
        <div className="space-y-4">
          {hrQuery.isLoading ? <LoadingSpinner /> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label:'إجمالي الموظفين', value:totalEmps, color:'#6366f1' },
                  { label:'نشط', value:activeEmps, color:'#10b981' },
                  { label:'في إجازة', value:(hrQuery.data?.byStatus||[]).find((r:any)=>r.status==='on-leave')?.count||0, color:'#f59e0b' },
                  { label:'غير نشط', value:(hrQuery.data?.byStatus||[]).find((r:any)=>r.status==='inactive')?.count||0, color:'#ef4444' },
                ].map(s=>(
                  <div key={s.label} className="card flex items-center gap-3 !py-3">
                    <div className="w-2 h-10 rounded-full flex-shrink-0" style={{background:s.color}}/>
                    <div>
                      <p className="text-xs text-gray-400 font-bold">{s.label}</p>
                      <p className="text-2xl font-black" style={{color:s.color}}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-black text-gray-700 mb-4">الموظفون حسب القسم</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={hrQuery.data?.byDepartment||[]} dataKey="count" nameKey="department" cx="50%" cy="50%"
                        outerRadius={85} innerRadius={40} paddingAngle={3}
                        label={(p:any)=>`${p.department}: ${p.count}`}>
                        {(hrQuery.data?.byDepartment||[]).map((_:any,i:number)=><Cell key={i} fill={DEPT_COLORS[i%DEPT_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-black text-gray-700 mb-4">الرواتب حسب القسم (ريال)</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={hrQuery.data?.bySalary||[]} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="department" tick={{fontSize:9,fontFamily:'Cairo'}}/>
                      <YAxis tick={{fontSize:9}}/>
                      <Tooltip contentStyle={TOOLTIP_STYLE}/>
                      <Bar dataKey="total" name="إجمالي الرواتب" fill="#10b981" radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-black text-gray-700 mb-3">حالة الموظفين</h3>
                  <div className="space-y-3">
                    {(hrQuery.data?.byStatus||[]).map((r:any,i:number)=>{
                      const label = r.status==='active'?'نشط':r.status==='on-leave'?'إجازة':'غير نشط'
                      const badge = r.status==='active'?'badge-success':r.status==='on-leave'?'badge-warning':'badge-gray'
                      return (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <span className={badge}>{label}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${totalEmps?(parseInt(r.count)/totalEmps*100):0}%`,background:DEPT_COLORS[i]}}/>
                            </div>
                            <span className="text-xl font-black" style={{color:DEPT_COLORS[i]}}>{r.count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-black text-gray-700 mb-3">نوع العقد</h3>
                  <div className="space-y-3">
                    {(hrQuery.data?.byType||[]).map((r:any,i:number)=>{
                      const label = r.employee_type==='full-time'?'دوام كامل':r.employee_type==='part-time'?'دوام جزئي':'عقد'
                      return (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <span className="font-bold text-gray-700">{label}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{width:`${totalEmps?(parseInt(r.count)/totalEmps*100):0}%`,background:DEPT_COLORS[i]}}/>
                            </div>
                            <span className="text-xl font-black" style={{color:DEPT_COLORS[i]}}>{r.count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
