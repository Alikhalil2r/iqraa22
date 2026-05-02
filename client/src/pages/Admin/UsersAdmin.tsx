import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAdminApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select } from '../../components/FormField'
import { Shield, UserPlus, Lock, CheckCircle, XCircle, Eye, EyeOff, Users, Key } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'admin',   label: 'مدير النظام' },
  { value: 'teacher', label: 'معلم' },
  { value: 'parent',  label: 'ولي أمر' },
]
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:   { label: 'مدير النظام', color: '#8b5cf6', bg: 'bg-purple-50 text-purple-700' },
  teacher: { label: 'معلم',        color: '#3b82f6', bg: 'bg-blue-50 text-blue-700' },
  parent:  { label: 'ولي أمر',    color: '#10b981', bg: 'bg-emerald-50 text-emerald-700' },
}
const emptyUser = { name: '', username: '', password: '', role: 'teacher', email: '', phone: '', isActive: true }

export default function UsersAdmin() {
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form,    setForm]    = useState(emptyUser)
  const [showPw,  setShowPw]  = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users-admin'],
    queryFn: () => usersAdminApi.list().then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => usersAdminApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users-admin'] }); closeModal(); toast.success('✅ تم إضافة المستخدم') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => usersAdminApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users-admin'] }); closeModal(); toast.success('✅ تم تعديل المستخدم') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => usersAdminApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users-admin'] }); toast.success('تم الحذف') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'لا يمكن الحذف')
  })

  const openAdd  = () => { setEditing(null); setForm(emptyUser); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ name: row.name, username: row.username, password: '', role: row.role, email: row.email || '', phone: row.phone || '', isActive: row.is_active })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setShowPw(false) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.username) return toast.error('الاسم واسم المستخدم مطلوبان')
    if (!editing && !form.password) return toast.error('كلمة المرور مطلوبة للمستخدم الجديد')
    const payload = { ...form }
    if (!payload.password) delete (payload as any).password
    if (editing) updateMut.mutate({ id: editing.id, ...payload })
    else createMut.mutate(payload)
  }

  const users = data?.users || []
  const adminCount   = users.filter((u: any) => u.role === 'admin').length
  const teacherCount = users.filter((u: any) => u.role === 'teacher').length
  const parentCount  = users.filter((u: any) => u.role === 'parent').length
  const activeCount  = users.filter((u: any) => u.is_active).length

  const columns = [
    {
      key: 'name', label: 'المستخدم', sortable: true,
      render: (v: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
            style={{ background: ROLE_CONFIG[row.role]?.color || '#6b7280' }}>
            {v?.[0]}
          </div>
          <div>
            <p className="font-bold text-gray-800">{v}</p>
            <p className="text-[10px] text-gray-400 font-mono">@{row.username}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role', label: 'الصلاحية',
      render: (v: string) => (
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${ROLE_CONFIG[v]?.bg || 'bg-gray-50 text-gray-600'}`}>
          {ROLE_CONFIG[v]?.label || v}
        </span>
      )
    },
    { key: 'email', label: 'البريد الإلكتروني', render: (v: string) => v ? <span className="text-xs text-gray-500">{v}</span> : <span className="text-gray-300">—</span> },
    { key: 'phone', label: 'الهاتف', render: (v: string) => v ? <span className="text-xs text-gray-500">{v}</span> : <span className="text-gray-300">—</span> },
    {
      key: 'is_active', label: 'الحالة',
      render: (v: boolean) => v
        ? <span className="badge-success flex items-center gap-1 w-fit text-[11px]"><CheckCircle size={10} /> مفعّل</span>
        : <span className="badge-danger flex items-center gap-1 w-fit text-[11px]"><XCircle size={10} /> معطّل</span>
    },
    {
      key: 'created_at', label: 'تاريخ الإنشاء', sortable: true,
      render: (v: string) => v ? <span className="text-xs text-gray-400">{new Date(v).toLocaleDateString('ar-OM')}</span> : <span className="text-gray-300">—</span>
    },
  ]

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Shield size={22} className="text-purple-600" /> إدارة المستخدمين</h1>
        <p className="text-sm text-gray-400 mt-1">إدارة حسابات المديرين والمعلمين وأولياء الأمور</p>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { l: 'إجمالي المستخدمين', v: users.length,   c: '#6366f1', icon: <Users size={15} /> },
            { l: 'المديرون',           v: adminCount,     c: '#8b5cf6', icon: <Shield size={15} /> },
            { l: 'المعلمون',           v: teacherCount,   c: '#3b82f6', icon: <UserPlus size={15} /> },
            { l: 'أولياء الأمور',     v: parentCount,    c: '#10b981', icon: <Users size={15} /> },
          ].map(s => (
            <div key={s.l} className="card !py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.c + '18', color: s.c }}>{s.icon}</div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold">{s.l}</p>
                <p className="text-xl font-black" style={{ color: s.c }}>{s.v}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        title={`المستخدمون (${users.length})`}
        data={users}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row => deleteMut.mutate(row.id)}
        deleteMessage={row => `هل تريد حذف المستخدم "${row.name}"؟`}
        searchKeys={['name', 'username', 'email', 'role']}
        addLabel="إضافة مستخدم"
        loading={isLoading}
        emptyMessage="لا يوجد مستخدمون مسجلون"
        exportFilename="المستخدمون"
      />

      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الاسم الكامل" required>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="محمد أحمد" />
            </FormField>
            <FormField label="اسم المستخدم" required>
              <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="mohammed" dir="ltr" />
            </FormField>
          </div>
          <FormField label={editing ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'} required={!editing}>
            <div className="relative">
              <Input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? '••••••••' : 'أدخل كلمة المرور'} dir="ltr" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الصلاحية">
              <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} options={ROLES} />
            </FormField>
            <FormField label="البريد الإلكتروني">
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@school.com" dir="ltr" />
            </FormField>
          </div>
          <FormField label="رقم الهاتف">
            <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+968 XXXX XXXX" />
          </FormField>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4.5 h-4.5 rounded accent-purple-600" />
            <span className="font-bold text-sm text-gray-700">الحساب مفعّل</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {form.isActive ? 'مفعّل' : 'معطّل'}
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3 font-black flex items-center justify-center gap-2"
              disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'حفظ التعديلات' : 'إنشاء الحساب'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
