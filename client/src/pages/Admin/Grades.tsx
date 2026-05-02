import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gradesApi, studentsApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { ClipboardCheck, Award, TrendingUp, AlertTriangle, BarChart2, BookOpen, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const TERMS     = ['الفصل الأول','الفصل الثاني','الفصل الثالث','الفصل الصيفي'].map(v=>({value:v,label:v}))
const SUBJECTS  = ['الرياضيات','العلوم','اللغة العربية','اللغة الإنجليزية','التربية الإسلامية','التاريخ والجغرافيا','التربية الفنية','التربية البدنية'].map(v=>({value:v,label:v}))
const GRADE_THRESHOLDS = [
  { min: 90, label: 'ممتاز',    color: '#10b981', bg: '#d1fae5' },
  { min: 80, label: 'جيد جداً', color: '#3b82f6', bg: '#dbeafe' },
  { min: 70, label: 'جيد',      color: '#0ea5e9', bg: '#e0f2fe' },
  { min: 60, label: 'مقبول',    color: '#f59e0b', bg: '#fef3c7' },
  { min: 50, label: 'ضعيف',     color: '#f97316', bg: '#ffedd5' },
  { min:  0, label: 'راسب',     color: '#ef4444', bg: '#fee2e2' },
]

const emptyGrade = {
  studentId:'', subjectName:'', className:'', academicYear:'2024-2025', term:'الفصل الأول',
  score:'', maxScore:'100', teacherNotes:'', examDate:''
}

function gradeInfo(pct: number) {
  return GRADE_THRESHOLDS.find(g => pct >= g.min) || GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1]
}

export default function Grades() {
  const [modal,       setModal]       = useState(false)
  const [editing,     setEditing]     = useState<any>(null)
  const [form,        setForm]        = useState(emptyGrade)
  const [filterTerm,  setFilterTerm]  = useState('')
  const [filterYear,  setFilterYear]  = useState('2024-2025')
  const [filterSubj,  setFilterSubj]  = useState('')
  const [view,        setView]        = useState<'table'|'analysis'>('table')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['grades', filterTerm, filterYear],
    queryFn: () => gradesApi.list({ term: filterTerm, academicYear: filterYear }).then(r => r.data)
  })
  const { data: studentsData } = useQuery({
    queryKey: ['students-select'],
    queryFn: () => studentsApi.list().then(r => r.data)
  })

  const createMut = useMutation({ mutationFn: (d:any) => gradesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['grades']}); closeModal(); toast.success('✅ تم إضافة الدرجة') },
    onError: () => toast.error('حدث خطأ') })
  const updateMut = useMutation({ mutationFn: ({id,...d}:any) => gradesApi.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['grades']}); closeModal(); toast.success('✅ تم التعديل') },
    onError: () => toast.error('حدث خطأ') })
  const deleteMut = useMutation({ mutationFn: (id:string) => gradesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['grades']}); toast.success('تم الحذف') } })

  const openAdd = () => { setEditing(null); setForm(emptyGrade); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ studentId:row.student_id, subjectName:row.subject_name, className:row.class_name,
      academicYear:row.academic_year, term:row.term, score:row.score, maxScore:row.max_score,
      teacherNotes:row.teacher_notes||'', examDate:row.exam_date?.split('T')[0]||'' })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentId || !form.subjectName || !form.score) return toast.error('أدخل الطالب والمادة والدرجة')
    if (editing) updateMut.mutate({id:editing.id,...form})
    else createMut.mutate(form)
  }

  const allGrades = data?.grades || []
  const grades = useMemo(() => filterSubj ? allGrades.filter((g:any) => g.subject_name === filterSubj) : allGrades, [allGrades, filterSubj])

  const avgGrade = grades.length ? grades.reduce((s:number,g:any)=>s+parseFloat(g.percentage),0)/grades.length : 0
  const passed   = grades.filter((g:any)=>g.status==='pass').length
  const failed   = grades.filter((g:any)=>g.status==='fail').length
  const excellent= grades.filter((g:any)=>parseFloat(g.percentage)>=90).length

  // Subject analysis
  const subjectStats = useMemo(() => {
    const map: Record<string,{count:number;sum:number;pass:number}> = {}
    allGrades.forEach((g:any) => {
      const s = g.subject_name
      if (!map[s]) map[s] = {count:0,sum:0,pass:0}
      map[s].count++
      map[s].sum += parseFloat(g.percentage)
      if (g.status==='pass') map[s].pass++
    })
    return Object.entries(map).map(([name,v]) => ({
      name, avg:(v.sum/v.count).toFixed(1), passRate:((v.pass/v.count)*100).toFixed(0), count:v.count
    })).sort((a,b)=>parseFloat(b.avg)-parseFloat(a.avg))
  }, [allGrades])

  // Grade distribution
  const distribution = useMemo(() => GRADE_THRESHOLDS.map(t => ({
    ...t, count: grades.filter((g:any) => {
      const pct = parseFloat(g.percentage)
      const next = GRADE_THRESHOLDS[GRADE_THRESHOLDS.indexOf(t)-1]
      return pct >= t.min && (!next || pct < next.min)
    }).length
  })), [grades])

  const studentOptions = [{value:'',label:'اختر الطالب'}, ...(studentsData?.students||[]).map((s:any)=>({value:s.id, label:s.name}))]
  const availableSubjects = useMemo(()=>[...new Set(allGrades.map((g:any)=>g.subject_name))],[allGrades])
  const currentPct = form.score && form.maxScore ? parseFloat(form.score)/parseFloat(form.maxScore)*100 : null
  const currentGrade = currentPct !== null ? gradeInfo(currentPct) : null

  const columns = [
    { key:'student_name', label:'الطالب', sortable:true, render:(v:string,row:any)=>(
      <div><p className="font-bold text-gray-800">{v}</p><p className="text-xs text-gray-400">{row.student_class}</p></div>
    )},
    { key:'subject_name', label:'المادة', sortable:true, render:(v:string)=>(
      <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">{v}</span>
    )},
    { key:'term', label:'الفصل', render:(v:string)=><span className="text-xs text-gray-500">{v}</span> },
    { key:'score', label:'الدرجة', render:(v:any,row:any)=>(
      <span className="font-black text-gray-800">{v}<span className="text-gray-300 font-normal">/{row.max_score}</span></span>
    )},
    { key:'percentage', label:'النسبة', render:(v:any)=>{
      const info = gradeInfo(parseFloat(v))
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full" style={{width:`${Math.min(parseFloat(v),100)}%`,background:info.color}}/>
          </div>
          <span className="text-xs font-black" style={{color:info.color}}>{parseFloat(v).toFixed(1)}%</span>
        </div>
      )
    }},
    { key:'grade_letter', label:'التقدير', render:(v:string,row:any)=>{
      const info = gradeInfo(parseFloat(row.percentage))
      return <span className="text-sm font-black" style={{color:info.color}}>{v || info.label}</span>
    }},
    { key:'status', label:'النتيجة', render:(v:string)=>(
      <span className={v==='pass'?'badge-success':'badge-danger'}>{v==='pass'?'ناجح':'راسب'}</span>
    )},
    { key:'exam_date', label:'التاريخ', render:(v:string)=>v?<span className="text-xs text-gray-400">{new Date(v).toLocaleDateString('ar-OM')}</span>:<span className="text-gray-200">—</span> },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">النتائج الدراسية</h1>
          <p className="text-sm text-gray-400 mt-1">إدارة درجات واختبارات الطلاب</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={()=>setView('table')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view==='table'?'bg-white shadow text-gray-700':'text-gray-400'}`}>
            الجدول
          </button>
          <button onClick={()=>setView('analysis')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${view==='analysis'?'bg-white shadow text-gray-700':'text-gray-400'}`}>
            التحليل
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label:'إجمالي الدرجات', value: grades.length, icon: ClipboardCheck, color:'#6366f1' },
          { label:'متوسط عام',       value: avgGrade.toFixed(1)+'%', icon: TrendingUp, color:'#3b82f6' },
          { label:'الناجحون',        value: passed, icon: Award, color:'#10b981' },
          { label:'الراسبون',        value: failed, icon: AlertTriangle, color:'#ef4444' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3 !py-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:s.color+'18'}}>
              <s.icon size={16} style={{color:s.color}}/>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">{s.label}</p>
              <p className="text-xl font-black" style={{color:s.color}}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input-field text-sm py-2 w-auto" value={filterYear} onChange={e=>setFilterYear(e.target.value)}>
          {['2024-2025','2023-2024','2022-2023'].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input-field text-sm py-2 w-auto" value={filterTerm} onChange={e=>setFilterTerm(e.target.value)}>
          <option value="">كل الفصول</option>
          {TERMS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input-field text-sm py-2 w-auto" value={filterSubj} onChange={e=>setFilterSubj(e.target.value)}>
          <option value="">كل المواد</option>
          {availableSubjects.map((s:string)=><option key={s} value={s}>{s}</option>)}
        </select>
        {(filterTerm || filterSubj) && (
          <button onClick={()=>{setFilterTerm('');setFilterSubj('')}} className="text-xs text-red-500 font-bold px-3 py-2 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1">
            <Filter size={12}/> مسح الفلاتر
          </button>
        )}
      </div>

      {view === 'table' ? (
        <DataTable
          title="سجل الدرجات"
          data={grades}
          columns={columns}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={row => setDeleteTarget(row)}
          searchKeys={['student_name','subject_name','class_name']}
          addLabel="إضافة درجة"
          loading={isLoading}
          exportFilename="النتائج_الدراسية"
        />
      ) : (
        /* Analysis View */
        <div className="space-y-5">
          {/* Grade distribution */}
          <div className="card">
            <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-blue-500"/>توزيع الدرجات</h3>
            <div className="space-y-2">
              {distribution.map(d => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="w-16 text-xs font-black text-right" style={{color:d.color}}>{d.label}</div>
                  <div className="flex-1 h-7 bg-gray-100 rounded-xl overflow-hidden">
                    <div className="h-full rounded-xl flex items-center pr-3 transition-all duration-700"
                      style={{width:`${grades.length ? (d.count/grades.length*100) : 0}%`, background:d.color, minWidth: d.count > 0 ? '2rem':0}}>
                      {d.count > 0 && <span className="text-white text-[10px] font-black">{d.count}</span>}
                    </div>
                  </div>
                  <div className="w-12 text-xs font-bold text-gray-400 text-left">
                    {grades.length ? (d.count/grades.length*100).toFixed(0) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subject performance */}
          <div className="card">
            <h3 className="font-black text-gray-700 mb-4 flex items-center gap-2"><BookOpen size={16} className="text-emerald-500"/>أداء المواد الدراسية</h3>
            {subjectStats.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">لا توجد بيانات</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['المادة','عدد الطلاب','متوسط الدرجة','نسبة النجاح','المستوى'].map(h=>(
                        <th key={h} className="table-header text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjectStats.map(s=>{
                      const info = gradeInfo(parseFloat(s.avg))
                      return (
                        <tr key={s.name} className="table-row">
                          <td className="table-cell">
                            <span className="font-bold text-gray-800">{s.name}</span>
                          </td>
                          <td className="table-cell text-center text-gray-600 font-bold">{s.count}</td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{width:`${s.avg}%`,background:info.color}}/>
                              </div>
                              <span className="font-black text-sm" style={{color:info.color}}>{s.avg}%</span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className={`text-xs font-black px-2 py-1 rounded-lg ${parseFloat(s.passRate)>=80?'bg-emerald-50 text-emerald-700':parseFloat(s.passRate)>=60?'bg-amber-50 text-amber-700':'bg-red-50 text-red-600'}`}>
                              {s.passRate}%
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="text-xs font-black" style={{color:info.color}}>{info.label}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Excellence vs failing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card !p-4 border-r-4 border-emerald-400">
              <h4 className="font-black text-emerald-700 mb-3 text-sm">المتفوقون (+90%)</h4>
              <p className="text-4xl font-black text-emerald-600">{excellent}</p>
              <p className="text-xs text-gray-400 mt-1">طالب متفوق</p>
            </div>
            <div className="card !p-4 border-r-4 border-red-400">
              <h4 className="font-black text-red-700 mb-3 text-sm">يحتاجون دعم (أقل 60%)</h4>
              <p className="text-4xl font-black text-red-600">{distribution.find(d=>d.label==='ضعيف')?.count || 0 + (distribution.find(d=>d.label==='راسب')?.count||0)}</p>
              <p className="text-xs text-gray-400 mt-1">طالب بحاجة للمتابعة</p>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title={editing?'تعديل الدرجة':'إضافة درجة جديدة'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="الطالب" required>
            <Select value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} options={studentOptions}/>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="المادة" required>
              <Select value={form.subjectName} onChange={e=>setForm({...form,subjectName:e.target.value})} options={[{value:'',label:'اختر المادة'}, ...SUBJECTS]} placeholder=""/>
            </FormField>
            <FormField label="الفصل الدراسي">
              <Select value={form.term} onChange={e=>setForm({...form,term:e.target.value})} options={TERMS}/>
            </FormField>
            <FormField label="الدرجة المحققة" required>
              <Input type="number" min="0" max="200" value={form.score} onChange={e=>setForm({...form,score:e.target.value})} placeholder="85"/>
            </FormField>
            <FormField label="الدرجة الكاملة">
              <Input type="number" value={form.maxScore} onChange={e=>setForm({...form,maxScore:e.target.value})} placeholder="100"/>
            </FormField>
            <FormField label="العام الدراسي">
              <Input value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/>
            </FormField>
            <FormField label="تاريخ الاختبار">
              <Input type="date" value={form.examDate} onChange={e=>setForm({...form,examDate:e.target.value})}/>
            </FormField>
          </div>
          <FormField label="ملاحظات المعلم">
            <Textarea value={form.teacherNotes} onChange={e=>setForm({...form,teacherNotes:e.target.value})} placeholder="ملاحظات على أداء الطالب..."/>
          </FormField>

          {/* Grade preview */}
          {currentPct !== null && currentGrade && (
            <div className="p-4 rounded-2xl text-center" style={{background:currentGrade.bg}}>
              <p className="text-2xl font-black mb-1" style={{color:currentGrade.color}}>
                {currentPct.toFixed(1)}% — {currentGrade.label}
              </p>
              <p className="text-xs font-bold" style={{color:currentGrade.color}}>
                {currentPct >= 50 ? '✅ ناجح' : '❌ راسب'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1 py-3 font-black"
              disabled={createMut.isPending||updateMut.isPending}>
              {editing?'حفظ التعديلات':'إضافة الدرجة'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الدرجة"
        message={deleteTarget ? `هل تريد حذف درجة ${deleteTarget.student_name} في مادة ${deleteTarget.subject_name}؟ لا يمكن التراجع.` : ''}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
