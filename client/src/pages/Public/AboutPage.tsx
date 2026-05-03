import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import {
  School, Eye, Heart, Calendar, Layers, MapPin, Award, Users, Camera, Search, X,
  BookOpen, Lightbulb, Shield, Globe, Star, CheckCircle, ChevronLeft
} from 'lucide-react'

const DEFAULT_STAFF = [
  { id: 1, name: 'د. أحمد المحروقي',   role: 'مدير المدرسة',          category: 'إدارة',   image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',  quote: 'نسعى لبناء جيل مبدع يحمل قيم الانتماء والتفوق' },
  { id: 2, name: 'أ. فاطمة البلوشي',   role: 'نائبة المدير',           category: 'إدارة',   image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', quote: 'التميز الأكاديمي هدفنا الدائم' },
  { id: 3, name: 'أ. سالم الحبسي',     role: 'معلم الرياضيات',         category: 'أكاديمي', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',  quote: 'الرياضيات لغة الكون وأداة التفكير' },
  { id: 4, name: 'أ. مريم الراشدي',    role: 'معلمة العلوم',           category: 'أكاديمي', image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&q=80',  quote: 'العلم نور والجهل ظلام' },
  { id: 5, name: 'أ. خالد العامري',    role: 'معلم اللغة العربية',     category: 'أكاديمي', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',    quote: 'العربية هويتنا وفخرنا' },
  { id: 6, name: 'أ. نورة السعيدي',    role: 'المرشدة الاجتماعية',    category: 'إدارة',   image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&q=80',    quote: 'طلابنا أبناؤنا والمدرسة بيتهم الثاني' },
]

const DEFAULT_PHOTOS = [
  { id: 1, src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',   caption: 'المبنى الرئيسي للمدرسة',            category: 'المبنى'    },
  { id: 2, src: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80',   caption: 'فصل دراسي مجهز بأحدث التقنيات',   category: 'الفصول'   },
  { id: 3, src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',      caption: 'مختبر العلوم',                      category: 'المختبرات'},
  { id: 4, src: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80',   caption: 'المكتبة المدرسية',                  category: 'المرافق'  },
  { id: 5, src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80',   caption: 'ممرات المدرسة',                     category: 'المبنى'   },
  { id: 6, src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80',      caption: 'قاعة الأنشطة والفعاليات',           category: 'القاعات'  },
]

const VALUES = [
  { icon: BookOpen,   title: 'التميز الأكاديمي',   desc: 'نسعى لتحقيق أعلى مستويات الجودة التعليمية من خلال مناهج متطورة وكوادر متخصصة.',       color: '#6366f1' },
  { icon: Shield,     title: 'القيم الإسلامية',     desc: 'نبني شخصية الطالب على أسس راسخة من قيم الإسلام والهوية الوطنية العُمانية الأصيلة.',   color: '#10b981' },
  { icon: Lightbulb,  title: 'الابتكار والإبداع',  desc: 'نشجع التفكير النقدي وريادة الأعمال وروح المبادرة في بيئة تعليمية محفزة ومبدعة.',      color: '#f59e0b' },
  { icon: Globe,      title: 'الانفتاح العالمي',    desc: 'نُعدّ طلابنا للتنافس في ساحة عالمية من خلال تعليم اللغات وتبني المعايير الدولية.',    color: '#0ea5e9' },
  { icon: Users,      title: 'الشراكة المجتمعية',  desc: 'نبني جسور التواصل مع الأسرة والمجتمع المحلي لتحقيق رؤية تعليمية متكاملة.',            color: '#8b5cf6' },
  { icon: Star,       title: 'التطوير المستمر',     desc: 'نؤمن بالتحسين المستدام لأساليب التدريس والبيئة المدرسية لضمان أفضل تجربة تعليمية.',  color: '#f97316' },
]

const TIMELINE = [
  { year: '2015', title: 'التأسيس',            desc: 'افتتاح المدرسة بـ 200 طالب وكادر تعليمي متميز' },
  { year: '2017', title: 'التوسع الأول',       desc: 'إضافة المرحلة الثانوية وافتتاح مختبر العلوم الحديث' },
  { year: '2019', title: 'شهادة الجودة',       desc: 'الحصول على اعتماد وزارة التربية والتعليم للجودة' },
  { year: '2021', title: 'التحول الرقمي',      desc: 'إطلاق البوابة الإلكترونية لأولياء الأمور والطلاب' },
  { year: '2023', title: 'التوسع الكبير',      desc: 'افتتاح المبنى الجديد وزيادة الطاقة الاستيعابية' },
  { year: '2025', title: 'عقد من التميز',      desc: 'الاحتفال بعشر سنوات من العطاء التعليمي المتميز' },
]

function StaffSection({ staff }: { staff: typeof DEFAULT_STAFF }) {
  const [filter, setFilter]     = useState('all')
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const categories  = useMemo(() => ['all', ...new Set(staff.map(s => s.category).filter(Boolean))], [staff])
  const filtered    = filter === 'all' ? staff : staff.filter(s => s.category === filter)
  const catLabels: Record<string, string> = { 'إدارة': '🏫 الإداري', 'أكاديمي': '📚 الأكاديمي', 'فني': '🔧 الفني' }

  return (
    <div className="mb-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-xl mb-4">
          <Users size={18} className="text-sky-600" />
          <span className="text-sky-700 font-black text-xs tracking-wider">فريقنا المتميز</span>
        </div>
        <h2 className="text-3xl font-black text-gray-900">الطاقم <span className="text-emerald-600">الإداري</span> والتدريسي</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-lg mx-auto">كوادر تعليمية وإدارية مؤهلة تعمل بروح الفريق الواحد نحو التميز</p>
      </div>
      {categories.length > 2 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === c ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
                {member.quote && (
                  <p className="text-gray-500 text-xs leading-relaxed italic">
                    <span className="text-amber-500 text-lg leading-none font-bold">"</span>{member.quote}
                  </p>
                )}
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
  const { data: schoolData }  = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const { data: staffApiData } = useQuery({ queryKey: ['public-staff'],  queryFn: () => publicApi.staff().then(r => r.data) })

  const school   = schoolData?.school
  const apiStaff = staffApiData?.staff || []
  const staff    = apiStaff.length > 0
    ? apiStaff.map((s: any) => ({ id: s.id, name: s.name, role: s.position || '', category: s.department || 'أكاديمي', image: s.photo || '', quote: '' }))
    : DEFAULT_STAFF

  const [filter,   setFilter]   = useState('all')
  const [lightbox, setLightbox] = useState<any>(null)
  const photos        = DEFAULT_PHOTOS
  const cats          = useMemo(() => ['all', ...new Set(photos.map(p => p.category).filter(Boolean))], [photos])
  const filteredPhotos = filter === 'all' ? photos : photos.filter(p => p.category === filter)

  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-emerald-300 blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="mb-4 flex justify-center text-amber-400/80 relative z-10"><School size={40} /></div>
        <h1 className="text-3xl md:text-5xl font-black relative z-10">عن مدرستنا</h1>
        <p className="text-white/60 mt-3 text-sm relative z-10">تعرف على رؤيتنا ورسالتنا وطاقمنا المتميز</p>
      </div>

      {/* Quick facts bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x md:divide-x rtl:divide-x-reverse divide-gray-100">
            {[
              { icon: Calendar,  label: 'سنة التأسيس',  value: '2015' },
              { icon: Layers,    label: 'المراحل',       value: 'الأول – الثاني عشر' },
              { icon: MapPin,    label: 'الموقع',        value: school?.address || 'سلطنة عُمان' },
              { icon: Award,     label: 'الاعتماد',      value: 'وزارة التربية' },
            ].map((x, i) => (
              <div key={x.label} className="text-center py-5 px-4">
                <div className="text-emerald-600 mb-1.5 flex justify-center"><x.icon size={20} /></div>
                <p className="text-[10px] text-gray-400 font-bold mb-0.5">{x.label}</p>
                <p className="font-black text-sm text-gray-800">{x.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14">
        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="p-8 rounded-3xl border-2 border-emerald-200 bg-emerald-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-200/40 rounded-br-[3rem]" />
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center">
                <Eye size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-emerald-800">رؤيتنا</h3>
            </div>
            <p className="leading-[2] text-gray-700 relative">{school?.vision || 'أن نكون مؤسسة تعليمية رائدة تجمع بين أصالة القيم الإسلامية وحداثة التعليم المعاصر، وأن نُخرّج أجيالاً قادرة على قيادة مسيرة التنمية في سلطنة عُمان.'}</p>
          </div>
          <div className="p-8 rounded-3xl border-2 border-amber-200 bg-amber-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-amber-200/40 rounded-br-[3rem]" />
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center">
                <Heart size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-amber-800">رسالتنا</h3>
            </div>
            <p className="leading-[2] text-gray-700 relative">{school?.mission || 'تقديم تعليم عالي الجودة يراعي الفروق الفردية ويُنمي مهارات التفكير النقدي والإبداع والقيادة، في بيئة آمنة وملهمة تشجع على التفوق والتميز.'}</p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl mb-4">
              <Star size={18} className="text-indigo-600" />
              <span className="text-indigo-700 font-black text-xs tracking-wider">ما نؤمن به</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">قيمنا <span className="text-emerald-600">الجوهرية</span></h2>
            <p className="text-gray-500 text-sm mt-2">المبادئ والثوابت التي تحكم رحلتنا التعليمية</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <div key={v.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:-translate-y-1 transition-all hover:shadow-md group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: v.color + '15' }}>
                  <v.icon size={22} style={{ color: v.color }} />
                </div>
                <h4 className="font-black text-gray-800 text-sm mb-2">{v.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl mb-4">
              <Calendar size={18} className="text-amber-600" />
              <span className="text-amber-700 font-black text-xs tracking-wider">مسيرتنا</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">محطات <span className="text-amber-500">تأسيسية</span></h2>
          </div>
          <div className="relative">
            <div className="absolute right-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 to-amber-300 hidden md:block" />
            <div className="space-y-6">
              {TIMELINE.map((item, i) => (
                <div key={item.year} className={`flex items-center gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1 md:px-8">
                    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">{item.year}</span>
                      <h4 className="font-black text-gray-800 mt-2 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border-4 border-emerald-400 flex items-center justify-center flex-shrink-0 z-10 shadow-sm hidden md:flex">
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff */}
        <StaffSection staff={staff} />

        {/* School Photos */}
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl mb-4">
              <Camera size={18} className="text-emerald-600" />
              <span className="text-emerald-700 font-black text-xs tracking-wider">جولة مصورة</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900">مرافق <span className="text-emerald-600">المدرسة</span></h2>
            <p className="text-gray-500 text-sm mt-2">بيئة تعليمية حديثة وجاذبة</p>
          </div>
          {cats.length > 2 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {cats.map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${filter === c ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c === 'all' ? '📷 الكل' : c}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredPhotos.map((photo, idx) => (
              <div key={photo.id}
                className={`group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1 ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                onClick={() => setLightbox(photo)}>
                <div className={`overflow-hidden ${idx === 0 ? 'h-64 md:min-h-[380px]' : 'h-52'}`}>
                  <img src={photo.src} alt={photo.caption} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/800x600/064e3b/fff?text=صورة' }} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 left-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white font-bold text-sm">{photo.caption}</p>
                </div>
                <div className="absolute top-3 right-3 text-[8px] bg-emerald-600/80 text-white px-2 py-0.5 rounded-md font-black">{photo.category}</div>
                <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 text-white">
                  <Search size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-l from-emerald-600 to-emerald-700 rounded-3xl p-8 md:p-10 text-center text-white">
          <School size={32} className="mx-auto mb-4 text-emerald-200" />
          <h3 className="text-2xl font-black mb-2">هل تودّ الانضمام إلى عائلتنا؟</h3>
          <p className="text-emerald-200 text-sm max-w-xl mx-auto mb-6">نرحب بالطلاب المتميزين وأولياء أمورهم. تواصل معنا لمعرفة متطلبات القبول والتسجيل.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/contact" className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg inline-flex items-center gap-2">
              تواصل معنا <ChevronLeft size={14} />
            </a>
            <a href="/news" className="bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/30 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all">
              آخر الأخبار
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[2000] bg-black/92 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.caption} className="w-full max-h-[80vh] object-contain rounded-2xl" />
            <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
              <p className="text-white font-bold text-lg">{lightbox.caption}</p>
              <span className="text-emerald-400 text-xs font-bold">{lightbox.category}</span>
            </div>
            <button onClick={() => setLightbox(null)} className="absolute top-4 left-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition">
              <X size={20} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); const idx = filteredPhotos.findIndex(p => p.id === lightbox.id); setLightbox(filteredPhotos[(idx + 1) % filteredPhotos.length]) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              onClick={e => { e.stopPropagation(); const idx = filteredPhotos.findIndex(p => p.id === lightbox.id); setLightbox(filteredPhotos[(idx - 1 + filteredPhotos.length) % filteredPhotos.length]) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
