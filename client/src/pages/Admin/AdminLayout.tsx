import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, AppRole, ROLE_LABELS } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { messagesApi } from '../../api/client'
import {
  LayoutDashboard, Users, UserCheck, ClipboardCheck, GraduationCap, Bus,
  MessageSquare, Newspaper, Calendar, Palette, Settings, LogOut, Menu,
  Bell, BarChart3, Shield, BookOpen, ChevronLeft, ChevronRight, Search,
  DollarSign, CalendarDays, Home, Globe, Moon, Sun, Image, FileText, CreditCard,
  School, BookMarked, ClipboardList, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'
import GlobalSearch from '../../components/GlobalSearch'
import SessionWarning from '../../components/SessionWarning'
import ShortcutsModal from '../../components/ShortcutsModal'
import NotificationPanel from '../../components/NotificationPanel'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useLanguage } from '../../context/LanguageContext'

type MenuItem = {
  to: string
  icon: any
  labelKey: string
  end?: boolean
  roles?: AppRole[]
}

type MenuGroup = {
  labelKey: string
  roles?: AppRole[]
  items: MenuItem[]
}

const ALL_ADMIN: AppRole[] = ['super_admin','admin','teacher','accountant','librarian','hr_manager','guard']
const ADMIN_ONLY: AppRole[] = ['super_admin','admin']
const SUPER_ONLY: AppRole[] = ['super_admin']

const menuGroups: MenuGroup[] = [
  {
    labelKey: 'nav.group.main',
    items: [
      { to: '/admin',          icon: LayoutDashboard, labelKey: 'nav.dashboard', end: true },
      { to: '/admin/teacher',  icon: School,          labelKey: 'nav.teacher',   roles: ['super_admin','admin','teacher'] },
      { to: '/admin/reports',  icon: BarChart3,        labelKey: 'nav.reports',   roles: ['super_admin','admin','accountant','hr_manager'] },
      { to: '/admin/pdf-reports', icon: Printer,      labelKey: 'nav.pdfReports',roles: ['super_admin','admin','teacher','accountant','hr_manager'] },
    ]
  },
  {
    labelKey: 'nav.group.school',
    items: [
      { to: '/admin/students',   icon: GraduationCap,  labelKey: 'nav.students' },
      { to: '/admin/employees',  icon: Users,           labelKey: 'nav.employees', roles: ['super_admin','admin','hr_manager'] },
      { to: '/admin/attendance', icon: UserCheck,       labelKey: 'nav.attendance',roles: ['super_admin','admin','teacher','hr_manager','guard'] },
      { to: '/admin/grades',     icon: ClipboardCheck,  labelKey: 'nav.grades',    roles: ['super_admin','admin','teacher'] },
      { to: '/admin/fees',       icon: DollarSign,      labelKey: 'nav.fees',      roles: ['super_admin','admin','accountant'] },
      { to: '/admin/buses',      icon: Bus,             labelKey: 'nav.buses',     roles: ['super_admin','admin','guard'] },
    ]
  },
  {
    labelKey: 'nav.group.communication',
    items: [
      { to: '/admin/messages',      icon: MessageSquare, labelKey: 'nav.messages' },
      { to: '/admin/announcements', icon: Bell,          labelKey: 'nav.announcements', roles: ['super_admin','admin'] },
      { to: '/admin/schedule',      icon: CalendarDays,  labelKey: 'nav.schedule',      roles: ['super_admin','admin','teacher'] },
      { to: '/admin/news',          icon: Newspaper,     labelKey: 'nav.news',          roles: ['super_admin','admin'] },
      { to: '/admin/events',        icon: Calendar,      labelKey: 'nav.events',        roles: ['super_admin','admin'] },
    ]
  },
  {
    labelKey: 'nav.group.academic',
    items: [
      { to: '/admin/library',  icon: BookMarked,    labelKey: 'nav.library',  roles: ['super_admin','admin','librarian'] },
      { to: '/admin/homework', icon: ClipboardList, labelKey: 'nav.homework', roles: ['super_admin','admin','teacher'] },
      { to: '/admin/conduct',  icon: Shield,        labelKey: 'nav.conduct',  roles: ['super_admin','admin','teacher'] },
      { to: '/admin/leaves',   icon: Calendar,      labelKey: 'nav.leaves',   roles: ['super_admin','admin','hr_manager'] },
    ]
  },
  {
    labelKey: 'nav.group.content',
    items: [
      { to: '/admin/gallery',  icon: Image,      labelKey: 'nav.gallery',  roles: ADMIN_ONLY },
      { to: '/admin/exams',    icon: FileText,   labelKey: 'nav.exams',    roles: ['super_admin','admin','teacher'] },
      { to: '/admin/id-cards', icon: CreditCard, labelKey: 'nav.idCards',  roles: ['super_admin','admin'] },
    ]
  },
  {
    labelKey: 'nav.group.settings',
    items: [
      { to: '/admin/theme',    icon: Palette,   labelKey: 'nav.theme',      roles: ADMIN_ONLY },
      { to: '/admin/settings', icon: Settings,  labelKey: 'nav.settings',   roles: ADMIN_ONLY },
      { to: '/admin/users',    icon: Shield,    labelKey: 'nav.users',       roles: ADMIN_ONLY },
      { to: '/admin/billing',  icon: CreditCard,labelKey: 'nav.billing',     roles: ADMIN_ONLY },
      { to: '/admin/super',    icon: Globe,     labelKey: 'nav.superAdmin',  roles: SUPER_ONLY },
    ]
  },
]

const BREADCRUMB_KEYS: Record<string, string> = {
  '/admin':                'breadcrumb.dashboard',
  '/admin/students':       'breadcrumb.students',
  '/admin/employees':      'breadcrumb.employees',
  '/admin/attendance':     'breadcrumb.attendance',
  '/admin/grades':         'breadcrumb.grades',
  '/admin/fees':           'breadcrumb.fees',
  '/admin/buses':          'breadcrumb.buses',
  '/admin/messages':       'breadcrumb.messages',
  '/admin/announcements':  'breadcrumb.announcements',
  '/admin/schedule':       'breadcrumb.schedule',
  '/admin/news':           'breadcrumb.news',
  '/admin/events':         'breadcrumb.events',
  '/admin/reports':        'breadcrumb.reports',
  '/admin/pdf-reports':    'breadcrumb.pdfReports',
  '/admin/theme':          'breadcrumb.theme',
  '/admin/settings':       'breadcrumb.settings',
  '/admin/users':          'breadcrumb.users',
  '/admin/gallery':        'breadcrumb.gallery',
  '/admin/exams':          'breadcrumb.exams',
  '/admin/billing':        'breadcrumb.billing',
  '/admin/super':          'breadcrumb.superAdmin',
  '/admin/teacher':        'breadcrumb.teacher',
  '/admin/id-cards':       'breadcrumb.idCards',
  '/admin/library':        'breadcrumb.library',
  '/admin/homework':       'breadcrumb.homework',
  '/admin/conduct':        'breadcrumb.conduct',
  '/admin/leaves':         'breadcrumb.leaves',
}

export default function AdminLayout() {
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [notifOpen,     setNotifOpen]     = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { user, logout }                  = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { isDark, toggle: toggleDark }    = useDarkMode()
  const { t, lang, toggleLang, isRTL }   = useLanguage()

  const { data: unreadData } = useQuery({
    queryKey:       ['unread-count'],
    queryFn:        () => messagesApi.unreadCount().then(r => r.data),
    refetchInterval: 30000
  })
  const unreadCount = unreadData?.count || 0

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully')
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && !isInput) {
        e.preventDefault(); setShortcutsOpen(true)
      }
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

  const currentBreadcrumb = t(BREADCRUMB_KEYS[location.pathname] || '')

  const userRole = user?.role as AppRole
  const roleLabel = userRole && ROLE_LABELS[userRole]
    ? (lang === 'ar' ? ROLE_LABELS[userRole].ar : ROLE_LABELS[userRole].en)
    : (lang === 'ar' ? 'مستخدم' : 'User')

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight

  const canSeeItem = (item: MenuItem) => {
    if (!item.roles) return true
    return userRole && item.roles.includes(userRole)
  }
  const canSeeGroup = (group: MenuGroup) => {
    return group.items.some(item => canSeeItem(item))
  }

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
              <p className="font-black text-gray-800 text-sm leading-none truncate">
                {lang === 'ar' ? 'لوحة التحكم' : 'Control Panel'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">School Management</p>
            </div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          {sidebarOpen ? <ChevronIcon size={17} /> : <Menu size={17} />}
        </button>
      </div>

      {/* Search */}
      {sidebarOpen && (
        <div className="px-3 pt-3 pb-1">
          <button onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-400 text-sm transition-colors border border-gray-200 group">
            <Search size={14} />
            <span className="flex-1 text-right text-xs">{lang === 'ar' ? 'بحث سريع...' : 'Quick search...'}</span>
            <kbd className="text-[9px] font-mono bg-gray-200 text-gray-400 px-1.5 py-0.5 rounded border border-gray-300">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Role badge */}
      {sidebarOpen && userRole !== 'admin' && userRole !== 'super_admin' && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-xl text-xs font-bold text-center" style={{ background: 'var(--color-primary)12', color: 'var(--color-primary)' }}>
          {roleLabel}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
        {menuGroups.filter(canSeeGroup).map((group) => (
          <div key={group.labelKey} className="mb-1">
            {sidebarOpen && (
              <div className="flex items-center gap-2 px-3 py-1.5 mt-1.5">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {t(group.labelKey)}
                </span>
              </div>
            )}
            {group.items.filter(canSeeItem).map(item => {
              const label = t(item.labelKey)
              const isMessages = item.labelKey === 'nav.messages'
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={(item as any).end}
                  onClick={() => setMobileSidebar(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-150 relative ${
                      isActive
                        ? 'text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    } ${!sidebarOpen ? 'justify-center px-2' : ''}`
                  }
                  style={({ isActive }) => isActive ? { background: 'var(--color-primary)' } : {}}
                  title={!sidebarOpen ? label : undefined}
                >
                  <item.icon size={17} className="flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 truncate">{label}</span>
                      {isMessages && unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse flex-shrink-0">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                  {!sidebarOpen && isMessages && unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer links */}
      {sidebarOpen && (
        <div className="px-3 pb-2">
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all font-bold">
            <Globe size={14} />
            <span>{lang === 'ar' ? 'عرض الموقع العام' : 'View Public Site'}</span>
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
                <p className="text-[10px] text-gray-400">{roleLabel}</p>
              </div>
              <button onClick={handleLogout} title={t('common.logout')}
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
        <SessionWarning />

        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm z-10">
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors" onClick={() => setMobileSidebar(true)}>
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            <Home size={13} className="text-gray-400 flex-shrink-0" />
            <span className="text-gray-400 hidden sm:block text-xs">/</span>
            <span className="text-gray-400 hidden sm:block text-xs">{lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}</span>
            {currentBreadcrumb && (
              <>
                <span className="text-gray-300 text-xs">/</span>
                <span className="font-black text-gray-700 text-xs truncate">{currentBreadcrumb}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs transition-colors font-bold">
              <Search size={14} />
              <span>{t('common.search')}</span>
              <kbd className="text-[9px] font-mono bg-white text-gray-400 px-1 py-0.5 rounded border border-gray-200 shadow-sm">⌘K</kbd>
            </button>

            {/* Language toggle */}
            <button onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-black transition-all"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}>
              <span className={lang === 'ar' ? 'text-green-600' : 'text-gray-400'}>ع</span>
              <span className="text-gray-300 mx-0.5">|</span>
              <span className={lang === 'en' ? 'text-green-600' : 'text-gray-400'}>EN</span>
            </button>

            {/* Dark mode */}
            <button onClick={toggleDark}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-all hover:scale-110"
              title={isDark ? (lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}>
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* Notifications bell */}
            <div className="relative">
              <button onClick={() => setNotifOpen(o => !o)}
                className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                title={t('notif.title')}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onOpenShortcuts={() => setShortcutsOpen(true)} />
            </div>

            {/* View site */}
            <a href="/" target="_blank"
              className="hidden lg:flex p-2.5 rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
              title={lang === 'ar' ? 'عرض الموقع العام' : 'View Public Site'}>
              <Globe size={18} />
            </a>

            {/* User avatar */}
            <div className="flex items-center gap-2 pr-2 border-r border-gray-200 mr-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
                {user?.name?.[0]}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-black text-gray-700 leading-none">{user?.name?.split(' ')[0]}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{roleLabel}</p>
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
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
