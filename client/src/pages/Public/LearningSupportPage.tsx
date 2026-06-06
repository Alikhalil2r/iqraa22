import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Heart, Users, BookOpen, Image, Calendar } from 'lucide-react'
import { DEMO_LEARNING_SUPPORT } from '../../data/demoPublicFallback'
import { isDemoMode } from '../../config/appMode'
import { usePublicSchool } from '../../context/PublicSchoolContext'

function PageBanner({ title, subtitle, icon, gradient = 'from-teal-800 to-teal-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const TABS = [
  { k: 'about', l: 'نبذة عنا', icon: <Heart size={16} /> },
  { k: 'specialists', l: 'المختصون', icon: <Users size={16} /> },
  { k: 'articles', l: 'مقالات توعوية', icon: <BookOpen size={16} /> },
  { k: 'gallery', l: 'معرض الصور', icon: <Image size={16} /> },
]

export default function LearningSupportPage() {
  const [tab, setTab] = useState('about')
  const { slug, query: schoolQuery } = usePublicSchool()
  const { data, isLoading } = useQuery({ queryKey: ['public-ls', slug], queryFn: () => publicApi.learningSupport(schoolQuery).then(r => r.data) })
  const demo = isDemoMode()

  const about = data?.about || (demo ? DEMO_LEARNING_SUPPORT.about : '')
  const services = data?.services?.length ? data.services : (demo ? DEMO_LEARNING_SUPPORT.services : [])
  const specialists = data?.specialists?.length ? data.specialists : (demo ? DEMO_LEARNING_SUPPORT.specialists : [])
  const articles = data?.articles?.length ? data.articles : (demo ? DEMO_LEARNING_SUPPORT.articles : [])
  const gallery = data?.gallery?.length ? data.gallery : (demo ? DEMO_LEARNING_SUPPORT.gallery : [])

  return (
    <div>
      <PageBanner title="وحدة دعم التعلم" subtitle="نؤمن بأن كل طالب يستطيع النجاح" icon={<Heart size={36} />} gradient="from-teal-800 to-teal-900" />
      <div className="max-w-5xl mx-auto px-4 py-14">
        {isLoading ? (
          <p className="text-center text-gray-500 py-12">جاري التحميل...</p>
        ) : (
          <>
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
                  <p className="text-gray-600 leading-[1.9] text-base">{about || 'لم تُضف نبذة عن الوحدة بعد.'}</p>
                </div>
                {services.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {services.map((s: any) => (
                      <div key={s.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 border-teal-100 group">
                        <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
                        <h3 className="font-black text-gray-800 mb-2">{s.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                      </div>
                    ))}
                  </div>
                )}
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
                {specialists.length === 0 ? (
                  <p className="text-center text-gray-400 col-span-3 py-10">لم يتم إضافة متخصصين بعد</p>
                ) : specialists.map((s: any) => (
                  <div key={s.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all group text-center">
                    <div className="relative h-52 overflow-hidden">
                      <img src={s.image_url} alt={s.name} className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
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
                {articles.length === 0 ? (
                  <p className="text-center text-gray-400 py-10">لا مقالات حالياً</p>
                ) : articles.map((a: any) => (
                  <div key={a.id} className="bg-white p-6 rounded-2xl shadow-lg border-r-4 border-teal-500 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] bg-teal-50 text-teal-600 px-3 py-1 rounded-xl font-black">📖 مقال تثقيفي</span>
                      {a.publish_date && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar size={9} />{new Date(a.publish_date).toLocaleDateString('ar-OM')}</span>}
                    </div>
                    <h3 className="font-black text-gray-800 mb-3 text-base">{a.title}</h3>
                    <p className="text-sm text-gray-600 leading-[1.9]">{a.content}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'gallery' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fadeUp">
                {gallery.length === 0 ? (
                  <p className="text-center text-gray-400 col-span-3 py-10">لا صور حالياً</p>
                ) : gallery.map((p: any) => (
                  <div key={p.id} className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
                    <div className="h-48 overflow-hidden">
                      <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400/0d9488/fff?text=صورة' }} alt={p.title} />
                    </div>
                    {p.title && <div className="p-3 bg-white"><p className="text-xs font-bold text-gray-700">{p.title}</p></div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
