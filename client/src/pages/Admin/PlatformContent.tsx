import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import toast from 'react-hot-toast'
import {
  Globe, Image, MessageSquare, HelpCircle, CreditCard, Settings,
  Plus, Pencil, Trash2, Star, Check, X, Eye, EyeOff, Save
} from 'lucide-react'

type Tab = 'services' | 'portfolio' | 'testimonials' | 'faq' | 'pricing' | 'settings'

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'services',     label: 'الخدمات',      icon: Globe },
  { id: 'portfolio',    label: 'أعمالنا',       icon: Image },
  { id: 'testimonials', label: 'آراء العملاء',  icon: MessageSquare },
  { id: 'faq',          label: 'الأسئلة',       icon: HelpCircle },
  { id: 'pricing',      label: 'الأسعار',       icon: CreditCard },
  { id: 'settings',     label: 'إعدادات الشركة',icon: Settings },
]

// ─── Small reusable modal ────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-600">{label}</label>
      {children}
    </div>
  )
}
const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
const btn = (variant: 'primary' | 'danger' | 'ghost' = 'primary') => ({
  primary: "px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors",
  danger:  "px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold transition-colors",
  ghost:   "px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors",
}[variant])

// ─── SERVICES ────────────────────────────────────────────────────────────────
function ServicesTab() {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const { data: services = [], isLoading } = useQuery({ queryKey: ['admin-services'], queryFn: () => adminApi.get('/api/platform/services') })

  const save = useMutation({
    mutationFn: (d: any) => d.id ? adminApi.put(`/api/platform/admin/services/${d.id}`, d) : adminApi.post('/api/platform/admin/services', d),
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['admin-services'] }); setForm(null) }
  })
  const del = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/platform/admin/services/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['admin-services'] }) }
  })

  const ICONS = ['💻', '📱', '🎨', '🧠', '☁️', '📈', '🔧', '🚀', '🔒', '📊']
  const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ef4444', '#14b8a6']

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{services.length} خدمة مضافة</p>
        <button className={btn('primary')} onClick={() => setForm({ title: '', description: '', icon: '💻', color: '#8b5cf6', price_from: '', category: 'web' })}>
          <Plus size={14} className="inline ml-1"/> إضافة خدمة
        </button>
      </div>
      {isLoading ? <div className="h-40 animate-pulse bg-gray-100 rounded-xl"/> : (
        <div className="space-y-2">
          {services.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <span className="text-2xl">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800">{s.title}</p>
                <p className="text-xs text-gray-400 truncate">{s.description}</p>
              </div>
              {s.price_from && <span className="text-xs font-bold text-violet-600">من {s.price_from} ﷼</span>}
              <div className="flex gap-1.5">
                <button onClick={() => setForm({ ...s })} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 transition-colors"><Pencil size={14}/></button>
                <button onClick={() => { if(confirm('حذف هذه الخدمة؟')) del.mutate(s.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم الخدمة (عربي)"><input className={inp} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="تطوير المواقع"/></Field>
              <Field label="اسم الخدمة (إنجليزي)"><input className={inp} value={form.title_en || ''} onChange={e => setForm({ ...form, title_en: e.target.value })} placeholder="Web Development"/></Field>
            </div>
            <Field label="الوصف"><textarea className={inp + ' resize-none'} rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="الأيقونة">
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm({ ...form, icon: ic })} className={`text-xl p-1.5 rounded-lg transition-all ${form.icon === ic ? 'bg-violet-100 ring-2 ring-violet-400' : 'hover:bg-gray-100'}`}>{ic}</button>
                  ))}
                </div>
              </Field>
              <Field label="اللون">
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className="w-7 h-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: form.color === c ? '#1f2937' : 'transparent' }}/>
                  ))}
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="السعر من (﷼)"><input className={inp} type="number" value={form.price_from || ''} onChange={e => setForm({ ...form, price_from: e.target.value })} placeholder="500"/></Field>
              <Field label="المدة (أيام)"><input className={inp} type="number" value={form.duration_days || ''} onChange={e => setForm({ ...form, duration_days: e.target.value })} placeholder="30"/></Field>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button className={btn('ghost')} onClick={() => setForm(null)}>إلغاء</button>
              <button className={btn('primary')} onClick={() => save.mutate(form)} disabled={save.isPending}>
                {save.isPending ? 'جارٍ الحفظ...' : <><Save size={14} className="inline ml-1"/> حفظ</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PORTFOLIO ───────────────────────────────────────────────────────────────
function PortfolioTab() {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const { data: items = [], isLoading } = useQuery({ queryKey: ['admin-portfolio'], queryFn: () => adminApi.get('/api/platform/portfolio') })

  const save = useMutation({
    mutationFn: (d: any) => d.id ? adminApi.put(`/api/platform/admin/portfolio/${d.id}`, d) : adminApi.post('/api/platform/admin/portfolio', d),
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['admin-portfolio'] }); setForm(null) }
  })
  const del = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/platform/admin/portfolio/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['admin-portfolio'] }) }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} مشروع في المحفظة</p>
        <button className={btn('primary')} onClick={() => setForm({ title: '', description: '', category: 'web', client_name: '', image_url: '', technologies: '', is_featured: false })}>
          <Plus size={14} className="inline ml-1"/> إضافة مشروع
        </button>
      </div>
      {isLoading ? <div className="h-40 animate-pulse bg-gray-100 rounded-xl"/> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-gray-100 relative">
                {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-3xl">🖼️</div>}
                {item.is_featured && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-xs font-bold flex items-center gap-1"><Star size={10}/> مميز</span>}
              </div>
              <div className="p-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.client_name} · {item.category}</p>
                </div>
                <button onClick={() => setForm({ ...item })} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600"><Pencil size={13}/></button>
                <button onClick={() => { if(confirm('حذف؟')) del.mutate(item.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={13}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {form && (
        <Modal title={form.id ? 'تعديل المشروع' : 'مشروع جديد'} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <Field label="عنوان المشروع"><input className={inp} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}/></Field>
            <Field label="وصف المشروع"><textarea className={inp + ' resize-none'} rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}/></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم العميل"><input className={inp} value={form.client_name || ''} onChange={e => setForm({ ...form, client_name: e.target.value })}/></Field>
              <Field label="الفئة">
                <select className={inp} value={form.category || 'web'} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="web">مواقع ويب</option><option value="mobile">تطبيقات جوال</option>
                  <option value="design">تصميم</option><option value="ai">ذكاء اصطناعي</option>
                </select>
              </Field>
            </div>
            <Field label="رابط الصورة"><input className={inp} value={form.image_url || ''} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..."/></Field>
            <Field label="التقنيات المستخدمة"><input className={inp} value={form.technologies || ''} onChange={e => setForm({ ...form, technologies: e.target.value })} placeholder="React, Node.js, PostgreSQL"/></Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured || false} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded accent-violet-600"/>
              <span className="text-sm font-bold text-gray-700">مشروع مميز</span>
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button className={btn('ghost')} onClick={() => setForm(null)}>إلغاء</button>
              <button className={btn('primary')} onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? 'جارٍ الحفظ...' : 'حفظ'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
function TestimonialsTab() {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const { data: items = [], isLoading } = useQuery({ queryKey: ['admin-testimonials'], queryFn: () => adminApi.get('/api/platform/testimonials') })

  const save = useMutation({
    mutationFn: (d: any) => d.id ? adminApi.put(`/api/platform/admin/testimonials/${d.id}`, d) : adminApi.post('/api/platform/admin/testimonials', d),
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); setForm(null) }
  })
  const del = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/platform/admin/testimonials/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['admin-testimonials'] }) }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} شهادة</p>
        <button className={btn('primary')} onClick={() => setForm({ client_name: '', client_position: '', company: '', content: '', rating: 5, is_featured: true })}>
          <Plus size={14} className="inline ml-1"/> إضافة شهادة
        </button>
      </div>
      {isLoading ? <div className="h-40 animate-pulse bg-gray-100 rounded-xl"/> : (
        <div className="space-y-3">
          {items.map((t: any) => (
            <div key={t.id} className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">{t.client_name?.charAt(0)}</div>
                    <div>
                      <p className="font-bold text-sm">{t.client_name}</p>
                      <p className="text-xs text-gray-400">{t.client_position} · {t.company}</p>
                    </div>
                    <div className="flex gap-0.5 mr-auto">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} size={12} className="text-amber-400 fill-amber-400"/>)}</div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">"{t.content}"</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => setForm({ ...t })} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600"><Pencil size={14}/></button>
                  <button onClick={() => { if(confirm('حذف؟')) del.mutate(t.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {form && (
        <Modal title={form.id ? 'تعديل الشهادة' : 'إضافة شهادة'} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم العميل"><input className={inp} value={form.client_name || ''} onChange={e => setForm({ ...form, client_name: e.target.value })}/></Field>
              <Field label="المنصب"><input className={inp} value={form.client_position || ''} onChange={e => setForm({ ...form, client_position: e.target.value })}/></Field>
            </div>
            <Field label="الشركة"><input className={inp} value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })}/></Field>
            <Field label="نص الشهادة"><textarea className={inp + ' resize-none'} rows={3} value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })}/></Field>
            <Field label="التقييم">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, rating: n })} className={`p-1.5 rounded-lg transition-colors ${n <= form.rating ? 'text-amber-400' : 'text-gray-300 hover:text-gray-400'}`}>
                    <Star size={20} className={n <= form.rating ? 'fill-amber-400' : ''}/>
                  </button>
                ))}
              </div>
            </Field>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button className={btn('ghost')} onClick={() => setForm(null)}>إلغاء</button>
              <button className={btn('primary')} onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? 'جارٍ...' : 'حفظ'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────
function FAQTab() {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const { data: items = [], isLoading } = useQuery({ queryKey: ['admin-faq'], queryFn: () => adminApi.get('/api/platform/faq') })

  const save = useMutation({
    mutationFn: (d: any) => d.id ? adminApi.put(`/api/platform/admin/faq/${d.id}`, d) : adminApi.post('/api/platform/admin/faq', d),
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['admin-faq'] }); setForm(null) }
  })
  const del = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/platform/admin/faq/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['admin-faq'] }) }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} سؤال وجواب</p>
        <button className={btn('primary')} onClick={() => setForm({ question: '', answer: '', is_active: true, sort_order: 0 })}>
          <Plus size={14} className="inline ml-1"/> إضافة سؤال
        </button>
      </div>
      {isLoading ? <div className="h-40 animate-pulse bg-gray-100 rounded-xl"/> : (
        <div className="space-y-2">
          {items.map((item: any, i: number) => (
            <div key={item.id} className="p-3.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 mb-1">{item.question}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setForm({ ...item })} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600"><Pencil size={13}/></button>
                  <button onClick={() => { if(confirm('حذف؟')) del.mutate(item.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {form && (
        <Modal title={form.id ? 'تعديل السؤال' : 'إضافة سؤال'} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <Field label="السؤال"><input className={inp} value={form.question || ''} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="كيف أبدأ مشروعي معكم؟"/></Field>
            <Field label="الإجابة"><textarea className={inp + ' resize-none'} rows={4} value={form.answer || ''} onChange={e => setForm({ ...form, answer: e.target.value })}/></Field>
            <Field label="الترتيب"><input className={inp} type="number" value={form.sort_order || 0} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })}/></Field>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button className={btn('ghost')} onClick={() => setForm(null)}>إلغاء</button>
              <button className={btn('primary')} onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? 'جارٍ...' : 'حفظ'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PRICING ─────────────────────────────────────────────────────────────────
function PricingTab() {
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const { data: items = [], isLoading } = useQuery({ queryKey: ['admin-pricing'], queryFn: () => adminApi.get('/api/platform/pricing') })

  const save = useMutation({
    mutationFn: (d: any) => d.id ? adminApi.put(`/api/platform/admin/pricing/${d.id}`, d) : adminApi.post('/api/platform/admin/pricing', d),
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['admin-pricing'] }); setForm(null) }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{items.length} خطط تسعير</p>
        <button className={btn('primary')} onClick={() => setForm({ name: '', price: '', currency: 'OMR', period: 'مشروع', description: '', features: [], is_popular: false, color: '#8b5cf6' })}>
          <Plus size={14} className="inline ml-1"/> إضافة خطة
        </button>
      </div>
      {isLoading ? <div className="h-40 animate-pulse bg-gray-100 rounded-xl"/> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((p: any) => (
            <div key={p.id} className="rounded-xl border-2 p-4 hover:shadow-md transition-shadow" style={{ borderColor: p.is_popular ? p.color : '#e5e7eb' }}>
              {p.is_popular && <div className="text-xs font-black text-center mb-2" style={{ color: p.color }}>الأكثر طلباً ⭐</div>}
              <p className="font-black text-gray-800 text-lg">{p.name}</p>
              <p className="text-2xl font-black mt-1" style={{ color: p.color }}>{p.price} <span className="text-sm font-bold text-gray-400">{p.currency}/{p.period}</span></p>
              <p className="text-xs text-gray-500 mt-2 mb-3">{p.description}</p>
              <button onClick={() => setForm({ ...p, features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features || [] })} className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700 transition-colors">
                <Pencil size={13} className="inline ml-1"/> تعديل
              </button>
            </div>
          ))}
        </div>
      )}
      {form && (
        <Modal title={form.id ? 'تعديل الخطة' : 'خطة جديدة'} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم الخطة"><input className={inp} value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="أعمال"/></Field>
              <Field label="السعر"><input className={inp} type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="2500"/></Field>
            </div>
            <Field label="الوصف"><textarea className={inp + ' resize-none'} rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}/></Field>
            <Field label="المميزات (كل سطر ميزة)">
              <textarea className={inp + ' resize-none'} rows={5}
                value={(Array.isArray(form.features) ? form.features : []).join('\n')}
                onChange={e => setForm({ ...form, features: e.target.value.split('\n').filter(Boolean) })}
                placeholder="موقع احترافي متجاوب&#10;لوحة تحكم&#10;دعم فني"
              />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_popular || false} onChange={e => setForm({ ...form, is_popular: e.target.checked })} className="rounded accent-violet-600"/>
              <span className="text-sm font-bold text-gray-700">الأكثر طلباً</span>
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button className={btn('ghost')} onClick={() => setForm(null)}>إلغاء</button>
              <button className={btn('primary')} onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending ? 'جارٍ...' : 'حفظ'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── COMPANY SETTINGS ────────────────────────────────────────────────────────
function SettingsTab() {
  const qc = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['platform-settings'], queryFn: () => adminApi.get('/api/platform/settings') })
  const [local, setLocal] = useState<Record<string, string>>({})
  const merged = { ...settings, ...local }

  const save = useMutation({
    mutationFn: () => adminApi.put('/api/platform/admin/settings', local),
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); qc.invalidateQueries({ queryKey: ['platform-settings'] }); setLocal({}) }
  })

  const set = (key: string, value: string) => setLocal(p => ({ ...p, [key]: value }))

  const FIELDS = [
    { key: 'company_name_ar', label: 'اسم الشركة (عربي)' },
    { key: 'company_name',    label: 'اسم الشركة (إنجليزي)' },
    { key: 'company_tagline', label: 'شعار الشركة' },
    { key: 'company_email',   label: 'البريد الإلكتروني' },
    { key: 'company_phone',   label: 'رقم الهاتف' },
    { key: 'company_whatsapp',label: 'رقم الواتساب' },
    { key: 'company_address', label: 'العنوان' },
    { key: 'social_twitter',  label: 'تويتر / X' },
    { key: 'social_linkedin', label: 'لينكدإن' },
    { key: 'social_instagram',label: 'إنستغرام' },
    { key: 'hero_title',      label: 'عنوان Hero الرئيسي' },
    { key: 'hero_subtitle',   label: 'النص الثانوي في Hero' },
  ]

  if (isLoading) return <div className="h-40 animate-pulse bg-gray-100 rounded-xl"/>

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {FIELDS.map(f => (
          <Field key={f.key} label={f.label}>
            <input className={inp + (local[f.key] !== undefined ? ' border-violet-400 ring-2 ring-violet-100' : '')} value={merged[f.key] || ''} onChange={e => set(f.key, e.target.value)}/>
          </Field>
        ))}
      </div>
      {Object.keys(local).length > 0 && (
        <div className="sticky bottom-4 bg-white rounded-2xl p-4 shadow-lg border border-violet-200 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">{Object.keys(local).length} حقل تم تعديله</p>
          <div className="flex gap-2">
            <button className={btn('ghost')} onClick={() => setLocal({})}>إلغاء</button>
            <button className={btn('primary')} onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'جارٍ الحفظ...' : <><Save size={14} className="inline ml-1"/> حفظ الإعدادات</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function PlatformContent() {
  const [tab, setTab] = useState<Tab>('services')

  const TAB_MAP: Record<Tab, React.ReactNode> = {
    services:     <ServicesTab/>,
    portfolio:    <PortfolioTab/>,
    testimonials: <TestimonialsTab/>,
    faq:          <FAQTab/>,
    pricing:      <PricingTab/>,
    settings:     <SettingsTab/>,
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <Globe size={24} className="text-violet-600"/> إدارة المحتوى
        </h1>
        <p className="text-sm text-gray-500 mt-1">تحكم في جميع محتويات موقعك من خدمات وأعمال وشهادات وأسعار</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-white shadow text-violet-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={15}/> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {TAB_MAP[tab]}
      </div>
    </div>
  )
}
