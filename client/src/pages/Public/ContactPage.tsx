import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Mail, Phone, MapPin, Send, Clock, Share2, ChevronLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

function PageBanner({ title, subtitle, icon, gradient = 'from-emerald-800 to-emerald-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const SOCIAL_PLATFORMS: Record<string, { color: string; name: string; icon: React.ReactNode }> = {
  whatsapp: { color: '#25D366', name: 'واتساب', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 1.636 6.065L.063 23.85a.376.376 0 0 0 .459.46l5.853-1.545A12 12 0 0 0 12 24a12 12 0 0 0 12-12A12 12 0 0 0 11.944 0z" opacity=".1"/></svg> },
  twitter: { color: '#000000', name: 'تويتر / X', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  instagram: { color: '#E1306C', name: 'إنستغرام', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  facebook: { color: '#1877F2', name: 'فيسبوك', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  youtube: { color: '#FF0000', name: 'يوتيوب', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
  snapchat: { color: '#FFFC00', name: 'سناب شات', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.49-.104.37 0 .73.195.81.49.065.233.025.57-.79 1.02.062.192.15.545.15.79 0 .395-.22.74-.57.95-.03.18-.073.37-.12.566.053.084.22.285.42.493.333.357 1.05.856 1.05 1.68 0 .535-.383.96-.95 1.065-1.125.19-1.667.63-2.046 1.076-.148.169-.234.288-.248.302-.003.003-.006.006-.01.008 0 0-.4.45-.49.63-.075.162-.13.314-.196.528-.04.15-.163.27-.344.27-.18 0-.38-.17-.577-.417-.433-.547-1.097-.806-2.034-.806-1.5 0-3.42.786-4.98 2.79-.273.35-.632.53-1.02.53-.69 0-1.376-.567-1.376-1.354 0-2.33-2.283-5.18-3.547-5.83-.26-.132-.39-.32-.39-.508 0-.244.197-.48.518-.48.212 0 .467.086.767.187.524.177 1.293.43 2.067.43.348 0 .672-.05.966-.182.012-.225.024-.44.035-.652-.104-1.628-.23-3.654.299-4.847C7.87 1.069 11.216.793 12.206.793zm0 1.41c-.72 0-3.56.23-4.89 3.137-.456 1.028-.348 2.795-.238 4.568l.013.218c.018.283.033.559.044.832-.06.18-.22.297-.408.297-.274 0-.628-.122-1.077-.258-.253-.077-.512-.155-.77-.207.9 1.01 2.6 3.3 2.6 5.718 0 .358.23.432.42.432.218 0 .44-.13.613-.356 1.7-2.2 3.812-3.13 5.513-3.13 1.215 0 2.097.372 2.625 1.038.122.154.24.29.343.4-.04-.1-.077-.2-.107-.29-.064-.187-.16-.463-.31-.638-.42-.48-1.162-1.014-2.572-1.25-.38-.065-.532-.355-.532-.608 0-.22.12-.414.303-.513 1.3-.693 1.437-1.24 1.364-1.55-.033-.14-.14-.2-.253-.2-.08 0-.168.024-.254.082-.54.346-1.173.58-1.74.58-.396 0-.79-.08-1.092-.298-.23-.165-.367-.41-.37-.68-.013-.25-.006-.503.004-.757l.003-.058c.116-1.773.224-3.54-.232-4.568C15.785 2.453 12.93 2.203 12.206 2.203z"/></svg> },
  tiktok: { color: '#000000', name: 'تيك توك', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.15a8.16 8.16 0 004.77 1.52V7.22a4.85 4.85 0 01-1-.53z"/></svg> },
}

const SAMPLE_SOCIALS = [
  { id: 1, platform: 'whatsapp', url: 'https://wa.me/96890000000', label: 'واتساب المدرسة' },
  { id: 2, platform: 'instagram', url: 'https://instagram.com/school', label: 'إنستغرام' },
  { id: 3, platform: 'twitter', url: 'https://twitter.com/school', label: 'تويتر / X' },
  { id: 4, platform: 'youtube', url: 'https://youtube.com/@school', label: 'يوتيوب' },
]

export default function ContactPage() {
  const { data: schoolData } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const school = schoolData?.school

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('شكراً لتواصلك معنا! سنرد عليك قريباً.')
    setSent(true)
    setForm({ name: '', phone: '', email: '', message: '' })
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <div>
      <PageBanner title="تواصل معنا" subtitle="نسعد باستقبال استفساراتكم ومقترحاتكم" icon={<Mail size={36} />} />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-black mb-6 text-emerald-800">معلومات التواصل</h2>
            <div className="space-y-5 mb-10">
              {[
                { icon: <Phone size={18} />, l: 'الهاتف', v: school?.phone || '+968 2400 0000' },
                { icon: <Mail size={18} />, l: 'البريد الإلكتروني', v: school?.email || 'info@school.edu.om' },
                { icon: <MapPin size={18} />, l: 'الموقع', v: school?.address || 'سلطنة عُمان' },
                { icon: <Clock size={18} />, l: 'دوام العمل', v: 'الأحد – الخميس | 7:00 ص – 2:00 م' },
              ].map((x, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-600">{x.icon}</div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800 mb-0.5">{x.l}</h4>
                    <p className="text-sm text-gray-600">{x.v}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                <Share2 size={18} className="text-amber-500" /> تابعنا على مواقع التواصل
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_SOCIALS.map(link => {
                  const platform = SOCIAL_PLATFORMS[link.platform]
                  if (!platform) return null
                  return (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.04] transition-opacity" style={{ backgroundColor: platform.color }} />
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: platform.color }}>
                        {platform.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-800">{link.label || platform.name}</p>
                        <p className="text-[10px] text-gray-400 truncate" dir="ltr">{link.url.replace(/https?:\/\/(www\.)?/, '').substring(0, 30)}...</p>
                      </div>
                      <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 group-hover:-translate-x-1 transition-all flex-shrink-0" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl shadow-xl border-t-4 border-amber-500 bg-white">
            <h3 className="text-xl font-bold mb-5 text-gray-800">أرسل رسالة</h3>
            {sent && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-bold text-emerald-700">تم إرسال رسالتك بنجاح!</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">الاسم الكامل *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسمك الكريم" required className="w-full p-3 rounded-xl border text-sm border-gray-200 focus:border-emerald-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">رقم الهاتف</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+968 XXXX XXXX" className="w-full p-3 rounded-xl border text-sm border-gray-200 focus:border-emerald-400 outline-none" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">البريد الإلكتروني *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required className="w-full p-3 rounded-xl border text-sm border-gray-200 focus:border-emerald-400 outline-none" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-gray-600">نص الرسالة *</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="اكتب استفسارك أو ملاحظتك هنا..." required rows={5} className="w-full p-3 rounded-xl border text-sm border-gray-200 focus:border-emerald-400 outline-none resize-none" />
              </div>
              <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition flex items-center justify-center gap-2">
                <Send size={14} /> إرسال الرسالة
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
