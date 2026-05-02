import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { Users, Phone, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

const EMP_TYPES = [{value:'full-time',label:'دوام كامل'},{value:'part-time',label:'دوام جزئي'},{value:'contract',label:'عقد مؤقت'}]
const EMP_STATUS = [{value:'active',label:'نشط'},{value:'inactive',label:'غير نشط'},{value:'on-leave',label:'إجازة'}]
const GENDER_OPTIONS = [{value:'M',label:'ذكر'},{value:'F',label:'أنثى'}]

const emptyEmp = {
  name:'', nameEn:'', employeeNumber:'', gender:'M', dateOfBirth:'', nationality:'عُماني',
  position:'', department:'', employeeType:'full-time', contractType:'', joinDate:'', endDate:'',
  salary:'', salaryCurrency:'OMR', phone:'', email:'', address:'', qualification:'', specialization:'',
  status:'active', photo:'', civilId:'', passportNumber:'', notes:''
}

export default function Employees() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyEmp)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.list().then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => employeesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['employees']}); closeModal(); toast.success('تم إضافة الموظف') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({id,...d}: any) => employeesApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['employees']}); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['employees']}); toast.success('تم الحذف') },
    onError: () => toast.error('حدث خطأ')
  })

  const openAdd = () => { setEditing(null); setForm(emptyEmp); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ name:row.name||'', nameEn:row.name_en||'', employeeNumber:row.employee_number||'',
      gender:row.gender||'M', dateOfBirth:row.date_of_birth?.split('T')[0]||'', nationality:row.nationality||'عُماني',
      position:row.position||'', department:row.department||'', employeeType:row.employee_type||'full-time',
      contractType:row.contract_type||'', joinDate:row.join_date?.split('T')[0]||'', endDate:row.end_date?.split('T')[0]||'',
      salary:row.salary||'', salaryCurrency:row.salary_currency||'OMR',
      phone:row.phone||'', email:row.email||'', address:row.address||'',
      qualification:row.qualification||'', specialization:row.specialization||'',
      status:row.status||'active', photo:row.photo||'', civilId:row.civil_id||'', passportNumber:row.passport_number||'', notes:row.notes||''
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return toast.error('الاسم مطلوب')
    if (editing) updateMut.mutate({id: editing.id, ...form})
    else createMut.mutate(form)
  }

  const columns = [
    { key:'photo', label:'', width:'50px', render: (_:any, row:any) => (
      <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center text-indigo-400">
        {row.photo ? <img src={row.photo} className="w-full h-full object-cover"/> : <Users size={16}/>}
      </div>
    )},
    { key:'name', label:'الاسم', sortable:true, render: (v:string, row:any) => (
      <div><p className="font-bold text-gray-800">{v}</p><p className="text-xs text-gray-400">{row.employee_number}</p></div>
    )},
    { key:'position', label:'المنصب', sortable:true },
    { key:'department', label:'القسم', sortable:true },
    { key:'employee_type', label:'نوع العقد', render:(v:string)=><span className="badge-info">{EMP_TYPES.find(t=>t.value===v)?.label||v}</span> },
    { key:'salary', label:'الراتب', render:(v:any,row:any)=> v ? (
      <span className="flex items-center gap-1 font-bold text-emerald-600"><DollarSign size={13}/>{parseFloat(v).toLocaleString()} {row.salary_currency}</span>
    ) : '—' },
    { key:'status', label:'الحالة', render:(v:string)=>(
      <span className={v==='active'?'badge-success':v==='on-leave'?'badge-warning':'badge-danger'}>
        {v==='active'?'نشط':v==='on-leave'?'إجازة':'غير نشط'}
      </span>
    )},
    { key:'phone', label:'الهاتف', render:(v:string)=> v ? <a href={`tel:${v}`} className="flex items-center gap-1 text-green-500 text-xs"><Phone size={12}/>{v}</a> : '—' },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">إدارة الموظفين</h1>
        <p className="text-sm text-gray-400 mt-1">سجل الموارد البشرية والرواتب</p>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label:'إجمالي الموظفين', value: data.total || 0, color:'#6366f1' },
            { label:'نشطون', value: (data.employees||[]).filter((e:any)=>e.status==='active').length, color:'#10b981' },
            { label:'في إجازة', value: (data.employees||[]).filter((e:any)=>e.status==='on-leave').length, color:'#f59e0b' },
            { label:'إجمالي الرواتب', value: (data.employees||[]).reduce((s:number,e:any)=>s+(parseFloat(e.salary)||0),0).toLocaleString()+' OMR', color:'#0ea5e9' },
          ].map(card => (
            <div key={card.label} className="card">
              <p className="text-xs font-bold text-gray-400 mb-1">{card.label}</p>
              <p className="text-2xl font-black" style={{color:card.color}}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <DataTable
        title={`الموظفون (${data?.total || 0})`}
        data={data?.employees || []}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row => { if (confirm(`حذف "${row.name}"؟`)) deleteMut.mutate(row.id) }}
        searchKeys={['name','employee_number','position','department']}
        addLabel="إضافة موظف"
        loading={isLoading}
      />

      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل الموظف' : 'إضافة موظف جديد'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الاسم بالعربي" required>
              <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            </FormField>
            <FormField label="الاسم بالإنجليزي">
              <Input value={form.nameEn} onChange={e=>setForm({...form,nameEn:e.target.value})}/>
            </FormField>
            <FormField label="رقم الموظف">
              <Input value={form.employeeNumber} onChange={e=>setForm({...form,employeeNumber:e.target.value})}/>
            </FormField>
            <FormField label="الجنس">
              <Select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} options={GENDER_OPTIONS}/>
            </FormField>
            <FormField label="المنصب" required>
              <Input value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/>
            </FormField>
            <FormField label="القسم" required>
              <Input value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/>
            </FormField>
            <FormField label="نوع العقد">
              <Select value={form.employeeType} onChange={e=>setForm({...form,employeeType:e.target.value})} options={EMP_TYPES}/>
            </FormField>
            <FormField label="الحالة">
              <Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={EMP_STATUS}/>
            </FormField>
            <FormField label="تاريخ الانضمام">
              <Input type="date" value={form.joinDate} onChange={e=>setForm({...form,joinDate:e.target.value})}/>
            </FormField>
            <FormField label="الراتب (OMR)">
              <Input type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} placeholder="0.000"/>
            </FormField>
            <FormField label="الهاتف">
              <Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
            </FormField>
            <FormField label="البريد الإلكتروني">
              <Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            </FormField>
            <FormField label="المؤهل العلمي">
              <Input value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})}/>
            </FormField>
            <FormField label="التخصص">
              <Input value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})}/>
            </FormField>
            <FormField label="رقم الهوية">
              <Input value={form.civilId} onChange={e=>setForm({...form,civilId:e.target.value})}/>
            </FormField>
            <FormField label="رقم جواز السفر">
              <Input value={form.passportNumber} onChange={e=>setForm({...form,passportNumber:e.target.value})}/>
            </FormField>
          </div>
          <FormField label="ملاحظات">
            <Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={createMut.isPending||updateMut.isPending}>
              {(createMut.isPending||updateMut.isPending) ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الموظف'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
