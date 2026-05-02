import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, Users, GraduationCap, TrendingUp, Download } from 'lucide-react'

const API = (path: string) => fetch(`/api${path}`, {headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}}).then(r=>r.json())

export default function Reports() {
  const [tab, setTab] = useState<'attendance'|'grades'|'hr'>('attendance')
  const [startDate, setStartDate] = useState(new Date(Date.now()-30*86400000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [personType, setPersonType] = useState('student')

  const attQuery = useQuery({
    queryKey: ['report-att', startDate, endDate, personType],
    queryFn: () => API(`/reports/attendance-summary?startDate=${startDate}&endDate=${endDate}&personType=${personType}`)
  })
  const gradesQuery = useQuery({ queryKey:['report-grades'], queryFn:()=>API('/reports/grades-summary') })
  const hrQuery = useQuery({ queryKey:['report-hr'], queryFn:()=>API('/reports/hr-summary') })

  const DEPT_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#0ea5e9','#8b5cf6']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">التقارير والإحصائيات</h1>
          <p className="text-sm text-gray-400 mt-1">تحليل شامل لأداء المدرسة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {[['attendance','تقرير الحضور',Users],['grades','تقرير الدرجات',GraduationCap],['hr','تقرير الموارد البشرية',BarChart3]].map(([v,l,Icon]) => (
          <button key={v} onClick={()=>setTab(v as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab===v?'text-white shadow-sm':'text-gray-500 hover:text-gray-700'}`}
            style={tab===v?{background:'var(--color-primary)'}:{}}>
            <Icon size={16}/>{l}
          </button>
        ))}
      </div>

      {/* Attendance Report */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-600">من</span>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="input-field w-40"/>
              <span className="text-sm font-bold text-gray-600">إلى</span>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="input-field w-40"/>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {[['student','الطلاب'],['employee','الموظفون']].map(([v,l])=>(
                <button key={v} onClick={()=>setPersonType(v)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${personType===v?'text-white':'text-gray-500'}`}
                  style={personType===v?{background:'var(--color-primary)'}:{}}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card overflow-x-auto">
            <h3 className="font-black text-gray-700 mb-4">تقرير الحضور التفصيلي</h3>
            {attQuery.isLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div> : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">الاسم</th>
                    <th className="table-header">المجموعة</th>
                    <th className="table-header">أيام الحضور</th>
                    <th className="table-header">أيام الغياب</th>
                    <th className="table-header">التأخر</th>
                    <th className="table-header">نسبة الحضور</th>
                  </tr>
                </thead>
                <tbody>
                  {(attQuery.data?.report||[]).map((r:any,i:number)=>(
                    <tr key={i} className="table-row">
                      <td className="table-cell font-bold text-gray-800">{r.name}</td>
                      <td className="table-cell text-gray-500">{r.group_name||'—'}</td>
                      <td className="table-cell text-green-600 font-bold">{r.present_days}</td>
                      <td className="table-cell text-red-500 font-bold">{r.absent_days}</td>
                      <td className="table-cell text-amber-500 font-bold">{r.late_days}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${r.attendance_rate||0}%`,background:parseFloat(r.attendance_rate)>=80?'#10b981':parseFloat(r.attendance_rate)>=60?'#f59e0b':'#ef4444'}}/>
                          </div>
                          <span className="text-xs font-black">{parseFloat(r.attendance_rate||0).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Grades Report */}
      {tab === 'grades' && (
        <div className="space-y-4">
          {gradesQuery.isLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div> : (
            <>
              <div className="card">
                <h3 className="font-black text-gray-700 mb-4">توزيع الدرجات</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(gradesQuery.data?.report||[]).slice(0,10)}>
                    <XAxis dataKey="student_name" tick={{fontSize:10,fontFamily:'Cairo'}}/>
                    <YAxis domain={[0,100]}/>
                    <Tooltip contentStyle={{fontFamily:'Cairo',fontSize:12,borderRadius:12}}/>
                    <Bar dataKey="avg_grade" name="متوسط الدرجات" fill="var(--color-primary)" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card overflow-x-auto">
                <h3 className="font-black text-gray-700 mb-4">تقرير الطلاب التفصيلي</h3>
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>
                    <th className="table-header">#</th>
                    <th className="table-header">الطالب</th>
                    <th className="table-header">الفصل</th>
                    <th className="table-header">المتوسط</th>
                    <th className="table-header">الناجح</th>
                    <th className="table-header">الراسب</th>
                  </tr></thead>
                  <tbody>
                    {(gradesQuery.data?.report||[]).map((r:any,i:number)=>(
                      <tr key={i} className="table-row">
                        <td className="table-cell text-gray-400">{i+1}</td>
                        <td className="table-cell font-bold text-gray-800">{r.student_name}</td>
                        <td className="table-cell text-gray-500">{r.class_name}</td>
                        <td className="table-cell"><span className={`font-black text-lg ${parseFloat(r.avg_grade)>=75?'text-green-600':parseFloat(r.avg_grade)>=60?'text-amber-600':'text-red-500'}`}>{r.avg_grade||'—'}%</span></td>
                        <td className="table-cell text-green-600 font-bold">{r.passed}</td>
                        <td className="table-cell text-red-500 font-bold">{r.failed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* HR Report */}
      {tab === 'hr' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {hrQuery.isLoading ? <div className="flex justify-center py-10 col-span-2"><div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div> : (
            <>
              <div className="card">
                <h3 className="font-black text-gray-700 mb-4">الموظفون حسب القسم</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={hrQuery.data?.byDepartment||[]} dataKey="count" nameKey="department" cx="50%" cy="50%" outerRadius={80} label={({department,count})=>`${department}: ${count}`}>
                      {(hrQuery.data?.byDepartment||[]).map((_:any,i:number)=><Cell key={i} fill={DEPT_COLORS[i%DEPT_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{fontFamily:'Cairo',fontSize:12,borderRadius:12}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-black text-gray-700 mb-4">الرواتب حسب القسم</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hrQuery.data?.bySalary||[]}>
                    <XAxis dataKey="department" tick={{fontSize:10,fontFamily:'Cairo'}}/>
                    <YAxis/>
                    <Tooltip contentStyle={{fontFamily:'Cairo',fontSize:12,borderRadius:12}}/>
                    <Bar dataKey="total" name="إجمالي الرواتب" fill="#10b981" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-black text-gray-700 mb-3">حالة الموظفين</h3>
                <div className="space-y-3">
                  {(hrQuery.data?.byStatus||[]).map((r:any,i:number)=>(
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="font-bold text-gray-700">{r.status==='active'?'نشط':r.status==='on-leave'?'إجازة':'غير نشط'}</span>
                      <span className="text-xl font-black" style={{color:DEPT_COLORS[i]}}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="font-black text-gray-700 mb-3">نوع العقد</h3>
                <div className="space-y-3">
                  {(hrQuery.data?.byType||[]).map((r:any,i:number)=>(
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="font-bold text-gray-700">{r.employee_type==='full-time'?'دوام كامل':r.employee_type==='part-time'?'دوام جزئي':'عقد'}</span>
                      <span className="text-xl font-black" style={{color:DEPT_COLORS[i]}}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
