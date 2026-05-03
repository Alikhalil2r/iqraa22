import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Building2, Users, GraduationCap, MessageSquare, Plus, Trash2, Globe,
  TrendingUp, DollarSign, ChevronDown, ChevronUp, Shield, CheckCircle,
  XCircle, Clock, Crown, Zap, Star, Copy, Eye, EyeOff, Mail, Edit
} from 'lucide-react'
import Modal from '../../components/Modal'
import { FormField, Input } from '../../components/FormField'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const api = (path: string, method = 'GET', data?: any) =>
  axios({ method, url: `/api${path}`, data, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

const emptySchool = { name: '', nameEn: '', tagline: '', address: '', phone: '', email: '', website: '', logoUrl: '', plan: 'basic', notes: '' }

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  basic:      { label: 'أساسي', color: '#6b7280', bg: '#f3f4f6', icon: Shield, desc: 'حتى 200 طالب' },
  pro:        { label: 'محترف', color: '#7c3aed', bg: '#f5f3ff', icon: Zap, desc: 'حتى 1000 طالب' },
  enterprise: { label: 'مؤسسي', color: '#d97706', bg: '#fffbeb', icon: Crown, desc: 'غير محدود' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active:    { label: 'نشطة', color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle },
  trial:     { label: 'تجريبي', color: '#d97706', bg: '#fffbeb', icon: Clock },
  suspended: { label: 'موقوفة', color: '#dc2626', bg: '#fef2f2', icon: XCircle },
}

export default function SuperAdmin() {
  const [modal, setModal]             = useState(false)
  const [editModal, setEditModal]     = useState(false)
  const [planModal, setPlanModal]     = useState(false)
  const [credModal, setCredModal]     = useState<any>(null)
  const [form, setForm]               = useState(emptySchool)
  const [editForm, setEditForm]       = useState<any>({})
  const [planForm, setPlanForm]       = useState({ plan: 'basic', planExpiresAt: '' })
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [targetSchool, setTargetSchool] = useState<any>(null)
  const [showPass, setShowPass]       = useState(false)
  const qc = useQueryClient()

  const { data: statsData } = useQuery({ queryKey: ['super-stats'], queryFn: () => api('/super-admin/stats').then(r => r.data) })
  const { data: schoolsData, isLoading } = useQuery({ queryKey: ['super-schools'], queryFn: () => api('/super-admin/schools').then(r => r.data) })

  const createMut = useMutation({
    mutationFn: (d: any) => api('/super-admin/schools', 'POST', d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['super-schools'] }); qc.invalidateQueries({ queryKey: ['super-stats'] })
      setModal(false); setForm(emptySchool)
      if (res.data.credentials) setCredModal(res.data.credentials)
      toast.success('تمت إضافة المدرسة')
    },
    onError: () => toast.error('حدث خطأ في الإضافة')
  })
  const statusMut = useMutation({
    mutationFn: ({ id, status }: any) => api(`/super-admin/schools/${id}/status`, 'PUT', { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-schools'] }); toast.success('تم تحديث الحالة') },
    onError: () => toast.error('حدث خطأ')
  })
  const planMut = useMutation({
    mutationFn: ({ id, ...data }: any) => api(`/super-admin/schools/${id}/plan`, 'PUT', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-schools'] }); setPlanModal(false); toast.success('تم تحديث الخطة') },
    onError: () => toast.error('حدث خطأ')
  })
  const editMut = useMutation({
    mutationFn: ({ id, ...data }: any) => api(`/super-admin/schools/${id}`, 'PUT', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['super-schools'] }); setEditModal(false); toast.success('تم تحديث البيانات') },
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
  const setE = (k: string) => (e: any) => setEditForm((f: any) => ({ ...f, [k]: e.target.value }))

  const STAT_CARDS = [
    { label: 'إجمالي المدارس',     value: stats.total_schools || 0,     icon: Building2,    color: '#6366f1' },
    { label: 'مدارس نشطة',         value: stats.active_schools || 0,    icon: CheckCircle,  color: '#10b981' },
    { label: 'في الفترة التجريبية',value: stats.trial_schools || 0,     icon: Clock,        color: '#f59e0b' },
    { label: 'موقوفة',              value: stats.suspended_schools || 0, icon: XCircle,      color: '#ef4444' },
    { label: 'إجمالي الطلاب',      value: stats.total_students || 0,    icon: GraduationCap,color: '#0ea5e9' },
    { label: 'إجمالي الإيرادات',   value: `${Number(stats.total_revenue||0).toLocaleString('ar-OM')} ر.ع`, icon: DollarSign, color: '#8b5cf6' },
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
          <p className="text-gray-500 text-sm">إدارة جميع المدارس والاشتراكات في النظام</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> إضافة مدرسة جديدة
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card text-center !py-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: s.color + '18', color: s.color }}>
              <s.icon size={18} />
            </div>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(PLAN_CONFIG).map(([key, cfg]) => {
          const count = schools.filter((s: any) => (s.plan || 'basic') === key).length
          return (
            <div key={key} className="card text-center" style={{ borderTop: `3px solid ${cfg.color}` }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2" style={{ background: cfg.bg, color: cfg.color }}>
                <cfg.icon size={20} />
              </div>
              <p className="text-3xl font-black" style={{ color: cfg.color }}>{count}</p>
              <p className="font-black text-gray-700 text-sm mt-1">خطة {cfg.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cfg.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Schools List */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-gray-800 flex items-center gap-2">
            <Building2 size={17} style={{ color: 'var(--color-primary)' }} />
            المدارس المسجلة ({schools.length})
          </h2>
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
            {schools.map((school: any) => {
              const plan = PLAN_CONFIG[school.plan || 'basic']
              const status = STATUS_CONFIG[school.status || 'active']
              const StatusIcon = status.icon
              const PlanIcon = plan.icon
              return (
                <div key={school.id} className="hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Logo */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden"
                      style={{ background: 'var(--color-primary)15' }}>
                      {school.logo_url
                        ? <img src={school.logo_url} alt="" className="w-full h-full object-cover" />
                        : <Building2 size={20} style={{ color: 'var(--color-primary)' }} />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-gray-800 truncate">{school.name}</p>
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: plan.bg, color: plan.color }}>
                          <PlanIcon size={10} />{plan.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>
                          <StatusIcon size={10} />{status.label}
                        </span>
                      </div>
                      {school.name_en && <p className="text-xs text-gray-400">{school.name_en}</p>}
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400"><GraduationCap size={10} /> {school.students_count} طالب</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Users size={10} /> {school.employees_count} موظف</span>
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold"><DollarSign size={10} /> {Number(school.revenue||0).toLocaleString('ar-OM')} ر.ع</span>
                        {school.admin_username && (
                          <span className="flex items-center gap-1 text-xs text-blue-500"><Shield size={10} /> {school.admin_username}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {/* Status toggle */}
                      <select value={school.status || 'active'}
                        onChange={e => statusMut.mutate({ id: school.id, status: e.target.value })}
                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white font-bold cursor-pointer"
                        style={{ color: STATUS_CONFIG[school.status||'active'].color }}>
                        <option value="active">نشطة</option>
                        <option value="trial">تجريبي</option>
                        <option value="suspended">موقوفة</option>
                      </select>
                      {/* Edit */}
                      <button onClick={() => { setEditForm({ ...school, nameEn: school.name_en, logoUrl: school.logo_url }); setTargetSchool(school); setEditModal(true) }}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors" title="تعديل">
                        <Edit size={13} />
                      </button>
                      {/* Plan */}
                      <button onClick={() => { setPlanForm({ plan: school.plan||'basic', planExpiresAt: school.plan_expires_at||'' }); setTargetSchool(school); setPlanModal(true) }}
                        className="p-1.5 rounded-lg bg-purple-50 text-purple-500 hover:bg-purple-100 transition-colors" title="تغيير الخطة">
                        <Crown size={13} />
                      </button>
                      {/* Expand */}
                      <button onClick={() => setExpanded(expanded === school.id ? null : school.id)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                        {expanded === school.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      {/* Delete */}
                      <button onClick={() => setDeleteTarget(school)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded */}
                  {expanded === school.id && (
                    <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 border-t border-gray-100">
                      {[
                        { label: 'البريد الإلكتروني', value: school.email || '—' },
                        { label: 'رقم الهاتف', value: school.phone || '—' },
                        { label: 'الموقع الإلكتروني', value: school.website || '—' },
                        { label: 'تاريخ التسجيل', value: school.created_at ? new Date(school.created_at).toLocaleDateString('ar-OM') : '—' },
                        { label: 'المستخدم Admin', value: school.admin_username || '—' },
                        { label: 'انتهاء الخطة', value: school.plan_expires_at ? new Date(school.plan_expires_at).toLocaleDateString('ar-OM') : 'غير محدد' },
                        { label: 'ملاحظات', value: school.notes || '—' },
                      ].map(d => (
                        <div key={d.label} className="bg-white rounded-xl p-3 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold">{d.label}</p>
                          <p className="text-sm font-bold text-gray-700 mt-0.5 truncate">{d.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
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
            <FormField label="خطة الاشتراك">
              <select value={form.plan} onChange={set('plan')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400">
                <option value="basic">أساسي — حتى 200 طالب</option>
                <option value="pro">محترف — حتى 1000 طالب</option>
                <option value="enterprise">مؤسسي — غير محدود</option>
              </select>
            </FormField>
          </div>
          <FormField label="ملاحظات">
            <Input value={form.notes} onChange={set('notes')} placeholder="ملاحظات إضافية..." />
          </FormField>
          <div className="p-3 rounded-xl text-xs text-blue-700 bg-blue-50 border border-blue-100">
            <strong>ملاحظة:</strong> سيتم إنشاء حساب Admin تلقائياً للمدرسة. ستظهر بيانات الدخول بعد الحفظ.
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={createMut.isPending}>
              {createMut.isPending ? 'جارٍ الإضافة...' : 'إضافة المدرسة'}
            </button>
            <button type="button" onClick={() => { setModal(false); setForm(emptySchool) }} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Credentials Modal */}
      <Modal open={!!credModal} onClose={() => setCredModal(null)} title="✅ تم إنشاء المدرسة بنجاح">
        {credModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-sm font-bold text-emerald-700 mb-3">بيانات دخول مدير المدرسة — احتفظ بها في مكان آمن</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-emerald-100">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold">اسم المستخدم</p>
                    <p className="font-black text-gray-800">{credModal.username}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(credModal.username); toast.success('تم النسخ') }}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-emerald-100">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold">كلمة المرور</p>
                    <p className="font-black text-gray-800 font-mono">{showPass ? credModal.password : '••••••••'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setShowPass(!showPass)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(credModal.password); toast.success('تم النسخ') }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setCredModal(null)} className="w-full btn-primary">حسناً، تم الحفظ</button>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={`تعديل — ${targetSchool?.name}`}>
        <form onSubmit={e => { e.preventDefault(); editMut.mutate({ id: targetSchool?.id, ...editForm }) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="الاسم بالعربي" required>
              <Input value={editForm.name||''} onChange={setE('name')} required />
            </FormField>
            <FormField label="الاسم بالإنجليزي">
              <Input value={editForm.nameEn||editForm.name_en||''} onChange={setE('nameEn')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="الهاتف"><Input value={editForm.phone||''} onChange={setE('phone')} /></FormField>
            <FormField label="البريد"><Input value={editForm.email||''} onChange={setE('email')} /></FormField>
          </div>
          <FormField label="العنوان"><Input value={editForm.address||''} onChange={setE('address')} /></FormField>
          <FormField label="الموقع"><Input value={editForm.website||''} onChange={setE('website')} /></FormField>
          <FormField label="ملاحظات"><Input value={editForm.notes||''} onChange={setE('notes')} /></FormField>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={editMut.isPending}>
              {editMut.isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button type="button" onClick={() => setEditModal(false)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Plan Modal */}
      <Modal open={planModal} onClose={() => setPlanModal(false)} title={`خطة الاشتراك — ${targetSchool?.name}`}>
        <form onSubmit={e => { e.preventDefault(); planMut.mutate({ id: targetSchool?.id, ...planForm }) }} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(PLAN_CONFIG).map(([key, cfg]) => (
              <button key={key} type="button"
                onClick={() => setPlanForm(f => ({ ...f, plan: key }))}
                className={`p-4 rounded-2xl border-2 transition-all text-center ${planForm.plan === key ? 'border-current' : 'border-gray-100 bg-gray-50'}`}
                style={planForm.plan === key ? { background: cfg.bg, borderColor: cfg.color } : {}}>
                <cfg.icon size={20} className="mx-auto mb-2" style={{ color: cfg.color }} />
                <p className="font-black text-sm" style={{ color: cfg.color }}>{cfg.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cfg.desc}</p>
              </button>
            ))}
          </div>
          <FormField label="تاريخ انتهاء الخطة (اختياري)">
            <input type="date" value={planForm.planExpiresAt} onChange={e => setPlanForm(f => ({ ...f, planExpiresAt: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
          </FormField>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1" disabled={planMut.isPending}>
              {planMut.isPending ? 'جارٍ الحفظ...' : 'حفظ الخطة'}
            </button>
            <button type="button" onClick={() => setPlanModal(false)} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="حذف المدرسة"
        message={`هل أنت متأكد من حذف مدرسة "${deleteTarget?.name}"؟ سيتم حذف جميع البيانات المرتبطة بها نهائياً.`}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
