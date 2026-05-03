import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conductApi, studentsApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import {
  Shield, Plus, AlertTriangle, Star, FileText, MessageSquare,
  Pencil, Trash2, Award, Users, ChevronLeft, Filter, Bell
} from 'lucide-react'
import toast from 'react-hot-toast'

const TYPES = [
  {value:'incident', label:'حادثة/مخالفة', color:'#ef4444'},
  {value:'reward',   label:'مكافأة/تقدير', color:'#10b981'},
  {value:'warning',  label:'تحذير',         color:'#f59e0b'},
  {value:'note',     label:'ملاحظة',        color:'#6366f1'},
]
const SEVERITIES = [
  {value:'low',      label:'منخفض'},
  {value:'medium',   label:'متوسط'},
  {value:'high',     label:'عالٍ'},
  {value:'critical', label:'حرج'},
]
const CATEGORIES = {
  incident: ['تأخر متكرر','غياب بدون عذر','سلوك مشاغب','تنمر','غش','إتلاف ممتلكات','مخالفة الزي','عدم التزام','آخر'],
  reward:   ['أداء أكاديمي','تفوق رياضي','مبادرة','مساعدة الآخرين','قيادة','إبداع','تمثيل المدرسة','آخر'],
  warning:  ['سلوك غير لائق','إهمال الواجبات','مخالفة متكررة','آخر'],
  note:     ['ملاحظة سلوكية','تواصل مع الأهل','آخر'],
}

const emptyForm = {
  studentId:'', recordType:'incident', category:'', title:'', description:'',
  severity:'low', points:'0', actionTaken:'', parentNotified:false,
  recordDate: new Date().toISOString().split('T')[0]
}

function TypeIcon({ type }: { type: string }) {
  const map: Record<string,{Icon:any;color:string}> = {
    incident: {Icon:AlertTriangle, color:'#ef4444'},
    reward:   {Icon:Star,         color:'#10b981'},
    warning:  {Icon:MessageSquare,color:'#f59e0b'},
    note:     {Icon:FileText,     color:'#6366f1'},
  }
  const m = map[type] || map.note
  return <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:m.color+'18'}}><m.Icon size={14} style={{color:m.color}}/></div>
}

export default function ConductAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [filterType, setFilterType] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['conduct', filterType, filterClass],
    queryFn: () => conductApi.list({ type:filterType||undefined, className:filterClass||undefined }).then(r=>r.data),
    staleTime: 30000
  })
  const { data: studData } = useQuery({
    queryKey: ['students-conduct'],
    queryFn: () => studentsApi.list({ status:'active' }).then(r=>r.data),
    staleTime: 120000
  })

  const records     = data?.records     || []
  const stats       = data?.stats       || {}
  const topStudents = data?.topStudents || []
  const students    = studData?.students || []

  const classes = [...new Set(students.map((s:any)=>s.class_name))].filter(Boolean)
  const categoriesForType = (type:string): string[] => (CATEGORIES as any)[type] || []

  const createMut = useMutation({
    mutationFn: (d:any) => conductApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['conduct']}); closeModal(); toast.success('تم تسجيل السجل') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({id,...d}:any) => conductApi.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['conduct']}); closeModal(); toast.success('تم التعديل') }
  })
  const deleteMut = useMutation({
    mutationFn: (id:string) => conductApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['conduct']}); setDeleteTarget(null); toast.success('تم الحذف') }
  })

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm) }

  const openEdit = (r:any) => {
    setEditing(r)
    setForm({ studentId:r.student_id, recordType:r.record_type, category:r.category||'',
      title:r.title, description:r.description||'', severity:r.severity||'low',
      points:String(r.points||0), actionTaken:r.action_taken||'',
      parentNotified:r.parent_notified||false, recordDate:r.record_date?.split('T')[0]||'' })
    setModal(true)
  }

  const submit = () => {
    if (!form.studentId || !form.title) return toast.error('الطالب والعنوان مطلوبان')
    const d = { ...form, points: parseInt(form.points)||0 }
    if (editing) updateMut.mutate({ id:editing.id, ...d })
    else createMut.mutate(d)
  }

  const severityColor = (s:string) => ({low:'text-gray-500',medium:'text-amber-600',high:'text-orange-600',critical:'text-red-700'}[s]||'text-gray-500')
  const severityBg = (s:string) => ({low:'bg-gray-50',medium:'bg-amber-50',high:'bg-orange-50',critical:'bg-red-50'}[s]||'bg-gray-50')

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Shield size={24} className="text-indigo-600"/> سجل السلوك
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">تتبع وتوثيق سلوك الطلاب ومكافآتهم</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> تسجيل جديد
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'إجمالي السجلات',  value:stats.total||0,     color:'#6366f1', icon:FileText },
          { label:'حوادث/مخالفات',   value:stats.incidents||0, color:'#ef4444', icon:AlertTriangle },
          { label:'مكافآت/تقدير',    value:stats.rewards||0,   color:'#10b981', icon:Star },
          { label:'تنبيهات مرسلة',   value:stats.warnings||0,  color:'#f59e0b', icon:MessageSquare },
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

      {/* Pending Notifications Alert */}
      {(stats.pending_notifications||0) > 0 && (
        <div className="card bg-amber-50 border-r-4 border-amber-400 flex items-center gap-3">
          <Bell size={18} className="text-amber-500 flex-shrink-0"/>
          <div className="flex-1">
            <p className="font-black text-amber-800">{stats.pending_notifications} حادثة لم يُبلَّغ عنها للأهل بعد</p>
          </div>
        </div>
      )}

      {/* Two-column: Records + Top Students */}
      <div className="grid lg:grid-cols-4 gap-4">
        {/* Top Students Widget */}
        {topStudents.length > 0 && (
          <div className="card lg:col-span-1">
            <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
              <Award size={16} className="text-amber-500"/> أفضل الطلاب
            </h3>
            <div className="space-y-2">
              {topStudents.map((s:any, i:number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 ${i===0?'bg-amber-400':i===1?'bg-gray-400':i===2?'bg-amber-700':'bg-gray-200'}`}>
                    {i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.class_name}</p>
                  </div>
                  <span className="text-xs font-black text-green-700">{s.total_points}+</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Records List */}
        <div className={`space-y-3 ${topStudents.length>0 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="input w-44">
              <option value="">كل الأنواع</option>
              {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} className="input w-52">
              <option value="">كل الفصول</option>
              {classes.map(c=><option key={String(c)} value={String(c)}>{String(c)}</option>)}
            </select>
          </div>

          {isLoading ? <div className="h-40 flex items-center justify-center text-gray-400">جارٍ التحميل...</div> : (
            records.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
                <Shield size={40} className="text-gray-200"/>
                <p className="font-bold">لا توجد سجلات سلوك بعد</p>
                <button onClick={()=>setModal(true)} className="btn-primary text-sm">إضافة أول سجل</button>
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r:any) => (
                  <div key={r.id} className={`card flex items-start gap-3 ${severityBg(r.severity)}`}>
                    <TypeIcon type={r.record_type}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-gray-800 text-sm">{r.title}</p>
                        {r.category && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                            {r.category}
                          </span>
                        )}
                        {r.severity !== 'low' && (
                          <span className={`text-[9px] font-black ${severityColor(r.severity)}`}>
                            ● {SEVERITIES.find(s=>s.value===r.severity)?.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-bold mt-0.5">
                        {r.student_name} — <span className="text-gray-400">{r.class_name}</span>
                      </p>
                      {r.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                        <span>{new Date(r.record_date).toLocaleDateString('ar-OM')}</span>
                        <span>بواسطة: {r.reported_by_name||'المسؤول'}</span>
                        {r.parent_notified && <span className="text-green-600 font-bold">✓ أُبلغ الأهل</span>}
                        {r.points > 0 && <span className="text-emerald-600 font-bold">+{r.points} نقطة</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={()=>openEdit(r)} className="p-1.5 text-gray-400 hover:bg-white rounded-lg transition-colors">
                        <Pencil size={13}/>
                      </button>
                      <button onClick={()=>setDeleteTarget(r)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل السجل' : 'تسجيل جديد'}>
        <div className="space-y-3">
          <FormField label="الطالب *">
            <select value={form.studentId} onChange={e=>setForm(p=>({...p,studentId:e.target.value}))} className="input w-full">
              <option value="">اختر طالباً...</option>
              {students.map((s:any)=><option key={s.id} value={s.id}>{s.name} — {s.class_name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="النوع *">
              <Select value={form.recordType} onChange={v=>setForm(p=>({...p,recordType:v,category:''}))} options={TYPES}/>
            </FormField>
            <FormField label="التصنيف">
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="input w-full">
                <option value="">اختر...</option>
                {categoriesForType(form.recordType).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="العنوان *"><Input value={form.title} onChange={v=>setForm(p=>({...p,title:v}))}/></FormField>
          <FormField label="التفاصيل"><Textarea value={form.description} onChange={v=>setForm(p=>({...p,description:v}))}/></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="مستوى الخطورة">
              <Select value={form.severity} onChange={v=>setForm(p=>({...p,severity:v}))} options={SEVERITIES}/>
            </FormField>
            <FormField label="النقاط">
              <Input type="number" value={form.points} onChange={v=>setForm(p=>({...p,points:v}))} min="0"/>
            </FormField>
          </div>
          <FormField label="الإجراء المتخذ"><Textarea value={form.actionTaken} onChange={v=>setForm(p=>({...p,actionTaken:v}))}/></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="التاريخ">
              <input type="date" value={form.recordDate} onChange={e=>setForm(p=>({...p,recordDate:e.target.value}))} className="input w-full"/>
            </FormField>
            <FormField label=" ">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.parentNotified} onChange={e=>setForm(p=>({...p,parentNotified:e.target.checked}))} className="w-4 h-4 rounded"/>
                <span className="text-sm font-bold text-gray-700">تم إبلاغ الأهل</span>
              </label>
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="btn-secondary">إلغاء</button>
            <button onClick={submit} disabled={createMut.isPending||updateMut.isPending} className="btn-primary">
              {editing ? 'حفظ التعديلات' : 'تسجيل'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} title="حذف السجل"
        message={`هل تريد حذف "${deleteTarget?.title}"؟`}
        onConfirm={()=>deleteMut.mutate(deleteTarget.id)}
        onCancel={()=>setDeleteTarget(null)}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
