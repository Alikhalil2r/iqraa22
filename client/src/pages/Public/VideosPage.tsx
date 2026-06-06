import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Video, Play, X } from 'lucide-react'
import { DEMO_VIDEOS, withDemoFallback } from '../../data/demoPublicFallback'
import { usePublicSchool } from '../../context/PublicSchoolContext'

function PageBanner({ title, subtitle, icon, gradient = 'from-red-800 to-red-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

function getYouTubeId(url: string) {
  const m = url?.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*)/)
  return m ? m[1] : null
}

export default function VideosPage() {
  const { slug, query: schoolQuery } = usePublicSchool()
  const { data, isLoading } = useQuery({ queryKey: ['public-videos', slug], queryFn: () => publicApi.videos(schoolQuery).then(r => r.data) })
  const videos = withDemoFallback(data?.videos, DEMO_VIDEOS).map((v: any) => ({
    id: v.id,
    title: v.title,
    url: v.video_url,
    category: v.category,
    desc: v.description,
  }))
  const [playing, setPlaying] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const categories = useMemo<string[]>(() => ['all', ...new Set(videos.map((v: any) => v.category).filter(Boolean) as string[])], [videos])
  const filtered = filter === 'all' ? videos : videos.filter((v: any) => v.category === filter)
  const playingVideo = playing !== null ? videos.find((v: any) => v.id === playing) : null

  return (
    <div>
      <PageBanner title="المكتبة المرئية" subtitle="شاهد فعالياتنا وأنشطتنا المتنوعة" icon={<Video size={36} />} gradient="from-red-800 to-red-900" />
      <div className="max-w-6xl mx-auto px-4 py-14">
        {isLoading ? (
          <p className="text-center text-gray-500">جاري التحميل...</p>
        ) : videos.length === 0 ? (
          <p className="text-center text-gray-500 py-12">لا توجد فيديوهات حالياً</p>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map(c => (
                <button key={c} onClick={() => setFilter(c)} className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === c ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c === 'all' ? '🎬 الكل' : c}
                </button>
              ))}
            </div>

            {playing !== null && playingVideo && (() => {
              const ytId = getYouTubeId(playingVideo.url)
              return ytId ? (
                <div className="mb-10">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black">
                    <div className="relative pb-[56.25%]">
                      <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`} className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-xl font-black text-gray-800">{playingVideo.title}</h3>
                      {playingVideo.desc && <p className="text-sm text-gray-500 mt-1">{playingVideo.desc}</p>}
                      {playingVideo.category && <span className="inline-block mt-2 text-[10px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-lg font-black">{playingVideo.category}</span>}
                    </div>
                    <button onClick={() => setPlaying(null)} className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition">
                      <X size={14} /> إغلاق المشغل
                    </button>
                  </div>
                </div>
              ) : null
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((v: any) => {
                const ytId = getYouTubeId(v.url)
                const isPlaying = playing === v.id
                return (
                  <div key={v.id} className={`rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 bg-white group cursor-pointer ${isPlaying ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                    onClick={() => { setPlaying(v.id); window.scrollTo({ top: 200, behavior: 'smooth' }) }}>
                    <div className="relative">
                      {ytId ? (
                        <div className="relative h-48 overflow-hidden">
                          <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="w-16 h-16 bg-red-600/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-red-600 transition-all">
                              <Play size={24} fill="white" className="text-white mr-[-2px]" />
                            </div>
                          </div>
                          {v.category && <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[9px] px-2.5 py-1 rounded-lg font-bold">{v.category}</div>}
                          <div className="absolute bottom-2 left-2 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1"><Play size={8} /> YouTube</div>
                        </div>
                      ) : (
                        <div className="h-48 bg-gray-200 flex items-center justify-center"><Video size={36} className="text-gray-400" /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className={`font-bold text-sm transition-colors ${isPlaying ? 'text-red-700' : 'text-gray-800 group-hover:text-red-700'}`}>{v.title}</h3>
                      {v.desc && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.desc}</p>}
                      {isPlaying && (
                        <span className="text-[10px] text-red-600 font-bold mt-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> قيد التشغيل
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
