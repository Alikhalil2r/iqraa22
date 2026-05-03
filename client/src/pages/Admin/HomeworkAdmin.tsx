import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { homeworkApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import {
  ClipboardList, Plus, BookOpen, Clock, CheckCircle, Users,
  AlertTriangle, ChevronLeft, Pencil, Trash2, Star, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const CLASSES = ['الصف الرابع - أ','الصف الرابع - ب','الصف الخامس - أ','الصف الخامس - ب','الصف السادس - أ','الصف السادس - ب',
                 'الصف السابع - أ','الصف السابع - ب','الصف الثامن - أ','الصف الثامن - ب'].map(v=>({value:v,label:v}))
const SUBJECTS = ['الرياضيات','اللغة العربية','اللغة الإنجليزية','العلوم','التربية الإسلامية','التاريخ','الجغرافيا','الحاسوب'].map(v=>({value:v,label:v}))

const emptyForm = { className:'', subjectName:'', title:'', description:'', dueDate:'', maxScore:'10' }

function ProgressRing({ pct, color, size=40 }: { pct:number; color:string; size?:number }) {
  const r = size/2 - 4, circ = 2*Math.PI*r, offset = circ*(1-pct/100)
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{transition:'stroke-dashoffset 0.5s ease'}}/>
    </svg>
  )
}

export default function HomeworkAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [gradingHw, setGradingHw] = useState<any>(null)
  const [gradeForm, setGradeForm] = useState<Record<string,{score:string;feedback:string}>>({})
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['homework', filterClass, filterStatus],
    queryFn: () => homeworkApi.list({ className: filterClass||undefined, status: filterStatus||undefined }).then(r=>r.data),
    staleTime: 30000
  })
  const { data: submData } = useQuery({
    queryKey: ['hw-submissions', expanded],
    queryFn: () => expanded ? homeworkApi.submissions(expanded).then(r=>r.data) : Promise.resolve({submissions:[]}),
    enabled: !!expanded,
    staleTime: 20000
  })
  const { data: gradingSubmData } = useQuery({
    queryKey: ['hw-grading-submissions', gradingHw?.id],
    queryFn: () => gradingHw ? homeworkApi.submissions(gradingHw.id).then(r=>r.data) : Promise.resolve({submissions:[]}),
    enabled: !!gradingHw,
    staleTime: 0
  })

  const hw   = data?.homework || []
  const stats = data?.stats   || {}
  const submissions = submData?.submissions || []
  const gradingSubmissions = gradingSubmData?.submissions || []

  const createMut = useMutation({
    mutationFn: (d:any) => homeworkApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['homework']}); closeModal(); toast.success('تم تعيين الواجب') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({id,...d}:any) => homeworkApi.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['homework']}); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id:string) => homeworkApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['homework']}); setDeleteTarget(null); toast.success('تم الأرشفة') }
  })
  const gradeMut = useMutation({
    mutationFn: ({id,...d}:any) => homeworkApi.gradeSubmission(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['hw-grading-submissions',gradingHw?.id]}); qc.invalidateQueries({queryKey:['homework']}); toast.success('تم التقييم') }
  })

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm) }

  const openEdit = (h:any) => {
    setEditing(h)
    setForm({ className:h.class_name||'', subjectName:h.subject_name||'', title:h.title,
      description:h.description||'', dueDate:h.due_date?.split('T')[0]||h.due_date||'', maxScore:String(h.max_score||10) })
    setModal(true)
  }

  const submit = () => {
    if (!form.title || !form.dueDate) return toast.error('العنوان وتاريخ التسليم مطلوبان')
    if (editing) updateMut.mutate({ id:editing.id, ...form })
    else createMut.mutate(form)
  }

  const openGrading = (h:any) => { setGradingHw(h); setGradeForm({}) }

  const submitGrade = (submId:string) => {
    const g = gradeForm[submId]
    if (!g) return
    gradeMut.mutate({ id:submId, score:parseInt(g.score)||0, feedback:g.feedback||'' })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <ClipboardList size={24} className="text-sky-600"/> الواجبات المنزلية
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">إدارة وتتبع وتقييم الواجبات</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> تعيين واجب جديد
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'إجمالي الواجبات', value:stats.total||0,   color:'#6366f1', icon:ClipboardList },
          { label:'واجبات نشطة',     value:stats.active||0,  color:'#10b981', icon:BookOpen },
          { label:'متأخرة',          value:stats.overdue||0, color:'#ef4444', icon:AlertTriangle },
          { label:'عدد الفصول',      value:stats.classes||0, color:'#0ea5e9', icon:Users },
        ].map(k=>(
          <div key={k.label} className="card flex items-start gap-3 !py-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:k.color+'18'}}>
              <k.icon size={20} style={{color:k.color}}/>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">{k.label}</p>
              <p className="text-2xl font-black" style={{color:k.color}}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="input w-40">
          <option value="">كل الواجبات</option>
          <option value="active">نشطة</option>
          <option value="closed">مغلقة</option>
          <option value="archived">مؤرشفة</option>
        </select>
        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="input w-52">
          <option value="">كل الفصول</option>
          {CLASSES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Homework List */}
      {isLoading ? <div className="h-40 flex items-center justify-center text-gray-400">جارٍ التحميل...</div> : (
        hw.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <ClipboardList size={40} className="text-gray-200"/>
            <p className="font-bold">لا توجد واجبات بعد</p>
            <button onClick={()=>setModal(true)} className="btn-primary text-sm">تعيين أول واجب</button>
          </div>
        ) : (
          <div className="space-y-3">
            {hw.map((h:any) => {
              const isOverdue = h.due_date?.split('T')[0] < today && h.status === 'active'
              const submPct = h.submission_count > 0 ? Math.round((h.submitted_count||0)/h.submission_count*100) : 0
              const isExpanded = expanded === h.id
              return (
                <div key={h.id} className={`card transition-all ${isOverdue ? 'border-r-4 border-red-400' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <ProgressRing pct={submPct} color={submPct>=80?'#10b981':submPct>=50?'#f59e0b':'#6366f1'}/>
                      <span className="text-[9px] font-bold text-gray-400">{submPct}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="font-black text-gray-800">{h.title}</h3>
                        {isOverdue && <span className="text-[10px] bg-red-100 text-red-700 font-black px-2 py-0.5 rounded-full">متأخر!</span>}
                        {h.status==='closed' && <span className="text-[10px] bg-gray-100 text-gray-600 font-black px-2 py-0.5 rounded-full">مغلق</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {h.class_name} — {h.subject_name} | المعلم: {h.teacher_name||'غير محدد'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={11}/>
                          تسليم: {h.due_date ? new Date(h.due_date).toLocaleDateString('ar-OM') : '—'}
                        </span>
                        <span className="flex items-center gap-1"><Users size={11}/>
                          {h.submitted_count||0}/{h.submission_count||0} سلّموا
                        </span>
                        {h.avg_score && <span className="flex items-center gap-1"><Star size={11}/> متوسط: {h.avg_score}/{h.max_score}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={()=>openGrading(h)} title="تقييم"
                        className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold hover:bg-sky-100 transition-colors">
                        <Star size={13}/>
                      </button>
                      <button onClick={()=>openEdit(h)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Pencil size={14}/>
                      </button>
                      <button onClick={()=>setDeleteTarget(h)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14}/>
                      </button>
                      <button onClick={()=>setExpanded(isExpanded?null:h.id)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                        {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Submissions */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-xs font-black text-gray-600 mb-2">حالة التسليم ({submissions.length} طالب)</p>
                      {submissions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">لا توجد تسليمات بعد</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {submissions.map((s:any)=>{
                            const statusMap: Record<string,{cls:string;label:string}> = {
                              pending:   {cls:'bg-gray-100 text-gray-600',  label:'لم يسلّم'},
                              submitted: {cls:'bg-blue-100 text-blue-700',  label:'سلّم'},
                              graded:    {cls:'bg-green-100 text-green-700',label:'تم التقييم'},
                              late:      {cls:'bg-amber-100 text-amber-700',label:'متأخر'},
                            }
                            const sm = statusMap[s.status] || statusMap.pending
                            return (
                              <div key={s.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-800 truncate">{s.student_name}</p>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${sm.cls}`}>{sm.label}</span>
                                </div>
                                {s.status === 'graded' && (
                                  <span className="text-xs font-black text-green-700">{s.score}/{h.max_score}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل واجب' : 'تعيين واجب جديد'}>
        <div className="space-y-3">
          <FormField label="الفصل الدراسي">
            <Select value={form.className} onChange={v=>setForm(p=>({...p,className:v}))} options={CLASSES}/>
          </FormField>
          <FormField label="المادة">
            <Select value={form.subjectName} onChange={v=>setForm(p=>({...p,subjectName:v}))} options={SUBJECTS}/>
          </FormField>
          <FormField label="عنوان الواجب *"><Input value={form.title} onChange={v=>setForm(p=>({...p,title:v}))}/></FormField>
          <FormField label="وصف الواجب"><Textarea value={form.description} onChange={v=>setForm(p=>({...p,description:v}))}/></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="تاريخ التسليم *">
              <input type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} className="input w-full"/>
            </FormField>
            <FormField label="الدرجة الكاملة">
              <Input type="number" value={form.maxScore} onChange={v=>setForm(p=>({...p,maxScore:v}))} min="1"/>
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="btn-secondary">إلغاء</button>
            <button onClick={submit} disabled={createMut.isPending||updateMut.isPending} className="btn-primary">
              {editing ? 'حفظ' : 'تعيين الواجب'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Grading Modal */}
      {gradingHw && (
        <Modal open={!!gradingHw} onClose={()=>setGradingHw(null)} title={`تقييم: ${gradingHw.title}`}>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {gradingSubmissions.length === 0 ? (
              <p className="text-center text-gray-400 py-8">لا توجد تسليمات للتقييم</p>
            ) : gradingSubmissions.map((s:any)=>(
              <div key={s.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-black text-gray-800">{s.student_name}</p>
                    <p className="text-[10px] text-gray-400">{s.student_number}</p>
                  </div>
                  {s.status==='graded' && (
                    <span className="text-sm font-black text-green-700">{s.score}/{gradingHw.max_score}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input type="number" placeholder={`الدرجة / ${gradingHw.max_score}`} min="0" max={gradingHw.max_score}
                    defaultValue={s.score||''} onChange={e=>setGradeForm(p=>({...p,[s.id]:{...p[s.id],score:e.target.value,feedback:p[s.id]?.feedback||s.feedback||''}}))}
                    className="input flex-1 text-sm"/>
                  <input placeholder="ملاحظة..." defaultValue={s.feedback||''}
                    onChange={e=>setGradeForm(p=>({...p,[s.id]:{...p[s.id],score:p[s.id]?.score||String(s.score||''),feedback:e.target.value}}))}
                    className="input flex-2 text-sm"/>
                  <button onClick={()=>submitGrade(s.id)} disabled={!gradeForm[s.id]?.score}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 disabled:opacity-40">
                    حفظ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget} title="أرشفة الواجب"
        message={`هل تريد أرشفة "${deleteTarget?.title}"؟`}
        onConfirm={()=>deleteMut.mutate(deleteTarget.id)}
        onCancel={()=>setDeleteTarget(null)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
