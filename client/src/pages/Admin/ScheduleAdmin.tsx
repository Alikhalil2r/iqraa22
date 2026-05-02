import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from '../../api/client'
import Modal from '../../components/Modal'
import { FormField, Input, Select } from '../../components/FormField'
import { Calendar, Clock, User, MapPin, Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس']
const DAY_COLORS = ['bg-blue-50 border-blue-200','bg-purple-50 border-purple-200','bg-green-50 border-green-200','bg-orange-50 border-orange-200','bg-pink-50 border-pink-200']
const DAY_HEADER_COLORS = ['bg-blue-600','bg-purple-600','bg-green-600','bg-orange-500','bg-pink-600']
const SUBJECTS = ['الرياضيات','العلوم','اللغة العربية','اللغة الإنجليزية','التربية الإسلامية','التاريخ','الجغرافيا','التربية الفنية','التربية البدنية','الحاسب الآلي','الفيزياء','الكيمياء','الأحياء'].map(v=>({value:v,label:v}))

const emptyEntry = { subjectName:'', teacherName:'', dayOfWeek:'0', startTime:'07:00', endTime:'07:45', room:'' }

export default function ScheduleAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyEntry)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [view, setView] = useState<'grid'|'list'>('grid')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['schedule'],
    queryFn: () => scheduleApi.list().then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => scheduleApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['schedule']}); closeModal(); toast.success('تمت الإضافة') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({id,...d}: any) => scheduleApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['schedule']}); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => scheduleApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['schedule']}); toast.success('تم الحذف') }
  })

  const openAdd = (day?: number) => {
    setEditing(null)
    setForm({...emptyEntry, dayOfWeek: day !== undefined ? String(day) : '0'})
    setModal(true)
  }
  const openEdit = (entry: any) => {
    setEditing(entry)
    setForm({
      subjectName: entry.subject_name||'', teacherName: entry.teacher_name||'',
      dayOfWeek: String(entry.day_of_week||0), startTime: entry.start_time||'07:00',
      endTime: entry.end_time||'07:45', room: entry.room||''
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startTime || !form.endTime) return toast.error('وقت البدء والانتهاء مطلوبان')
    if (editing) updateMut.mutate({id:editing.id,...form})
    else createMut.mutate(form)
  }

  const entries = data?.schedule || []
  const byDay = DAYS.map((_, i) => entries.filter((e: any) => parseInt(e.day_of_week) === i))
  const totalSubjects = new Set(entries.map((e: any) => e.subject_name)).size

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">الجدول الدراسي</h1>
          <p className="text-sm text-gray-400 mt-1">إدارة جدول الحصص الأسبوعي</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['grid','list'] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${view===v?'text-white shadow-sm':'text-gray-500'}`}
                style={view===v?{background:'var(--color-primary)'}:{}}>
                {v==='grid'?'شبكة':'قائمة'}
              </button>
            ))}
          </div>
          <button onClick={()=>openAdd()} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> إضافة حصة
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {label:'إجمالي الحصص',value:entries.length,color:'#6366f1'},
          {label:'عدد المواد',value:totalSubjects,color:'#10b981'},
          {label:'أيام الدراسة',value:byDay.filter(d=>d.length>0).length,color:'#f59e0b'},
        ].map(s=>(
          <div key={s.label} className="card !py-3 flex items-center gap-3">
            <div className="w-2 h-8 rounded-full" style={{background:s.color}}/>
            <div>
              <p className="text-xs text-gray-400 font-bold">{s.label}</p>
              <p className="text-2xl font-black" style={{color:s.color}}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div>
      ) : view === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {DAYS.map((day, dayIdx) => (
            <div key={day} className={`rounded-2xl border-2 overflow-hidden ${DAY_COLORS[dayIdx]}`}>
              <div className={`${DAY_HEADER_COLORS[dayIdx]} text-white py-3 px-4 flex items-center justify-between`}>
                <h3 className="font-black text-sm">{day}</h3>
                <button onClick={()=>openAdd(dayIdx)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <Plus size={14}/>
                </button>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {byDay[dayIdx].length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-300">
                    <Calendar size={22} className="mb-1"/>
                    <p className="text-[10px]">لا حصص</p>
                  </div>
                ) : byDay[dayIdx].sort((a:any,b:any)=>a.start_time?.localeCompare(b.start_time)).map((entry: any) => (
                  <div key={entry.id} className="bg-white rounded-xl p-3 shadow-sm border border-white/80 group hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-black text-xs text-gray-800 leading-tight flex-1">{entry.subject_name||'—'}</p>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>openEdit(entry)} className="p-1 hover:bg-blue-50 rounded text-blue-500"><Pencil size={11}/></button>
                        <button onClick={()=>setDeleteTarget(entry)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={11}/></button>
                      </div>
                    </div>
                    {entry.teacher_name && <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><User size={9}/>{entry.teacher_name}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold">
                        <Clock size={8}/>{entry.start_time?.slice(0,5)}–{entry.end_time?.slice(0,5)}
                      </span>
                      {entry.room && <span className="text-[9px] text-gray-400 flex items-center gap-0.5"><MapPin size={8}/>{entry.room}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-x-auto !p-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-700">قائمة الحصص</h3>
            <span className="text-sm text-gray-400">{entries.length} حصة</span>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>{['اليوم','المادة','المعلم','الوقت','القاعة','إجراءات'].map(h=>(
                <th key={h} className="table-header">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {entries.sort((a:any,b:any)=>a.day_of_week-b.day_of_week||a.start_time?.localeCompare(b.start_time)).map((e: any, i: number)=>(
                <tr key={e.id} className="table-row">
                  <td className="table-cell"><span className="font-bold text-gray-700">{DAYS[e.day_of_week]||'—'}</span></td>
                  <td className="table-cell font-bold text-gray-800">{e.subject_name||'—'}</td>
                  <td className="table-cell text-gray-500">{e.teacher_name||'—'}</td>
                  <td className="table-cell text-xs font-mono text-gray-600">{e.start_time?.slice(0,5)} — {e.end_time?.slice(0,5)}</td>
                  <td className="table-cell text-gray-400">{e.room||'—'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={()=>openEdit(e)} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded-lg"><Pencil size={14}/></button>
                      <button onClick={()=>setDeleteTarget(e)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={closeModal} title={editing?'تعديل الحصة':'إضافة حصة جديدة'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="اليوم">
              <Select value={form.dayOfWeek} onChange={e=>setForm({...form,dayOfWeek:e.target.value})}
                options={DAYS.map((d,i)=>({value:String(i),label:d}))}/>
            </FormField>
            <FormField label="المادة">
              <Select value={form.subjectName} onChange={e=>setForm({...form,subjectName:e.target.value})}
                options={[{value:'',label:'اختر المادة'},...SUBJECTS]}/>
            </FormField>
            <FormField label="اسم المعلم">
              <Input value={form.teacherName} onChange={e=>setForm({...form,teacherName:e.target.value})} placeholder="اسم المعلم"/>
            </FormField>
            <FormField label="القاعة / الغرفة">
              <Input value={form.room} onChange={e=>setForm({...form,room:e.target.value})} placeholder="أ-101"/>
            </FormField>
            <FormField label="وقت البدء" required>
              <Input type="time" value={form.startTime} onChange={e=>setForm({...form,startTime:e.target.value})}/>
            </FormField>
            <FormField label="وقت الانتهاء" required>
              <Input type="time" value={form.endTime} onChange={e=>setForm({...form,endTime:e.target.value})}/>
            </FormField>
          </div>
          {/* Duration preview */}
          {form.startTime && form.endTime && (
            <div className="bg-blue-50 rounded-xl p-3 text-center text-blue-700 text-sm font-bold">
              مدة الحصة: {Math.round((new Date(`2000-01-01T${form.endTime}`).getTime()-new Date(`2000-01-01T${form.startTime}`).getTime())/60000)} دقيقة
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3">
              {editing?'حفظ التعديلات':'إضافة الحصة'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الحصة"
        message={`حذف حصة "${deleteTarget?.subject_name}" يوم ${DAYS[deleteTarget?.day_of_week]}؟`}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
