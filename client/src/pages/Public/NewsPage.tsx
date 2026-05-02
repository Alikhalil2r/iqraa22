import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Newspaper, Calendar, Search, Tag, X, Star, TrendingUp, Clock } from 'lucide-react'

const SAMPLE_NEWS = [
  { id: 1, title: 'انطلاق الفصل الدراسي الثاني بزخم أكاديمي', summary: 'استقبلت المدرسة الفصل الدراسي الثاني بروح عالية وحماس كبير من الطلاب والمعلمين، وسط استعدادات مميزة.', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', category: 'إداري', publish_date: '2025-01-15', is_featured: true },
  { id: 2, title: 'المدرسة تحصد المركز الأول في مسابقة العلوم والتقنية', summary: 'فريق طلاب المدرسة حقق المركز الأول على مستوى المحافظة في مسابقة العلوم والتقنية السنوية.', image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', category: 'إنجازات', publish_date: '2025-01-20', is_featured: true },
  { id: 3, title: 'ختام مخيم القراءة الإثرائي الصيفي', summary: 'أُقيم حفل ختام مخيم القراءة بحضور أولياء الأمور وتكريم المشاركين المتميزين.', image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', category: 'أنشطة', publish_date: '2025-01-25', is_featured: false },
  { id: 4, title: 'زيارة ميدانية لمشروع الطاقة الشمسية الوطني', summary: 'نظّمت المدرسة رحلة تعليمية لطلاب الصفوف العليا لمشروع الطاقة الشمسية الوطني.', image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', category: 'رحلات', publish_date: '2025-02-05', is_featured: false },
  { id: 5, title: 'بطولة كرة القدم بين المدارس — المركز الثاني', summary: 'شارك فريقنا في البطولة الرياضية المدرسية وأحرز المركز الثاني بعد مباريات مثيرة.', image_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80', category: 'رياضي', publish_date: '2025-02-12', is_featured: false },
  { id: 6, title: 'حفل تكريم المعلمين في يومهم العالمي', summary: 'أقامت إدارة المدرسة حفلاً بهيجاً بمناسبة اليوم العالمي للمعلم تقديراً لجهودهم المتميزة.', image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', category: 'مناسبات', publish_date: '2025-02-18', is_featured: false },
  { id: 7, title: 'إطلاق مشروع المختبر الذكي الرقمي', summary: 'افتتحت المدرسة مختبرها الرقمي الجديد بتجهيزات حديثة لتعزيز التعليم القائم على التقنية.', image_url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', category: 'تقنية', publish_date: '2025-03-01', is_featured: false },
  { id: 8, title: 'اليوم المفتوح السنوي — لقاء الأسرة التعليمية', summary: 'استقبلت المدرسة أولياء الأمور في يومها المفتوح السنوي لمناقشة تقدم الطلاب وتعزيز الشراكة.', image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80', category: 'إداري', publish_date: '2025-03-15', is_featured: false },
]

const CAT_COLORS: Record<string, string> = {
  'إداري': '#6366f1', 'إنجازات': '#10b981', 'أنشطة': '#8b5cf6', 'رحلات': '#f97316',
  'رياضي': '#f59e0b', 'مناسبات': '#ec4899', 'تقنية': '#0ea5e9', 'أخرى': '#6b7280',
}

function NewsCard({ n, featured }: { n: any; featured?: boolean }) {
  const color = CAT_COLORS[n.category] || '#6b7280'
  return (
    <article className={`group rounded-3xl overflow-hidden bg-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ${featured ? 'md:flex' : ''}`}>
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
            <Calendar size={9} />{new Date(n.publish_date).toLocaleDateString('ar-OM')}
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
        <div className="flex items-center gap-2 mt-3">
          <Clock size={11} className="text-gray-300" />
          <span className="text-[10px] text-gray-400">{new Date(n.publish_date).toLocaleDateString('ar-OM', { year:'numeric', month:'long', day:'numeric' })}</span>
        </div>
      </div>
    </article>
  )
}

export default function NewsPage() {
  const { data: apiData } = useQuery({ queryKey: ['public-news'], queryFn: () => publicApi.news().then(r => r.data) })
  const [search,  setSearch]  = useState('')
  const [cat,     setCat]     = useState('all')
  const [showAll, setShowAll] = useState(false)

  const allNews = useMemo(
    () => (apiData?.news?.length > 0 ? apiData.news : SAMPLE_NEWS) as typeof SAMPLE_NEWS,
    [apiData]
  )

  const categories = useMemo(() => ['all', ...new Set(allNews.map((n: any) => n.category).filter(Boolean))], [allNews])
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
            <NewsCard n={featuredNews[0]} featured />
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
                <NewsCard key={n.id} n={n} />
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
