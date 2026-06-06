import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Trophy, Award, Star, Calendar, Tag, Filter, Medal, ChevronLeft } from 'lucide-react'
import { DEMO_ACHIEVEMENTS, withDemoFallback } from '../../data/demoPublicFallback'
import { usePublicSchool } from '../../context/PublicSchoolContext'

const CAT_COLORS: Record<string, { bg: string; text: string; border: string; solid: string }> = {
  أكاديمي:   { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     solid: '#0ea5e9' },
  مسابقات:   { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  solid: '#8b5cf6' },
  مبادرات:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', solid: '#10b981' },
  رياضي:     { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  solid: '#f97316' },
  علمي:      { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    solid: '#14b8a6' },
}

function RankBadge({ rank }: { rank: number | null }) {
  if (!rank) return null
  const colors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }
  const labels: Record<number, string> = { 1: 'المركز الأول 🥇', 2: 'المركز الثاني 🥈', 3: 'المركز الثالث 🥉' }
  if (!colors[rank]) return null
  return (
    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-lg"
      style={{ background: colors[rank], color: rank === 1 ? '#78350f' : rank === 2 ? '#374151' : '#7c2d12' }}>
      <Medal size={11} fill="currentColor" />
      {labels[rank]}
    </div>
  )
}

export default function AchievementsPage() {
  const { slug, query: schoolQuery } = usePublicSchool()
  const { data: apiData } = useQuery({ queryKey: ['public-achievements', slug], queryFn: () => publicApi.achievements(schoolQuery).then(r => r.data) })
  const [filter, setFilter] = useState('all')

  const all = useMemo(() => withDemoFallback(apiData?.achievements, DEMO_ACHIEVEMENTS).map((a: any) => ({
    id: a.id, title: a.title, category: a.category || 'أكاديمي',
    date: a.achievement_date || '', desc: a.description || '', image: a.image_url || '', rank: null,
    studentName: a.student_name, grade: a.class_name,
  })), [apiData])

  const categories = useMemo(() => ['all', ...new Set(all.map((a: any) => a.category).filter(Boolean))], [all])
  const filtered   = filter === 'all' ? all : all.filter((a: any) => a.category === filter)

  const stats = useMemo(() => {
    const cats = new Set(all.map((a: any) => a.category).filter(Boolean))
    return [
      { n: String(all.length), l: 'إنجاز مسجّل', icon: <Trophy size={22} />, color: '#f59e0b' },
      { n: String(cats.size), l: 'مجال تميز', icon: <Medal size={22} />, color: '#6366f1' },
      { n: all.length ? new Date(all[0]?.date || '').getFullYear().toString() || '—' : '—', l: 'أحدث إنجاز', icon: <Star size={22} />, color: '#0ea5e9' },
      { n: String(all.filter((a: any) => a.rank === 1).length), l: 'مركز أول', icon: <Award size={22} />, color: '#10b981' },
    ]
  }, [all])

  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-br from-amber-700 to-orange-800 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-amber-300 blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="mb-4 flex justify-center text-amber-200/80 relative z-10"><Trophy size={44} /></div>
        <h1 className="text-3xl md:text-5xl font-black relative z-10">مشاركاتنا وإنجازاتنا</h1>
        <p className="text-white/60 mt-3 text-sm relative z-10">أبرز ما حققناه من جوائز ومشاركات على المستوى الوطني والخليجي</p>
      </div>

      {/* Stats Banner */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x md:divide-x rtl:divide-x-reverse divide-gray-100">
            {stats.map((s, i) => (
              <div key={s.l} className="text-center py-6 px-4">
                <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
                <p className="text-3xl font-black text-gray-900">{s.n}</p>
                <p className="text-xs text-gray-400 font-bold mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14">
        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Filter size={13} /> الكل ({all.length})
          </button>
          {(categories as string[]).filter(c => c !== 'all').map((c: string) => {
            const style = CAT_COLORS[c] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', solid: '#6b7280' }
            return (
              <button key={c} onClick={() => setFilter(c)}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${filter === c ? `${style.bg} ${style.text} ${style.border} shadow-md` : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}>
                <Tag size={12} />{c}
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Trophy size={56} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-bold text-gray-500">لا توجد إنجازات في هذا التصنيف</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((a: any) => {
              const style = CAT_COLORS[a.category] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', solid: '#6b7280' }
              return (
                <div key={a.id} className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  {a.image ? (
                    <div className="h-52 overflow-hidden relative">
                      <img src={a.image} alt={a.title} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x350/d97706/fff?text=إنجاز' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <RankBadge rank={a.rank} />
                      <div className="absolute top-3 right-3">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl ${style.bg} ${style.text}`}>{a.category}</span>
                      </div>
                      {a.date && (
                        <div className="absolute bottom-3 right-3">
                          <span className="text-[9px] bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                            <Calendar size={9} />{new Date(a.date).toLocaleDateString('ar-OM')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`h-24 ${style.bg} flex items-center justify-center relative`}>
                      <Trophy size={36} style={{ color: style.solid }} />
                      <RankBadge rank={a.rank} />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-2 mb-2">
                      <Trophy size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <h3 className="font-black text-gray-800 text-sm leading-snug">{a.title}</h3>
                    </div>
                    {a.desc && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{a.desc}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Encouragement Banner */}
        <div className="mt-16 bg-gradient-to-l from-amber-500/10 to-amber-600/5 border border-amber-200 rounded-3xl p-8 md:p-10 text-center">
          <Trophy size={32} className="text-amber-500 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-gray-900 mb-2">نحن فخورون بكل طالب متميز</h3>
          <p className="text-gray-500 text-sm max-w-xl mx-auto mb-6">كل إنجاز هو ثمرة جهد مشترك بين الطالب والمعلم وولي الأمر. نواصل معاً رحلة التميز.</p>
          <a href="/school/contact" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5">
            تواصل معنا <ChevronLeft size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
