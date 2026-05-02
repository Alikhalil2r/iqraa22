import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi, busesApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { GraduationCap, Phone, Bus, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const GENDER_OPTIONS = [{value:'M',label:'ذكر'},{value:'F',label:'أنثى'}]
const STATUS_OPTIONS = [{value:'active',label:'نشط'},{value:'inactive',label:'غير نشط'},{value:'transferred',label:'محوّل'}]
const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v=>({value:v,label:v}))

const emptyStudent = {
  name:'', nameEn:'', studentNumber:'', gender:'M', dateOfBirth:'', nationality:'عُماني',
  className:'', academicYear:'2024-2025', status:'active',
  parentName:'', parentPhone:'', parentEmail:'', parentRelation:'أب',
  address:'', bloodType:'', medicalNotes:'', busId:'', photo:'', notes:''
}

export default function Students() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyStudent)
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list().then(r => r.data)
  })
  const { data: busesData } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.list().then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => studentsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['students']}); closeModal(); toast.success('تم إضافة الطالب') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({id,...d}: any) => studentsApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['students']}); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['students']}); toast.success('تم الحذف') },
    onError: () => toast.error('حدث خطأ')
  })

  const openAdd = () => { setEditing(null); setForm(emptyStudent); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ name:row.name||'', nameEn:row.name_en||'', studentNumber:row.student_number||'', gender:row.gender||'M',
      dateOfBirth:row.date_of_birth?.split('T')[0]||'', nationality:row.nationality||'عُماني',
      className:row.class_name||'', academicYear:row.academic_year||'2024-2025', status:row.status||'active',
      parentName:row.parent_name||'', parentPhone:row.parent_phone||'', parentEmail:row.parent_email||'',
      parentRelation:row.parent_relation||'أب', address:row.address||'', bloodType:row.blood_type||'',
      medicalNotes:row.medical_notes||'', busId:row.bus_id||'', photo:row.photo||'', notes:row.notes||'' })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return toast.error('الاسم مطلوب')
    const d = {...form, busId: form.busId || null}
    if (editing) updateMut.mutate({id: editing.id, ...d})
    else createMut.mutate(d)
  }

  const buses = busesData?.buses || []
  const busOptions = [{value:'',label:'لا حافلة'}, ...buses.map((b:any) => ({value:b.id, label:`${b.bus_number} - ${b.route_name||''}`}))]

  const columns = [
    { key:'photo', label:'', width:'50px', render: (_:any, row:any) => (
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400">
        {row.photo ? <img src={row.photo} className="w-full h-full object-cover"/> : <GraduationCap size={16}/>}
      </div>
    )},
    { key:'name', label:'اسم الطالب', sortable: true, render: (v:string, row:any) => (
      <div>
        <p className="font-bold text-gray-800">{v}</p>
        <p className="text-xs text-gray-400">{row.student_number}</p>
      </div>
    )},
    { key:'class_name', label:'الفصل', sortable: true },
    { key:'gender', label:'الجنس', render: (v:string) => v === 'M' ? 'ذكر' : 'أنثى' },
    { key:'status', label:'الحالة', render: (v:string) => (
      <span className={v==='active'?'badge-success':v==='inactive'?'badge-danger':'badge-warning'}>
        {v==='active'?'نشط':v==='inactive'?'غير نشط':'محوّل'}
      </span>
    )},
    { key:'parent_name', label:'ولي الأمر', render: (v:string, row:any) => (
      <div className="flex items-center gap-1">
        <span className="text-sm">{v || '—'}</span>
        {row.parent_phone && <a href={`tel:${row.parent_phone}`} className="text-green-500 hover:text-green-700"><Phone size={13}/></a>}
      </div>
    )},
    { key:'bus_number', label:'الحافلة', render: (v:string, row:any) => v ? (
      <span className="flex items-center gap-1 text-blue-600 text-xs font-bold"><Bus size={12}/>{v}</span>
    ) : <span className="text-gray-300 text-xs">—</span>},
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">إدارة الطلاب</h1>
        <p className="text-sm text-gray-400 mt-1">إضافة وتعديل وحذف بيانات الطلاب</p>
      </div>

      <DataTable
        title={`الطلاب (${data?.total || 0})`}
        data={data?.students || []}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row => { if (confirm(`حذف الطالب "${row.name}"؟`)) deleteMut.mutate(row.id) }}
        searchKeys={['name','student_number','parent_name','class_name']}
        addLabel="إضافة طالب"
        loading={isLoading}
        emptyMessage="لا يوجد طلاب مسجلون"
      />

      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الاسم بالعربي" required>
              <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم الكامل"/>
            </FormField>
            <FormField label="الاسم بالإنجليزي">
              <Input value={form.nameEn} onChange={e=>setForm({...form,nameEn:e.target.value})} placeholder="Full Name"/>
            </FormField>
            <FormField label="رقم الطالب">
              <Input value={form.studentNumber} onChange={e=>setForm({...form,studentNumber:e.target.value})} placeholder="2024-001"/>
            </FormField>
            <FormField label="الجنس">
              <Select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} options={GENDER_OPTIONS}/>
            </FormField>
            <FormField label="تاريخ الميلاد">
              <Input type="date" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})}/>
            </FormField>
            <FormField label="الجنسية">
              <Input value={form.nationality} onChange={e=>setForm({...form,nationality:e.target.value})}/>
            </FormField>
            <FormField label="الفصل الدراسي">
              <Input value={form.className} onChange={e=>setForm({...form,className:e.target.value})} placeholder="الصف الخامس - أ"/>
            </FormField>
            <FormField label="العام الدراسي">
              <Input value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/>
            </FormField>
            <FormField label="الحالة">
              <Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={STATUS_OPTIONS}/>
            </FormField>
            <FormField label="الحافلة">
              <Select value={form.busId} onChange={e=>setForm({...form,busId:e.target.value})} options={busOptions}/>
            </FormField>
          </div>
          <hr className="border-gray-100"/>
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider">بيانات ولي الأمر</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="اسم ولي الأمر">
              <Input value={form.parentName} onChange={e=>setForm({...form,parentName:e.target.value})}/>
            </FormField>
            <FormField label="رقم الهاتف">
              <Input value={form.parentPhone} onChange={e=>setForm({...form,parentPhone:e.target.value})} placeholder="+968 9X XXX XXX"/>
            </FormField>
            <FormField label="البريد الإلكتروني">
              <Input type="email" value={form.parentEmail} onChange={e=>setForm({...form,parentEmail:e.target.value})}/>
            </FormField>
            <FormField label="صلة القرابة">
              <Select value={form.parentRelation} onChange={e=>setForm({...form,parentRelation:e.target.value})}
                options={['أب','أم','جد','جدة','عم','خال','أخ','أخت','وصي'].map(v=>({value:v,label:v}))}/>
            </FormField>
          </div>
          <hr className="border-gray-100"/>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="فصيلة الدم">
              <Select value={form.bloodType} onChange={e=>setForm({...form,bloodType:e.target.value})} options={BLOOD_TYPES} placeholder="اختر"/>
            </FormField>
            <FormField label="رابط الصورة">
              <Input value={form.photo} onChange={e=>setForm({...form,photo:e.target.value})} placeholder="https://..."/>
            </FormField>
          </div>
          <FormField label="ملاحظات طبية">
            <Textarea value={form.medicalNotes} onChange={e=>setForm({...form,medicalNotes:e.target.value})}/>
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الطالب'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
