import React, { useState } from 'react'
import { Heart, Users, BookOpen, Image, Tag, Calendar } from 'lucide-react'

function PageBanner({ title, subtitle, icon, gradient = 'from-teal-800 to-teal-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const LS_DATA = {
  about: 'وحدة دعم التعلم تعمل على توفير الدعم الأكاديمي والنفسي والاجتماعي لجميع الطلاب، مع الاهتمام بذوي صعوبات التعلم وضمان دمجهم في البيئة التعليمية بشكل إيجابي.',
  services: [
    { title: 'صعوبات التعلم', icon: '📖', desc: 'برامج متخصصة لتشخيص وعلاج صعوبات القراءة والكتابة والحساب' },
    { title: 'الدعم النفسي', icon: '💙', desc: 'جلسات إرشادية فردية وجماعية لدعم الصحة النفسية للطلاب' },
    { title: 'دعم الموهوبين', icon: '⭐', desc: 'برامج إثرائية للطلاب ذوي القدرات والمواهب الاستثنائية' },
    { title: 'التواصل الاجتماعي', icon: '🤝', desc: 'تنمية مهارات التواصل والتفاعل الاجتماعي الإيجابي' },
  ],
  specialists: [
    { id: 1, name: 'أ. فاطمة الكلبانية', role: 'أخصائية صعوبات التعلم', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', bio: 'ماجستير في التربية الخاصة، خبرة 10 سنوات' },
    { id: 2, name: 'أ. سعيد المقبالي', role: 'مرشد نفسي', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80', bio: 'دكتوراه في علم النفس التربوي' },
    { id: 3, name: 'أ. منى البراشدية', role: 'أخصائية التخاطب', image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&q=80', bio: 'بكالوريوس أمراض النطق والتخاطب' },
  ],
  articles: [
    { id: 1, title: 'كيف تساعد طفلك على التغلب على صعوبات القراءة؟', content: 'صعوبات القراءة أو ما يُعرف بـ"الديسلكسيا" تؤثر على كثير من الأطفال. في هذا المقال نستعرض أساليب عملية يمكن للوالدين تطبيقها في المنزل لدعم أطفالهم...', date: '2025-01-20' },
    { id: 2, title: 'الذكاء العاطفي: المهارة التي يحتاجها كل طالب', content: 'تُعدّ مهارات الذكاء العاطفي من أهم ما يجب تنميته لدى الطلاب. الطفل الذي يتمتع بذكاء عاطفي عالٍ يكون أكثر قدرة على التعامل مع الضغوط والتواصل مع الآخرين...', date: '2025-02-10' },
    { id: 3, title: 'دور الأسرة في دعم التعلم الإيجابي', content: 'الأسرة هي الشريك الأول للمدرسة في رحلة تعلم الطفل. حين تتعاون الأسرة مع المعلمين، تتضاعف فرص النجاح...', date: '2025-02-20' },
  ],
  gallery: [
    { id: 1, src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80', caption: 'جلسة دعم التعلم' },
    { id: 2, src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80', caption: 'نشاط تفاعلي للطلاب' },
    { id: 3, src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80', caption: 'ورشة مهارات التعلم' },
    { id: 4, src: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80', caption: 'فعالية الوعي بصعوبات التعلم' },
    { id: 5, src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', caption: 'لقاء مع أولياء الأمور' },
    { id: 6, src: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80', caption: 'مكتبة دعم التعلم' },
  ]
}

const TABS = [
  { k: 'about', l: 'نبذة عنا', icon: <Heart size={16} /> },
  { k: 'specialists', l: 'المختصون', icon: <Users size={16} /> },
  { k: 'articles', l: 'مقالات توعوية', icon: <BookOpen size={16} /> },
  { k: 'gallery', l: 'معرض الصور', icon: <Image size={16} /> },
]

export default function LearningSupportPage() {
  const [tab, setTab] = useState('about')

  return (
    <div>
      <PageBanner title="وحدة دعم التعلم" subtitle="نؤمن بأن كل طالب يستطيع النجاح" icon={<Heart size={36} />} gradient="from-teal-800 to-teal-900" />
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="flex flex-wrap justify-center gap-2 mb-12 bg-gray-50 p-2 rounded-2xl w-fit mx-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${tab === t.k ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}>
              {t.icon}{t.l}
            </button>
          ))}
        </div>

        {tab === 'about' && (
          <div className="space-y-8 animate-fadeUp">
            <div className="bg-teal-50 border-r-4 border-teal-600 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4"><Heart size={24} className="text-teal-600" /><h2 className="text-2xl font-black text-teal-800">عن الوحدة</h2></div>
              <p className="text-gray-600 leading-[1.9] text-base">{LS_DATA.about}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {LS_DATA.services.map((s, i) => (
                <div key={s.title} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 border-teal-100 group">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
                  <h3 className="font-black text-gray-800 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-l from-teal-800 to-teal-900 text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-black mb-2">هل طفلك بحاجة للدعم؟</h3>
                <p className="text-teal-200 text-sm">تواصل معنا لجدولة جلسة تقييم مجانية</p>
              </div>
              <div className="flex-shrink-0">
                <a href="tel:+96890000000" className="bg-white text-teal-800 font-black px-8 py-3.5 rounded-2xl hover:bg-gray-100 transition-all shadow-xl flex items-center gap-2">
                  📞 تواصل الآن
                </a>
              </div>
            </div>
          </div>
        )}

        {tab === 'specialists' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeUp">
            {LS_DATA.specialists.length === 0 ? (
              <p className="text-center text-gray-400 col-span-3 py-10">لم يتم إضافة متخصصين بعد</p>
            ) : LS_DATA.specialists.map(s => (
              <div key={s.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all group text-center">
                <div className="relative h-52 overflow-hidden">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&size=300&background=0d9488&color=fff` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-900/80 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="font-black text-gray-800 text-base mb-1">{s.name}</h3>
                  <p className="text-teal-600 font-bold text-xs mb-2">{s.role}</p>
                  {s.bio && <p className="text-gray-500 text-xs">{s.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'articles' && (
          <div className="space-y-5 animate-fadeUp">
            {LS_DATA.articles.length === 0 ? (
              <p className="text-center text-gray-400 py-10">لا مقالات حالياً</p>
            ) : LS_DATA.articles.map(a => (
              <div key={a.id} className="bg-white p-6 rounded-2xl shadow-lg border-r-4 border-teal-500 hover:shadow-xl transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] bg-teal-50 text-teal-600 px-3 py-1 rounded-xl font-black">📖 مقال تثقيفي</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar size={9} />{new Date(a.date).toLocaleDateString('ar-OM')}</span>
                </div>
                <h3 className="font-black text-gray-800 mb-3 text-base">{a.title}</h3>
                <p className="text-sm text-gray-600 leading-[1.9]">{a.content}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'gallery' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fadeUp">
            {LS_DATA.gallery.length === 0 ? (
              <p className="text-center text-gray-400 col-span-3 py-10">لا صور حالياً</p>
            ) : LS_DATA.gallery.map(p => (
              <div key={p.id} className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                <div className="h-48 overflow-hidden">
                  <img src={p.src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400/0d9488/fff?text=صورة' }} alt={p.caption} />
                </div>
                {p.caption && <div className="p-3 bg-white"><p className="text-xs font-bold text-gray-700">{p.caption}</p></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
