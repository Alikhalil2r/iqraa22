import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Trophy, Award, Star, Calendar, Tag, Filter } from 'lucide-react'

function PageBanner({ title, subtitle, icon, gradient = 'from-amber-700 to-orange-800' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center relative overflow-hidden`}>
      {icon && <div className="mb-3 flex justify-center text-amber-200/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const SAMPLE_ACHIEVEMENTS = [
  { id: 1, title: 'المركز الأول في أولمبياد الرياضيات الوطني', category: 'أكاديمي', date: '2025-01-25', desc: 'حقق الطالب محمد العلوي المركز الأول على مستوى السلطنة في مسابقة الأولمبياد الوطنية للرياضيات', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80' },
  { id: 2, title: 'بطل السلطنة في مسابقة الروبوت', category: 'مسابقات', date: '2025-02-10', desc: 'فاز فريق الروبوت المدرسي بالبطولة الوطنية ويمثل السلطنة في البطولة الخليجية', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80' },
  { id: 3, title: 'مشاركة في مبادرة البيئة الخضراء', category: 'مبادرات', date: '2025-01-18', desc: 'شارك طلاب المدرسة في مبادرة زراعة 1000 شجرة ضمن حملة السلطنة الوطنية', image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=600&q=80' },
  { id: 4, title: 'المركز الثاني في بطولة كرة القدم', category: 'رياضي', date: '2024-12-20', desc: 'وصل الفريق المدرسي لكرة القدم إلى نهائي البطولة الإقليمية', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&q=80' },
  { id: 5, title: 'جائزة أفضل مشروع في المعرض العلمي', category: 'علمي', date: '2025-02-28', desc: 'فازت الطالبة مريم الراشدي بجائزة أفضل مشروع علمي عن مشروعها في تحلية المياه', image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80' },
  { id: 6, title: 'تكريم الطلاب المتفوقين من وزارة التربية', category: 'أكاديمي', date: '2024-12-15', desc: 'حظي 5 طلاب من مدرستنا بتكريم وزارة التربية والتعليم للمتفوقين على المستوى الوطني', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80' },
]

const CAT_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  أكاديمي:   { bg: 'bg-sky-100', text: 'text-sky-700', icon: <Trophy size={14} className="text-sky-600" /> },
  مسابقات:   { bg: 'bg-purple-100', text: 'text-purple-700', icon: <Award size={14} className="text-purple-600" /> },
  مبادرات:   { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <Star size={14} className="text-emerald-600" /> },
  رياضي:     { bg: 'bg-orange-100', text: 'text-orange-700', icon: <Trophy size={14} className="text-orange-600" /> },
  علمي:      { bg: 'bg-teal-100', text: 'text-teal-700', icon: <Award size={14} className="text-teal-600" /> },
}

export default function AchievementsPage() {
  const { data: apiData } = useQuery({ queryKey: ['public-achievements'], queryFn: () => publicApi.achievements().then(r => r.data) })
  const [filter, setFilter] = useState('all')

  const all = (apiData?.achievements?.length > 0
    ? apiData.achievements.map((a: any) => ({ id: a.id, title: a.title, category: a.category || 'أكاديمي', date: a.achievement_date || '', desc: a.description || '', image: a.image_url || '' }))
    : SAMPLE_ACHIEVEMENTS)

  const categories = useMemo(() => ['all', ...new Set(all.map((a: any) => a.category).filter(Boolean))], [all])
  const filtered = filter === 'all' ? all : all.filter((a: any) => a.category === filter)

  const stats = [
    { n: '50+', l: 'جائزة وطنية', icon: <Trophy size={24} />, c: 'text-amber-500' },
    { n: '15+', l: 'مسابقة خليجية', icon: <Award size={24} />, c: 'text-sky-500' },
    { n: '10', l: 'سنوات تميز', icon: <Star size={24} />, c: 'text-purple-500' },
    { n: '200+', l: 'طالب متفوق', icon: <Trophy size={24} />, c: 'text-emerald-500' },
  ]

  return (
    <div>
      <PageBanner title="مشاركاتنا وإنجازاتنا" subtitle="أبرز ما حققناه من جوائز ومنجزات" icon={<Trophy size={36} />} gradient="from-amber-700 to-orange-800" />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {stats.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-3xl bg-white shadow-lg hover:-translate-y-1 transition-all">
              <div className={`flex justify-center mb-2 ${s.c}`}>{s.icon}</div>
              <p className="text-2xl font-black text-gray-900">{s.n}</p>
              <p className="text-xs text-gray-400 font-bold">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button onClick={() => setFilter('all')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Filter size={13} /> الكل
          </button>
          {categories.filter((c: string) => c !== 'all').map((c: string) => {
            const style = CAT_COLORS[c] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Tag size={14} /> }
            return (
              <button key={c} onClick={() => setFilter(c)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${filter === c ? `${style.bg} ${style.text} border-current` : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}>
                {style.icon}{c}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map((a: any) => {
            const style = CAT_COLORS[a.category] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Tag size={14} /> }
            return (
              <div key={a.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all group">
                {a.image ? (
                  <div className="h-52 overflow-hidden relative">
                    <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x350/d97706/fff?text=إنجاز' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl ${style.bg} ${style.text}`}>{a.category}</span>
                    </div>
                    {a.date && (
                      <div className="absolute bottom-3 left-3">
                        <span className="text-[9px] bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                          <Calendar size={9} />{new Date(a.date).toLocaleDateString('ar-OM')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`h-24 ${style.bg} flex items-center justify-center`}><Trophy size={36} className={style.text} /></div>
                )}
                <div className="p-5">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0"><Trophy size={16} /></span>
                    <h3 className="font-black text-gray-800 text-base leading-snug">{a.title}</h3>
                  </div>
                  {a.desc && <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{a.desc}</p>}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Trophy size={56} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-500">لا توجد إنجازات في هذا التصنيف</h3>
          </div>
        )}
      </div>
    </div>
  )
}
