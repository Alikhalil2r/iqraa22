import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { busesApi, studentsApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { FormField, Input, Textarea } from '../../components/FormField'
import { Bus, Users, Phone, MapPin, Clock, Plus, Trash2, Edit, Search, X, UserPlus, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyBus = {
  busNumber: '', plateNumber: '', driverName: '', driverPhone: '',
  supervisorName: '', supervisorPhone: '', capacity: '40',
  routeName: '', routeDescription: '', morningTime: '', afternoonTime: '',
  isActive: true, gpsId: '', notes: ''
}

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round(used / total * 100)) : 0
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981'
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>{used} طالب</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">سعة {total}</p>
    </div>
  )
}

export default function Buses() {
  const [modal,       setModal]       = useState(false)
  const [editing,     setEditing]     = useState<any>(null)
  const [form,        setForm]        = useState(emptyBus)
  const [selectedBus, setSelectedBus] = useState<any>(null)
  const [confirmBus,  setConfirmBus]  = useState<any>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const qc = useQueryClient()

  const { data: busesData,    isLoading } = useQuery({ queryKey: ['buses'],    queryFn: () => busesApi.list().then(r => r.data) })
  const { data: studentsData }            = useQuery({ queryKey: ['students'], queryFn: () => studentsApi.list().then(r => r.data) })

  const createMut  = useMutation({ mutationFn: (d: any) => busesApi.create(d),              onSuccess: () => { qc.invalidateQueries({ queryKey: ['buses'] }); closeModal(); toast.success('✅ تم إضافة الحافلة') } })
  const updateMut  = useMutation({ mutationFn: ({ id, ...d }: any) => busesApi.update(id, d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['buses'] }); closeModal(); toast.success('✅ تم تعديل الحافلة') } })
  const deleteMut  = useMutation({ mutationFn: (id: string) => busesApi.delete(id),          onSuccess: () => { qc.invalidateQueries({ queryKey: ['buses'] }); toast.success('تم الحذف') } })
  const assignMut  = useMutation({ mutationFn: ({ busId, studentId }: any) => busesApi.assignStudent(busId, studentId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); qc.invalidateQueries({ queryKey: ['buses'] }); toast.success('تم تعيين الطالب') } })
  const removeMut  = useMutation({ mutationFn: ({ busId, studentId }: any) => busesApi.removeStudent(busId, studentId), onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); qc.invalidateQueries({ queryKey: ['buses'] }); toast.success('تم إزالة الطالب') } })

  const openAdd  = () => { setEditing(null); setForm(emptyBus); setModal(true) }
  const openEdit = (b: any) => {
    setEditing(b)
    setForm({
      busNumber: b.bus_number, plateNumber: b.plate_number || '', driverName: b.driver_name || '',
      driverPhone: b.driver_phone || '', supervisorName: b.supervisor_name || '', supervisorPhone: b.supervisor_phone || '',
      capacity: b.capacity || '40', routeName: b.route_name || '', routeDescription: b.route_description || '',
      morningTime: b.morning_time || '', afternoonTime: b.afternoon_time || '',
      isActive: b.is_active, gpsId: b.gps_id || '', notes: b.notes || ''
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.busNumber) return toast.error('رقم الحافلة مطلوب')
    if (editing) updateMut.mutate({ id: editing.id, ...form })
    else createMut.mutate(form)
  }

  const buses    = busesData?.buses   || []
  const students = studentsData?.students || []
  const unassignedStudents = useMemo(() => {
    const s = students.filter((s: any) => !s.bus_id)
    if (!studentSearch) return s
    return s.filter((s: any) => s.name?.includes(studentSearch) || s.class_name?.includes(studentSearch))
  }, [students, studentSearch])
  const busStudents = selectedBus ? students.filter((s: any) => s.bus_id === selectedBus.id) : []

  const totalStudents = students.filter((s: any) => s.bus_id).length
  const totalCapacity = buses.reduce((sum: number, b: any) => sum + parseInt(b.capacity || 0), 0)
  const activeBuses   = buses.filter((b: any) => b.is_active).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">الحافلات المدرسية</h1>
          <p className="text-sm text-gray-400 mt-1">إدارة أسطول الحافلات وتعيين الطلاب للمسارات</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> إضافة حافلة
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الحافلات', value: buses.length,      color: '#6366f1', icon: Bus },
          { label: 'الحافلات النشطة', value: activeBuses,       color: '#10b981', icon: CheckCircle },
          { label: 'الطلاب المسجلون', value: totalStudents,     color: '#0ea5e9', icon: Users },
          { label: 'الطاقة الإجمالية',value: totalCapacity,     color: '#f59e0b', icon: UserPlus },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: s.color + '15' }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold">{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      ) : buses.length === 0 ? (
        <div className="card text-center py-16">
          <Bus size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-bold mb-2">لا توجد حافلات مسجلة</p>
          <button onClick={openAdd} className="btn-primary">إضافة أول حافلة</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Bus cards - 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">الحافلات ({buses.length})</h3>
            {buses.map((bus: any) => (
              <div key={bus.id}
                onClick={() => setSelectedBus(selectedBus?.id === bus.id ? null : bus)}
                className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-md ${selectedBus?.id === bus.id ? 'border-blue-400 shadow-md bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'var(--color-primary)' }}>
                      <Bus size={22} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800">حافلة {bus.bus_number}</h4>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{bus.plate_number || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={bus.is_active ? 'badge-success' : 'badge-danger'}>
                      {bus.is_active ? 'نشطة' : 'متوقفة'}
                    </span>
                    <button onClick={e => { e.stopPropagation(); openEdit(bus) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmBus(bus) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500 mb-4">
                  {bus.route_name     && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-400 flex-shrink-0" /><span className="truncate">{bus.route_name}</span></div>}
                  {bus.driver_name    && <div className="flex items-center gap-1.5"><Users size={12} className="text-purple-400 flex-shrink-0" /><span className="truncate">{bus.driver_name}</span></div>}
                  {bus.driver_phone   && <div className="flex items-center gap-1.5"><Phone size={12} className="text-green-400 flex-shrink-0" />{bus.driver_phone}</div>}
                  {bus.morning_time   && <div className="flex items-center gap-1.5"><Clock size={12} className="text-amber-400 flex-shrink-0" />صباح: {bus.morning_time}</div>}
                  {bus.afternoon_time && <div className="flex items-center gap-1.5"><Clock size={12} className="text-orange-400 flex-shrink-0" />ظهر: {bus.afternoon_time}</div>}
                  {bus.supervisor_name && <div className="flex items-center gap-1.5"><Users size={12} className="text-teal-400 flex-shrink-0" /><span className="truncate">م: {bus.supervisor_name}</span></div>}
                </div>

                <CapacityBar used={bus.student_count || 0} total={parseInt(bus.capacity || 40)} />

                {selectedBus?.id === bus.id && (
                  <div className="mt-3 pt-2 border-t border-blue-100">
                    <p className="text-[10px] text-blue-500 font-black flex items-center gap-1">
                      <CheckCircle size={11} /> تم اختيار هذه الحافلة — يمكنك إدارة طلابها من اليمين
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Students panel - 2 cols */}
          <div className="lg:col-span-2">
            {selectedBus ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-4 overflow-hidden">
                {/* Panel header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between" style={{ background: 'var(--color-primary)' }}>
                  <div>
                    <h3 className="font-black text-white text-sm">حافلة {selectedBus.bus_number}</h3>
                    <p className="text-white/70 text-[10px]">{busStudents.length} / {selectedBus.capacity} طالب</p>
                  </div>
                  <button onClick={() => setSelectedBus(null)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {/* Current students */}
                <div className="p-4 border-b border-gray-100">
                  <h4 className="text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">الطلاب المسجلون ({busStudents.length})</h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {busStudents.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">لا يوجد طلاب مسجلون</p>
                    ) : busStudents.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl group">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
                            {s.name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-gray-800 truncate">{s.name}</p>
                            <p className="text-[10px] text-gray-400">{s.class_name}</p>
                          </div>
                        </div>
                        <button onClick={() => removeMut.mutate({ busId: selectedBus.id, studentId: s.id })}
                          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add student */}
                <div className="p-4">
                  <h4 className="text-xs font-black text-gray-500 mb-2 uppercase tracking-wider">إضافة طالب</h4>
                  <div className="relative mb-2">
                    <Search size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو الفصل..."
                      className="input-field pr-8 py-2 text-xs w-full" />
                  </div>
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {unassignedStudents.length === 0 ? (
                      <p className="text-[10px] text-gray-400 text-center py-3">
                        {studentSearch ? 'لا توجد نتائج' : 'جميع الطلاب مسجلون في حافلات'}
                      </p>
                    ) : unassignedStudents.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50 group transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-600 flex-shrink-0">
                            {s.name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-700 font-bold truncate">{s.name}</p>
                            <p className="text-[10px] text-gray-400">{s.class_name}</p>
                          </div>
                        </div>
                        <button onClick={() => assignMut.mutate({ busId: selectedBus.id, studentId: s.id })}
                          className="text-[10px] bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-blue-700 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                          إضافة
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 sticky top-4">
                <Bus size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="font-bold text-sm">اختر حافلة لإدارة طلابها</p>
                <p className="text-xs mt-1">انقر على أي حافلة من القائمة</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmBus}
        title="حذف الحافلة"
        message={`هل تريد حذف حافلة رقم "${confirmBus?.bus_number}" بشكل نهائي؟ سيتم إلغاء تعيين جميع الطلاب المرتبطين بها.`}
        confirmLabel="نعم، احذف"
        danger
        onConfirm={() => { deleteMut.mutate(confirmBus.id); setConfirmBus(null) }}
        onCancel={() => setConfirmBus(null)}
      />

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل الحافلة' : 'إضافة حافلة جديدة'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="رقم الحافلة" required>
              <Input value={form.busNumber} onChange={e => setForm({ ...form, busNumber: e.target.value })} placeholder="001" />
            </FormField>
            <FormField label="رقم اللوحة">
              <Input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} placeholder="أ ب ج 1234" />
            </FormField>
            <FormField label="اسم السائق">
              <Input value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} />
            </FormField>
            <FormField label="هاتف السائق">
              <Input value={form.driverPhone} onChange={e => setForm({ ...form, driverPhone: e.target.value })} placeholder="968XXXXXXXX" />
            </FormField>
            <FormField label="اسم المشرف">
              <Input value={form.supervisorName} onChange={e => setForm({ ...form, supervisorName: e.target.value })} />
            </FormField>
            <FormField label="هاتف المشرف">
              <Input value={form.supervisorPhone} onChange={e => setForm({ ...form, supervisorPhone: e.target.value })} />
            </FormField>
            <FormField label="الطاقة الاستيعابية">
              <Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} min="1" max="80" />
            </FormField>
            <FormField label="اسم الخط / المسار">
              <Input value={form.routeName} onChange={e => setForm({ ...form, routeName: e.target.value })} placeholder="حي الموج" />
            </FormField>
            <FormField label="وقت المغادرة الصباحي">
              <Input type="time" value={form.morningTime} onChange={e => setForm({ ...form, morningTime: e.target.value })} />
            </FormField>
            <FormField label="وقت العودة المسائي">
              <Input type="time" value={form.afternoonTime} onChange={e => setForm({ ...form, afternoonTime: e.target.value })} />
            </FormField>
          </div>
          <FormField label="وصف المسار / المحطات">
            <Textarea value={form.routeDescription} onChange={e => setForm({ ...form, routeDescription: e.target.value })} placeholder="وصف مسار الحافلة والمحطات الرئيسية..." />
          </FormField>
          <FormField label="ملاحظات إضافية">
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </FormField>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded accent-blue-600" />
            <span className="font-bold text-gray-700">الحافلة نشطة</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {form.isActive ? 'نشطة' : 'متوقفة'}
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الحافلة'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
