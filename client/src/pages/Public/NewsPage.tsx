import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useLocalize } from '../../hooks/useLocalize'
import { useLanguage } from '../../context/LanguageContext'
import { Newspaper, Calendar, Search, Tag, X, Star, TrendingUp, Clock, ChevronLeft } from 'lucide-react'
import { DEMO_NEWS, withDemoFallback } from '../../data/demoPublicFallback'
import { usePublicSchool } from '../../context/PublicSchoolContext'

const SAMPLE_NEWS = DEMO_NEWS

const CAT_COLORS: Record<string, string> = {
  'إداري': '#6366f1', 'إنجازات': '#10b981', 'أنشطة': '#8b5cf6', 'رحلات': '#f97316',
  'رياضي': '#f59e0b', 'مناسبات': '#ec4899', 'تقنية': '#0ea5e9', 'أخرى': '#6b7280',
}

function NewsCard({ n, featured, dateLocale }: { n: any; featured?: boolean; dateLocale: string }) {
  const color = CAT_COLORS[n.category] || CAT_COLORS['أخرى'] || '#6b7280'
  return (
    <Link to={`/school/news/${n.id}`} className={`group block rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${featured ? 'md:flex' : ''}`}>
      <div className={`relative overflow-hidden ${featured ? 'md:w-1/2 h-52 md:h-auto' : 'h-48'}`}>
        {n.image_url ? (
          <img src={n.image_url} alt={n.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/800x400/064e3b/fff?text=خبر' }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Newspaper size={32} className="text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg text-white shadow-lg" style={{ background: color }}>
            {n.category}
          </span>
          <span className="text-[9px] bg-black/40 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center gap-1">
            <Calendar size={9} />{new Date(n.publish_date).toLocaleDateString(dateLocale)}
          </span>
        </div>
        {n.is_featured && (
          <div className="absolute top-3 left-3 bg-amber-400/90 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Star size={10} className="text-amber-900" fill="currentColor" />
            <span className="text-[9px] font-black text-amber-900">مميز</span>
          </div>
        )}
      </div>
      <div className={`p-5 flex flex-col ${featured ? 'md:w-1/2 justify-center' : ''}`}>
        <h3 className={`font-black text-gray-800 mb-2 leading-snug group-hover:text-emerald-700 transition-colors ${featured ? 'text-lg md:text-xl' : 'text-sm line-clamp-2'}`}>{n.title}</h3>
        {n.summary && <p className={`text-gray-500 leading-relaxed ${featured ? 'text-sm line-clamp-3' : 'text-xs line-clamp-2'}`}>{n.summary}</p>}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Clock size={11} className="text-gray-300" />
            <span className="text-[10px] text-gray-400">{new Date(n.publish_date).toLocaleDateString(dateLocale, { year:'numeric', month:'long', day:'numeric' })}</span>
          </div>
          <span className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5 group-hover:gap-1 transition-all">
            اقرأ المزيد <ChevronLeft size={11} />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function NewsPage() {
  const { t } = useLanguage()
  const { localizeNews, dateLocale, category, lang } = useLocalize()
  const { slug, query: schoolQuery } = usePublicSchool()
  const { data: apiData } = useQuery({ queryKey: ['public-news', slug], queryFn: () => publicApi.news(schoolQuery).then(r => r.data) })
  const [search,  setSearch]  = useState('')
  const [cat,     setCat]     = useState('all')
  const [showAll, setShowAll] = useState(false)

  const allNews = useMemo(
    () => withDemoFallback(apiData?.news, SAMPLE_NEWS).map((n: any) => localizeNews(n)),
    [apiData, localizeNews, lang]
  )

  const categories = useMemo<string[]>(() => {
    const cats = allNews.map((n: any) => String(n.category)).filter((c): c is string => Boolean(c))
    return ['all', ...Array.from(new Set<string>(cats))]
  }, [allNews])
  const featuredNews = useMemo(() => allNews.filter((n: any) => n.is_featured).slice(0, 1), [allNews])

  const filtered = useMemo(() => allNews.filter((n: any) => {
    const matchSearch = !search || n.title.includes(search) || (n.summary || '').includes(search)
    const matchCat    = cat === 'all' || n.category === cat
    return matchSearch && matchCat
  }), [allNews, search, cat])

  const visibleNews = showAll ? filtered : filtered.slice(0, 9)

  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-0 left-10 w-96 h-96 rounded-full border border-white" />
        </div>
        <div className="mb-4 flex justify-center text-amber-400/80 relative z-10"><Newspaper size={40} /></div>
        <h1 className="text-3xl md:text-5xl font-black relative z-10">الأخبار والأحداث</h1>
        <p className="text-white/60 mt-3 text-sm relative z-10">آخر المستجدات والفعاليات المدرسية</p>
        <div className="flex justify-center gap-4 mt-5 relative z-10 text-white/60 text-xs">
          <span className="flex items-center gap-1"><TrendingUp size={12}/> {allNews.length} خبر منشور</span>
          <span className="flex items-center gap-1"><Star size={12}/> {allNews.filter((n:any)=>n.is_featured).length} مميز</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14">
        {/* Featured news hero (only when no filter) */}
        {featuredNews.length > 0 && !search && cat === 'all' && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <Star size={16} className="text-amber-500" fill="currentColor" />
              <span className="font-black text-gray-700 text-sm">الخبر المميز</span>
            </div>
            <NewsCard n={featuredNews[0]} featured dateLocale={dateLocale} />
          </div>
        )}

        {/* Search + filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن خبر..." dir="auto"
              className="w-full pr-11 pl-10 py-3 rounded-2xl border border-gray-200 text-sm focus:border-emerald-400 focus:outline-none transition-all" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1"
                style={cat === c
                  ? { background: c === 'all' ? '#065f46' : (CAT_COLORS[c] || '#065f46'), color: '#fff' }
                  : { background: '#f3f4f6', color: '#4b5563' }
                }>
                <Tag size={11} />{c === 'all' ? 'الكل' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500 font-bold">
            {filtered.length} {cat !== 'all' ? `في فئة "${cat}"` : 'خبر'}
            {search && ` — بحث عن: "${search}"`}
          </p>
          {cat !== 'all' && (
            <button onClick={() => setCat('all')} className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
              <X size={12} /> مسح الفلتر
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={56} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">لا توجد نتائج</h3>
            <p className="text-sm text-gray-400 mb-6">جرّب البحث بكلمات أخرى أو غيّر الفئة</p>
            <button onClick={() => { setSearch(''); setCat('all') }}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-colors">
              إعادة ضبط
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleNews.map((n: any) => (
                <NewsCard key={n.id} n={n} dateLocale={dateLocale} />
              ))}
            </div>

            {filtered.length > 9 && !showAll && (
              <div className="text-center mt-10">
                <button onClick={() => setShowAll(true)}
                  className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-bold text-sm transition-all shadow-lg hover:-translate-y-0.5">
                  عرض المزيد ({filtered.length - 9} خبر آخر)
                </button>
              </div>
            )}
            {showAll && filtered.length > 9 && (
              <div className="text-center mt-10">
                <button onClick={() => setShowAll(false)}
                  className="px-8 py-3.5 border-2 border-gray-200 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">
                  عرض أقل
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
