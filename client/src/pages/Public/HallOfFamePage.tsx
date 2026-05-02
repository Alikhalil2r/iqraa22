import React, { useState, useMemo } from 'react'
import { Award, Star, Trophy, Medal, Sparkles } from 'lucide-react'

function PageBanner({ title, subtitle, icon, gradient = 'from-yellow-700 to-amber-800' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20l-2-2 2-2 2 2zm0-14l-2-2 2-2 2 2zM6 20l-2-2 2-2 2 2zM34 20l-2-2 2-2 2 2z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
      {icon && <div className="mb-3 flex justify-center text-amber-300/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black relative z-10">{title}</h1>
      <p className="text-white/60 mt-2 text-sm relative z-10">{subtitle}</p>
    </div>
  )
}

const HALL_OF_FAME = [
  { id: 1, name: 'محمد بن سالم العلوي', grade: 'الثاني عشر', year: '2024', achievement: 'أعلى المعدلات على مستوى المحافظة', category: 'أكاديمي', rank: 1, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80', desc: 'حقق معدل 99.8% في الثانوية العامة' },
  { id: 2, name: 'فاطمة بنت خالد الحارثي', grade: 'الثاني عشر', year: '2024', achievement: 'المركز الأول في أولمبياد الرياضيات', category: 'أكاديمي', rank: 2, image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80', desc: 'تمثل المدرسة على المستوى الوطني' },
  { id: 3, name: 'سلطان بن عيسى المعمري', grade: 'العاشر', year: '2024', achievement: 'بطل المملكة في كرة القدم', category: 'رياضي', rank: 3, image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80', desc: 'قائد الفريق الوطني تحت 16 سنة' },
  { id: 4, name: 'مريم بنت سعيد البوسعيدي', grade: 'الحادي عشر', year: '2024', achievement: 'فائزة بجائزة الأمير للإبداع العلمي', category: 'علمي', rank: 1, image: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=300&q=80', desc: 'اختراعها في تحلية المياه بالطاقة الشمسية' },
  { id: 5, name: 'عبدالله بن ناصر الكندي', grade: 'الثاني عشر', year: '2023', achievement: 'مؤسس نادي البرمجة المدرسي', category: 'ريادي', rank: 1, image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80', desc: 'دربّ 50 طالباً على البرمجة المتقدمة' },
  { id: 6, name: 'نورة بنت حمد الشامسي', grade: 'الثاني عشر', year: '2023', achievement: 'حافظة القرآن الكريم والمتفوقة', category: 'ديني', rank: 1, image: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=300&q=80', desc: 'ختمت القرآن حفظاً وحازت أعلى درجات' },
]

const CATEGORY_COLORS: Record<string, string> = {
  أكاديمي: 'from-sky-500 to-sky-600',
  رياضي: 'from-emerald-500 to-emerald-600',
  علمي: 'from-purple-500 to-purple-600',
  ريادي: 'from-orange-500 to-orange-600',
  ديني: 'from-teal-500 to-teal-600',
}

const RANK_STYLES: Record<number, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  1: { bg: 'from-yellow-400 to-amber-500', text: 'text-yellow-900', label: 'ذهبي', icon: <Trophy size={16} /> },
  2: { bg: 'from-gray-300 to-gray-400', text: 'text-gray-700', label: 'فضي', icon: <Medal size={16} /> },
  3: { bg: 'from-amber-600 to-amber-700', text: 'text-amber-100', label: 'برونزي', icon: <Award size={16} /> },
}

function SparkleEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute animate-ping opacity-20"
          style={{
            top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`, animationDuration: `${2 + i * 0.3}s`
          }}>
          <Star size={8} fill="currentColor" className="text-yellow-400" />
        </div>
      ))}
    </div>
  )
}

export default function HallOfFamePage() {
  const [filter, setFilter] = useState('all')
  const [year, setYear] = useState('all')

  const categories = useMemo(() => ['all', ...new Set(HALL_OF_FAME.map(h => h.category))], [])
  const years = useMemo(() => ['all', ...new Set(HALL_OF_FAME.map(h => h.year)).values()].sort().reverse(), [])

  const filtered = HALL_OF_FAME.filter(h => {
    const matchCat = filter === 'all' || h.category === filter
    const matchYear = year === 'all' || h.year === year
    return matchCat && matchYear
  })

  const top3 = filtered.filter(h => h.rank <= 3).slice(0, 3)
  const rest = filtered.filter(h => h.rank > 3 || !filtered.some(f => f.id !== h.id && f.rank <= 3 && f.rank === h.rank))

  return (
    <div>
      <PageBanner title="جدار الشرف" subtitle="أبطالنا وعباقرتنا في كل المجالات" icon={<Award size={36} />} gradient="from-yellow-700 to-amber-800" />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === c ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {c === 'all' ? '🏆 الكل' : c}
              </button>
            ))}
          </div>
          <select value={year} onChange={e => setYear(e.target.value)} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 border-0 outline-none">
            {years.map(y => <option key={y} value={y}>{y === 'all' ? 'كل السنوات' : `عام ${y}`}</option>)}
          </select>
        </div>

        {top3.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-amber-700 font-black text-xs">المراكز الأولى</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {top3.sort((a, b) => a.rank - b.rank).map(h => {
                const rs = RANK_STYLES[h.rank] || RANK_STYLES[3]
                const cc = CATEGORY_COLORS[h.category] || 'from-gray-400 to-gray-500'
                return (
                  <div key={h.id} className={`relative rounded-3xl overflow-hidden shadow-2xl group transition-all hover:-translate-y-2 ${h.rank === 1 ? 'md:-mt-4 md:scale-105 z-10' : ''}`}>
                    <SparkleEffect />
                    <div className={`bg-gradient-to-br ${cc} p-6 text-white text-center relative`}>
                      <div className={`absolute -top-1 -right-1 w-14 h-14 rounded-br-3xl bg-gradient-to-br ${rs.bg} flex items-center justify-center ${rs.text} font-black text-lg shadow-xl`}>
                        {rs.icon}
                      </div>
                      <img src={h.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(h.name)}&size=200&background=fff&color=064e3b`} alt={h.name}
                        className="w-28 h-28 rounded-full object-cover mx-auto border-4 border-white/40 shadow-xl mb-4 group-hover:scale-105 transition-transform"
                        onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(h.name)}&size=200&background=fff&color=064e3b` }} />
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-l ${rs.bg} ${rs.text} mb-3`}>
                        {rs.icon} المركز {h.rank === 1 ? 'الأول' : h.rank === 2 ? 'الثاني' : 'الثالث'}
                      </span>
                      <h3 className="text-lg font-black leading-snug">{h.name}</h3>
                      <p className="text-white/70 text-[11px] mt-1">{h.grade} | {h.year}</p>
                    </div>
                    <div className="bg-white p-5">
                      <p className="text-xs font-black text-gray-800 mb-1 flex items-start gap-1"><Trophy size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />{h.achievement}</p>
                      {h.desc && <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">{h.desc}</p>}
                      <span className={`inline-block mt-3 text-[9px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-l ${cc}`}>{h.category}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(h => {
              const cc = CATEGORY_COLORS[h.category] || 'from-gray-400 to-gray-500'
              return (
                <div key={h.id} className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white flex items-stretch hover:-translate-y-1">
                  <div className={`w-1.5 bg-gradient-to-b ${cc} flex-shrink-0`} />
                  <div className="p-4 flex items-center gap-4 flex-1">
                    <img src={h.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(h.name)}&size=100&background=064e3b&color=fff`} alt={h.name}
                      className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(h.name)}&size=100&background=064e3b&color=fff` }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm text-gray-800 leading-snug">{h.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">{h.grade} | {h.year}</p>
                      <p className="text-[11px] font-bold text-amber-600 mt-1 line-clamp-2">{h.achievement}</p>
                      <span className={`inline-block mt-1.5 text-[8px] font-black text-white px-2 py-0.5 rounded-md bg-gradient-to-l ${cc}`}>{h.category}</span>
                    </div>
                    <Star size={20} fill="#fbbf24" className="text-amber-400 flex-shrink-0" />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Award size={56} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-500">لا توجد نتائج لهذا التصفية</h3>
          </div>
        )}
      </div>
    </div>
  )
}
