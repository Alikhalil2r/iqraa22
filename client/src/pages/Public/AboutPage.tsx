import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { School, Eye, Heart, Calendar, Layers, MapPin, Award, Users, Camera, Search, X } from 'lucide-react'

function PageBanner({ title, subtitle, icon, gradient = 'from-emerald-800 to-emerald-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center relative overflow-hidden`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black relative z-10">{title}</h1>
      <p className="text-white/60 mt-2 text-sm relative z-10">{subtitle}</p>
    </div>
  )
}

const DEFAULT_STAFF = [
  { id: 1, name: 'د. أحمد المحروقي', role: 'مدير المدرسة', category: 'إدارة', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', quote: 'نسعى لبناء جيل مبدع' },
  { id: 2, name: 'أ. فاطمة البلوشي', role: 'نائبة المدير', category: 'إدارة', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', quote: 'التميز هدفنا الدائم' },
  { id: 3, name: 'أ. سالم الحبسي', role: 'معلم الرياضيات', category: 'أكاديمي', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', quote: 'الرياضيات لغة الكون' },
  { id: 4, name: 'أ. مريم الراشدي', role: 'معلمة العلوم', category: 'أكاديمي', image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&q=80', quote: 'العلم نور والجهل ظلام' },
  { id: 5, name: 'أ. خالد العامري', role: 'معلم اللغة العربية', category: 'أكاديمي', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', quote: 'العربية هويتنا' },
  { id: 6, name: 'أ. نورة السعيدي', role: 'المرشدة الاجتماعية', category: 'إدارة', image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80', quote: 'طلابنا أبناؤنا' },
]

const DEFAULT_PHOTOS = [
  { id: 1, src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', caption: 'المبنى الرئيسي للمدرسة', category: 'المبنى' },
  { id: 2, src: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80', caption: 'فصل دراسي مجهز بأحدث التقنيات', category: 'الفصول' },
  { id: 3, src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', caption: 'مختبر العلوم', category: 'المختبرات' },
  { id: 4, src: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80', caption: 'المكتبة المدرسية', category: 'المرافق' },
  { id: 5, src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80', caption: 'ممرات المدرسة', category: 'المبنى' },
  { id: 6, src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80', caption: 'قاعة الأنشطة والفعاليات', category: 'القاعات' },
]

function StaffSection({ staff }: { staff: typeof DEFAULT_STAFF }) {
  const [filter, setFilter] = useState('all')
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const categories = useMemo(() => ['all', ...new Set(staff.map(s => s.category).filter(Boolean))], [staff])
  const filtered = filter === 'all' ? staff : staff.filter(s => s.category === filter)
  const catLabels: Record<string, string> = { 'إدارة': '🏫 الإداري', 'أكاديمي': '📚 الأكاديمي', 'فني': '🔧 الفني' }

  return (
    <div className="mb-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-xl mb-4">
          <Users size={18} className="text-sky-600" />
          <span className="text-sky-700 font-black text-xs tracking-wider">فريقنا المتميز</span>
        </div>
        <h2 className="text-3xl font-black text-gray-900">الطاقم <span className="text-emerald-600">الإداري</span> و<span className="text-sky-600">التدريسي</span></h2>
        <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">كوادر تعليمية وإدارية مؤهلة تعمل بروح الفريق الواحد</p>
      </div>
      {categories.length > 2 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === c ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c === 'all' ? '👥 الجميع' : (catLabels[c] || c)}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {filtered.map(member => (
          <div key={member.id} className="relative group cursor-pointer" onClick={() => setActiveCard(activeCard === member.id ? null : member.id)}>
            <div className={`bg-white rounded-[1.25rem] overflow-hidden shadow-lg transition-all duration-500 ${activeCard === member.id ? 'shadow-2xl -translate-y-2' : 'hover:shadow-xl hover:-translate-y-1'}`}>
              <div className="relative h-52 overflow-hidden">
                <img src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=300&background=064e3b&color=fff`} alt={member.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=300&background=064e3b&color=fff` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />
                {member.category && (
                  <div className={`absolute top-3 right-3 text-[8px] font-black px-2 py-0.5 rounded-md text-white ${member.category === 'إدارة' ? 'bg-amber-500/90' : member.category === 'أكاديمي' ? 'bg-sky-500/90' : 'bg-gray-500/90'}`}>
                    {member.category}
                  </div>
                )}
                <div className="absolute bottom-0 p-4">
                  <h3 className="font-black text-white text-sm leading-snug">{member.name}</h3>
                  <p className="text-emerald-300 text-[11px] font-bold mt-0.5">{member.role}</p>
                </div>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeCard === member.id ? 'max-h-24 py-3 px-4' : 'max-h-0'}`}>
                {member.quote && <p className="text-gray-500 text-xs leading-relaxed italic"><span className="text-amber-500 text-lg leading-none font-bold">"</span>{member.quote}</p>}
              </div>
              <div className={`h-1 transition-all duration-500 ${activeCard === member.id ? 'bg-gradient-to-l from-emerald-500 via-amber-500 to-sky-500' : 'bg-gray-100'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AboutPage() {
  const { data: schoolData } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const { data: staffApiData } = useQuery({ queryKey: ['public-staff'], queryFn: () => publicApi.staff().then(r => r.data) })

  const school = schoolData?.school
  const apiStaff = staffApiData?.staff || []
  const staff = apiStaff.length > 0
    ? apiStaff.map((s: any) => ({ id: s.id, name: s.name, role: s.position || '', category: s.department || 'أكاديمي', image: s.photo || '', quote: '' }))
    : DEFAULT_STAFF

  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState<any>(null)
  const photos = DEFAULT_PHOTOS
  const cats = useMemo(() => ['all', ...new Set(photos.map(p => p.category).filter(Boolean))], [photos])
  const filteredPhotos = filter === 'all' ? photos : photos.filter(p => p.category === filter)

  return (
    <div>
      <PageBanner title="عن المدرسة" subtitle="تعرف على رؤيتنا ورسالتنا وطاقمنا المتميز" icon={<School size={36} />} />
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="p-8 rounded-3xl border-r-4 border-emerald-600 bg-emerald-50">
            <div className="flex items-center gap-3 mb-4"><Eye size={26} className="text-emerald-600" /><h3 className="text-xl font-black text-emerald-800">رؤيتنا</h3></div>
            <p className="leading-[1.9] text-gray-600">{school?.vision || 'أن نكون مؤسسة تعليمية رائدة تجمع بين أصالة القيم الإسلامية وحداثة التعليم المعاصر.'}</p>
          </div>
          <div className="p-8 rounded-3xl border-r-4 border-amber-500 bg-amber-50">
            <div className="flex items-center gap-3 mb-4"><Heart size={26} className="text-amber-500" /><h3 className="text-xl font-black text-amber-800">رسالتنا</h3></div>
            <p className="leading-[1.9] text-gray-600">{school?.mission || 'تقديم تعليم عالي الجودة يراعي الفروق الفردية ويُنمي المهارات التفكيرية والقيادية.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: <Calendar size={22} />, l: 'التأسيس', v: '2015' },
            { icon: <Layers size={22} />, l: 'المراحل', v: 'الأول – الثاني عشر' },
            { icon: <MapPin size={22} />, l: 'الموقع', v: school?.address || 'سلطنة عُمان' },
            { icon: <Award size={22} />, l: 'الاعتماد', v: 'وزارة التربية' },
          ].map((x, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-gray-50 hover:-translate-y-1 transition-all">
              <div className="text-emerald-600 mb-2 flex justify-center">{x.icon}</div>
              <p className="text-[10px] mb-1 text-gray-500">{x.l}</p>
              <p className="font-bold text-sm text-gray-800">{x.v}</p>
            </div>
          ))}
        </div>

        <StaffSection staff={staff} />

        {/* School Photos Gallery */}
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl mb-4">
              <Camera size={18} className="text-emerald-600" />
              <span className="text-emerald-700 font-black text-xs tracking-wider">جولة مصورة</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">مرافق <span className="text-emerald-600">المدرسة</span> وتجهيزاتها</h2>
          </div>
          {cats.length > 2 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {cats.map(c => (
                <button key={c} onClick={() => setFilter(c)} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${filter === c ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c === 'all' ? '📷 الكل' : c}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPhotos.map((photo, idx) => (
              <div key={photo.id} className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-500 ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                onClick={() => setLightbox(photo)}>
                <div className={`overflow-hidden ${idx === 0 ? 'h-64 md:min-h-[380px]' : 'h-52'}`}>
                  <img src={photo.src} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/800x600/064e3b/fff?text=صورة' }} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 left-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-bold text-sm">{photo.caption}</p>
                </div>
                <div className="absolute top-3 right-3 text-[8px] bg-emerald-600/80 text-white px-2 py-0.5 rounded-md font-black">{photo.category}</div>
                <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 text-white"><Search size={14} /></div>
              </div>
            ))}
          </div>
        </div>

        {lightbox && (
          <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
              <img src={lightbox.src} alt={lightbox.caption} className="w-full max-h-[80vh] object-contain rounded-2xl" />
              <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
                <p className="text-white font-bold text-lg">{lightbox.caption}</p>
              </div>
              <button onClick={() => setLightbox(null)} className="absolute top-4 left-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20">
                <X size={20} />
              </button>
              <button onClick={e => { e.stopPropagation(); const idx = filteredPhotos.findIndex(p => p.id === lightbox.id); setLightbox(filteredPhotos[(idx + 1) % filteredPhotos.length]) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button onClick={e => { e.stopPropagation(); const idx = filteredPhotos.findIndex(p => p.id === lightbox.id); setLightbox(filteredPhotos[(idx - 1 + filteredPhotos.length) % filteredPhotos.length]) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
