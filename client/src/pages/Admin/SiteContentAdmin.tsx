import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi } from '../../api/client'
import toast from 'react-hot-toast'
import { Trophy, Users, Bell, HelpCircle, Plus, Trash2, Pencil } from 'lucide-react'

type Tab = 'achievements' | 'staff' | 'alerts' | 'faqs'

export default function SiteContentAdmin() {
  const [tab, setTab] = useState<Tab>('alerts')
  const qc = useQueryClient()

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'alerts', label: 'تنبيهات الموقع', icon: <Bell size={16} /> },
    { id: 'faqs', label: 'الأسئلة الشائعة', icon: <HelpCircle size={16} /> },
    { id: 'achievements', label: 'الإنجازات', icon: <Trophy size={16} /> },
    { id: 'staff', label: 'الطاقم العام', icon: <Users size={16} /> },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">محتوى الموقع العام</h1>
        <p className="text-sm text-gray-500 mt-1">تنبيهات، أسئلة شائعة، إنجازات، وطاقم الموقع</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${tab === t.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab === 'alerts' && <AlertsTab qc={qc} />}
      {tab === 'faqs' && <FaqsTab qc={qc} />}
      {tab === 'achievements' && <AchievementsTab qc={qc} />}
      {tab === 'staff' && <StaffTab qc={qc} />}
    </div>
  )
}

function AlertsTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ message: '', alertType: 'info', isActive: true })
  const { data } = useQuery({ queryKey: ['content-alerts'], queryFn: () => contentApi.alerts().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createAlert({ message: form.message, alertType: form.alertType, isActive: form.isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-alerts', 'public-alerts'] }); setForm({ message: '', alertType: 'info', isActive: true }); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteAlert(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-alerts', 'public-alerts'] }); toast.success('تم الحذف') },
  })
  const toggle = useMutation({
    mutationFn: (a: { id: string; is_active: boolean }) => contentApi.updateAlert(a.id, { isActive: !a.is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-alerts', 'public-alerts'] }); toast.success('تم التحديث') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="نص التنبيه (يظهر في شريط «عاجل» أعلى الموقع)..." rows={2} className="w-full p-3 rounded-xl border text-sm" />
        <div className="flex gap-2 flex-wrap items-center">
          <select value={form.alertType} onChange={e => setForm(f => ({ ...f, alertType: e.target.value }))} className="p-2 rounded-lg border text-sm">
            <option value="urgent">عاجل (urgent)</option>
            <option value="danger">خطير (danger)</option>
            <option value="warning">تحذير (warning)</option>
            <option value="info">معلومة (info)</option>
            <option value="success">إعلان (success)</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            نشط
          </label>
          <button onClick={() => create.mutate()} disabled={!form.message.trim()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-1"><Plus size={14} /> إضافة</button>
        </div>
      </div>
      {(data?.alerts || []).map((a: any) => (
        <div key={a.id} className={`bg-white rounded-xl border p-4 flex justify-between gap-3 ${!a.is_active ? 'opacity-60' : ''}`}>
          <div className="min-w-0">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${a.alert_type === 'urgent' || a.alert_type === 'danger' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {a.alert_type === 'urgent' ? 'عاجل' : a.alert_type}
            </span>
            {!a.is_active && <span className="text-[10px] text-gray-400 mr-2">(معطّل)</span>}
            <p className="text-sm mt-1">{a.message}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => toggle.mutate(a)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title={a.is_active ? 'تعطيل' : 'تفعيل'}>
              <Bell size={16} />
            </button>
            <button onClick={() => remove.mutate(a.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

function FaqsTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ question: '', answer: '' })
  const { data } = useQuery({ queryKey: ['content-faqs'], queryFn: () => contentApi.faqs().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createFaq(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-faqs', 'public-faqs'] }); setForm({ question: '', answer: '' }); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteFaq(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-faqs', 'public-faqs'] }); toast.success('تم الحذف') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 space-y-2">
        <input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="السؤال" className="w-full p-3 rounded-xl border text-sm" />
        <textarea value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="الجواب" rows={3} className="w-full p-3 rounded-xl border text-sm" />
        <button onClick={() => create.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline ml-1" />إضافة</button>
      </div>
      {(data?.faqs || []).map((f: any) => (
        <div key={f.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3">
          <div><p className="font-bold text-sm">{f.question}</p><p className="text-xs text-gray-500 mt-1">{f.answer}</p></div>
          <button onClick={() => remove.mutate(f.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function AchievementsTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', category: 'أكاديمي' })
  const { data } = useQuery({ queryKey: ['content-achievements'], queryFn: () => contentApi.achievements().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createAchievement({ ...form, isPublished: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-achievements', 'public-achievements'] }); setForm({ title: '', description: '', imageUrl: '', category: 'أكاديمي' }); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteAchievement(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-achievements', 'public-achievements'] }); toast.success('تم الحذف') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 grid gap-2">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان الإنجاز" className="p-3 rounded-xl border text-sm" />
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="الوصف" rows={2} className="p-3 rounded-xl border text-sm" />
        <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="رابط الصورة" className="p-3 rounded-xl border text-sm" dir="ltr" />
        <button onClick={() => create.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold w-fit"><Plus size={14} className="inline ml-1" />إضافة</button>
      </div>
      {(data?.achievements || []).map((a: any) => (
        <div key={a.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3">
          <div><p className="font-bold text-sm">{a.title}</p><p className="text-xs text-gray-500">{a.category}</p></div>
          <button onClick={() => remove.mutate(a.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function StaffTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ name: '', position: '', department: 'أكاديمي', bio: '', photo: '' })
  const { data } = useQuery({ queryKey: ['content-staff'], queryFn: () => contentApi.staff().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createStaff(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-staff', 'public-staff'] }); setForm({ name: '', position: '', department: 'أكاديمي', bio: '', photo: '' }); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteStaff(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-staff', 'public-staff'] }); toast.success('تم الحذف') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 grid md:grid-cols-2 gap-2">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="الاسم" className="p-3 rounded-xl border text-sm" />
        <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="المنصب" className="p-3 rounded-xl border text-sm" />
        <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="القسم (إدارة / أكاديمي)" className="p-3 rounded-xl border text-sm" />
        <input value={form.photo} onChange={e => setForm(f => ({ ...f, photo: e.target.value }))} placeholder="رابط الصورة" className="p-3 rounded-xl border text-sm" dir="ltr" />
        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="نبذة / اقتباس" rows={2} className="p-3 rounded-xl border text-sm md:col-span-2" />
        <button onClick={() => create.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold w-fit"><Plus size={14} className="inline ml-1" />إضافة</button>
      </div>
      {(data?.staff || []).map((s: any) => (
        <div key={s.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3">
          <div><p className="font-bold text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.position} — {s.department}</p></div>
          <button onClick={() => remove.mutate(s.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}
