import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Image, Search, X, Grid, ChevronLeft, ChevronRight } from 'lucide-react'

function PageBanner({ title, subtitle, icon, gradient = 'from-emerald-800 to-emerald-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const SAMPLE_GALLERY = [
  { id: 1, src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', caption: 'حفل افتتاح العام الدراسي', category: 'فعاليات' },
  { id: 2, src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80', caption: 'أنشطة التعلم التفاعلي', category: 'أكاديمي' },
  { id: 3, src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80', caption: 'بطولة كرة القدم الداخلية', category: 'رياضة' },
  { id: 4, src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', caption: 'مختبر العلوم والأبحاث', category: 'أكاديمي' },
  { id: 5, src: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&q=80', caption: 'يوم المهنة والتوجيه', category: 'فعاليات' },
  { id: 6, src: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80', caption: 'تدريبات فريق كرة القدم', category: 'رياضة' },
  { id: 7, src: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', caption: 'المعرض العلمي السنوي', category: 'علوم' },
  { id: 8, src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', caption: 'حفل تكريم المعلمين', category: 'مناسبات' },
  { id: 9, src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80', caption: 'رحلة إلى منتزه سمائل', category: 'رحلات' },
  { id: 10, src: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&q=80', caption: 'معرض الفنون التشكيلية', category: 'فنون' },
  { id: 11, src: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', caption: 'زيارة الوالي للمدرسة', category: 'مناسبات' },
  { id: 12, src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', caption: 'مسابقة الروبوت', category: 'علوم' },
]

export default function GalleryPage() {
  const { data: apiData } = useQuery({ queryKey: ['public-gallery'], queryFn: () => publicApi.gallery().then(r => r.data) })
  const [filter, setFilter] = useState('all')
  const [lightbox, setLightbox] = useState<number | null>(null)

  const allGallery = (apiData?.gallery?.length > 0
    ? apiData.gallery.map((g: any) => ({ id: g.id, src: g.image_url || g.src || '', caption: g.caption || '', category: g.category || 'عام' }))
    : SAMPLE_GALLERY)

  const categories = useMemo(() => ['all', ...new Set(allGallery.map((g: any) => g.category).filter(Boolean))], [allGallery])
  const filtered = filter === 'all' ? allGallery : allGallery.filter((g: any) => g.category === filter)

  const lbIdx = lightbox !== null ? filtered.findIndex((g: any) => g.id === lightbox) : -1
  const lbItem = lbIdx >= 0 ? filtered[lbIdx] : null

  const goNext = (e: React.MouseEvent) => { e.stopPropagation(); if (lbIdx < filtered.length - 1) setLightbox(filtered[lbIdx + 1].id) }
  const goPrev = (e: React.MouseEvent) => { e.stopPropagation(); if (lbIdx > 0) setLightbox(filtered[lbIdx - 1].id) }

  return (
    <div>
      <PageBanner title="معرض الصور" subtitle="لحظات مميزة من حياتنا المدرسية" icon={<Image size={36} />} gradient="from-purple-800 to-purple-900" />
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button onClick={() => setFilter('all')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Grid size={14} /> الكل ({allGallery.length})
          </button>
          {categories.filter(c => c !== 'all').map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === c ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c} ({allGallery.filter((g: any) => g.category === c).length})
            </button>
          ))}
        </div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((item: any) => (
            <div key={item.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1"
              onClick={() => setLightbox(item.id)}>
              <img src={item.src} alt={item.caption} className="w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x300/6d28d9/fff?text=صورة' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 right-0 left-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                {item.caption && <p className="text-white font-bold text-xs">{item.caption}</p>}
                {item.category && <span className="inline-block mt-1 text-[8px] bg-purple-500/80 text-white px-2 py-0.5 rounded-md font-black">{item.category}</span>}
              </div>
              <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <Search size={14} />
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Image size={56} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-500">لا توجد صور في هذا التصنيف</h3>
          </div>
        )}
      </div>

      {lightbox !== null && lbItem && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition"><X size={20} /></button>
          <div className="text-center text-white/40 text-xs absolute top-4 right-0 left-0">{lbIdx + 1} / {filtered.length}</div>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={lbItem.src} alt={lbItem.caption} className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl" />
            {lbItem.caption && (
              <div className="absolute bottom-0 right-0 left-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                <p className="text-white font-bold">{lbItem.caption}</p>
                {lbItem.category && <span className="text-purple-400 text-xs font-bold">{lbItem.category}</span>}
              </div>
            )}
          </div>
          {lbIdx > 0 && (
            <button onClick={goPrev} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition">
              <ChevronRight size={24} />
            </button>
          )}
          {lbIdx < filtered.length - 1 && (
            <button onClick={goNext} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition">
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
