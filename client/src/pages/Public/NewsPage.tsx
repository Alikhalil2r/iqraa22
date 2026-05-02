import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Newspaper, Calendar, Search, Tag, X } from 'lucide-react'

function PageBanner({ title, subtitle, icon, gradient = 'from-emerald-800 to-emerald-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const SAMPLE_NEWS = [
  { id: 1, title: 'انطلاق الفصل الدراسي الثاني بزخم أكاديمي', summary: 'استقبلت المدرسة الفصل الدراسي الثاني بروح عالية وحماس من الطلاب والمعلمين.', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', category: 'إداري', publish_date: '2025-01-15' },
  { id: 2, title: 'المدرسة تحصد المركز الأول في مسابقة العلوم', summary: 'فريق الطلاب المتفوقون حقق المركز الأول على مستوى المحافظة في مسابقة العلوم والتقنية.', image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', category: 'أكاديمي', publish_date: '2025-01-20' },
  { id: 3, title: 'ختام مخيم القراءة الإثرائي الصيفي', summary: 'أُقيم حفل ختام مخيم القراءة بحضور أولياء الأمور وتكريم المشاركين المتميزين.', image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', category: 'أنشطة', publish_date: '2025-01-25' },
  { id: 4, title: 'زيارة ميدانية لمصنع الطاقة الشمسية', summary: 'نظّمت المدرسة رحلة تعليمية لطلاب الصفوف العليا لمشروع الطاقة الشمسية الوطني.', image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', category: 'رحلات', publish_date: '2025-02-05' },
  { id: 5, title: 'بطولة كرة القدم بين المدارس', summary: 'شارك فريقنا في البطولة الرياضية المدرسية وأحرز المركز الثاني بعد مباريات مثيرة.', image_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80', category: 'رياضي', publish_date: '2025-02-12' },
  { id: 6, title: 'حفل تكريم المعلمين في يومهم العالمي', summary: 'أقامت إدارة المدرسة حفلاً بهيجاً بمناسبة اليوم العالمي للمعلم تقديراً لجهودهم المتميزة.', image_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', category: 'مناسبات', publish_date: '2025-02-18' },
]

export default function NewsPage() {
  const { data: apiData } = useQuery({ queryKey: ['public-news'], queryFn: () => publicApi.news().then(r => r.data) })
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')

  const allNews = (apiData?.news?.length > 0 ? apiData.news : SAMPLE_NEWS) as typeof SAMPLE_NEWS

  const categories = useMemo(() => ['all', ...new Set(allNews.map((n: any) => n.category).filter(Boolean))], [allNews])

  const filtered = useMemo(() => allNews.filter((n: any) => {
    const matchSearch = !search || n.title.includes(search) || (n.summary || '').includes(search)
    const matchCat = cat === 'all' || n.category === cat
    return matchSearch && matchCat
  }), [allNews, search, cat])

  return (
    <div>
      <PageBanner title="الأخبار والأحداث" subtitle="آخر المستجدات والفعاليات المدرسية" icon={<Newspaper size={36} />} />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن خبر..." className="w-full pr-11 pl-4 py-3 rounded-2xl border border-gray-200 text-sm focus:border-emerald-400 outline-none" />
            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all ${cat === c ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Tag size={12} className="inline ml-1" />{c === 'all' ? 'الكل' : c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={56} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">لا توجد نتائج</h3>
            <p className="text-sm text-gray-400">جرّب البحث بكلمات أخرى</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filtered.map((n: any, idx: number) => (
              <article key={n.id} className={`rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all bg-white group ${idx === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                <div className={`relative overflow-hidden ${idx === 0 ? 'h-60' : 'h-48'}`}>
                  {n.image_url && (
                    <img src={n.image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/800x400/064e3b/fff?text=خبر' }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
                    {n.category && <span className="text-[9px] bg-amber-500/90 text-white px-2 py-0.5 rounded-md font-black">{n.category}</span>}
                    <span className="text-[9px] bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Calendar size={9} />{new Date(n.publish_date).toLocaleDateString('ar-OM')}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-gray-800 mb-2 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">{n.title}</h3>
                  {n.summary && <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{n.summary}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
