import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Mail, Phone, MapPin, Send, Clock, Share2, ChevronLeft, CheckCircle, ChevronDown, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

function PageBanner({ title, subtitle, icon, gradient = 'from-emerald-800 to-emerald-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-20 text-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-20 w-64 h-64 rounded-full border-2 border-white" />
        <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full border border-white" />
      </div>
      {icon && <div className="mb-4 flex justify-center text-amber-400/80 relative z-10">{icon}</div>}
      <h1 className="text-3xl md:text-5xl font-black relative z-10">{title}</h1>
      <p className="text-white/60 mt-3 text-sm relative z-10">{subtitle}</p>
    </div>
  )
}

const SOCIAL_PLATFORMS: Record<string, { color: string; name: string; icon: React.ReactNode }> = {
  whatsapp: { color: '#25D366', name: 'واتساب', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 1.636 6.065L.063 23.85a.376.376 0 0 0 .459.46l5.853-1.545A12 12 0 0 0 12 24a12 12 0 0 0 12-12A12 12 0 0 0 11.944 0z" opacity=".1"/></svg> },
  twitter:   { color: '#000000', name: 'تويتر / X', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  instagram: { color: '#E1306C', name: 'إنستغرام', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  facebook:  { color: '#1877F2', name: 'فيسبوك', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  youtube:   { color: '#FF0000', name: 'يوتيوب', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
}

const SAMPLE_SOCIALS = [
  { id: 1, platform: 'whatsapp', url: 'https://wa.me/96890000000', label: 'واتساب المدرسة' },
  { id: 2, platform: 'instagram', url: 'https://instagram.com/school', label: 'إنستغرام' },
  { id: 3, platform: 'twitter', url: 'https://twitter.com/school', label: 'تويتر / X' },
  { id: 4, platform: 'youtube', url: 'https://youtube.com/@school', label: 'يوتيوب' },
]

const FAQS = [
  { q: 'كيف يمكنني التواصل مع إدارة المدرسة؟', a: 'يمكنك التواصل عبر الهاتف أو البريد الإلكتروني خلال أوقات الدوام، أو إرسال رسالة عبر البوابة الإلكترونية وسيتم الرد خلال 24 ساعة.' },
  { q: 'ما هي أوقات دوام المدرسة؟', a: 'تعمل المدرسة من الأحد إلى الخميس من الساعة 7:00 صباحاً حتى 2:30 مساءً، وتكون الإدارة متاحة حتى 3:00 مساءً.' },
  { q: 'كيف أتابع تقدم ابني الدراسي؟', a: 'يمكنك متابعة الدرجات والحضور والجدول الدراسي وكل تفاصيل ابنك عبر بوابة الأولياء الإلكترونية على مدار الساعة.' },
  { q: 'ما طريقة التسجيل للعام الدراسي القادم؟', a: 'التسجيل متاح عبر الموقع الرسمي أو بزيارة مبنى الإدارة مع الوثائق المطلوبة، ويُعلن عن موعد التسجيل في بداية الفصل الثاني.' },
  { q: 'هل تقدم المدرسة خدمة الحافلات المدرسية؟', a: 'نعم، نوفر خدمة نقل مدرسية تغطي معظم المناطق، يمكنك التواصل مع إدارة المدرسة للاستفسار عن المسارات والرسوم.' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden transition-all hover:border-emerald-200">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 text-right gap-4 hover:bg-gray-50 transition-colors">
        <span className="font-bold text-gray-800 text-sm">{q}</span>
        <ChevronDown size={18} className={`text-emerald-600 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40' : 'max-h-0'}`}>
        <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">{a}</p>
      </div>
    </div>
  )
}

export default function ContactPage() {
  const { data: schoolData } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const school = schoolData?.school

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return toast.error('يرجى ملء الحقول المطلوبة')
    toast.success('شكراً لتواصلك معنا! سنرد عليك قريباً.')
    setSent(true)
    setForm({ name: '', phone: '', email: '', subject: '', message: '' })
    setTimeout(() => setSent(false), 6000)
  }

  return (
    <div>
      <PageBanner title="تواصل معنا" subtitle="نسعد باستقبال استفساراتكم ومقترحاتكم في أي وقت" icon={<Mail size={40} />} />

      {/* Quick contact bar */}
      <div className="bg-emerald-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 rtl:divide-x-reverse">
            {[
              { icon: <Phone size={18}/>, label: 'الهاتف المباشر', value: school?.phone || '+968 2400 0000', href: `tel:${school?.phone || '+96824000000'}` },
              { icon: <Mail size={18}/>, label: 'البريد الإلكتروني', value: school?.email || 'info@school.edu.om', href: `mailto:${school?.email || 'info@school.edu.om'}` },
              { icon: <Clock size={18}/>, label: 'أوقات الدوام', value: 'الأحد – الخميس | 7:00 ص – 2:30 م', href: '#' },
            ].map((item, i) => (
              <a key={i} href={item.href} className="flex items-center gap-4 px-6 py-4 text-white hover:bg-emerald-600 transition-colors">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-emerald-200 text-[10px] font-bold">{item.label}</p>
                  <p className="font-bold text-sm" dir="ltr">{item.value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Left: Info + Social */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <MapPin size={22} className="text-emerald-600"/> موقعنا
              </h2>
              <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 h-56 relative">
                {school?.mapEmbed ? (
                  <iframe src={school.mapEmbed} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="موقع المدرسة" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                      <MapPin size={30} className="text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-emerald-800">{school?.address || 'سلطنة عُمان'}</p>
                      <p className="text-xs text-emerald-600 mt-1">انقر لعرض الخريطة</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-3 font-bold flex items-center gap-2">
                <MapPin size={14} className="text-emerald-600" />
                {school?.address || 'سلطنة عُمان'}
              </p>
            </div>

            {/* Social links */}
            <div>
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <Share2 size={18} className="text-amber-500"/> تابعنا على منصات التواصل
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {SAMPLE_SOCIALS.map(link => {
                  const platform = SOCIAL_PLATFORMS[link.platform]
                  if (!platform) return null
                  return (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity" style={{ backgroundColor: platform.color }} />
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: platform.color }}>
                        {platform.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800">{link.label || platform.name}</p>
                        <p className="text-[10px] text-gray-400 truncate" dir="ltr">{link.url.replace(/https?:\/\/(www\.)?/,'').substring(0,25)}</p>
                      </div>
                      <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:-translate-x-1 transition-all flex-shrink-0" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-3xl shadow-2xl border-t-4 border-amber-500 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <MessageSquare size={22} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">أرسل رسالة</h3>
                <p className="text-xs text-gray-400">نرد خلال 24 ساعة</p>
              </div>
            </div>

            {sent && (
              <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle size={22} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-700">تم إرسال رسالتك بنجاح!</p>
                  <p className="text-xs text-emerald-600">سيتواصل معك فريقنا قريباً</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">الاسم الكامل *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="اسمك الكريم" required
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">رقم الهاتف</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+968 XXXX XXXX" dir="ltr"
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">البريد الإلكتروني *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com" required dir="ltr"
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">موضوع الرسالة</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all bg-white">
                  <option value="">اختر الموضوع</option>
                  {['استفسار عن التسجيل','متابعة أكاديمية','مقترح أو شكوى','الخدمات المدرسية','خدمة الحافلات','أخرى'].map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">نص الرسالة *</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="اكتب استفسارك أو ملاحظتك هنا بالتفصيل..." required rows={5}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all resize-none" />
              </div>
              <button type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <Send size={16} /> إرسال الرسالة
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl mb-4">
              <MessageSquare size={16} className="text-emerald-600" />
              <span className="text-emerald-700 font-black text-xs tracking-wider">الأسئلة الشائعة</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">أسئلة يطرحها <span className="text-emerald-600">أولياء الأمور</span></h2>
            <p className="text-gray-500 text-sm mt-2">إجابات على أبرز الاستفسارات المتكررة</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, i) => <FaqItem key={i} {...faq} />)}
          </div>
          <p className="text-center text-sm text-gray-500 mt-8">
            لم تجد إجابة لسؤالك؟{' '}
            <a href={`mailto:${school?.email || 'info@school.edu.om'}`} className="text-emerald-600 font-bold hover:underline">تواصل معنا مباشرة</a>
          </p>
        </div>
      </div>
    </div>
  )
}
