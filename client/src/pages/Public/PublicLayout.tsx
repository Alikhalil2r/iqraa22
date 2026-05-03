import React, { useState, useEffect } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'
import {
  Menu, X, Moon, Sun, BookOpen, Home, Info, Award, GraduationCap, Trophy,
  Image, Newspaper, PenTool, Heart, Calendar, Video, Briefcase, Mail,
  Phone, MapPin, Clock, Users, ChevronLeft, AlertTriangle, Bell, CheckCircle
} from 'lucide-react'
import DevSignature from '../../components/DevSignature'

const EMERGENCY_ALERTS = [
  { id: 1, active: true, message: '📋 نتائج الفصل الدراسي الأول متاحة الآن عبر البوابة الإلكترونية', type: 'success' as const },
]

function EmergencyAlerts({ alerts }: { alerts: typeof EMERGENCY_ALERTS }) {
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({})
  const active = alerts.filter(a => a.active && !dismissed[a.id])
  if (!active.length) return null
  const styles = {
    success: 'bg-gradient-to-l from-emerald-700 via-emerald-600 to-emerald-700',
    warning: 'bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600',
    danger:  'bg-gradient-to-l from-red-700 via-red-600 to-red-700',
    info:    'bg-gradient-to-l from-sky-700 via-sky-600 to-sky-700',
    urgent:  'bg-gradient-to-l from-red-700 via-red-600 to-red-700',
  }
  return (
    <div className="relative z-50">
      {active.map((alert, idx) => (
        <div key={alert.id} className={`${styles[alert.type] || styles.info} text-white relative overflow-hidden`}
          style={{ animation: `slideIn .5s ${idx * 0.1}s both` }}>
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
            <span className="flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-md bg-white/20">
              {alert.type === 'success' ? '✅ إعلان' : alert.type === 'warning' ? '⚡ تنبيه' : '🔴 عاجل'}
            </span>
            <CheckCircle size={14} className="hidden sm:block flex-shrink-0" />
            <span className="font-bold text-xs flex-1 leading-snug pr-6">{alert.message}</span>
            <button onClick={() => setDismissed(p => ({ ...p, [alert.id]: true }))}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-lg">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function NewsTicker({ news }: { news: any[] }) {
  if (!news?.length) return null
  const text = news.map(n => `◆ ${n.title}`).join('          ')
  return (
    <div className="bg-gradient-to-l from-emerald-900 via-emerald-800 to-emerald-900 text-white py-1.5 overflow-hidden">
      <div className="flex items-center max-w-7xl mx-auto px-4">
        <span className="bg-amber-500 text-[10px] px-3 py-0.5 font-black rounded-lg ml-3 flex-shrink-0 uppercase tracking-wider">عاجل</span>
        <div className="overflow-hidden flex-1">
          <div className="whitespace-nowrap text-sm font-medium opacity-90" style={{ animation: 'ticker 30s linear infinite' }}>
            <span>{text}</span><span className="mr-20">{text}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PublicLayout() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === '1')
  const [scrolled, setScrolled] = useState(false)
  const { theme } = useTheme()
  const navigate = useNavigate()

  const { data: schoolData } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const { data: newsData } = useQuery({ queryKey: ['public-news'], queryFn: () => publicApi.news().then(r => r.data) })

  const school = schoolData?.school
  const news = newsData?.news || []

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark', dark ? '1' : '0')
  }, [dark])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const navLinks = [
    { to: '/', label: 'الرئيسية', end: true, icon: <Home size={15} /> },
    { to: '/about', label: 'عن المدرسة', icon: <Info size={15} /> },
    { to: '/hall-of-fame', label: 'جدار الشرف', icon: <Award size={15} /> },
    { to: '/alumni', label: 'خريجونا', icon: <GraduationCap size={15} /> },
    { to: '/achievements', label: 'المشاركات', icon: <Trophy size={15} /> },
    { to: '/gallery', label: 'المعرض', icon: <Image size={15} /> },
    { to: '/news', label: 'الأخبار', icon: <Newspaper size={15} /> },
    { to: '/articles', label: 'إبداعات الطلاب', icon: <PenTool size={15} /> },
    { to: '/learning-support', label: 'دعم التعلم', icon: <Heart size={15} /> },
    { to: '/calendar', label: 'التقويم', icon: <Calendar size={15} /> },
    { to: '/videos', label: 'المكتبة المرئية', icon: <Video size={15} /> },
    { to: '/jobs', label: 'التوظيف', icon: <Briefcase size={15} /> },
    { to: '/contact', label: 'تواصل معنا', icon: <Mail size={15} /> },
  ]

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'dark bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}`}>
      <EmergencyAlerts alerts={EMERGENCY_ALERTS} />
      <NewsTicker news={news} />

      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'shadow-2xl backdrop-blur-xl ' + (dark ? 'bg-slate-900/95' : 'bg-white/95')
          : 'shadow-md ' + (dark ? 'bg-slate-900' : 'bg-white')
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="relative">
              {theme.logoUrl
                ? <img src={theme.logoUrl} className="h-12 w-auto rounded-2xl shadow-lg group-hover:scale-105 transition-all" alt={theme.schoolName} />
                : <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-all">
                    <BookOpen size={24} strokeWidth={2.5} />
                  </div>
              }
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-black">★</span>
              </div>
            </div>
            <div>
              <h1 className={`text-base font-black leading-tight ${dark ? 'text-emerald-400' : 'text-emerald-900'}`}>{theme.schoolName}</h1>
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-amber-600">سلطنة عُمان</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-wrap justify-center flex-1 mx-2">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : dark ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-gray-400 hover:text-emerald-700 hover:bg-gray-50'
                  }`
                }>
                {({ isActive }) => (<>
                  <span className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-emerald-100 text-emerald-600' : ''}`}>{l.icon}</span>
                  <span className="whitespace-nowrap relative">
                    {l.label}
                    {isActive && <span className="absolute -bottom-0.5 left-0 w-full h-[2px] bg-amber-500 rounded-full" />}
                  </span>
                </>)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setDark(!dark)}
              className={`p-2.5 rounded-xl transition-all ${dark ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/parent-login"
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700 transition flex-shrink-0">
              <Users size={14} />بوابة الأولياء
            </Link>
            <button className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className={`lg:hidden border-t p-3 space-y-0.5 max-h-[70vh] overflow-y-auto ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? dark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                      : dark ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-50'
                  }`
                }>
                <span className="text-amber-500">{l.icon}</span>{l.label}
              </NavLink>
            ))}
            <Link to="/parent-login" onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm bg-emerald-600">
              <Users size={16} />بوابة أولياء الأمور
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className={`mt-8 ${dark ? 'bg-slate-950' : 'bg-gray-900'} text-white`}>
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-l from-emerald-500 via-amber-500 to-emerald-600" />

        <div className="max-w-7xl mx-auto px-4 py-14 grid md:grid-cols-12 gap-10">
          {/* Brand column */}
          <div className="md:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                <BookOpen size={22} className="text-white" />
              </div>
              <div>
                <p className="font-black text-xl leading-tight">{theme.schoolName}</p>
                {theme.tagline && <p className="text-[11px] text-amber-400 font-bold mt-0.5">{theme.tagline}</p>}
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              مدرسة رائدة في التعليم الأكاديمي والتربية الإسلامية، نسعى لبناء أجيال مبدعة قادرة على مواجهة تحديات المستقبل بعلم وإيمان وإبداع.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {[
                { label: 'فيسبوك', href: '#', svg: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                )},
                { label: 'تويتر', href: '#', svg: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                )},
                { label: 'إنستغرام', href: '#', svg: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                )},
                { label: 'يوتيوب', href: '#', svg: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                )},
                { label: 'واتساب', href: '#', svg: (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                )},
              ].map(s => (
                <a key={s.label} href={s.href} title={s.label}
                  className="w-9 h-9 rounded-xl bg-white/8 hover:bg-emerald-600 text-white/50 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/10 hover:border-emerald-500">
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4 className="font-black mb-5 text-white/80 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
              <span className="w-5 h-0.5 bg-amber-500 rounded-full" />روابط سريعة
            </h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {navLinks.slice(0, 10).map(l => (
                <Link key={l.to} to={l.to} className="flex items-center gap-1.5 text-xs text-white/45 hover:text-emerald-400 transition-colors group">
                  <ChevronLeft size={10} className="text-amber-500/60 group-hover:text-amber-400 flex-shrink-0" />
                  <span className="truncate">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Portals */}
          <div className="md:col-span-2">
            <h4 className="font-black mb-5 text-white/80 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
              <span className="w-5 h-0.5 bg-amber-500 rounded-full" />البوابات
            </h4>
            <div className="space-y-2.5">
              <Link to="/parent-login" className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold hover:bg-emerald-600/30 transition-all group">
                <Users size={15} />
                <span className="flex-1">بوابة الأولياء</span>
                <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/login" className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm font-bold hover:bg-white/10 transition-all group">
                <BookOpen size={15} />
                <span className="flex-1">لوحة التحكم</span>
                <ChevronLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h4 className="font-black mb-5 text-white/80 text-xs uppercase tracking-[0.15em] flex items-center gap-2">
              <span className="w-5 h-0.5 bg-amber-500 rounded-full" />تواصل معنا
            </h4>
            <div className="space-y-3">
              {school?.address && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={13} className="text-amber-400" />
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{school.address}</p>
                </div>
              )}
              {school?.phone && (
                <a href={`tel:${school.phone}`} className="flex items-center gap-3 group">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Phone size={13} className="text-amber-400" />
                  </div>
                  <span className="text-xs text-white/50 group-hover:text-white transition-colors">{school.phone}</span>
                </a>
              )}
              {school?.email && (
                <a href={`mailto:${school.email}`} className="flex items-center gap-3 group">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Mail size={13} className="text-amber-400" />
                  </div>
                  <span className="text-xs text-white/50 group-hover:text-white transition-colors">{school.email}</span>
                </a>
              )}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <Clock size={13} className="text-amber-400" />
                </div>
                <span className="text-xs text-white/50">الأحد – الخميس | 7:00 ص – 2:00 م</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8">
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/25 text-xs">
              جميع الحقوق محفوظة © {new Date().getFullYear()} {theme.schoolName}
            </p>
            <DevSignature variant="dark" />
          </div>
        </div>
      </footer>
    </div>
  )
}
