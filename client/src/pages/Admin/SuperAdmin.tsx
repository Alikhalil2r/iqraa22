import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Building2, Users, GraduationCap, MessageSquare, Plus, Trash2, Globe, TrendingUp, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../../components/Modal'
import { FormField, Input } from '../../components/FormField'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const api = (path: string, method = 'GET', data?: any) =>
  axios({ method, url: `/api${path}`, data, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

const emptySchool = { name: '', nameEn: '', tagline: '', address: '', phone: '', email: '', website: '', logoUrl: '' }

export default function SuperAdmin() {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptySchool)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: statsData } = useQuery({ queryKey: ['super-stats'], queryFn: () => api('/super-admin/stats').then(r => r.data) })
  const { data: schoolsData, isLoading } = useQuery({ queryKey: ['super-schools'], queryFn: () => api('/super-admin/schools').then(r => r.data) })

  const createMut = useMutation({
    mutationFn: (d: any) => api('/super-admin/schools', 'POST', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-schools'] }); qc.invalidateQueries({ queryKey: ['super-stats'] }); setModal(false); setForm(emptySchool); toast.success('تمت إضافة المدرسة') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/super-admin/schools/${id}`, 'DELETE'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-schools'] }); qc.invalidateQueries({ queryKey: ['super-stats'] }); toast.success('تم حذف المدرسة') },
    onError: () => toast.error('حدث خطأ')
  })

  const stats = statsData?.stats || {}
  const schools = schoolsData?.schools || []
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const STAT_CARDS = [
    { label: 'إجمالي المدارس', value: stats.total_schools || 0, icon: <Building2 size={18} />, color: '#6366f1' },
    { label: 'إجمالي الطلاب', value: stats.total_students || 0, icon: <GraduationCap size={18} />, color: '#10b981' },
    { label: 'إجمالي الموظفين', value: stats.total_employees || 0, icon: <Users size={18} />, color: '#f59e0b' },
    { label: 'إجمالي المستخدمين', value: stats.total_users || 0, icon: <Users size={18} />, color: '#8b5cf6' },
    { label: 'إجمالي الرسائل', value: stats.total_messages || 0, icon: <MessageSquare size={18} />, color: '#0ea5e9' },
    { label: 'إجمالي الإيرادات', value: `${Number(stats.total_revenue || 0).toLocaleString('ar-OM')} ر.ع`, icon: <DollarSign size={18} />, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary)', color: 'white' }}>
              <Globe size={15} />
            </div>
            <h1 className="text-2xl font-black text-gray-800">لوحة الإدارة العليا</h1>
          </div>
          <p className="text-gray-500 text-sm">إدارة جميع المدارس في النظام</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> إضافة مدرسة جديدة
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card text-center !py-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: s.color + '18', color: s.color }}>{s.icon}</div>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Schools List */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <Building2 size={17} style={{ color: 'var(--color-primary)' }} />
            المدارس المسجلة ({schools.length})
          </h2>
          <span className="text-xs text-gray-400">{schools.length} مدرسة</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : schools.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">لا توجد مدارس مسجلة</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {schools.map((school: any) => (
              <div key={school.id} className="hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden"
                    style={{ background: 'var(--color-primary)15' }}>
                    {school.logo_url
                      ? <img src={school.logo_url} alt="" className="w-full h-full object-cover" />
                      : <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 truncate">{school.name}</p>
                    {school.name_en && <p className="text-xs text-gray-400">{school.name_en}</p>}
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <GraduationCap size={10} /> {school.students_count} طالب
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users size={10} /> {school.employees_count} موظف
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageSquare size={10} /> {school.messages_count} رسالة
                      </span>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                        <DollarSign size={10} /> {Number(school.revenue || 0).toLocaleString('ar-OM')} ر.ع
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setExpanded(expanded === school.id ? null : school.id)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      {expanded === school.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button onClick={() => setDeleteTarget(school)}
                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded === school.id && (
                  <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 border-t border-gray-100">
                    {[
                      { label: 'البريد الإلكتروني', value: school.email || '—' },
                      { label: 'رقم الهاتف', value: school.phone || '—' },
                      { label: 'الموقع الإلكتروني', value: school.website || '—' },
                      { label: 'تاريخ التسجيل', value: school.created_at ? new Date(school.created_at).toLocaleDateString('ar-OM') : '—' },
                    ].map(d => (
                      <div key={d.label} className="bg-white rounded-xl p-3 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold">{d.label}</p>
                        <p className="text-sm font-bold text-gray-700 mt-0.5 truncate">{d.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Chart Placeholder */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={17} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-black text-gray-800">النمو الإجمالي للنظام</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'معدل نمو الطلاب', value: '+12%', color: '#10b981' },
            { label: 'نسبة الأولياء النشطين', value: '78%', color: '#6366f1' },
            { label: 'معدل استخدام النظام', value: '94%', color: '#f59e0b' },
          ].map(m => (
            <div key={m.label} className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs text-gray-400 font-bold mt-1">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add School Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(emptySchool) }} title="إضافة مدرسة جديدة">
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="اسم المدرسة (عربي)" required>
              <Input value={form.name} onChange={set('name')} placeholder="مدرسة النجاح" required />
            </FormField>
            <FormField label="اسم المدرسة (إنجليزي)">
              <Input value={form.nameEn} onChange={set('nameEn')} placeholder="Al Najah School" />
            </FormField>
          </div>
          <FormField label="الشعار / الوصف المختصر">
            <Input value={form.tagline} onChange={set('tagline')} placeholder="بناء المستقبل بالعلم والإيمان" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="رقم الهاتف">
              <Input value={form.phone} onChange={set('phone')} placeholder="+968 22 000 000" />
            </FormField>
            <FormField label="البريد الإلكتروني">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="info@school.com" />
            </FormField>
          </div>
          <FormField label="العنوان">
            <Input value={form.address} onChange={set('address')} placeholder="مسقط، سلطنة عمان" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="الموقع الإلكتروني">
              <Input value={form.website} onChange={set('website')} placeholder="https://school.com" />
            </FormField>
            <FormField label="رابط الشعار">
              <Input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." />
            </FormField>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={createMut.isPending}>
              {createMut.isPending ? 'جارٍ الإضافة...' : 'إضافة المدرسة'}
            </button>
            <button type="button" onClick={() => { setModal(false); setForm(emptySchool) }} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="حذف المدرسة" message={`هل أنت متأكد من حذف مدرسة "${deleteTarget?.name}"؟ سيتم حذف جميع البيانات المرتبطة بها نهائياً.`}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
