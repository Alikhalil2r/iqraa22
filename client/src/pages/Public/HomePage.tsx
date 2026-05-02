import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Target, Award, Heart, Lightbulb, Rocket, Play, Pause,
  ChevronLeft, ChevronRight, MessageCircle, Star, Briefcase, Video,
  Users, X
} from 'lucide-react'

const DEFAULT_SLIDES = [
  { image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1600&q=90', title: 'بيئة تعليمية محفزة ومتطورة', subtitle: 'مرافق حديثة ومختبرات مجهزة وكادر تدريسي من الطراز الأول', cta: 'اكتشف المزيد' },
  { image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=90', title: 'نصنع قادة المستقبل', subtitle: 'من الصف الأول وحتى الثاني عشر، نبني الشخصية القيادية', cta: 'تعرف على رؤيتنا' },
  { image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=90', title: 'أنشطة لاصفية متنوعة', subtitle: 'نادي الروبوت، المسرح، الرياضة، الفنون... وأكثر', cta: 'شاهد مشاركاتنا' },
]

const DEFAULT_TESTIMONIALS = [
  { id: 1, text: 'مدرسة متميزة، لاحظت فرقاً كبيراً في شخصية ابنتي.', name: 'أم خديجة', relation: 'ولية أمر', rating: 5, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80' },
  { id: 2, text: 'الاهتمام بالجانب القيمي يوازي الاهتمام بالأكاديمي.', name: 'أبو سلطان', relation: 'ولي أمر', rating: 5, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80' },
  { id: 3, text: 'الكادر التدريسي متعاون والتواصل سهل وسلس.', name: 'أم يوسف', relation: 'ولية أمر', rating: 5, image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80' },
]

const DEFAULT_VIDEOS = [
  { id: 1, title: 'فعاليات اليوم المفتوح 2025', url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', category: 'فعاليات', desc: 'جولة شاملة في فعاليات اليوم المفتوح' },
  { id: 2, title: 'مسابقة الروبوت التعليمية', url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', category: 'مسابقات', desc: 'تغطية مشاركة فريق المدرسة' },
  { id: 3, title: 'حفل تكريم المتفوقين', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', category: 'حفلات', desc: 'حفل تكريم الطلاب المتميزين أكاديمياً' },
]

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start || !target) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, start, duration])
  return count
}

function AnimatedStat({ icon, num, label, color, suffix = '+', delay = 0 }: any) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  const count = useCountUp(parseInt(num) || 0, 2000, visible)
  return (
    <div ref={ref} className="text-center group cursor-default" style={{ animation: visible ? `fadeUp .6s ${delay}s both` : 'none' }}>
      <div className={`${color} mb-2 flex justify-center group-hover:scale-110 transition-transform duration-300`}>{icon}</div>
      <p className="text-2xl md:text-3xl font-black text-gray-900">
        <span>{count}</span><span className="text-amber-500">{suffix}</span>
      </p>
      <p className="text-xs font-bold text-gray-400">{label}</p>
    </div>
  )
}

function HeroSlider({ slides }: { slides: typeof DEFAULT_SLIDES }) {
  const [cur, setCur] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    setCur(idx)
    setProgress(0)
  }, [])

  useEffect(() => {
    if (paused) return
    progressRef.current = setInterval(() => setProgress(p => p < 100 ? p + 100 / 50 : 100), 100)
    intervalRef.current = setInterval(() => {
      setCur(c => (c + 1) % slides.length)
      setProgress(0)
    }, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [slides.length, paused])

  const slide = slides[cur]

  return (
    <div className="relative h-[480px] md:h-[600px] overflow-hidden group" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === cur ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <img src={s.image} alt="" className="w-full h-full object-cover animate-kenburns" style={{ animationPlayState: paused ? 'paused' : 'running' }} />
          <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent" />
        </div>
      ))}
      <div className="absolute inset-0 z-20 flex items-center max-w-7xl mx-auto px-6">
        <div className="max-w-2xl text-right" style={{ animation: 'fadeUp .8s ease' }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-amber-500 text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-xl">{cur + 1} / {slides.length}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">{slide.title}</h2>
          <p className="text-lg text-white/80 leading-relaxed mb-8">{slide.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/about" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-xl hover:scale-105">{slide.cta}</Link>
            <Link to="/parent-login" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-3.5 rounded-2xl font-bold transition-all border border-white/20">بوابة الأولياء</Link>
          </div>
        </div>
      </div>
      <button onClick={() => setPaused(p => !p)} className="absolute top-6 right-6 z-30 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-black/50 transition">
        {paused ? <Play size={16} fill="white" /> : <Pause size={16} />}
      </button>
      <button onClick={() => goTo((cur - 1 + slides.length) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition opacity-0 group-hover:opacity-100">
        <ChevronRight size={20} />
      </button>
      <button onClick={() => goTo((cur + 1) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition opacity-0 group-hover:opacity-100">
        <ChevronLeft size={20} />
      </button>
      <div className="absolute bottom-6 right-0 left-0 z-30 flex justify-center gap-2 px-6">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className="flex-1 max-w-[80px] h-1 rounded-full overflow-hidden bg-white/20 cursor-pointer">
            <div className={`h-full rounded-full transition-all ${i === cur ? 'bg-amber-500' : i < cur ? 'bg-white/60' : 'bg-transparent'}`}
              style={i === cur ? { width: `${progress}%` } : { width: i < cur ? '100%' : '0%' }} />
          </button>
        ))}
      </div>
    </div>
  )
}

function TestimonialsCarousel({ testimonials }: { testimonials: typeof DEFAULT_TESTIMONIALS }) {
  const [cur, setCur] = useState(0)
  const items = testimonials
  useEffect(() => {
    const iv = setInterval(() => setCur(p => (p + 1) % items.length), 5000)
    return () => clearInterval(iv)
  }, [items.length])
  const t = items[cur]
  return (
    <section className="py-16 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl mb-3">
            <MessageCircle size={16} className="text-amber-400" />
            <span className="text-amber-300 text-xs font-black">آراء أولياء الأمور</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">ماذا يقول <span className="text-amber-400">أولياء الأمور</span> عنّا</h2>
        </div>
        <div key={cur} className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-white/10 text-center animate-fadeUp">
          <div className="text-6xl text-amber-400/30 font-serif leading-none mb-4">"</div>
          <p className="text-white text-lg md:text-xl leading-relaxed font-bold max-w-2xl mx-auto mb-6">{t.text}</p>
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < t.rating ? '#fbbf24' : 'transparent'} className={i < t.rating ? 'text-amber-400' : 'text-white/20'} />)}
          </div>
          <div className="flex items-center justify-center gap-3">
            <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/50" onError={e => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&size=100&background=065f46&color=fbbf24` }} />
            <div className="text-right">
              <p className="text-white font-bold text-sm">{t.name}</p>
              <p className="text-emerald-300 text-[11px]">{t.relation}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {items.map((_, i) => (
            <button key={i} onClick={() => setCur(i)} className={`h-2 rounded-full transition-all ${i === cur ? 'w-8 bg-amber-400' : 'w-2 bg-white/30 hover:bg-white/50'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeVideos({ videos }: { videos: typeof DEFAULT_VIDEOS }) {
  const [activeVideo, setActiveVideo] = useState<any>(null)
  const getYtId = (url: string) => { const m = url?.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*)/); return m ? m[1] : null }
  const featured = videos[0]
  const rest = videos.slice(1)
  const featuredYtId = featured ? getYtId(featured.url) : null

  return (
    <section className="py-20 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center"><Play size={14} fill="white" className="text-white" /></div>
              <span className="text-red-400 font-black text-[10px] tracking-[0.25em] uppercase">المكتبة المرئية</span>
            </div>
            <h2 className="text-3xl font-black text-white">شاهد <span className="text-red-400">فعالياتنا</span> وأنشطتنا</h2>
            <p className="text-gray-500 text-sm mt-2">لحظات مميزة من حياتنا المدرسية</p>
          </div>
          <Link to="/videos" className="text-red-400 font-bold text-sm hover:text-red-300 flex items-center gap-1 bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10">
            عرض الكل <ChevronLeft size={14} />
          </Link>
        </div>
        {activeVideo && (() => {
          const ytId = getYtId(activeVideo.url)
          return ytId ? (
            <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
              <div className="relative pb-[56.25%] bg-black">
                <iframe src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
              <div className="bg-gray-900/80 backdrop-blur-sm p-4 flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">{activeVideo.title}</h4>
                <button onClick={() => setActiveVideo(null)} className="text-xs text-red-400 hover:text-red-300 bg-white/5 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold"><X size={12} /> إغلاق</button>
              </div>
            </div>
          ) : null
        })()}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {featured && (
            <div className="lg:col-span-3 group cursor-pointer" onClick={() => setActiveVideo(featured)}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
                {featuredYtId ? (
                  <div className="relative h-64 md:h-80 overflow-hidden">
                    <img src={`https://img.youtube.com/vi/${featuredYtId}/maxresdefault.jpg`} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={e => { (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${featuredYtId}/hqdefault.jpg` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-red-600/90 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300 ring-4 ring-white/20">
                        <Play size={30} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 left-0 p-6">
                      {featured.category && <span className="text-[9px] bg-red-600 text-white px-2.5 py-0.5 rounded-md font-black">{featured.category}</span>}
                      <h3 className="text-xl font-black text-white leading-snug mt-2">{featured.title}</h3>
                    </div>
                  </div>
                ) : <div className="h-80 bg-gray-800 flex items-center justify-center"><Video size={48} className="text-gray-600" /></div>}
              </div>
            </div>
          )}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {rest.map((v, idx) => {
              const ytId = getYtId(v.url)
              return (
                <div key={v.id} className="group cursor-pointer flex gap-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl p-2.5 transition-all border border-white/5 hover:border-white/10" onClick={() => setActiveVideo(v)}>
                  <div className="relative w-36 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                    {ytId ? (<>
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-9 h-9 bg-red-600/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <Play size={14} fill="white" className="text-white" />
                        </div>
                      </div>
                    </>) : <div className="w-full h-full bg-gray-800 flex items-center justify-center"><Video size={18} className="text-gray-600" /></div>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-sm text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">{v.title}</h4>
                    {v.category && <span className="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-bold mt-1.5 inline-block">{v.category}</span>}
                  </div>
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 text-xs font-black self-center">{idx + 2}</div>
                </div>
              )
            })}
            <Link to="/videos" className="mt-auto bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all group">
              <Video size={15} /> شاهد المكتبة الكاملة <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { theme } = useTheme()
  const { data: schoolData } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const { data: newsData } = useQuery({ queryKey: ['public-news'], queryFn: () => publicApi.news().then(r => r.data) })

  const school = schoolData?.school
  const featuredNews = (newsData?.news || []).slice(0, 3)

  return (
    <div>
      <HeroSlider slides={DEFAULT_SLIDES} />

      {/* Animated Stats */}
      <div className="relative z-30 -mt-14 mx-4 md:mx-auto max-w-5xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatedStat icon={<GraduationCap size={26} />} num="10" label="سنوات من التميز" color="text-emerald-600" delay={0} />
          <AnimatedStat icon={<Target size={26} />} num="98" label="نسبة النجاح" color="text-sky-600" suffix="%" delay={0.15} />
          <AnimatedStat icon={<Award size={26} />} num="50" label="جائزة ومشاركة" color="text-amber-600" delay={0.3} />
          <AnimatedStat icon={<Heart size={26} />} num="95" label="رضا أولياء الأمور" color="text-rose-600" suffix="%" delay={0.45} />
        </div>
      </div>

      {/* Welcome Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-amber-600 font-black text-xs tracking-[0.2em] uppercase mb-3 block">مرحباً بكم</span>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-5 text-gray-900">
                نبني <span className="text-emerald-600">أجيالاً</span> قادرة على <span className="text-amber-600">صناعة المستقبل</span>
              </h2>
              <p className="text-base leading-[1.9] mb-6 text-gray-600">
                {school?.aboutText
                  ? school.aboutText.substring(0, 200) + '...'
                  : 'في مدرستنا، نؤمن بأن التعليم رحلة بناء متكاملة للعقل والروح والشخصية. نمزج بين عراقة القيم الإسلامية وحداثة المناهج العالمية لنصنع جيلاً متميزاً.'}
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link to="/about" className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg">تعرف علينا</Link>
                <Link to="/contact" className="px-6 py-3 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-600 hover:border-amber-500 transition-all">تواصل معنا</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Lightbulb size={24} />, title: 'تفكير إبداعي', desc: 'تنمية مهارات الابتكار', bg: 'bg-emerald-50' },
                { icon: <Target size={24} />, title: 'تميز أكاديمي', desc: 'نتائج متقدمة وطنياً', bg: 'bg-amber-50' },
                { icon: <Heart size={24} />, title: 'قيم أصيلة', desc: 'تربية على الهوية العُمانية', bg: 'bg-rose-50' },
                { icon: <Rocket size={24} />, title: 'تقنية حديثة', desc: 'مختبرات ذكية ورقمية', bg: 'bg-sky-50' },
              ].map((c, i) => (
                <div key={i} className={`${c.bg} p-5 rounded-2xl hover:-translate-y-1 transition-all group`}>
                  <div className="text-emerald-600 mb-3 group-hover:scale-110 transition-transform">{c.icon}</div>
                  <h4 className="font-bold text-sm mb-1 text-gray-800">{c.title}</h4>
                  <p className="text-[11px] text-gray-500">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      {featuredNews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-amber-600 font-black text-[10px] tracking-[0.2em] uppercase">آخر المستجدات</span>
                <h2 className="text-2xl font-black mt-1 text-gray-900">أحدث الأخبار</h2>
              </div>
              <Link to="/news" className="text-emerald-600 font-bold text-sm hover:underline flex items-center gap-1">عرض الكل <ChevronLeft size={14} /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredNews.map((n: any) => (
                <div key={n.id} className="rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 bg-white group">
                  <div className="h-52 overflow-hidden relative">
                    {n.image_url && <img src={n.image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/800x400/064e3b/fff?text=خبر' }} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-3 right-3 text-white text-[10px] font-bold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                      {new Date(n.publish_date).toLocaleDateString('ar-OM')}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold mb-2 line-clamp-2 text-gray-800">{n.title}</h3>
                    {n.summary && <p className="text-sm leading-relaxed line-clamp-2 text-gray-500">{n.summary}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <HomeVideos videos={DEFAULT_VIDEOS} />
      <TestimonialsCarousel testimonials={DEFAULT_TESTIMONIALS} />

      {/* CTA */}
      <section className="py-16 bg-gradient-to-l from-amber-500 to-amber-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-black text-gray-900 mb-3">انضم إلى عائلتنا</h2>
          <p className="text-gray-800/80 mb-8 max-w-xl mx-auto">نرحب بالكوادر التعليمية المتميزة. اكتشف الوظائف الشاغرة وقدّم طلبك الآن.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/jobs" className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
              <Briefcase size={16} /> الوظائف الشاغرة
            </Link>
            <Link to="/contact" className="bg-white/30 text-gray-900 px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-white/50 transition-all border border-gray-900/20">تواصل معنا</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
