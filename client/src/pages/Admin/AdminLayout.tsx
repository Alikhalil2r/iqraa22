import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { messagesApi } from '../../api/client'
import {
  LayoutDashboard, Users, UserCheck, ClipboardCheck, GraduationCap, Bus,
  MessageSquare, Newspaper, Calendar, Palette, Settings, LogOut, Menu,
  Bell, BarChart3, Shield, BookOpen, ChevronLeft, Search,
  DollarSign, CalendarDays, Home, Globe, Moon, Sun
} from 'lucide-react'
import toast from 'react-hot-toast'
import GlobalSearch from '../../components/GlobalSearch'
import { useDarkMode } from '../../hooks/useDarkMode'

const menuGroups = [
  {
    label: 'الرئيسية',
    items: [
      { to: '/admin',         icon: LayoutDashboard, label: 'لوحة المعلومات', end: true },
      { to: '/admin/reports', icon: BarChart3,        label: 'التقارير والإحصائيات' },
    ]
  },
  {
    label: 'إدارة المدرسة',
    items: [
      { to: '/admin/students',   icon: GraduationCap,  label: 'الطلاب' },
      { to: '/admin/employees',  icon: Users,           label: 'الموظفون' },
      { to: '/admin/attendance', icon: UserCheck,       label: 'الحضور والغياب' },
      { to: '/admin/grades',     icon: ClipboardCheck,  label: 'النتائج الدراسية' },
      { to: '/admin/fees',       icon: DollarSign,      label: 'الرسوم الدراسية' },
      { to: '/admin/buses',      icon: Bus,             label: 'الحافلات المدرسية' },
    ]
  },
  {
    label: 'التواصل والمحتوى',
    items: [
      { to: '/admin/messages',      icon: MessageSquare,  label: 'رسائل الأولياء' },
      { to: '/admin/announcements', icon: Bell,           label: 'إشعارات الأولياء' },
      { to: '/admin/schedule',      icon: CalendarDays,   label: 'الجدول الدراسي' },
      { to: '/admin/news',          icon: Newspaper,      label: 'الأخبار والمنشورات' },
      { to: '/admin/events',        icon: Calendar,       label: 'التقويم المدرسي' },
    ]
  },
  {
    label: 'الإعدادات',
    items: [
      { to: '/admin/theme',    icon: Palette,  label: 'تخصيص التصميم' },
      { to: '/admin/settings', icon: Settings, label: 'إعدادات المدرسة' },
      { to: '/admin/users',    icon: Shield,   label: 'إدارة المستخدمين' },
    ]
  },
]

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin':            'لوحة المعلومات',
  '/admin/students':   'الطلاب',
  '/admin/employees':  'الموظفون',
  '/admin/attendance': 'الحضور والغياب',
  '/admin/grades':     'النتائج الدراسية',
  '/admin/fees':       'الرسوم الدراسية',
  '/admin/buses':      'الحافلات',
  '/admin/messages':      'الرسائل',
  '/admin/announcements': 'إشعارات الأولياء',
  '/admin/schedule':      'الجدول الدراسي',
  '/admin/news':       'الأخبار',
  '/admin/events':     'التقويم',
  '/admin/reports':    'التقارير',
  '/admin/theme':      'تخصيص التصميم',
  '/admin/settings':   'إعدادات المدرسة',
  '/admin/users':      'إدارة المستخدمين',
}

const GROUP_ICON_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#64748b']

export default function AdminLayout() {
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isDark, toggle: toggleDark } = useDarkMode()

  const { data: unreadData } = useQuery({
    queryKey:       ['unread-count'],
    queryFn:        () => messagesApi.unreadCount().then(r => r.data),
    refetchInterval: 30000
  })
  const unreadCount = unreadData?.count || 0

  const handleLogout = () => { logout(); navigate('/login'); toast.success('تم تسجيل الخروج بنجاح') }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.altKey && !e.ctrlKey) {
        const map: Record<string, string> = {
          '1':'/admin','2':'/admin/students','3':'/admin/employees',
          '4':'/admin/attendance','5':'/admin/grades','6':'/admin/messages','7':'/admin/reports',
        }
        if (map[e.key]) { e.preventDefault(); navigate(map[e.key]) }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate])

  const currentLabel = BREADCRUMB_MAP[location.pathname] || ''

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-100 flex-shrink-0 ${sidebarOpen ? 'px-4 py-3.5 justify-between' : 'px-2 py-3.5 justify-center'}`}>
        {sidebarOpen && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-800 text-sm leading-none truncate">لوحة التحكم</p>
              <p className="text-[10px] text-gray-400 mt-0.5">School Management</p>
            </div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          {sidebarOpen ? <ChevronLeft size={17} /> : <Menu size={17} />}
        </button>
      </div>

      {/* Search */}
      {sidebarOpen && (
        <div className="px-3 pt-3 pb-1">
          <button onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 text-sm transition-colors border border-gray-200 group">
            <Search size={14} />
            <span className="flex-1 text-right text-xs">بحث سريع...</span>
            <kbd className="text-[9px] font-mono bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded border border-gray-300">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
        {menuGroups.map((group, gIdx) => (
          <div key={group.label} className="mb-1">
            {sidebarOpen && (
              <div className="flex items-center gap-2 px-3 py-1.5 mt-1.5">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{group.label}</span>
              </div>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileSidebar(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-150 relative ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  } ${!sidebarOpen ? 'justify-center px-2' : ''}`
                }
                style={({ isActive }) => isActive ? { background: 'var(--color-primary)' } : {}}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon size={17} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.label === 'رسائل الأولياء' && unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse flex-shrink-0">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && item.label === 'رسائل الأولياء' && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer links */}
      {sidebarOpen && (
        <div className="px-3 pb-2">
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-bold">
            <Globe size={14} />
            <span>عرض الموقع العام</span>
          </a>
        </div>
      )}

      {/* User footer */}
      <div className="p-3 border-t border-gray-100 flex-shrink-0">
        <div className={`flex items-center gap-2.5 p-3 rounded-xl hover:bg-gray-50 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm"
            style={{ background: 'var(--color-primary)' }}>
            {user?.name?.[0] || 'A'}
          </div>
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-800 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-400">{user?.role === 'admin' ? 'مدير النظام' : user?.role === 'teacher' ? 'معلم' : 'مستخدم'}</p>
              </div>
              <button onClick={handleLogout} title="تسجيل الخروج"
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0">
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-l border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar overlay */}
      {mobileSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileSidebar(false)} />
          <aside className="fixed right-0 top-0 h-full w-72 bg-white z-50 shadow-2xl md:hidden animate-slide-in">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm z-10">
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" onClick={() => setMobileSidebar(true)}>
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            <Home size={13} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 hidden sm:block text-xs">/</span>
            <span className="text-gray-400 hidden sm:block text-xs">لوحة التحكم</span>
            {currentLabel && (
              <>
                <span className="text-gray-300 text-xs">/</span>
                <span className="font-black text-gray-700 text-xs truncate">{currentLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs transition-colors font-bold">
              <Search size={14} />
              <span>بحث</span>
              <kbd className="text-[9px] font-mono bg-white text-gray-400 px-1 py-0.5 rounded border border-gray-200 shadow-sm">⌘K</kbd>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-all hover:scale-110"
              title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* Notifications bell */}
            <button onClick={() => navigate('/admin/messages')}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* View site link */}
            <a href="/" target="_blank" className="hidden lg:flex p-2.5 rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" title="عرض الموقع العام">
              <Globe size={18} />
            </a>

            {/* User avatar */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 mr-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
                {user?.name?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-700 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{user?.role === 'admin' ? 'مدير' : 'معلم'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
