import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useLanguage } from '../../context/LanguageContext'
import { useSchoolDisplay } from '../../hooks/useSchoolDisplay'
import { useLocalize } from '../../hooks/useLocalize'
import {
  GraduationCap, Target, Award, Heart, ChevronLeft, ChevronRight, Pause,
  Lightbulb, Rocket, Briefcase, Calendar, MapPin, Sparkles, Play, Globe, BookOpen,
  Newspaper, Star, Clock, ArrowUpLeft, Users, MessageCircle
} from 'lucide-react'
import { DEMO_NEWS, DEMO_GALLERY, withDemoFallback } from '../../data/demoPublicFallback'

const BASE = '/school'

const SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80',
]

function useHomeContent() {
  const { t } = useLanguage()

  const slideThemes = useMemo(() => [
    { badge: t('site.home.hero.badge1'), accent: 'from-emerald-400 to-teal-300', glow: 'bg-emerald-500/20', icon: <GraduationCap size={14} /> },
    { badge: t('site.home.hero.badge2'), accent: 'from-amber-300 to-orange-400', glow: 'bg-amber-500/25', icon: <Award size={14} /> },
    { badge: t('site.home.hero.badge3'), accent: 'from-sky-300 to-cyan-400', glow: 'bg-sky-500/20', icon: <Sparkles size={14} /> },
  ], [t])

  const defaultSlides = useMemo(() => [
    {
      image: SLIDE_IMAGES[0],
      title: '',
      subtitle: '',
      cta: t('site.home.hero.ctaAbout'),
      ctaTo: `${BASE}/about`,
      cta2: t('site.home.hero.ctaAdmission'),
      cta2To: `${BASE}/admission`,
    },
    {
      image: SLIDE_IMAGES[1],
      title: t('site.home.hero.slide2Title'),
      subtitle: t('site.home.hero.slide2Sub'),
      cta: t('site.nav.achievements'),
      ctaTo: `${BASE}/achievements`,
      cta2: t('site.nav.hallOfFame'),
      cta2To: `${BASE}/hall-of-fame`,
    },
    {
      image: SLIDE_IMAGES[2],
      title: t('site.home.hero.slide3Title'),
      subtitle: t('site.home.hero.slide3Sub'),
      cta: t('site.nav.gallery'),
      ctaTo: `${BASE}/gallery`,
      cta2: t('site.nav.videos'),
      cta2To: `${BASE}/videos`,
    },
  ], [t])

  const valueCards = useMemo(() => [
    { icon: Lightbulb, title: t('site.home.value.creative.title'), desc: t('site.home.value.creative.desc'), bg: 'from-emerald-50 via-white to-teal-50/80', iconBg: 'from-emerald-500 to-teal-500', accent: 'group-hover:border-emerald-300/60' },
    { icon: Target, title: t('site.home.value.academic.title'), desc: t('site.home.value.academic.desc'), bg: 'from-amber-50 via-white to-orange-50/80', iconBg: 'from-amber-500 to-orange-500', accent: 'group-hover:border-amber-300/60' },
    { icon: Heart, title: t('site.home.value.values.title'), desc: t('site.home.value.values.desc'), bg: 'from-rose-50 via-white to-pink-50/80', iconBg: 'from-rose-500 to-pink-500', accent: 'group-hover:border-rose-300/60' },
    { icon: Rocket, title: t('site.home.value.tech.title'), desc: t('site.home.value.tech.desc'), bg: 'from-sky-50 via-white to-cyan-50/80', iconBg: 'from-sky-500 to-cyan-500', accent: 'group-hover:border-sky-300/60' },
  ], [t])

  const welcomePills = useMemo(() => [
    { icon: <MapPin size={13} />, label: t('site.home.pill.location') },
    { icon: <Globe size={13} />, label: t('site.home.pill.curriculum') },
    { icon: <BookOpen size={13} />, label: t('site.home.pill.k12') },
  ], [t])

  const statConfig = useMemo(() => [
    { key: 'years' as const, icon: GraduationCap, label: t('site.home.stat.years'), fallback: '10', gradient: 'from-emerald-500 to-teal-500', ring: '#10b981' },
    { key: 'students' as const, icon: Target, label: t('site.home.stat.students'), fallback: '500', gradient: 'from-sky-500 to-blue-500', ring: '#0ea5e9' },
    { key: 'teachers' as const, icon: Award, label: t('site.home.stat.teachers'), fallback: '40', gradient: 'from-amber-500 to-orange-500', ring: '#f59e0b' },
    { key: 'classrooms' as const, icon: Heart, label: t('site.home.stat.classrooms'), fallback: '25', gradient: 'from-rose-500 to-pink-500', ring: '#f43f5e' },
  ], [t])

  const joinPerks = useMemo(() => [
    { icon: Briefcase, label: t('site.home.join.perk1.label'), desc: t('site.home.join.perk1.desc') },
    { icon: GraduationCap, label: t('site.home.join.perk2.label'), desc: t('site.home.join.perk2.desc') },
    { icon: Users, label: t('site.home.join.perk3.label'), desc: t('site.home.join.perk3.desc') },
  ], [t])

  return { slideThemes, defaultSlides, valueCards, welcomePills, statConfig, joinPerks, t }
}

const NEWS_CAT_COLORS: Record<string, string> = {
  أكاديمي: '#6366f1', إنجازات: '#10b981', أنشطة: '#8b5cf6', فعاليات: '#f97316',
  تخرج: '#ec4899', مرافق: '#0ea5e9', إداري: '#6366f1', رحلات: '#f97316', رياضي: '#f59e0b', أخرى: '#6b7280',
}

interface NewsItem {
  id: string | number
  title: string
  summary?: string
  image_url?: string
  publish_date: string
  category?: string
  is_featured?: boolean
}

interface Slide {
  image: string
  title: string
  subtitle: string
  cta: string
  ctaTo: string
  cta2?: string
  cta2To?: string
}

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

function AnimatedStat({ icon: Icon, num, label, gradient, ring, suffix = '+', delay = 0, locale = 'ar-OM' }: {
  icon: React.ElementType; num: string; label: string; gradient: string; ring: string; suffix?: string; delay?: number; locale?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  const parsed = parseInt(num)
  const isNum = !isNaN(parsed)
  const count = useCountUp(parsed || 0, 2200, visible)

  return (
    <div
      ref={ref}
      className="relative text-center group cursor-default px-2 py-3 md:py-1"
      style={{ animation: visible ? `fadeUp .7s ${delay}s cubic-bezier(.16,1,.3,1) both` : 'none' }}
    >
      <div className="relative mx-auto mb-3 w-[3.25rem] h-[3.25rem] md:w-14 md:h-14">
        <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity duration-500" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke={ring} strokeWidth="2" strokeOpacity="0.15" />
          <circle cx="28" cy="28" r="24" fill="none" stroke={ring} strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray="120" strokeDashoffset={visible ? 0 : 120}
            style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1)', transitionDelay: `${delay + 0.2}s` }} />
        </svg>
        <div className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
          <Icon size={22} strokeWidth={2.2} />
          <div className="absolute inset-0 rounded-2xl bg-white/25 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <p className="text-2xl md:text-[1.75rem] font-black text-gray-900 tabular-nums leading-none mb-1.5">
        {isNum ? (
          <>
            <span className="text-amber-500 text-lg md:text-xl align-top">{suffix}</span>
            <span>{count.toLocaleString(locale)}</span>
          </>
        ) : (
          <span>{num}</span>
        )}
      </p>
      <p className="text-[11px] md:text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">{label}</p>

      <div className={`mx-auto mt-2.5 h-0.5 w-0 group-hover:w-10 rounded-full bg-gradient-to-l ${gradient} transition-all duration-500`} />
    </div>
  )
}

function NewsHomeCard({ item, variant = 'default' }: { item: NewsItem; variant?: 'featured' | 'compact' | 'default' }) {
  const { t, lang } = useLanguage()
  const color = NEWS_CAT_COLORS[item.category || ''] || '#10b981'
  const dateStr = new Date(item.publish_date).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  if (variant === 'featured') {
    return (
      <Link to={`${BASE}/news/${item.id}`}
        className="group relative md:col-span-7 flex flex-col rounded-[1.75rem] overflow-hidden bg-white border border-gray-100/80 shadow-xl shadow-gray-200/60 hover:shadow-2xl hover:shadow-emerald-100/40 hover:-translate-y-1 transition-all duration-500">
        <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden">
          <img src={item.image_url || 'https://placehold.co/900x500/064e3b/fff?text=خبر'} alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 animate-news-img" loading="lazy"
            onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/900x500/064e3b/fff?text=خبر' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-emerald-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {item.is_featured && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/95 backdrop-blur-sm shadow-lg">
              <Star size={12} className="text-amber-900" fill="currentColor" />
              <span className="text-[10px] font-black text-amber-900">{t('site.home.featuredNews')}</span>
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 p-5 md:p-6">
            {item.category && (
              <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-lg text-white mb-3 shadow-md" style={{ background: color }}>
                {item.category}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-black text-white leading-snug mb-2 group-hover:text-emerald-100 transition-colors line-clamp-2">
              {item.title}
            </h3>
            {item.summary && (
              <p className="text-sm text-white/65 leading-relaxed line-clamp-2 max-w-xl">{item.summary}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-l from-gray-50 to-white border-t border-gray-100/80">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
            <Calendar size={12} className="text-emerald-500" />
            {dateStr}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-700 group-hover:gap-2.5 transition-all">
            {t('site.home.news.readMore')}
            <ChevronLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          </span>
        </div>
      </Link>
    )
  }

  const isCompact = variant === 'compact'
  return (
    <Link to={`${BASE}/news/${item.id}`}
      className={`group flex rounded-2xl overflow-hidden bg-white border border-gray-100/80 shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-emerald-100/30 hover:-translate-y-1 transition-all duration-500 ${isCompact ? 'flex-row' : 'flex-col'}`}>
      <div className={`relative overflow-hidden flex-shrink-0 ${isCompact ? 'w-36 sm:w-40' : 'h-48'}`}>
        <img src={item.image_url || 'https://placehold.co/600x400/064e3b/fff?text=خبر'} alt={item.title}
          className={`w-full object-cover group-hover:scale-110 transition-transform duration-700 ${isCompact ? 'h-full min-h-[7.5rem]' : 'h-full'}`}
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/600x400/064e3b/fff?text=خبر' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {item.category && (
          <span className="absolute bottom-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-md text-white shadow" style={{ background: color }}>
            {item.category}
          </span>
        )}
      </div>

      <div className={`flex flex-col flex-1 ${isCompact ? 'p-4 justify-center' : 'p-5'}`}>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 mb-2">
          <Clock size={10} className="text-amber-500" />
          {dateStr}
        </div>
        <h3 className={`font-black text-gray-800 leading-snug mb-1.5 group-hover:text-emerald-700 transition-colors ${isCompact ? 'text-sm line-clamp-2' : 'text-base line-clamp-2'}`}>
          {item.title}
        </h3>
        {item.summary && !isCompact && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{item.summary}</p>
        )}
        <span className={`inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 mt-auto ${isCompact ? '' : 'pt-1'}`}>
          {t('site.home.news.details')} <ArrowUpLeft size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
        </span>
      </div>
    </Link>
  )
}

function LatestNewsSection({ news }: { news: NewsItem[] }) {
  const { t, isRTL } = useLanguage()
  const NavChevron = isRTL ? ChevronLeft : ChevronRight
  const items = news.slice(0, 3)
  const [featured, ...rest] = items

  return (
    <section className="relative py-20 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 via-white to-gray-50 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-100/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 tracking-wide">{t('site.home.news.badge')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Newspaper size={26} className="text-emerald-600 hidden sm:block" />
              {t('site.home.news.title')}
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md">{t('site.home.news.sub')}</p>
          </div>
          <Link to={`${BASE}/news`}
            className="group inline-flex items-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-black shadow-lg hover:bg-emerald-800 hover:-translate-y-0.5 transition-all">
            {t('site.home.news.viewAll')}
            <NavChevron size={15} className={`transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="grid md:grid-cols-12 gap-5 md:gap-6">
            <NewsHomeCard item={featured} variant="featured" />
            <div className="md:col-span-5 flex flex-col gap-5">
              {rest.map(n => (
                <NewsHomeCard key={n.id} item={n} variant="compact" />
              ))}
              {rest.length === 0 && (
                <div className="flex-1 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center p-8 text-gray-400 text-sm">
                  {t('site.home.news.moreSoon')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 py-16 text-center">
            <Newspaper size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm font-medium">{t('site.home.news.empty')}</p>
            <Link to={`${BASE}/news`} className="inline-block mt-4 text-emerald-600 font-bold text-sm hover:underline">
              {t('site.home.news.visit')}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function JoinFamilyCTA({
  schoolName,
  joinPerks,
}: {
  schoolName: string
  joinPerks: { icon: React.ElementType; label: string; desc: string }[]
}) {
  const { t, isRTL } = useLanguage()
  const NavChevron = isRTL ? ChevronLeft : ChevronRight
  return (
    <section className="relative py-20 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative rounded-[2rem] md:rounded-[2.25rem] overflow-hidden shadow-2xl shadow-amber-900/20 border border-amber-200/30">
          {/* خلفية الصورة والتدرج */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80"
              alt=""
              className="w-full h-full object-cover scale-105"
              loading="lazy"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-emerald-950/92 via-emerald-900/88 to-amber-900/75" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(255,255,255,0.12),transparent_55%)]" />
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="relative grid lg:grid-cols-12 gap-8 lg:gap-10 p-8 md:p-10 lg:p-12 items-center">
            {/* المحتوى الرئيسي */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25">
                <Briefcase size={13} className="text-white" />
                <span className="text-[11px] font-black text-white/95">{t('site.home.join.badge')}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-[1.2] tracking-tight">
                {t('site.home.join.title')}{' '}
                <span className="relative inline-block text-amber-300">
                  {schoolName}
                  <span className="absolute -bottom-1 right-0 left-0 h-2.5 bg-amber-400/35 rounded-full -z-10" />
                </span>
              </h2>

              <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-xl font-medium">
                {t('site.home.join.sub')}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link to={`${BASE}/jobs`}
                  className="group relative inline-flex items-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white px-7 py-4 rounded-2xl font-black text-sm shadow-xl shadow-gray-900/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-l from-emerald-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Briefcase size={17} className="relative" />
                  <span className="relative">{t('site.home.join.jobs')}</span>
                  <NavChevron size={15} className={`relative transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </Link>
                <Link to={`${BASE}/contact`}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/35 hover:border-white/50 transition-all shadow-lg">
                  <MessageCircle size={16} />
                  {t('site.nav.contact')}
                </Link>
              </div>
            </div>

            {/* بطاقات المزايا */}
            <div className="lg:col-span-5 space-y-3">
              {joinPerks.map((perk, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white/12 hover:bg-white/20 backdrop-blur-xl border border-white/20 hover:border-white/35 transition-all duration-300 hover:-translate-x-1"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white/30 transition-all">
                    <perk.icon size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className="font-black text-sm text-white">{perk.label}</p>
                    <p className="text-[11px] text-white/70 font-medium mt-0.5">{perk.desc}</p>
                  </div>
                  <NavChevron size={14} className={`${isRTL ? 'mr-auto group-hover:-translate-x-0.5' : 'ml-auto group-hover:translate-x-0.5'} text-white/35 group-hover:text-white/70 transition-all flex-shrink-0`} />
                </div>
              ))}

              <div className="hidden sm:flex items-center justify-center gap-2 pt-2 text-[10px] font-bold text-white/45">
                <Sparkles size={11} className="text-amber-200" />
                <span>{t('site.home.demoNote')}</span>
              </div>
            </div>
          </div>

          {/* زخرفة سفلية */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-l from-emerald-600 via-white/50 to-amber-300" />
        </div>
      </div>
    </section>
  )
}

function StatsStrip({
  school,
  schoolName,
  location,
  statConfig,
  dateLocale,
}: {
  school?: { stats?: Record<string, string> }
  schoolName?: string
  location: string
  statConfig: { key: string; icon: React.ElementType; label: string; fallback: string; gradient: string; ring: string }[]
  dateLocale: string
}) {
  const { t } = useLanguage()
  const stats = school?.stats
  return (
    <div className="relative z-30 -mt-16 md:-mt-20 mx-3 sm:mx-4 md:mx-auto max-w-5xl">
      <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-l from-emerald-400/40 via-amber-400/50 to-orange-400/40 blur-xl opacity-70 animate-card-glow pointer-events-none" />

      <div className="relative rounded-[1.75rem] p-px bg-gradient-to-l from-emerald-400/80 via-amber-400 to-orange-400/80 shadow-2xl shadow-gray-900/15">
        <div className="rounded-[calc(1.75rem-1px)] bg-white/92 backdrop-blur-2xl border border-white/60 overflow-hidden">
          <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-gradient-to-l from-gray-50/90 to-white border-b border-gray-100/80">
            <span className="text-[10px] font-black text-emerald-700/80 tracking-wide flex items-center gap-1.5">
              <Sparkles size={11} className="text-amber-500" />
              {t('site.home.statsTitle')}
            </span>
            <span className="text-[10px] font-bold text-gray-400">{schoolName} · {location.split('·')[0]?.trim() || location}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-4 md:p-6 md:gap-0">
            {statConfig.map((cfg, i) => {
              const raw = stats?.[cfg.key]?.replace(/\D/g, '') || cfg.fallback
              return (
                <div key={cfg.key} className={`relative ${i < statConfig.length - 1 ? 'md:border-l md:border-gray-100/90' : ''}`}>
                  <AnimatedStat
                    icon={cfg.icon}
                    num={raw}
                    label={cfg.label}
                    gradient={cfg.gradient}
                    ring={cfg.ring}
                    delay={i * 0.12}
                    locale={dateLocale}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroSlider({ slides, slideThemes, isRTL, t }: {
  slides: Slide[]
  slideThemes: { badge: string; accent: string; glow: string; icon: React.ReactNode }[]
  isRTL: boolean
  t: (key: string) => string
}) {
  const [cur, setCur] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<number | null>(null)
  const DURATION = 7000

  const startProgress = useCallback(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)
      if (pct < 100) progressRef.current = requestAnimationFrame(tick)
      else setCur(p => (p + 1) % slides.length)
    }
    progressRef.current = requestAnimationFrame(tick)
  }, [slides.length])

  useEffect(() => {
    if (!paused && slides.length > 1) { setProgress(0); startProgress() }
    return () => { if (progressRef.current) cancelAnimationFrame(progressRef.current) }
  }, [cur, paused, startProgress, slides.length])

  const goTo = (i: number) => {
    if (progressRef.current) cancelAnimationFrame(progressRef.current)
    setProgress(0)
    setCur(i)
  }

  if (!slides.length) return null
  const slide = slides[cur]
  const theme = slideThemes[cur % slideThemes.length]
  const titleWords = slide.title.split(' ')
  const highlightStart = Math.max(0, titleWords.length - 3)
  const PrevChevron = isRTL ? ChevronRight : ChevronLeft
  const NextChevron = isRTL ? ChevronLeft : ChevronRight
  const CtaChevron = isRTL ? ChevronLeft : ChevronRight
  const ctaHover = isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'

  return (
    <div className="relative h-[520px] md:h-[620px] lg:h-[720px] bg-[#030712] overflow-hidden group"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>

      {/* خلفيات الصور */}
      {slides.map((s, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-[1.2s] ease-out ${i === cur ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <div className={`absolute inset-0 overflow-hidden ${i === cur ? 'animate-slide-zoom' : ''}`}>
            <img src={s.image} alt="" className="w-full h-full object-cover scale-105" loading={i < 2 ? 'eager' : 'lazy'}
              onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/1600x800/064e3b/ffffff?text=Al-Noor+School' }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-[#030712]/20" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#030712]/80 via-transparent to-[#030712]/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,transparent_0%,#030712_75%)]" />
        </div>
      ))}

      {/* عناصر زخرفية */}
      <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl ${theme.glow} animate-hero-orb pointer-events-none z-10`} />
      <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl animate-hero-orb pointer-events-none z-10" style={{ animationDelay: '2s' }} />
      <div className="absolute inset-0 z-10 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* محتوى السلايد */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-12 gap-6 items-center">
            <div key={cur} className="lg:col-span-7 xl:col-span-6 space-y-5 animate-hero-content">
              {/* بطاقة زجاجية */}
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-black/40 overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${theme.accent}`} />
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                <div className="animate-hero-badge flex flex-wrap items-center gap-2 mb-5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-black text-white/90`}>
                    {theme.icon}
                    {theme.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-[10px] font-bold text-emerald-300">
                    <MapPin size={10} /> {t('site.hero.muscat')}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-3xl md:text-4xl font-black bg-gradient-to-l ${theme.accent} bg-clip-text text-transparent tabular-nums`}>
                    {String(cur + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 h-px bg-white/10 animate-hero-line max-w-[80px]" />
                  <span className="text-white/30 text-xs font-bold">{String(slides.length).padStart(2, '0')}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-black text-white leading-[1.15] mb-4 tracking-tight">
                  {titleWords.map((word, wi) => (
                    <span key={wi} className={wi >= highlightStart ? `bg-gradient-to-l ${theme.accent} bg-clip-text text-transparent` : ''}>
                      {word}{wi < titleWords.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </h2>

                <p className="text-sm md:text-base text-white/55 leading-relaxed mb-6 max-w-lg font-medium">
                  {slide.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link to={slide.ctaTo}
                    className={`group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-sm text-gray-900 bg-gradient-to-l from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30 hover:shadow-amber-400/50 hover:-translate-y-0.5 transition-all overflow-hidden`}>
                    <span className="absolute inset-0 bg-gradient-to-l from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Play size={14} className="fill-gray-900 relative z-10" />
                    <span className="relative z-10">{slide.cta}</span>
                    <CtaChevron size={15} className={`relative z-10 transition-transform ${ctaHover}`} />
                  </Link>
                  {slide.cta2 && slide.cta2To && (
                    <Link to={slide.cta2To}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white/80 border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all">
                      {slide.cta2}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* مؤشرات جانبية — شاشات كبيرة */}
            {slides.length > 1 && (
              <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 justify-end">
                <div className="flex flex-col gap-2">
                  {slides.map((s, i) => (
                    <button key={i} type="button" onClick={() => goTo(i)}
                      className={`group flex items-center gap-3 p-2 rounded-2xl transition-all duration-300 text-start ${
                        i === cur ? 'bg-white/10 border border-white/15 scale-105' : 'opacity-50 hover:opacity-90 hover:bg-white/5 border border-transparent'
                      }`}>
                      <div className="w-16 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                        <img src={s.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] font-black truncate max-w-[140px] ${i === cur ? 'text-white' : 'text-white/50'}`}>
                          {s.title.slice(0, 28)}{s.title.length > 28 ? '…' : ''}
                        </p>
                        {i === cur && (
                          <div className="mt-1.5 h-0.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-gradient-to-l from-amber-400 to-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-black tabular-nums ${i === cur ? 'text-amber-400' : 'text-white/25'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* أسهم التنقل */}
      {slides.length > 1 && (
        <>
          <button type="button" onClick={() => goTo((cur - 1 + slides.length) % slides.length)}
            className={`absolute ${isRTL ? 'right-4 md:right-6' : 'left-4 md:left-6'} top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 bg-white/8 backdrop-blur-xl border border-white/15 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/15 hover:scale-110 shadow-xl`}>
            <PrevChevron size={20} />
          </button>
          <button type="button" onClick={() => goTo((cur + 1) % slides.length)}
            className={`absolute ${isRTL ? 'left-4 md:left-6' : 'right-4 md:right-6'} top-1/2 -translate-y-1/2 z-30 w-11 h-11 md:w-12 md:h-12 bg-white/8 backdrop-blur-xl border border-white/15 text-white rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/15 hover:scale-110 shadow-xl`}>
            <NextChevron size={20} />
          </button>

          {/* شريط التقدم — جوال */}
          <div className="absolute bottom-0 inset-x-0 z-30 lg:hidden">
            <div className="flex gap-1.5 px-4 pb-5 max-w-7xl mx-auto">
              {slides.map((_, i) => (
                <button key={i} type="button" onClick={() => goTo(i)} className="flex-1 h-1 rounded-full overflow-hidden bg-white/15">
                  <div className={`h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-500 transition-all ${i === cur ? '' : i < cur ? 'opacity-60' : 'opacity-0'}`}
                    style={{ width: i === cur ? `${progress}%` : i < cur ? '100%' : '0%' }} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {paused && slides.length > 1 && (
        <div className="absolute top-20 left-4 z-30 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 text-white/60 text-[10px] px-3 py-1.5 rounded-full font-bold">
          <Pause size={10} /> {t('site.home.sliderPaused')}
        </div>
      )}

      {/* موجة سفلية */}
      <div className="absolute bottom-0 inset-x-0 z-20 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  )
}

export default function SchoolHomePage() {
  const { isRTL } = useLanguage()
  const { pick, lang, localizeNews, dirClass, dateLocale } = useLocalize()
  const { schoolName, location } = useSchoolDisplay()
  const { slideThemes, defaultSlides, valueCards, welcomePills, statConfig, joinPerks, t } = useHomeContent()

  const { data: schoolData } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const { data: newsData } = useQuery({ queryKey: ['public-news'], queryFn: () => publicApi.news().then(r => r.data) })
  const { data: galleryData } = useQuery({ queryKey: ['public-gallery'], queryFn: () => publicApi.gallery().then(r => r.data) })

  const school = schoolData?.school
  const news = useMemo(
    () => withDemoFallback(newsData?.news, DEMO_NEWS).map((n: NewsItem) => localizeNews(n as NewsItem & Record<string, unknown>)),
    [newsData, localizeNews]
  )
  const gallery = withDemoFallback(galleryData?.gallery, DEMO_GALLERY)
  const NavChevron = isRTL ? ChevronLeft : ChevronRight
  const aboutLocalized = pick(school?.aboutText, school?.aboutTextEn, t('site.home.welcomeFallback'))

  useEffect(() => {
    document.title = `${schoolName} — ${t('site.home.pageTitle')}`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', aboutLocalized?.slice(0, 160) || `${schoolName} — ${t('site.home.metaDesc')}`)
  }, [schoolName, aboutLocalized, t])

  const slides = useMemo<Slide[]>(() => {
    const images: string[] = []
    if (school?.heroImage) images.push(school.heroImage)
    gallery.slice(0, 4).forEach((g: { image_url?: string }) => { if (g.image_url) images.push(g.image_url) })
    defaultSlides.forEach(s => images.push(s.image))

    const unique = [...new Set(images)].slice(0, 5)
    const tagline = aboutLocalized?.slice(0, 120) || defaultSlides[0].subtitle || t('site.home.welcomeFallback')

    return unique.map((image, i) => {
      const def = defaultSlides[i % defaultSlides.length]
      return {
        image,
        title: i === 0 ? schoolName : def.title,
        subtitle: i === 0 ? tagline : def.subtitle,
        cta: def.cta,
        ctaTo: def.ctaTo,
        cta2: def.cta2,
        cta2To: def.cta2To,
      }
    })
  }, [school, gallery, schoolName, defaultSlides, t, aboutLocalized, lang])

  const welcomeText = aboutLocalized
  const gradWelcome = isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'
  const gradTitle = isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'

  return (
    <div className={dirClass}>
      <HeroSlider slides={slides} slideThemes={slideThemes} isRTL={isRTL} t={t} />

      <StatsStrip school={school} schoolName={schoolName} location={location} statConfig={statConfig} dateLocale={dateLocale} />

      <section className="relative py-24 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-emerald-50/40 to-white pointer-events-none" />
        <div className="absolute top-16 -right-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl animate-card-glow pointer-events-none" />
        <div className="absolute bottom-10 -left-16 w-64 h-64 bg-emerald-200/35 rounded-full blur-3xl animate-card-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #d1fae5 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* النص الترحيبي */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-6 text-start">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${gradWelcome} from-amber-50 to-orange-50 border border-amber-200/70 shadow-sm`}>
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white">
                  <Sparkles size={12} />
                </span>
                <span className="text-amber-700 font-black text-xs tracking-wide">{t('site.home.welcomeBadge')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-black leading-[1.2] text-gray-900 tracking-tight text-start">
                {t('site.home.welcomeTitle1')}{' '}
                <span className="relative inline-block text-emerald-600">
                  {t('site.home.welcomeTitle2')}
                  <span className="absolute -bottom-1 start-0 end-0 h-2 bg-emerald-200/60 rounded-full -z-10" />
                </span>
                {' '}
                <span className={`${gradTitle} from-amber-500 to-orange-500 bg-clip-text text-transparent`}>
                  {t('site.home.welcomeTitle3')}
                </span>
              </h2>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-900 text-white text-[11px] font-bold shadow-lg border border-gray-700/50">
                <Award size={14} className="text-amber-400 flex-shrink-0" />
                <span>{t('site.home.certifiedBadge')}</span>
              </div>

              <p className="text-base md:text-[1.05rem] leading-[1.95] text-gray-600 max-w-lg text-start">{welcomeText}</p>

              <div className="flex flex-wrap gap-2">
                {welcomePills.map((pill, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-gray-100 text-[11px] font-bold text-gray-500 shadow-sm">
                    <span className="text-emerald-600">{pill.icon}</span>
                    {pill.label}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link to={`${BASE}/about`}
                  className="group relative inline-flex items-center gap-2 bg-gradient-to-l from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 text-white px-7 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-l from-white/20 to-transparent translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                  <span className="relative">{t('site.nav.about')}</span>
                  <NavChevron size={15} className={`relative transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </Link>
                <Link to={`${BASE}/admission`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm border-2 border-emerald-200/80 text-emerald-700 bg-white/70 hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm">
                  {t('site.nav.admission')}
                </Link>
                <Link to={`${BASE}/contact`}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm text-gray-600 hover:text-amber-700 border border-gray-200/80 bg-white/50 hover:border-amber-300 transition-all">
                  {t('site.nav.contact')}
                </Link>
              </div>
            </div>

            {/* شبكة القيم — bento */}
            <div className="lg:col-span-7 xl:col-span-7 relative">
              <div className="absolute -inset-4 bg-gradient-to-bl from-emerald-100/40 via-transparent to-amber-100/30 rounded-[2.5rem] blur-2xl pointer-events-none" />

              <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
                {valueCards.map((c, i) => (
                  <div
                    key={i}
                    className={`group relative p-5 sm:p-6 rounded-3xl border border-white/80 bg-gradient-to-br ${c.bg} shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-emerald-100/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden ${c.accent} ${i === 0 ? 'sm:row-span-1' : ''}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-l from-transparent via-white to-transparent opacity-80" />
                    <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${c.iconBg} opacity-[0.08] group-hover:opacity-[0.18] group-hover:scale-125 transition-all duration-700 blur-xl`} />

                    <span className="text-[10px] font-black text-gray-300/80 mb-4 block tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ${i === 1 ? 'animate-welcome-float' : ''}`}
                      style={i === 1 ? { animationDelay: '0.5s' } : undefined}>
                      <c.icon size={22} strokeWidth={2.2} />
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <h4 className="font-black text-sm sm:text-base mb-1.5 text-gray-800 group-hover:text-gray-900 transition-colors">
                      {c.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors">
                      {c.desc}
                    </p>

                    <div className={`absolute bottom-0 inset-x-0 h-1 bg-gradient-to-l ${c.iconBg} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <LatestNewsSection news={news} />

      <JoinFamilyCTA schoolName={schoolName} joinPerks={joinPerks} />
    </div>
  )
}
