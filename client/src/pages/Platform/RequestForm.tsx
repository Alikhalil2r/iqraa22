import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle, ArrowRight, Globe, Smartphone, Palette,
  TrendingUp, Brain, Cloud, Upload, Calendar, DollarSign,
  FileText, User, Phone, Mail, Building2, Rocket, Code2, Search
} from 'lucide-react'

const API = (p: string) => fetch(`/api${p}`).then(r => r.json())

const SERVICE_TYPES = [
  { id:'web',     label:'تطوير موقع إلكتروني', Icon:Globe,       color:'#7c3aed' },
  { id:'mobile',  label:'تطبيق جوال',           Icon:Smartphone,  color:'#2563eb' },
  { id:'design',  label:'تصميم UI/UX',          Icon:Palette,     color:'#059669' },
  { id:'marketing',label:'تسويق رقمي',          Icon:TrendingUp,  color:'#dc2626' },
  { id:'ai',      label:'حلول ذكاء اصطناعي',   Icon:Brain,       color:'#9333ea' },
  { id:'cloud',   label:'حوسبة سحابية',         Icon:Cloud,       color:'#0284c7' },
  { id:'other',   label:'أخرى / متعددة',        Icon:Rocket,      color:'#6b7280' },
]
const BUDGETS = [
  { id:'lt500',    label:'أقل من 500 ريال' },
  { id:'500_2000', label:'500 - 2,000 ريال' },
  { id:'2000_5000',label:'2,000 - 5,000 ريال' },
  { id:'5000_plus',label:'أكثر من 5,000 ريال' },
  { id:'tbd',      label:'لم أحدد بعد' },
]

type Step = 1 | 2 | 3 | 4
interface FormState {
  service_type: string
  title: string
  description: string
  budget: string
  expected_date: string
  client_name: string
  client_email: string
  client_phone: string
  client_company: string
}

export default function RequestForm() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>({ service_type:'', title:'', description:'', budget:'', expected_date:'', client_name:'', client_email:'', client_phone:'', client_company:'' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ticket: string } | null>(null)
  const [error, setError]   = useState('')

  const { data: cfg = {} as Record<string,string> } = useQuery({ queryKey:['plat-settings'], queryFn:() => API('/platform/settings'), staleTime:600_000 })

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]:v }))

  const canNext = () => {
    if (step === 1) return !!form.service_type
    if (step === 2) return form.title.length >= 10 && form.description.length >= 20
    if (step === 3) return !!form.budget
    if (step === 4) return form.client_name.length >= 2 && /\S+@\S+\.\S+/.test(form.client_email)
    return false
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const budgetMap: Record<string,{min:number,max:number}> = {
        lt500:    { min:0,    max:500 },
        '500_2000':{ min:500,  max:2000 },
        '2000_5000':{ min:2000, max:5000 },
        '5000_plus':{ min:5000, max:0 },
        tbd:      { min:0,    max:0 },
      }
      const bud = budgetMap[form.budget] || { min:0, max:0 }
      const resp = await fetch('/api/platform/request', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          client_name:    form.client_name,
          client_email:   form.client_email,
          client_phone:   form.client_phone,
          client_company: form.client_company,
          service_type:   form.service_type,
          title:          form.title,
          description:    form.description,
          budget_min:     bud.min || null,
          budget_max:     bud.max || null,
          expected_date:  form.expected_date || null,
        })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'فشل الإرسال')
      setResult({ ticket: data.ticket })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const companyName = cfg.company_name_ar || 'اكسبو التقنية'

  if (result) {
    const trackUrl = `/track/${result.ticket}?email=${encodeURIComponent(form.client_email)}`
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }} dir="rtl">
        <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl">
          {/* Animated checkmark */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-400/30 animate-pulse">
            <CheckCircle size={46} className="text-white"/>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">تم إرسال طلبك بنجاح!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            استلمنا طلبك وسيتواصل معك فريقنا خلال 24 ساعة عمل.<br/>رقم تذكرتك هو:
          </p>

          {/* Ticket number */}
          <div className="px-6 py-5 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-200 mb-3">
            <p className="text-xs text-violet-400 font-bold mb-1">رقم التذكرة</p>
            <p className="font-black text-violet-700 text-2xl tracking-widest font-mono">{result.ticket}</p>
          </div>
          <p className="text-gray-400 text-xs mb-7">
            🔒 احتفظ بهذا الرقم لمتابعة حالة طلبك وإجراء محادثات مع الفريق
          </p>

          {/* CTA buttons */}
          <div className="space-y-3">
            <Link to={trackUrl}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 hover:shadow-xl hover:shadow-violet-600/30 hover:-translate-y-0.5"
              style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Search size={18}/> تتبع طلبي الآن
            </Link>
            <Link to="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all text-sm">
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(135deg,#0f0c29,#302b63)' }} dir="rtl">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm font-bold">
            <ArrowRight size={16}/> العودة
          </Link>
        </div>
        <div className="text-center mb-8">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Code2 size={18} className="text-white"/>
            </div>
            <span className="text-white font-black text-lg">{companyName}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">ابدأ مشروعك الآن</h1>
          <p className="text-gray-400 text-sm">أخبرنا عن مشروعك وسنتواصل معك خلال 24 ساعة</p>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {([1,2,3,4] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s ? 'text-white' : 'bg-white/10 text-gray-400'}`}
                style={step >= s ? { background:'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}}>
                {step > s ? <CheckCircle size={15}/> : s}
              </div>
              {i < 3 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-purple-500' : 'bg-white/10'}`}/>}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-8">
          <span className={step===1?'text-purple-300 font-bold':''}>نوع الخدمة</span>
          <span className={step===2?'text-purple-300 font-bold':''}>تفاصيل المشروع</span>
          <span className={step===3?'text-purple-300 font-bold':''}>الميزانية والموعد</span>
          <span className={step===4?'text-purple-300 font-bold':''}>بياناتك</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* STEP 1 — Service type */}
          {step === 1 && (
            <div>
              <h2 className="font-black text-gray-900 text-xl mb-2">ما نوع الخدمة التي تحتاجها؟</h2>
              <p className="text-gray-400 text-sm mb-6">اختر نوع المشروع الذي تريد تنفيذه</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICE_TYPES.map(svc => {
                  const Icon = svc.Icon
                  const selected = form.service_type === svc.id
                  return (
                    <button key={svc.id} onClick={() => set('service_type', svc.id)}
                      className={`p-4 rounded-2xl border-2 text-right transition-all ${selected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'}`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: selected ? svc.color : svc.color + '20', color: selected ? 'white' : svc.color }}>
                        <Icon size={20}/>
                      </div>
                      <p className={`text-sm font-black ${selected ? 'text-purple-700' : 'text-gray-700'}`}>{svc.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Project details */}
          {step === 2 && (
            <div>
              <h2 className="font-black text-gray-900 text-xl mb-2">أخبرنا عن مشروعك</h2>
              <p className="text-gray-400 text-sm mb-6">كلما زادت التفاصيل، كان عرض السعر أدق وأسرع</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">عنوان المشروع *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="مثال: موقع تجاري لبيع المنتجات الرياضية"
                    className="input-field w-full" dir="rtl"/>
                  <p className="text-xs text-gray-400 mt-1">{form.title.length}/200 حرف (الحد الأدنى 10)</p>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">وصف تفصيلي للمشروع *</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
                    placeholder="صف مشروعك بالتفصيل: ما هو هدفه؟ من هم المستخدمون؟ ما الميزات الأساسية التي تحتاجها؟"
                    className="input-field w-full" dir="rtl"/>
                  <p className="text-xs text-gray-400 mt-1">{form.description.length} حرف (الحد الأدنى 20)</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Budget & timeline */}
          {step === 3 && (
            <div>
              <h2 className="font-black text-gray-900 text-xl mb-2">الميزانية والموعد المتوقع</h2>
              <p className="text-gray-400 text-sm mb-6">هذه المعلومات تساعدنا على تقديم أفضل حل يناسبك</p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3"><DollarSign size={14} className="inline ml-1"/>الميزانية التقريبية *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BUDGETS.map(b => (
                      <button key={b.id} onClick={() => set('budget', b.id)}
                        className={`p-3 rounded-xl border-2 text-sm font-bold text-right transition-all ${form.budget===b.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200 text-gray-700'}`}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2"><Calendar size={14} className="inline ml-1"/>تاريخ التسليم المتوقع (اختياري)</label>
                  <input type="date" value={form.expected_date} onChange={e => set('expected_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field w-full"/>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Contact info */}
          {step === 4 && (
            <div>
              <h2 className="font-black text-gray-900 text-xl mb-2">بياناتك للتواصل</h2>
              <p className="text-gray-400 text-sm mb-6">سيتواصل معك فريقنا على هذه البيانات خلال 24 ساعة</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2"><User size={13} className="inline ml-1"/>الاسم الكامل *</label>
                  <input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="أحمد محمد" className="input-field w-full" dir="rtl"/>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2"><Mail size={13} className="inline ml-1"/>البريد الإلكتروني *</label>
                  <input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} placeholder="ahmed@example.com" className="input-field w-full" dir="ltr"/>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2"><Phone size={13} className="inline ml-1"/>رقم الجوال</label>
                  <input value={form.client_phone} onChange={e => set('client_phone', e.target.value)} placeholder="+968 9999 9999" className="input-field w-full" dir="ltr"/>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2"><Building2 size={13} className="inline ml-1"/>اسم الشركة / المؤسسة</label>
                  <input value={form.client_company} onChange={e => set('client_company', e.target.value)} placeholder="شركتك (اختياري)" className="input-field w-full" dir="rtl"/>
                </div>
              </div>
              {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <p className="text-xs text-purple-700 leading-relaxed">
                  ✅ بإرسال هذا الطلب، أنت توافق على التواصل معك بخصوص مشروعك. لن نشارك بياناتك مع أي جهة خارجية.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1
              ? <button onClick={() => setStep(s => (s - 1) as Step)} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">السابق</button>
              : <div/>
            }
            {step < 4
              ? <button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canNext()}
                  className="px-8 py-2.5 rounded-xl font-black text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-lg"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  التالي ←
                </button>
              : <button onClick={submit} disabled={!canNext() || loading}
                  className="px-8 py-2.5 rounded-xl font-black text-white text-sm transition-all disabled:opacity-40 flex items-center gap-2 hover:opacity-90 hover:shadow-lg"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> جاري الإرسال...</> : <><Rocket size={15}/> إرسال الطلب</>}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
