import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { GraduationCap, Briefcase, MapPin, Star, Send, User, Phone, Mail, ChevronDown, CheckCircle } from 'lucide-react'
import { DEMO_ALUMNI, withDemoFallback } from '../../data/demoPublicFallback'
import { usePublicSchool } from '../../context/PublicSchoolContext'
import toast from 'react-hot-toast'

function PageBanner({ title, subtitle, icon, gradient = 'from-indigo-800 to-indigo-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center relative overflow-hidden`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

export default function AlumniPage() {
  const { slug, query: schoolQuery } = usePublicSchool()
  const { data: alumniData } = useQuery({ queryKey: ['public-alumni', slug], queryFn: () => publicApi.alumni(schoolQuery).then(r => r.data) })

  const alumniList = useMemo(() => {
    const fromApi = withDemoFallback(alumniData?.alumni, DEMO_ALUMNI).map((a: any) => ({
      id: a.id,
      name: a.name,
      year: String(a.graduation_year),
      job: a.job_title,
      city: a.city,
      image: a.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&size=300&background=3730a3&color=fff`,
      story: a.story,
      achievement: a.achievement,
    }))
    return fromApi
  }, [alumniData])

  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', year: '', job: '', city: '', email: '', phone: '', story: '', achievement: '' })
  const years = useMemo<string[]>(() => {
    const ys = alumniList.map(a => String(a.year)).filter((y): y is string => Boolean(y))
    return ['all', ...Array.from(new Set<string>(ys)).sort().reverse()]
  }, [alumniList])
  const filtered = filter === 'all' ? alumniList : alumniList.filter(a => a.year === filter)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await publicApi.registerAlumni({ ...form, schoolSlug: slug })
      toast.success('شكراً! سيتم مراجعة بياناتك وإضافتها قريباً.')
      setForm({ name: '', year: '', job: '', city: '', email: '', phone: '', story: '', achievement: '' })
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'فشل إرسال البيانات. حاول مجدداً.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageBanner title="خريجونا فخرنا" subtitle="قصص نجاح خريجي مدرستنا حول العالم" icon={<GraduationCap size={36} />} gradient="from-indigo-800 to-indigo-900" />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="bg-gradient-to-l from-indigo-800 to-indigo-900 rounded-3xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div>
            <h2 className="text-2xl font-black mb-2">أنت خريج مدرستنا؟</h2>
            <p className="text-indigo-300 text-sm">شاركنا قصة نجاحك لتكون مصدر إلهام للطلاب الحاليين</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-black px-8 py-3.5 rounded-2xl flex items-center gap-2 flex-shrink-0 transition-all shadow-xl hover:-translate-y-0.5">
            <Star size={18} fill="currentColor" /> شاركنا قصتك
            <ChevronDown size={16} className={`transition-transform ${showForm ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-12 border-t-4 border-indigo-600 animate-fadeUp">
            <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2"><User size={20} className="text-indigo-600" /> نموذج تسجيل الخريج</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-600 mb-1 block">الاسم الكامل *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none" /></div>
                <div><label className="text-xs font-bold text-gray-600 mb-1 block">سنة التخرج *</label><input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required min="2000" max="2025" placeholder="مثال: 2015" className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none" /></div>
                <div><label className="text-xs font-bold text-gray-600 mb-1 block">المسمى الوظيفي / التخصص *</label><input value={form.job} onChange={e => setForm({ ...form, job: e.target.value })} required className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none" /></div>
                <div><label className="text-xs font-bold text-gray-600 mb-1 block">المدينة / البلد</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none" /></div>
                <div><label className="text-xs font-bold text-gray-600 mb-1 block"><Mail size={12} className="inline ml-1" />البريد الإلكتروني *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none" dir="ltr" /></div>
                <div><label className="text-xs font-bold text-gray-600 mb-1 block"><Phone size={12} className="inline ml-1" />رقم التواصل</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none" dir="ltr" /></div>
              </div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">قصة نجاحك *</label><textarea value={form.story} onChange={e => setForm({ ...form, story: e.target.value })} required rows={4} placeholder="شارك قصة مسيرتك المهنية والمحطات المهمة في حياتك..." className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none resize-none" /></div>
              <div><label className="text-xs font-bold text-gray-600 mb-1 block">أبرز إنجازاتك</label><input value={form.achievement} onChange={e => setForm({ ...form, achievement: e.target.value })} placeholder="جوائز، شهادات، مشاريع بارزة..." className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-400 outline-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-700 disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold hover:bg-indigo-800 transition flex items-center justify-center gap-2"><Send size={16} /> {loading ? 'جاري الإرسال...' : 'إرسال بياناتي'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {years.map(y => (
            <button key={y} onClick={() => setFilter(y)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === y ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {y === 'all' ? '🎓 الكل' : `دفعة ${y}`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(alumnus => (
            <div key={alumnus.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 group">
              <div className="relative h-52 overflow-hidden">
                <img src={alumnus.image} alt={alumnus.name} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(alumnus.name)}&size=300&background=3730a3&color=fff` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/90 via-indigo-900/20 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <span className="text-[9px] bg-amber-500 text-gray-900 px-2 py-0.5 rounded-md font-black">دفعة {alumnus.year}</span>
                  <h3 className="text-white font-black text-base mt-2 leading-snug">{alumnus.name}</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start gap-2 mb-2">
                  <Briefcase size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-bold text-gray-800">{alumnus.job}</p>
                </div>
                {alumnus.city && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-500">{alumnus.city}</p>
                  </div>
                )}
                {alumnus.story && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">{alumnus.story}</p>}
                {alumnus.achievement && (
                  <div className="flex items-start gap-2 pt-3 border-t border-gray-100">
                    <CheckCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-amber-700">{alumnus.achievement}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
