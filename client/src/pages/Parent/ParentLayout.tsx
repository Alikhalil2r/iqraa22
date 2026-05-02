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

const navItems = [
  { to: '/parent',               label: 'الرئيسية', icon: Home,          end: true, badge: null as string | null },
  { to: '/parent/grades',        label: 'النتائج',  icon: BookOpen,      end: false, badge: null },
  { to: '/parent/attendance',    label: 'الحضور',   icon: CalendarCheck, end: false, badge: null },
  { to: '/parent/messages',      label: 'الرسائل',  icon: MessageSquare, end: false, badge: 'unreadMsgs' },
  { to: '/parent/schedule',      label: 'الجدول',   icon: Clock,         end: false, badge: null },
  { to: '/parent/notifications', label: 'الإشعارات',icon: Bell,          end: false, badge: 'unreadNotif' },
]

export default function ParentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)
  const { isDark, toggle: toggleDark } = useDarkMode()

  const { data: dashData } = useQuery({
    queryKey: ['parent-dash'],
    queryFn: () => parentApi.dashboard().then(r => r.data),
    refetchInterval: 60000
  })

  const handleLogout = () => { logout(); navigate('/parent-login'); toast.success('تم الخروج') }
  const unreadMsgs  = dashData?.stats?.unreadMessages    || 0
  const unreadNotif = dashData?.stats?.unreadNotifications || 0

  function getBadge(badgeKey: string | null) {
    if (badgeKey === 'unreadMsgs')  return unreadMsgs  > 0 ? unreadMsgs  : null
    if (badgeKey === 'unreadNotif') return unreadNotif > 0 ? unreadNotif : null
    return null
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
              <p className="text-[10px] text-gray-400">بوابة ولي الأمر</p>
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
                  {item.label}
                  {badge !== null && (
                    <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
          <button
            onClick={toggleDark}
            className="hidden md:flex p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-all hover:scale-110"
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
          <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-400 hover:bg-red-50">
            <LogOut size={16}/>خروج
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
                  <item.icon size={18}/>{item.label}
                  {badge !== null && <span className="mr-auto badge-danger">{badge}</span>}
                </NavLink>
              )
            })}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-bold rounded-xl hover:bg-red-50">
              <LogOut size={18}/>خروج
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
                dashData.stats.todayStatus==='present'?'bg-green-100 text-green-700':
                dashData.stats.todayStatus==='absent'?'bg-red-100 text-red-700':
                dashData.stats.todayStatus==='late'?'bg-amber-100 text-amber-700':'bg-white/20 text-white'}`}>
                {dashData.stats.todayStatus==='present'?'✅ حاضر اليوم':dashData.stats.todayStatus==='absent'?'❌ غائب اليوم':dashData.stats.todayStatus==='late'?'⏰ متأخر اليوم':'الحضور غير مسجل'}
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
                <span className="text-[10px] font-bold leading-none">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
