import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { busesApi, studentsApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { FormField, Input, Textarea } from '../../components/FormField'
import { Bus, Users, Phone, MapPin, Clock, Plus, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyBus = {
  busNumber:'', plateNumber:'', driverName:'', driverPhone:'', supervisorName:'', supervisorPhone:'',
  capacity:'40', routeName:'', routeDescription:'', morningTime:'', afternoonTime:'', isActive:true, gpsId:'', notes:''
}

export default function Buses() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyBus)
  const [selectedBus, setSelectedBus] = useState<any>(null)
  const [confirmBus, setConfirmBus] = useState<any>(null)
  const qc = useQueryClient()

  const { data: busesData, isLoading } = useQuery({
    queryKey: ['buses'], queryFn: () => busesApi.list().then(r => r.data)
  })
  const { data: studentsData } = useQuery({
    queryKey: ['students'], queryFn: () => studentsApi.list().then(r => r.data)
  })

  const createMut = useMutation({ mutationFn: (d:any) => busesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['buses']}); closeModal(); toast.success('تم إضافة الحافلة') } })
  const updateMut = useMutation({ mutationFn: ({id,...d}:any) => busesApi.update(id,d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['buses']}); closeModal(); toast.success('تم التعديل') } })
  const deleteMut = useMutation({ mutationFn: (id:string) => busesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['buses']}); toast.success('تم الحذف') } })
  const assignMut = useMutation({ mutationFn: ({busId,studentId}:any) => busesApi.assignStudent(busId,studentId),
    onSuccess: () => { qc.invalidateQueries({queryKey:['students']}); toast.success('تم تعيين الطالب') } })
  const removeMut = useMutation({ mutationFn: ({busId,studentId}:any) => busesApi.removeStudent(busId,studentId),
    onSuccess: () => { qc.invalidateQueries({queryKey:['students']}); toast.success('تم الإزالة') } })

  const openAdd = () => { setEditing(null); setForm(emptyBus); setModal(true) }
  const openEdit = (b:any) => {
    setEditing(b)
    setForm({ busNumber:b.bus_number, plateNumber:b.plate_number||'', driverName:b.driver_name||'', driverPhone:b.driver_phone||'',
      supervisorName:b.supervisor_name||'', supervisorPhone:b.supervisor_phone||'', capacity:b.capacity||'40',
      routeName:b.route_name||'', routeDescription:b.route_description||'',
      morningTime:b.morning_time||'', afternoonTime:b.afternoon_time||'', isActive:b.is_active, gpsId:b.gps_id||'', notes:b.notes||'' })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.busNumber) return toast.error('رقم الحافلة مطلوب')
    if (editing) updateMut.mutate({id:editing.id,...form})
    else createMut.mutate(form)
  }

  const buses = busesData?.buses || []
  const students = studentsData?.students || []
  const unassignedStudents = students.filter((s:any) => !s.bus_id)
  const busStudents = selectedBus ? students.filter((s:any) => s.bus_id === selectedBus.id) : []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">الحافلات المدرسية</h1>
          <p className="text-sm text-gray-400 mt-1">إدارة أسطول الحافلات وتعيين الطلاب</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/>إضافة حافلة</button>
      </div>

      {isLoading ? <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div> : (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Bus cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-wider">الحافلات ({buses.length})</h3>
            {buses.map((bus: any) => (
              <div key={bus.id} onClick={() => setSelectedBus(selectedBus?.id === bus.id ? null : bus)}
                className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-md ${selectedBus?.id === bus.id ? 'border-blue-400 shadow-md' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--color-primary)'}}>
                      <Bus size={22} className="text-white"/>
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800">حافلة {bus.bus_number}</h4>
                      <p className="text-sm text-gray-400">{bus.plate_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={bus.is_active ? 'badge-success' : 'badge-danger'}>{bus.is_active ? 'نشطة' : 'متوقفة'}</span>
                    <button onClick={e=>{e.stopPropagation();openEdit(bus)}} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit size={14}/></button>
                    <button onClick={e=>{e.stopPropagation();setConfirmBus(bus)}} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {bus.route_name && <div className="flex items-center gap-2 text-gray-600"><MapPin size={13} className="text-blue-400"/>{bus.route_name}</div>}
                  {bus.driver_name && <div className="flex items-center gap-2 text-gray-600"><Users size={13} className="text-purple-400"/>{bus.driver_name}</div>}
                  {bus.morning_time && <div className="flex items-center gap-2 text-gray-600"><Clock size={13} className="text-green-400"/>صباح {bus.morning_time}</div>}
                  {bus.afternoon_time && <div className="flex items-center gap-2 text-gray-600"><Clock size={13} className="text-amber-400"/>ظهر {bus.afternoon_time}</div>}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{bus.student_count || 0} / {bus.capacity} طالب</span>
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${Math.min(100,(bus.student_count/bus.capacity)*100)}%`, background:'var(--color-primary)'}}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Students panel */}
          {selectedBus && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 h-fit">
              <h3 className="font-black text-gray-800 mb-4">طلاب حافلة {selectedBus.bus_number}</h3>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {busStudents.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">لا يوجد طلاب مسجلون في هذه الحافلة</p> :
                  busStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.class_name}</p>
                      </div>
                      <button onClick={() => removeMut.mutate({busId:selectedBus.id,studentId:s.id})}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  ))
                }
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-black text-gray-500 mb-2">إضافة طالب للحافلة</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {unassignedStudents.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50">
                      <p className="text-sm text-gray-700">{s.name}</p>
                      <button onClick={() => assignMut.mutate({busId:selectedBus.id,studentId:s.id})}
                        className="text-xs text-blue-600 font-bold hover:underline">إضافة</button>
                    </div>
                  ))}
                  {unassignedStudents.length === 0 && <p className="text-xs text-gray-400">جميع الطلاب مسجلون في حافلات</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmBus}
        title="حذف الحافلة"
        message={`هل تريد حذف حافلة رقم "${confirmBus?.bus_number}" بشكل نهائي؟`}
        confirmLabel="نعم، احذف"
        danger
        onConfirm={() => { deleteMut.mutate(confirmBus.id); setConfirmBus(null) }}
        onCancel={() => setConfirmBus(null)}
      />

      <Modal open={modal} onClose={closeModal} title={editing?'تعديل الحافلة':'إضافة حافلة جديدة'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="رقم الحافلة" required><Input value={form.busNumber} onChange={e=>setForm({...form,busNumber:e.target.value})} placeholder="001"/></FormField>
            <FormField label="رقم اللوحة"><Input value={form.plateNumber} onChange={e=>setForm({...form,plateNumber:e.target.value})}/></FormField>
            <FormField label="اسم السائق"><Input value={form.driverName} onChange={e=>setForm({...form,driverName:e.target.value})}/></FormField>
            <FormField label="هاتف السائق"><Input value={form.driverPhone} onChange={e=>setForm({...form,driverPhone:e.target.value})}/></FormField>
            <FormField label="اسم المشرف"><Input value={form.supervisorName} onChange={e=>setForm({...form,supervisorName:e.target.value})}/></FormField>
            <FormField label="هاتف المشرف"><Input value={form.supervisorPhone} onChange={e=>setForm({...form,supervisorPhone:e.target.value})}/></FormField>
            <FormField label="السعة"><Input type="number" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})}/></FormField>
            <FormField label="اسم الخط"><Input value={form.routeName} onChange={e=>setForm({...form,routeName:e.target.value})}/></FormField>
            <FormField label="وقت الصباح"><Input type="time" value={form.morningTime} onChange={e=>setForm({...form,morningTime:e.target.value})}/></FormField>
            <FormField label="وقت الظهر"><Input type="time" value={form.afternoonTime} onChange={e=>setForm({...form,afternoonTime:e.target.value})}/></FormField>
          </div>
          <FormField label="وصف المسار"><Textarea value={form.routeDescription} onChange={e=>setForm({...form,routeDescription:e.target.value})}/></FormField>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} className="w-5 h-5 rounded"/>
            <span className="font-bold text-gray-700">الحافلة نشطة</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3">{editing?'حفظ التعديلات':'إضافة الحافلة'}</button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
