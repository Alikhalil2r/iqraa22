import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../../api/client'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { Calendar, Plus, Edit, Trash2, MapPin, Clock, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const EVENT_TYPES = ['أكاديمي','رياضي','ثقافي','اجتماعي','امتحانات','إجازة','اجتماع','أخرى'].map(v=>({value:v,label:v}))
const TYPE_COLORS: Record<string,string> = {
  'أكاديمي': '#3b82f6', 'رياضي': '#10b981', 'ثقافي': '#8b5cf6',
  'اجتماعي': '#f59e0b', 'امتحانات': '#ef4444', 'إجازة': '#0ea5e9',
  'اجتماع': '#f97316', 'أخرى': '#6b7280'
}

const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

const emptyEvent = { title:'', description:'', eventType:'أكاديمي', startDate:'', endDate:'', location:'', color:'#3b82f6', isPublic:true }

function CalendarGrid({ events, year, month, onEdit, onDelete, onAdd }: any) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const today = new Date()

  const eventsByDay = useMemo(() => {
    const map: Record<number, any[]> = {}
    events.forEach((ev: any) => {
      const d = new Date(ev.start_date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(ev)
      }
    })
    return map
  }, [events, year, month])

  const cells: { day: number; current: boolean; dateObj: Date }[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false, dateObj: new Date(year, month - 1, daysInPrev - i) })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true, dateObj: new Date(year, month, i) })
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, current: false, dateObj: new Date(year, month + 1, i) })

  return (
    <div className="card !p-0 overflow-hidden">
      {/* Days header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
        {DAYS_AR.map(d => (
          <div key={d} className="py-3 text-center text-xs font-black text-gray-500">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 rtl:divide-x-reverse">
        {cells.map((cell, idx) => {
          const isToday = cell.current && cell.day === today.getDate() && year === today.getFullYear() && month === today.getMonth()
          const dayEvs = cell.current ? (eventsByDay[cell.day] || []) : []
          return (
            <div key={`${year}-${month}-${idx}`} className={`min-h-[90px] p-1.5 relative group transition-colors ${cell.current ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50'} ${isToday ? 'ring-2 ring-inset ring-emerald-400' : ''}`}>
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black mb-1 ${isToday ? 'bg-emerald-600 text-white' : cell.current ? 'text-gray-700' : 'text-gray-300'}`}>
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {dayEvs.slice(0, 2).map((ev: any) => (
                  <div key={ev.id} onClick={() => onEdit(ev)}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ background: ev.color || TYPE_COLORS[ev.event_type] || '#6b7280' }}
                    title={ev.title}>
                    {ev.title}
                  </div>
                ))}
                {dayEvs.length > 2 && (
                  <div className="text-[9px] font-black text-gray-400 px-1">+{dayEvs.length - 2} أكثر</div>
                )}
              </div>
              {cell.current && (
                <button onClick={() => onAdd(cell.dateObj)} title="إضافة فعالية"
                  className="absolute top-1 left-1 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-emerald-600">
                  <Plus size={10} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventCard({ ev, onEdit, onDelete }: any) {
  const color = ev.color || TYPE_COLORS[ev.event_type] || '#6b7280'
  const isPast = new Date(ev.start_date) < new Date()
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all ${isPast ? 'opacity-70' : ''}`}
      style={{ borderTop: `3px solid ${color}` }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] font-black px-2 py-1 rounded-lg text-white" style={{ background: color }}>{ev.event_type}</span>
          <div className="flex gap-1">
            <button onClick={() => onEdit(ev)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
            <button onClick={() => onDelete(ev)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
        <h4 className="font-black text-gray-800 leading-snug mb-3">{ev.title}</h4>
        {ev.description && <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{ev.description}</p>}
        <div className="space-y-1.5 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-emerald-500" />
            {new Date(ev.start_date).toLocaleString('ar-OM', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
          {ev.end_date && (
            <div className="flex items-center gap-1.5">
              <Clock size={11} className="text-gray-300" />
              حتى: {new Date(ev.end_date).toLocaleString('ar-OM', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          )}
          {ev.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-red-400" />
              {ev.location}
            </div>
          )}
        </div>
        {!ev.is_public && (
          <div className="mt-2 text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md w-fit">داخلي فقط</div>
        )}
      </div>
    </div>
  )
}

export default function Events() {
  const today = new Date()
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState<any>(null)
  const [form,      setForm]      = useState(emptyEvent)
  const [view,      setView]      = useState<'calendar'|'list'>('calendar')
  const [year,      setYear]      = useState(today.getFullYear())
  const [month,     setMonth]     = useState(today.getMonth())
  const [delTarget, setDelTarget] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey:['events-admin'], queryFn:()=>eventsApi.list().then(r=>r.data) })
  const createMut = useMutation({ mutationFn:(d:any)=>eventsApi.create(d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['events-admin']}); closeModal(); toast.success('✅ تم إضافة الفعالية') } })
  const updateMut = useMutation({ mutationFn:({id,...d}:any)=>eventsApi.update(id,d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['events-admin']}); closeModal(); toast.success('✅ تم تعديل الفعالية') } })
  const deleteMut = useMutation({ mutationFn:(id:string)=>eventsApi.delete(id),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['events-admin']}); setDelTarget(null); toast.success('تم الحذف') } })

  const events = data?.events || []
  const upcoming = events.filter((e: any) => new Date(e.start_date) > today)
  const thisMonth = events.filter((e: any) => {
    const d = new Date(e.start_date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const openAdd = (dateObj?: Date) => {
    setEditing(null)
    const dt = dateObj ? new Date(dateObj) : new Date()
    dt.setHours(8, 0, 0, 0)
    setForm({ ...emptyEvent, startDate: dt.toISOString().slice(0, 16) })
    setModal(true)
  }
  const openEdit = (e: any) => {
    setEditing(e)
    setForm({ title:e.title, description:e.description||'', eventType:e.event_type||'أكاديمي',
      startDate:e.start_date?.slice(0,16)||'', endDate:e.end_date?.slice(0,16)||'',
      location:e.location||'', color:e.color||TYPE_COLORS[e.event_type]||'#3b82f6', isPublic:e.is_public })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((e: any) => { counts[e.event_type] = (counts[e.event_type] || 0) + 1 })
    return counts
  }, [events])

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">التقويم المدرسي</h1>
          <p className="text-sm text-gray-400 mt-1">{events.length} فعالية مسجلة • {upcoming.length} قادمة</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setView('calendar')} className={`p-2 rounded-lg transition-all ${view === 'calendar' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400'}`}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400'}`}>
              <List size={15} />
            </button>
          </div>
          <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> إضافة فعالية
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {!isLoading && events.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
              style={{ background: TYPE_COLORS[type] || '#6b7280' }}>
              {type} <span className="bg-white/25 px-1.5 py-0.5 rounded-md">{count}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" /></div>
      ) : view === 'calendar' ? (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
              <ChevronRight size={20} />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-black text-gray-800">{MONTHS_AR[month]} {year}</h2>
              <p className="text-xs text-gray-400">{thisMonth.length} فعالية هذا الشهر</p>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
              <ChevronLeft size={20} />
            </button>
          </div>
          <CalendarGrid events={events} year={year} month={month} onEdit={openEdit} onDelete={setDelTarget} onAdd={openAdd} />
        </>
      ) : (
        /* List view */
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl w-fit mb-3">
                🗓 القادمة ({upcoming.length})
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((ev: any) => <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={setDelTarget} />)}
              </div>
            </div>
          )}
          {events.filter((e:any) => new Date(e.start_date) <= today).length > 0 && (
            <div>
              <h3 className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl w-fit mb-3">
                ✓ المنتهية
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.filter((e:any) => new Date(e.start_date) <= today).slice(0,6).map((ev: any) => (
                  <EventCard key={ev.id} ev={ev} onEdit={openEdit} onDelete={setDelTarget} />
                ))}
              </div>
            </div>
          )}
          {events.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">لا توجد فعاليات مسجلة</p>
              <button onClick={() => openAdd()} className="btn-primary mt-4 text-sm px-6 py-2.5">إضافة أول فعالية</button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل الفعالية' : 'إضافة فعالية جديدة'} size="md">
        <form onSubmit={e => {
          e.preventDefault()
          if (!form.title) return toast.error('العنوان مطلوب')
          if (!form.startDate) return toast.error('تاريخ البداية مطلوب')
          if (editing) updateMut.mutate({ id: editing.id, ...form })
          else createMut.mutate(form)
        }} className="space-y-4">
          <FormField label="عنوان الفعالية" required>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="حفل افتتاح العام الدراسي..." />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="النوع">
              <Select value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value, color: TYPE_COLORS[e.target.value] || form.color })} options={EVENT_TYPES} />
            </FormField>
            <FormField label="اللون">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl border border-gray-200 flex-shrink-0" style={{ background: form.color }} />
                <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="flex-1 h-10 rounded-xl border border-gray-200 cursor-pointer" />
              </div>
            </FormField>
            <FormField label="تاريخ البداية" required>
              <Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </FormField>
            <FormField label="تاريخ النهاية">
              <Input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </FormField>
          </div>
          <FormField label="الموقع">
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="قاعة الاجتماعات، الملعب..." />
          </FormField>
          <FormField label="التفاصيل">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="تفاصيل الفعالية..." style={{ minHeight: '80px' }} />
          </FormField>
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm font-bold text-gray-700">ظاهر في الموقع العام للمدرسة</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1 py-3 font-black"
              disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <span className="ml-2">...</span>}
              {editing ? 'حفظ التعديلات' : 'إضافة الفعالية'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        title="حذف الفعالية"
        message={`حذف الفعالية "${delTarget?.title}"؟ لا يمكن التراجع.`}
        confirmLabel="نعم، احذف"
        danger
        onConfirm={() => deleteMut.mutate(delTarget?.id)}
        onCancel={() => setDelTarget(null)}
      />
    </div>
  )
}
