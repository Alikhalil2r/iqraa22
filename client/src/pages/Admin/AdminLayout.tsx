import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { messagesApi } from '../../api/client'
import {
  LayoutDashboard, Users, UserCheck, ClipboardCheck, GraduationCap, Bus,
  MessageSquare, Newspaper, Calendar, Palette, Settings, LogOut, Menu, X,
  Bell, ChevronDown, BarChart3, Shield, BookOpen, ChevronLeft
} from 'lucide-react'
import toast from 'react-hot-toast'

const menuGroups = [
  {
    label: 'الرئيسية',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'لوحة المعلومات', end: true },
      { to: '/admin/reports', icon: BarChart3, label: 'التقارير' },
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

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagesApi.unreadCount().then(r => r.data),
    refetchInterval: 30000
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('تم تسجيل الخروج')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        {sidebarOpen && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'var(--color-primary)'}}>
              <BookOpen size={18} className="text-white"/>
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm leading-none">لوحة التحكم</p>
              <p className="text-[10px] text-gray-400 mt-0.5">School Management</p>
            </div>
          </div>
        )}
        <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          {sidebarOpen ? <ChevronLeft size={18}/> : <Menu size={18}/>}
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {menuGroups.map(group => (
          <div key={group.label} className="mb-2">
            {sidebarOpen && <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 py-2">{group.label}</p>}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileSidebar(false)}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center px-2' : ''}`}
              >
                <item.icon size={18} className="flex-shrink-0"/>
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
                {sidebarOpen && item.label === 'رسائل الأولياء' && (unreadData?.count || 0) > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                    {unreadData.count}
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{background:'var(--color-primary)'}}>
            {user?.name?.[0] || 'A'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-400">{user?.role === 'admin' ? 'مدير النظام' : 'معلم'}</p>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
              <LogOut size={16}/>
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
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebar(false)}/>
          <aside className="fixed right-0 top-0 h-full w-72 bg-white z-50 shadow-2xl md:hidden animate-slide-in">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100" onClick={() => setMobileSidebar(true)}>
            <Menu size={20} className="text-gray-600"/>
          </button>
          <div className="flex-1"/>
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
              <Bell size={19}/>
              {(unreadData?.count || 0) > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center">
                  {unreadData.count}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{background:'var(--color-primary)'}}>
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
    </div>
  )
}
