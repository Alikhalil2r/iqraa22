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

      <footer className={`py-12 mt-8 ${dark ? 'bg-slate-950' : 'bg-gray-900'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 flex items-center justify-center"><BookOpen size={20} className="text-white" /></div>
              <div>
                <p className="font-black text-lg">{theme.schoolName}</p>
                {theme.tagline && <p className="text-xs text-white/60">{theme.tagline}</p>}
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">مدرسة رائدة في التعليم الأكاديمي والتربية الإسلامية، نسعى لبناء أجيال مبدعة قادرة على مواجهة تحديات المستقبل.</p>
          </div>
          <div>
            <h4 className="font-black mb-4 text-white/80 text-sm uppercase tracking-wider">روابط سريعة</h4>
            <div className="space-y-2">
              {navLinks.slice(0, 7).map(l => (
                <Link key={l.to} to={l.to} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition">
                  <ChevronLeft size={12} />{l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-black mb-4 text-white/80 text-sm uppercase tracking-wider">تواصل معنا</h4>
            <div className="space-y-3">
              {school?.address && <p className="text-sm text-white/50 flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />{school.address}</p>}
              {school?.phone && <a href={`tel:${school.phone}`} className="text-sm text-white/50 hover:text-white flex items-center gap-2"><Phone size={14} className="text-amber-500" />{school.phone}</a>}
              {school?.email && <a href={`mailto:${school.email}`} className="text-sm text-white/50 hover:text-white flex items-center gap-2"><Mail size={14} className="text-amber-500" />{school.email}</a>}
              <p className="text-sm text-white/50 flex items-center gap-2"><Clock size={14} className="text-amber-500" />الأحد – الخميس | 7:00 ص – 2:00 م</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-white/30 text-xs">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} {theme.schoolName}</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white/60 transition">لوحة التحكم</Link>
            <Link to="/parent-login" className="hover:text-white/60 transition">بوابة الأولياء</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
