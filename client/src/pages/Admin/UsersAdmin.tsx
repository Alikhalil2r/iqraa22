import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select } from '../../components/FormField'
import { Shield, Lock, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [{value:'admin',label:'مدير النظام'},{value:'teacher',label:'معلم'},{value:'parent',label:'ولي أمر'}]
const emptyUser = { name:'', username:'', password:'', role:'teacher', email:'', phone:'', isActive:true }

export default function UsersAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyUser)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey:['users-admin'], queryFn:()=>settingsApi.get().then(async()=>{
    const r = await fetch('/api/settings/users', {headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}})
    return r.json()
  })})

  const createMut = useMutation({ mutationFn:(d:any)=>settingsApi.update({...d, _action:'create_user'}),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['users-admin']}); closeModal(); toast.success('تم إضافة المستخدم') },
    onError:(e:any)=>toast.error(e.response?.data?.error||'حدث خطأ') })

  const closeModal = () => { setModal(false); setEditing(null) }

  // Direct API calls
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.username || !form.password) return toast.error('الاسم واسم المستخدم وكلمة المرور مطلوبة')
    try {
      const r = await fetch('/api/settings/users', {
        method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('token')}`},
        body: JSON.stringify(form)
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      qc.invalidateQueries({queryKey:['users-list']})
      closeModal(); toast.success('تم إضافة المستخدم بنجاح')
    } catch(e:any) { toast.error(e.message||'حدث خطأ') }
  }

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const r = await fetch('/api/settings/users', {headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}})
      return r.json()
    }
  })

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا المستخدم؟')) return
    await fetch(`/api/settings/users/${id}`, {method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}})
    qc.invalidateQueries({queryKey:['users-list']})
    toast.success('تم الحذف')
  }

  const toggleActive = async (user: any) => {
    await fetch(`/api/settings/users/${user.id}`, {
      method:'PUT', headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('token')}`},
      body: JSON.stringify({...user, isActive: !user.is_active})
    })
    qc.invalidateQueries({queryKey:['users-list']})
    toast.success('تم التغيير')
  }

  const columns = [
    { key:'name', label:'الاسم', sortable:true, render:(v:string,row:any)=>(
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{background:'var(--color-primary)'}}>
          {v?.[0]}
        </div>
        <div><p className="font-bold text-gray-800">{v}</p><p className="text-xs text-gray-400">@{row.username}</p></div>
      </div>
    )},
    { key:'role', label:'الصلاحية', render:(v:string)=>(
      <span className={`font-bold text-xs px-2.5 py-1 rounded-full ${v==='admin'?'bg-red-100 text-red-700':v==='teacher'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
        {ROLES.find(r=>r.value===v)?.label||v}
      </span>
    )},
    { key:'email', label:'البريد الإلكتروني' },
    { key:'is_active', label:'الحالة', render:(v:boolean,row:any)=>(
      <button onClick={()=>toggleActive(row)} className={`badge-${v?'success':'danger'} cursor-pointer`}>{v?'نشط':'معطل'}</button>
    )},
    { key:'last_login', label:'آخر دخول', render:(v:string)=>v?new Date(v).toLocaleDateString('ar-OM'):'لم يدخل' },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Shield size={24}/>إدارة المستخدمين</h1>
        <p className="text-sm text-gray-400 mt-1">إدارة حسابات المشرفين والمعلمين وأولياء الأمور</p>
      </div>
      <div className="card mb-6 p-4 bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-700 font-bold flex items-center gap-2"><Lock size={14}/>كلمات المرور مشفرة ولا تُعرض - لإعادة تعيين كلمة مرور أي مستخدم، استخدم إضافة مستخدم جديد أو تواصل مع مدير النظام.</p>
      </div>
      <DataTable
        title={`المستخدمون (${usersData?.users?.length||0})`}
        data={usersData?.users||[]} columns={columns}
        onAdd={()=>{setEditing(null);setForm(emptyUser);setModal(true)}}
        onDelete={row=>handleDelete(row.id)}
        searchKeys={['name','username','email']}
        addLabel="إضافة مستخدم"
        loading={usersLoading}
      />

      <Modal open={modal} onClose={closeModal} title="إضافة مستخدم جديد" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="الاسم الكامل" required><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="اسم المستخدم" required><Input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} dir="ltr" placeholder="username"/></FormField>
            <FormField label="كلمة المرور" required><Input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} dir="ltr"/></FormField>
          </div>
          <FormField label="الصلاحية"><Select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} options={ROLES}/></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="البريد الإلكتروني"><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></FormField>
            <FormField label="الهاتف"><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"><UserPlus size={16}/>إضافة المستخدم</button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
