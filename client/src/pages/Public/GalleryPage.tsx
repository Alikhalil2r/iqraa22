import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useLanguage } from '../../context/LanguageContext'
import { useLocalize } from '../../hooks/useLocalize'
import PublicPageBanner from '../../components/PublicPageBanner'
import { Image, X, Grid, List, ChevronLeft, ChevronRight, ZoomIn, Tag } from 'lucide-react'
import { DEMO_GALLERY, withDemoFallback } from '../../data/demoPublicFallback'

const SAMPLE_GALLERY = DEMO_GALLERY.map(g => ({ id: g.id, src: g.image_url, caption: g.title, category: g.category }))

const CAT_COLORS: Record<string, string> = {
  'فعاليات': '#6366f1', 'أكاديمي': '#0ea5e9', 'رياضة': '#f97316',
  'علوم': '#10b981', 'مناسبات': '#ec4899', 'رحلات': '#f59e0b', 'فنون': '#8b5cf6',
}

export default function GalleryPage() {
  const { t } = useLanguage()
  const { pick, category, dirClass } = useLocalize()
  const { data: apiData } = useQuery({ queryKey: ['public-gallery'], queryFn: () => publicApi.gallery().then(r => r.data) })
  const [filter,   setFilter]   = useState('all')
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [layout,   setLayout]   = useState<'masonry'|'grid'>('masonry')

  const allGallery = useMemo(
    () => withDemoFallback(apiData?.gallery, DEMO_GALLERY).map((g: any) => ({
      id: g.id, src: g.image_url || '', caption: pick(g.title, g.title_en, g.caption || ''), category: category(g.category, g.category_en) || 'عام',
    })),
    [apiData, pick, category]
  )

  const categories = useMemo(() => ['all', ...Array.from(new Set(allGallery.map((g: any) => g.category as string).filter(Boolean)))], [allGallery])
  const filtered   = useMemo(() => filter === 'all' ? allGallery : allGallery.filter((g: any) => g.category === filter), [allGallery, filter])

  const lbIdx  = lightbox !== null ? filtered.findIndex((g: any) => g.id === lightbox) : -1
  const lbItem = lbIdx >= 0 ? filtered[lbIdx] : null

  const goNext = (e: React.MouseEvent) => { e.stopPropagation(); if (lbIdx < filtered.length - 1) setLightbox(filtered[lbIdx + 1].id) }
  const goPrev = (e: React.MouseEvent) => { e.stopPropagation(); if (lbIdx > 0)                   setLightbox(filtered[lbIdx - 1].id) }

  // Keyboard nav for lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox === null) return
      if (e.key === 'ArrowLeft')  { if (lbIdx > 0) setLightbox(filtered[lbIdx - 1].id) }
      if (e.key === 'ArrowRight') { if (lbIdx < filtered.length - 1) setLightbox(filtered[lbIdx + 1].id) }
      if (e.key === 'Escape')     setLightbox(null)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightbox, lbIdx, filtered])

  return (
    <div className={dirClass}>
      <PublicPageBanner title={t('site.page.gallery.title')} subtitle={t('site.page.gallery.subtitle')} icon={<Image size={40} />} gradient="from-purple-800 to-purple-900" />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2 flex-1">
            <button onClick={() => setFilter('all')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Grid size={13} /> الكل ({allGallery.length})
            </button>
            {(categories as string[]).filter(c => c !== 'all').map((c: string) => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filter === c ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={filter === c ? { background: CAT_COLORS[c] || '#6366f1' } : {}}>
                <Tag size={11} />{c} ({allGallery.filter((g: any) => g.category === c).length})
              </button>
            ))}
          </div>
          {/* Layout toggle */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-shrink-0">
            {([['masonry','شلال'],['grid','شبكة']] as const).map(([v,l]) => (
              <button key={v} onClick={() => setLayout(v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${layout===v?'bg-white shadow text-gray-700':'text-gray-400'}`}>
                {v==='masonry'?<List size={13}/>:<Grid size={13}/>}{l}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Image size={56} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-xl font-bold text-gray-500">لا توجد صور في هذا التصنيف</h3>
          </div>
        ) : layout === 'masonry' ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map((item: any) => (
              <div key={item.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1"
                onClick={() => setLightbox(item.id)}>
                <img src={item.src} alt={item.caption} loading="lazy"
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x300/6d28d9/fff?text=صورة' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 right-0 left-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  {item.caption && <p className="text-white font-bold text-xs leading-tight">{item.caption}</p>}
                  {item.category && (
                    <span className="inline-block mt-1 text-[9px] text-white px-2 py-0.5 rounded-md font-black"
                      style={{ background: CAT_COLORS[item.category] || '#6366f1' }}>{item.category}</span>
                  )}
                </div>
                <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <ZoomIn size={14} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item: any) => (
              <div key={item.id} className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1 aspect-square"
                onClick={() => setLightbox(item.id)}>
                <img src={item.src} alt={item.caption} loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x400/6d28d9/fff?text=صورة' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 right-3 left-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  {item.caption && <p className="text-white font-bold text-xs line-clamp-2">{item.caption}</p>}
                </div>
                <div className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 text-white">
                  <ZoomIn size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && lbItem && (
        <div className="fixed inset-0 z-[2000] bg-black/96 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold">
            {lbIdx + 1} / {filtered.length}
          </div>
          {/* Close */}
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition">
            <X size={20} />
          </button>

          <div className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={lbItem.src} alt={lbItem.caption}
              className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl" />
            {(lbItem.caption || lbItem.category) && (
              <div className="absolute bottom-0 right-0 left-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                {lbItem.caption && <p className="text-white font-bold text-sm">{lbItem.caption}</p>}
                {lbItem.category && (
                  <span className="inline-block mt-1 text-[10px] text-white px-2 py-0.5 rounded-md font-black"
                    style={{ background: CAT_COLORS[lbItem.category] || '#6366f1' }}>{lbItem.category}</span>
                )}
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
