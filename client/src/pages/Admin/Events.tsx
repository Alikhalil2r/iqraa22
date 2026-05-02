import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../../api/client'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { Calendar, Plus, Edit, Trash2, MapPin, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const EVENT_TYPES = ['أكاديمي','رياضي','ثقافي','اجتماعي','امتحانات','إجازة','اجتماع','أخرى'].map(v=>({value:v,label:v}))
const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#14b8a6','#f97316'].map(v=>({value:v,label:v}))
const emptyEvent = { title:'', description:'', eventType:'أكاديمي', startDate:'', endDate:'', location:'', color:'#3b82f6', isPublic:true }

export default function Events() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyEvent)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey:['events-admin'], queryFn:()=>eventsApi.list().then(r=>r.data) })
  const createMut = useMutation({ mutationFn:(d:any)=>eventsApi.create(d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['events-admin']}); closeModal(); toast.success('تم إضافة الفعالية') } })
  const updateMut = useMutation({ mutationFn:({id,...d}:any)=>eventsApi.update(id,d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['events-admin']}); closeModal(); toast.success('تم التعديل') } })
  const deleteMut = useMutation({ mutationFn:(id:string)=>eventsApi.delete(id),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['events-admin']}); toast.success('تم الحذف') } })

  const openAdd = () => { setEditing(null); setForm(emptyEvent); setModal(true) }
  const openEdit = (e:any) => {
    setEditing(e)
    setForm({ title:e.title, description:e.description||'', eventType:e.event_type||'أكاديمي',
      startDate:e.start_date?.slice(0,16)||'', endDate:e.end_date?.slice(0,16)||'',
      location:e.location||'', color:e.color||'#3b82f6', isPublic:e.is_public })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const events = data?.events || []
  const upcoming = events.filter((e:any) => new Date(e.start_date) > new Date())
  const past = events.filter((e:any) => new Date(e.start_date) <= new Date())

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">التقويم المدرسي</h1>
          <p className="text-sm text-gray-400 mt-1">الفعاليات والأحداث المدرسية</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/>إضافة فعالية</button>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div> : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">قادمة ({upcoming.length})</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((ev:any) => <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={row=>{if(confirm('حذف؟'))deleteMut.mutate(row.id)}}/>)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-3">منتهية ({past.length})</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {past.slice(0,6).map((ev:any) => <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={row=>{if(confirm('حذف؟'))deleteMut.mutate(row.id)}}/>)}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal} onClose={closeModal} title={editing?'تعديل الفعالية':'إضافة فعالية'} size="md">
        <form onSubmit={e=>{e.preventDefault();if(!form.title)return toast.error('العنوان مطلوب');if(editing)updateMut.mutate({id:editing.id,...form});else createMut.mutate(form)}} className="space-y-4">
          <FormField label="عنوان الفعالية" required><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="النوع"><Select value={form.eventType} onChange={e=>setForm({...form,eventType:e.target.value})} options={EVENT_TYPES}/></FormField>
            <FormField label="اللون">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl border border-gray-200" style={{background:form.color}}/>
                <input type="color" value={form.color} onChange={e=>setForm({...form,color:e.target.value})} className="flex-1 h-10 rounded-xl border border-gray-200"/>
              </div>
            </FormField>
            <FormField label="تاريخ البداية" required><Input type="datetime-local" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></FormField>
            <FormField label="تاريخ النهاية"><Input type="datetime-local" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></FormField>
          </div>
          <FormField label="الموقع"><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="قاعة الاجتماعات"/></FormField>
          <FormField label="التفاصيل"><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></FormField>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublic} onChange={e=>setForm({...form,isPublic:e.target.checked})} className="w-4 h-4 rounded"/>
            <span className="text-sm font-bold text-gray-700">ظاهر في الموقع العام</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3">{editing?'حفظ':'إضافة'}</button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function EventCard({ ev, onEdit, onDelete }: any) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all" style={{borderTop:`3px solid ${ev.color}`}}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold px-2.5 py-1 rounded-lg text-white" style={{background:ev.color}}>{ev.event_type}</span>
        <div className="flex gap-1">
          <button onClick={()=>onEdit(ev)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit size={14}/></button>
          <button onClick={()=>onDelete(ev)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
        </div>
      </div>
      <h4 className="font-black text-gray-800 mb-2">{ev.title}</h4>
      <div className="space-y-1.5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><Clock size={12}/>{new Date(ev.start_date).toLocaleString('ar-OM',{dateStyle:'medium',timeStyle:'short'})}</div>
        {ev.location && <div className="flex items-center gap-1.5"><MapPin size={12}/>{ev.location}</div>}
      </div>
    </div>
  )
}
