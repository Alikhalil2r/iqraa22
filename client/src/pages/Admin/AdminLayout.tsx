import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { messagesApi } from '../../api/client'
import {
  LayoutDashboard, Users, UserCheck, ClipboardCheck, GraduationCap, Bus,
  MessageSquare, Newspaper, Calendar, Palette, Settings, LogOut, Menu,
  Bell, BarChart3, Shield, BookOpen, ChevronLeft, Search, Command
} from 'lucide-react'
import toast from 'react-hot-toast'
import GlobalSearch from '../../components/GlobalSearch'

const menuGroups = [
  {
    label: 'الرئيسية',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'لوحة المعلومات', end: true },
      { to: '/admin/reports', icon: BarChart3, label: 'التقارير والإحصائيات' },
    ]
  },
  {
    label: 'إدارة البشر',
    items: [
      { to: '/admin/students', icon: GraduationCap, label: 'الطلاب' },
      { to: '/admin/employees', icon: Users, label: 'الموظفون' },
      { to: '/admin/attendance', icon: UserCheck, label: 'الحضور والغياب' },
      { to: '/admin/grades', icon: ClipboardCheck, label: 'النتائج الدراسية' },
      { to: '/admin/buses', icon: Bus, label: 'الحافلات المدرسية' },
    ]
  },
  {
    label: 'التواصل',
    items: [
      { to: '/admin/messages', icon: MessageSquare, label: 'رسائل الأولياء' },
    ]
  },
  {
    label: 'المحتوى',
    items: [
      { to: '/admin/news', icon: Newspaper, label: 'الأخبار والفعاليات' },
      { to: '/admin/events', icon: Calendar, label: 'التقويم المدرسي' },
    ]
  },
  {
    label: 'الإعدادات',
    items: [
      { to: '/admin/theme', icon: Palette, label: 'تخصيص التصميم' },
      { to: '/admin/settings', icon: Settings, label: 'إعدادات المدرسة' },
      { to: '/admin/users', icon: Shield, label: 'إدارة المستخدمين' },
    ]
  },
]

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin': 'لوحة المعلومات',
  '/admin/students': 'الطلاب',
  '/admin/employees': 'الموظفون',
  '/admin/attendance': 'الحضور والغياب',
  '/admin/grades': 'النتائج الدراسية',
  '/admin/buses': 'الحافلات',
  '/admin/messages': 'الرسائل',
  '/admin/news': 'الأخبار',
  '/admin/events': 'الفعاليات',
  '/admin/reports': 'التقارير',
  '/admin/theme': 'تخصيص التصميم',
  '/admin/settings': 'الإعدادات',
  '/admin/users': 'المستخدمون',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagesApi.unreadCount().then(r => r.data),
    refetchInterval: 30000
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('تم تسجيل الخروج بنجاح')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      // Alt+shortcuts for nav
      if (e.altKey && !e.ctrlKey) {
        const map: Record<string, string> = {
          '1': '/admin', '2': '/admin/students', '3': '/admin/employees',
          '4': '/admin/attendance', '5': '/admin/grades', '6': '/admin/messages',
          '7': '/admin/reports',
        }
        if (map[e.key]) { e.preventDefault(); navigate(map[e.key]) }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [navigate])

  const currentLabel = BREADCRUMB_MAP[location.pathname] || ''

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {sidebarOpen && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'var(--color-primary)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm leading-none">لوحة التحكم</p>
              <p className="text-[10px] text-gray-400 mt-0.5">School Management</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          title="طي/توسيع القائمة"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Search button */}
      {sidebarOpen && (
        <div className="px-3 pt-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 text-sm transition-colors border border-gray-200"
          >
            <Search size={15} />
            <span className="flex-1 text-right">بحث سريع...</span>
            <kbd className="text-[10px] font-mono bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {menuGroups.map(group => (
          <div key={group.label} className="mb-2">
            {sidebarOpen && (
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-2 mt-1">
                {group.label}
              </p>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileSidebar(false)}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`
                }
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
                {sidebarOpen && item.label === 'رسائل الأولياء' && (unreadData?.count || 0) > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {unreadData.count > 9 ? '9+' : unreadData.count}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <div className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm" style={{ background: 'var(--color-primary)' }}>
            {user?.name?.[0] || 'A'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400">{user?.role === 'admin' ? 'مدير النظام' : 'معلم'}</p>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-l border-gray-100 shadow-sm transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-[68px]'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebar && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebar(false)} />
          <aside className="fixed right-0 top-0 h-full w-72 bg-white z-50 shadow-2xl md:hidden animate-slide-in">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setMobileSidebar(true)}>
            <Menu size={20} className="text-gray-600" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm flex-1">
            <span className="text-gray-400 hidden sm:block">لوحة التحكم</span>
            {currentLabel && (
              <>
                <span className="text-gray-300 hidden sm:block">/</span>
                <span className="font-bold text-gray-700">{currentLabel}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 text-sm transition-colors"
            >
              <Search size={15} />
              <span className="text-xs">بحث</span>
              <kbd className="text-[10px] font-mono bg-white text-gray-400 px-1 py-0.5 rounded border border-gray-200">⌘K</kbd>
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/admin/messages')}
              className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Bell size={19} />
              {(unreadData?.count || 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center animate-pulse">
                  {unreadData.count > 9 ? '9+' : unreadData.count}
                </span>
              )}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm" style={{ background: 'var(--color-primary)' }}>
                {user?.name?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-700">{user?.name}</p>
                <p className="text-[10px] text-gray-400">{user?.role === 'admin' ? 'مدير' : 'معلم'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
