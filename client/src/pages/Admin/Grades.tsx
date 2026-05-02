import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gradesApi, studentsApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { ClipboardCheck, Award, TrendingUp, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const TERMS = ['الفصل الأول','الفصل الثاني','الفصل الثالث','الفصل الصيفي'].map(v=>({value:v,label:v}))
const SUBJECTS = ['الرياضيات','العلوم','اللغة العربية','اللغة الإنجليزية','التربية الإسلامية','التاريخ والجغرافيا','التربية الفنية','التربية البدنية'].map(v=>({value:v,label:v}))

const emptyGrade = {
  studentId:'', subjectName:'', className:'', academicYear:'2024-2025', term:'الفصل الأول',
  score:'', maxScore:'100', teacherNotes:'', examDate:''
}

function gradeColor(pct: number) {
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 75) return 'text-blue-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}
function gradeBg(pct: number) {
  if (pct >= 90) return 'bg-emerald-50'
  if (pct >= 75) return 'bg-blue-50'
  if (pct >= 60) return 'bg-amber-50'
  return 'bg-red-50'
}

export default function Grades() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyGrade)
  const [filterTerm, setFilterTerm] = useState('')
  const [filterYear, setFilterYear] = useState('2024-2025')
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
    onSuccess: () => { qc.invalidateQueries({queryKey:['grades']}); closeModal(); toast.success('تم إضافة الدرجة') },
    onError: () => toast.error('حدث خطأ') })
  const updateMut = useMutation({ mutationFn: ({id,...d}:any) => gradesApi.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['grades']}); closeModal(); toast.success('تم التعديل') },
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

  const grades = data?.grades || []
  const avgGrade = grades.length ? grades.reduce((s:number,g:any)=>s+parseFloat(g.percentage),0)/grades.length : 0
  const passed = grades.filter((g:any)=>g.status==='pass').length
  const failed = grades.filter((g:any)=>g.status==='fail').length

  const studentOptions = [{value:'',label:'اختر الطالب'}, ...(studentsData?.students||[]).map((s:any)=>({value:s.id, label:s.name}))]

  const columns = [
    { key:'student_name', label:'الطالب', sortable:true, render:(v:string,row:any)=>(
      <div><p className="font-bold text-gray-800">{v}</p><p className="text-xs text-gray-400">{row.student_class}</p></div>
    )},
    { key:'subject_name', label:'المادة', sortable:true },
    { key:'term', label:'الفصل' },
    { key:'score', label:'الدرجة', render:(v:any,row:any)=>(
      <span className="font-black text-gray-800">{v}/{row.max_score}</span>
    )},
    { key:'percentage', label:'النسبة', render:(v:any)=>(
      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${gradeBg(parseFloat(v))}`}>
        <span className={`font-black text-sm ${gradeColor(parseFloat(v))}`}>{parseFloat(v).toFixed(1)}%</span>
      </div>
    )},
    { key:'grade_letter', label:'التقدير', render:(v:string,row:any)=>(
      <span className={`font-black text-lg ${gradeColor(parseFloat(row.percentage))}`}>{v}</span>
    )},
    { key:'status', label:'النتيجة', render:(v:string)=>(
      <span className={v==='pass'?'badge-success':'badge-danger'}>{v==='pass'?'ناجح':'راسب'}</span>
    )},
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">النتائج الدراسية</h1>
        <p className="text-sm text-gray-400 mt-1">إدارة درجات واختبارات الطلاب</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {label:'إجمالي الدرجات', value: grades.length, icon: ClipboardCheck, color:'#6366f1'},
          {label:'متوسط الدرجات', value: avgGrade.toFixed(1)+'%', icon: TrendingUp, color:'#3b82f6'},
          {label:'الناجحون', value: passed, icon: Award, color:'#10b981'},
          {label:'الراسبون', value: failed, icon: AlertTriangle, color:'#ef4444'},
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:s.color+'15'}}>
              <s.icon size={18} style={{color:s.color}}/>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold">{s.label}</p>
              <p className="text-xl font-black" style={{color:s.color}}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        title="سجل الدرجات"
        data={grades}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row => { if(confirm('حذف هذه الدرجة؟')) deleteMut.mutate(row.id) }}
        searchKeys={['student_name','subject_name']}
        addLabel="إضافة درجة"
        loading={isLoading}
        filters={
          <select className="input-field w-40 text-sm py-2" value={filterTerm} onChange={e=>setFilterTerm(e.target.value)}>
            <option value="">كل الفصول</option>
            {TERMS.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        }
      />

      <Modal open={modal} onClose={closeModal} title={editing?'تعديل الدرجة':'إضافة درجة جديدة'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="الطالب" required>
            <Select value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} options={studentOptions}/>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="المادة" required>
              <Select value={form.subjectName} onChange={e=>setForm({...form,subjectName:e.target.value})} options={[{value:'',label:'اختر'}, ...SUBJECTS]} placeholder=""/>
            </FormField>
            <FormField label="الفصل الدراسي">
              <Select value={form.term} onChange={e=>setForm({...form,term:e.target.value})} options={TERMS}/>
            </FormField>
            <FormField label="الدرجة المحققة" required>
              <Input type="number" min="0" max="100" value={form.score} onChange={e=>setForm({...form,score:e.target.value})}/>
            </FormField>
            <FormField label="الدرجة الكاملة">
              <Input type="number" value={form.maxScore} onChange={e=>setForm({...form,maxScore:e.target.value})}/>
            </FormField>
            <FormField label="العام الدراسي">
              <Input value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/>
            </FormField>
            <FormField label="تاريخ الاختبار">
              <Input type="date" value={form.examDate} onChange={e=>setForm({...form,examDate:e.target.value})}/>
            </FormField>
          </div>
          <FormField label="ملاحظات المعلم">
            <Textarea value={form.teacherNotes} onChange={e=>setForm({...form,teacherNotes:e.target.value})}/>
          </FormField>
          {form.score && form.maxScore && (
            <div className={`p-3 rounded-xl text-center ${gradeBg(parseFloat(form.score)/parseFloat(form.maxScore)*100)}`}>
              <p className={`text-lg font-black ${gradeColor(parseFloat(form.score)/parseFloat(form.maxScore)*100)}`}>
                {(parseFloat(form.score)/parseFloat(form.maxScore)*100).toFixed(1)}% — {parseFloat(form.score)/parseFloat(form.maxScore)*100 >= 50 ? '✅ ناجح' : '❌ راسب'}
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3">
              {editing?'حفظ التعديلات':'إضافة الدرجة'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
