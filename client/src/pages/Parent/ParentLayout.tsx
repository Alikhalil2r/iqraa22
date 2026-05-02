import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import {
  Home, BookOpen, CalendarCheck, MessageSquare, Clock,
  LogOut, Menu, X, Bell, GraduationCap, User
} from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/parent', label: 'الرئيسية', icon: Home, end: true },
  { to: '/parent/grades', label: 'النتائج', icon: BookOpen },
  { to: '/parent/attendance', label: 'الحضور', icon: CalendarCheck },
  { to: '/parent/messages', label: 'الرسائل', icon: MessageSquare },
  { to: '/parent/schedule', label: 'الجدول', icon: Clock },
]

export default function ParentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)

  const { data: dashData } = useQuery({
    queryKey: ['parent-dash'],
    queryFn: () => parentApi.dashboard().then(r => r.data),
    refetchInterval: 60000
  })

  const handleLogout = () => { logout(); navigate('/parent-login'); toast.success('تم الخروج') }
  const unreadMsgs = dashData?.stats?.unreadMessages || 0

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
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({isActive}) => `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                style={({isActive}) => isActive ? {background:'var(--color-accent)'} : {}}>
                <item.icon size={16}/>
                {item.label}
                {item.label==='الرسائل' && unreadMsgs > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{unreadMsgs}</span>
                )}
              </NavLink>
            ))}
          </nav>
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
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileMenu(false)}
                className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                style={({isActive}) => isActive ? {background:'var(--color-accent)'} : {}}>
                <item.icon size={18}/>{item.label}
                {item.label==='الرسائل' && unreadMsgs > 0 && <span className="mr-auto badge-danger">{unreadMsgs}</span>}
              </NavLink>
            ))}
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

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
