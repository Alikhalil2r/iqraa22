import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import {
  Home, BookOpen, CalendarCheck, MessageSquare, Clock,
  LogOut, Menu, X, Bell, GraduationCap, Moon, Sun,
  ClipboardList, DollarSign, Shield, Bus
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useLanguage } from '../../context/LanguageContext'
import { ParentChildProvider, useParentChild } from '../../context/ParentChildContext'
import PageTransition from '../../components/ux/PageTransition'
import BackToTop from '../../components/ux/BackToTop'

const navItems = [
  { to: '/parent',               labelKey: 'nav.home',             icon: Home,          end: true,  badge: null as string | null },
  { to: '/parent/grades',        labelKey: 'nav.parentGrades',     icon: BookOpen,      end: false, badge: null },
  { to: '/parent/attendance',    labelKey: 'nav.parentAttendance', icon: CalendarCheck, end: false, badge: null },
  { to: '/parent/homework',      labelKey: 'nav.parentHomework',   icon: ClipboardList, end: false, badge: 'pendingHw' },
  { to: '/parent/fees',          labelKey: 'nav.parentFees',       icon: DollarSign,    end: false, badge: 'unpaidFees' },
  { to: '/parent/exams',         labelKey: 'nav.parentExams',      icon: GraduationCap, end: false, badge: null },
  { to: '/parent/conduct',       labelKey: 'nav.parentConduct',    icon: Shield,        end: false, badge: null },
  { to: '/parent/bus',           labelKey: 'nav.parentBus',        icon: Bus,           end: false, badge: null },
  { to: '/parent/messages',      labelKey: 'nav.parentMessages',   icon: MessageSquare, end: false, badge: 'unreadMsgs' },
  { to: '/parent/schedule',      labelKey: 'nav.parentSchedule',   icon: Clock,         end: false, badge: null },
  { to: '/parent/notifications', labelKey: 'nav.notifications',    icon: Bell,          end: false, badge: 'unreadNotif' },
]

const mobileNavItems = [
  '/parent', '/parent/grades', '/parent/homework', '/parent/fees', '/parent/messages'
]

function ParentLayoutInner() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)
  const { isDark, toggle: toggleDark } = useDarkMode()
  const { t, lang, toggleLang } = useLanguage()
  const { children: childList, selectedChildId, setSelectedChildId, childParams, isReady } = useParentChild()

  const { data: dashData } = useQuery({
    queryKey: ['parent-dash', selectedChildId],
    queryFn: () => parentApi.dashboard(childParams).then(r => r.data),
    refetchInterval: 60000,
    enabled: isReady,
  })

  const dashStats = dashData?.stats

  const handleLogout = () => {
    logout()
    navigate('/parent/login')
    toast.success(lang === 'ar' ? 'تم الخروج' : 'Logged out successfully')
  }
  const unreadMsgs   = dashStats?.unreadMessages      || 0
  const unreadNotif  = dashStats?.unreadNotifications || 0
  const pendingHw    = dashStats?.pendingHomework     || 0
  const unpaidFees   = dashStats?.unpaidFees          || 0

  function getBadge(badgeKey: string | null) {
    if (badgeKey === 'unreadMsgs')   return unreadMsgs  > 0 ? unreadMsgs  : null
    if (badgeKey === 'unreadNotif')  return unreadNotif > 0 ? unreadNotif : null
    if (badgeKey === 'pendingHw')    return pendingHw    > 0 ? pendingHw    : null
    if (badgeKey === 'unpaidFees')   return unpaidFees   > 0 ? unpaidFees   : null
    return null
  }

  React.useEffect(() => {
    setMobileMenu(false)
    window.scrollTo(0, 0)
  }, [location.pathname])

  const todayStatusLabel = () => {
    const s = dashStats?.todayStatus
    if (s === 'present') return t('parent.present')
    if (s === 'absent')  return t('parent.absent')
    if (s === 'late')    return t('parent.late')
    return t('parent.notRecorded')
  }

  return (
    <div className="min-h-screen dash-parent-shell flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 dash-parent-header">
        {/* صف العلوي: هوية المستخدم + أدوات */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0 max-w-[min(100%,220px)] sm:max-w-[260px]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: 'var(--color-accent)' }}>
              {user?.name?.[0]}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm text-gray-800 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{t('parent.portal')}</p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleLang}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-black transition-all"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            >
              <span className={lang === 'ar' ? 'text-green-600' : 'text-gray-400'}>ع</span>
              <span className="text-gray-300 mx-0.5">|</span>
              <span className={lang === 'en' ? 'text-green-600' : 'text-gray-400'}>EN</span>
            </button>
            <button
              onClick={toggleDark}
              className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
              title={isDark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button onClick={handleLogout} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50">
              <LogOut size={15} />{t('parent.logout')}
            </button>
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* صف التنقل — سطر مستقل قابل للتمرير */}
        <nav className="hidden md:block dash-parent-nav">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map(item => {
                const badge = getBadge(item.badge)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `dash-parent-nav-link relative flex-shrink-0 ${isActive ? 'active' : ''}`
                    }
                  >
                    <item.icon size={14} />
                    {t(item.labelKey)}
                    {badge !== null && (
                      <span className="min-w-[16px] h-4 px-1 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 p-3 space-y-1">
            {navItems.map(item => {
              const badge = getBadge(item.badge)
              return (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileMenu(false)}
                  className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  style={({isActive}) => isActive ? {background:'var(--color-accent)'} : {}}>
                  <item.icon size={18}/>{t(item.labelKey)}
                  {badge !== null && <span className="mr-auto badge-danger">{badge}</span>}
                </NavLink>
              )
            })}
            <div className="flex items-center gap-2 px-4 py-2">
              <button onClick={toggleLang}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-black">
                <span className={lang === 'ar' ? 'text-green-600' : 'text-gray-400'}>ع</span>
                <span className="text-gray-300 mx-0.5">|</span>
                <span className={lang === 'en' ? 'text-green-600' : 'text-gray-400'}>EN</span>
              </button>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-bold rounded-xl hover:bg-red-50">
              <LogOut size={18}/>{t('parent.logout')}
            </button>
          </div>
        )}
      </header>

      {/* Child info bar */}
      {(dashData?.child || childList.length > 0) && (
        <div className="dash-child-bar border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap size={16} className="text-white"/>
            </div>
            <div className="flex-1 min-w-0">
              {childList.length > 1 ? (
                <select
                  value={selectedChildId || ''}
                  onChange={e => setSelectedChildId(e.target.value)}
                  className="bg-white/20 text-white font-black text-sm rounded-lg px-2 py-1 border-0 outline-none max-w-full"
                >
                  {childList.map(c => (
                    <option key={c.id} value={c.id} className="text-gray-800">{c.name} — {c.class_name}</option>
                  ))}
                </select>
              ) : (
                <>
                  <p className="text-white font-black text-sm">{dashData?.child?.name || childList[0]?.name}</p>
                  <p className="text-white/80 text-[10px]">{(dashData?.child || childList[0])?.class_name} — {(dashData?.child || childList[0])?.student_number}</p>
                </>
              )}
            </div>
            {dashStats?.todayStatus && dashStats.todayStatus !== 'unknown' && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                dashStats.todayStatus === 'present' ? 'bg-green-100 text-green-700' :
                dashStats.todayStatus === 'absent'  ? 'bg-red-100 text-red-700' :
                dashStats.todayStatus === 'late'    ? 'bg-amber-100 text-amber-700' :
                'bg-white/20 text-white'}`}>
                {todayStatusLabel()}
              </span>
            )}
          </div>
        </div>
      )}

      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-24 md:pb-6 outline-none" tabIndex={-1}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <BackToTop threshold={320} />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 dash-parent-bottom-nav safe-area-pb">
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {navItems.filter(item => mobileNavItems.includes(item.to)).map(item => {
            const badge = getBadge(item.badge)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[52px] transition-all ${
                    isActive ? 'text-white' : 'text-gray-400 hover:text-gray-600'
                  }`
                }
                style={({ isActive }) => isActive ? { background: 'var(--color-accent)' } : {}}
              >
                <div className="relative">
                  <item.icon size={20} strokeWidth={2} />
                  {badge !== null && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold leading-none">{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default function ParentLayout() {
  return (
    <ParentChildProvider>
      <ParentLayoutInner />
    </ParentChildProvider>
  )
}
