import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import {
  Home, BookOpen, CalendarCheck, MessageSquare, Clock,
  LogOut, Menu, X, Bell, GraduationCap, Moon, Sun
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useLanguage } from '../../context/LanguageContext'

const navItems = [
  { to: '/parent',               labelKey: 'nav.home',             icon: Home,          end: true,  badge: null as string | null },
  { to: '/parent/grades',        labelKey: 'nav.parentGrades',     icon: BookOpen,      end: false, badge: null },
  { to: '/parent/attendance',    labelKey: 'nav.parentAttendance', icon: CalendarCheck, end: false, badge: null },
  { to: '/parent/messages',      labelKey: 'nav.parentMessages',   icon: MessageSquare, end: false, badge: 'unreadMsgs' },
  { to: '/parent/schedule',      labelKey: 'nav.parentSchedule',   icon: Clock,         end: false, badge: null },
  { to: '/parent/notifications', labelKey: 'nav.notifications',    icon: Bell,          end: false, badge: 'unreadNotif' },
]

export default function ParentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)
  const { isDark, toggle: toggleDark } = useDarkMode()
  const { t, lang, toggleLang } = useLanguage()

  const { data: dashData } = useQuery({
    queryKey: ['parent-dash'],
    queryFn: () => parentApi.dashboard().then(r => r.data),
    refetchInterval: 60000
  })

  const handleLogout = () => {
    logout()
    navigate('/parent-login')
    toast.success(lang === 'ar' ? 'تم الخروج' : 'Logged out successfully')
  }
  const unreadMsgs  = dashData?.stats?.unreadMessages     || 0
  const unreadNotif = dashData?.stats?.unreadNotifications || 0

  function getBadge(badgeKey: string | null) {
    if (badgeKey === 'unreadMsgs')  return unreadMsgs  > 0 ? unreadMsgs  : null
    if (badgeKey === 'unreadNotif') return unreadNotif > 0 ? unreadNotif : null
    return null
  }

  const todayStatusLabel = () => {
    const s = dashData?.stats?.todayStatus
    if (s === 'present') return t('parent.present')
    if (s === 'absent')  return t('parent.absent')
    if (s === 'late')    return t('parent.late')
    return t('parent.notRecorded')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black" style={{background:'var(--color-accent)'}}>
              {user?.name?.[0]}
            </div>
            <div>
              <p className="font-black text-sm text-gray-800">{user?.name}</p>
              <p className="text-[10px] text-gray-400">{t('parent.portal')}</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const badge = getBadge(item.badge)
              return (
                <NavLink key={item.to} to={item.to} end={item.end}
                  className={({isActive}) => `relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  style={({isActive}) => isActive ? {background:'var(--color-accent)'} : {}}>
                  <item.icon size={16}/>
                  {t(item.labelKey)}
                  {badge !== null && (
                    <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-black transition-all"
            title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
          >
            <span className={lang === 'ar' ? 'text-green-600' : 'text-gray-400'}>ع</span>
            <span className="text-gray-300 mx-0.5">|</span>
            <span className={lang === 'en' ? 'text-green-600' : 'text-gray-400'}>EN</span>
          </button>

          <button
            onClick={toggleDark}
            className="hidden md:flex p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all hover:scale-110"
            title={isDark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
          <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-400 hover:bg-red-50">
            <LogOut size={16}/>{t('parent.logout')}
          </button>
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>

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
      {dashData?.child && (
        <div className="border-b border-gray-100" style={{background:'var(--color-accent)'}}>
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <GraduationCap size={16} className="text-white"/>
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-sm">{dashData.child.name}</p>
              <p className="text-white/80 text-[10px]">{dashData.child.class_name} — {dashData.child.student_number}</p>
            </div>
            {dashData.stats.todayStatus && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                dashData.stats.todayStatus === 'present' ? 'bg-green-100 text-green-700' :
                dashData.stats.todayStatus === 'absent'  ? 'bg-red-100 text-red-700' :
                dashData.stats.todayStatus === 'late'    ? 'bg-amber-100 text-amber-700' :
                'bg-white/20 text-white'}`}>
                {todayStatusLabel()}
              </span>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-pb">
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {navItems.slice(0, 5).map(item => {
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
