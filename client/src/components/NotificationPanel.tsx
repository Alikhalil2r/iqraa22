import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { messagesApi, dashboardApi, eventsApi, feesApi } from '../api/client'
import {
  MessageSquare, AlertTriangle, CheckCircle,
  ChevronLeft, Bell, X, Keyboard, Calendar, DollarSign,
  GraduationCap, TrendingUp, Clock
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onOpenShortcuts?: () => void
}

export default function NotificationPanel({ open, onClose, onOpenShortcuts }: Props) {
  const { data: msgData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagesApi.unreadCount().then(r => r.data),
    staleTime: 30000
  })
  const { data: dashData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.stats().then(r => r.data),
    staleTime: 60000,
    enabled: open
  })
  const { data: eventsData } = useQuery({
    queryKey: ['events-upcoming-notif'],
    queryFn: () => eventsApi.list({ upcoming: true }).then(r => r.data),
    staleTime: 120000,
    enabled: open
  })
  const { data: feesData } = useQuery({
    queryKey: ['fees-stats-notif'],
    queryFn: () => feesApi.list({ status: 'unpaid' }).then(r => r.data),
    staleTime: 120000,
    enabled: open
  })

  if (!open) return null

  const unreadMessages = msgData?.count || 0
  const sAbs           = dashData?.todayAttendance?.students?.absent || 0
  const highAbsences   = sAbs > 5 ? sAbs : 0
  const overdueFeesCount = (feesData?.fees || []).filter((f: any) => {
    if (!f.due_date) return false
    return new Date(f.due_date) < new Date() && f.status !== 'paid'
  }).length
  const upcomingEvents = (eventsData?.events || []).filter((e: any) => {
    const d = new Date(e.start_date)
    const diff = (d.getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 3
  }).slice(0, 2)

  const sPct = (() => {
    const s = dashData?.todayAttendance?.students || {}
    const total = (s.present || 0) + (s.absent || 0) + (s.late || 0)
    return total > 0 ? Math.round((s.present || 0) / total * 100) : -1
  })()

  const notifications: { id: string; icon: any; iconBg: string; iconColor: string; title: string; sub: string; href: string; priority: number }[] = []

  if (unreadMessages > 0) notifications.push({
    id: 'msgs', icon: MessageSquare, iconBg: '#fee2e2', iconColor: '#ef4444',
    title: `${unreadMessages} رسالة غير مقروءة`,
    sub: 'من أولياء الأمور — اضغط للرد',
    href: '/admin/messages', priority: 3
  })

  if (highAbsences > 0) notifications.push({
    id: 'abs', icon: AlertTriangle, iconBg: '#fef3c7', iconColor: '#f59e0b',
    title: `${highAbsences} طالب غائب اليوم`,
    sub: 'يُنصح بمراجعة سجل الغياب',
    href: '/admin/attendance', priority: 2
  })

  if (overdueFeesCount > 0) notifications.push({
    id: 'fees', icon: DollarSign, iconBg: '#ffedd5', iconColor: '#f97316',
    title: `${overdueFeesCount} رسوم متأخرة`,
    sub: 'فواتير متأخرة السداد — أرسل تذكيراً',
    href: '/admin/fees', priority: 2
  })

  upcomingEvents.forEach((e: any) => {
    const diff = Math.round((new Date(e.start_date).getTime() - Date.now()) / 86400000)
    notifications.push({
      id: `ev-${e.id}`, icon: Calendar, iconBg: '#ede9fe', iconColor: '#8b5cf6',
      title: e.title,
      sub: diff === 0 ? 'الفعالية اليوم!' : diff === 1 ? 'غداً' : `خلال ${diff} أيام`,
      href: '/admin/events', priority: 1
    })
  })

  if (sPct >= 0 && sPct >= 90) notifications.push({
    id: 'att-good', icon: CheckCircle, iconBg: '#dcfce7', iconColor: '#10b981',
    title: `حضور ممتاز اليوم ${sPct}%`,
    sub: 'استمر في متابعة الحضور اليومي',
    href: '/admin/attendance', priority: 0
  })

  const allClear = notifications.length === 0
  const alertCount = notifications.filter(n => n.priority >= 2).length

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
        style={{ animation: 'slideIn .2s ease' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-gray-600" />
            <span className="text-sm font-black text-gray-800">الإشعارات</span>
            {alertCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Today summary bar */}
        {sPct >= 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span className="font-bold">حضور الطلاب اليوم</span>
                <span className="font-black" style={{ color: sPct >= 90 ? '#10b981' : sPct >= 70 ? '#f59e0b' : '#ef4444' }}>{sPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${sPct}%`, background: sPct >= 90 ? '#10b981' : sPct >= 70 ? '#f59e0b' : '#ef4444' }} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gray-400" />
              <span className="text-[10px] text-gray-400 font-bold">
                {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="max-h-72 overflow-y-auto">
          {allClear ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <p className="text-sm font-bold text-gray-600">كل شيء على ما يرام!</p>
              <p className="text-xs text-gray-400">لا توجد تنبيهات جديدة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map(n => (
                <Link key={n.id} to={n.href} onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: n.iconBg }}>
                    <n.icon size={18} style={{ color: n.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.sub}</p>
                  </div>
                  {n.priority >= 2 && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-red-400" />
                  )}
                  <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/60">
          <div className="flex items-center gap-3">
            <Link to="/admin/messages" onClick={onClose}
              className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1">
              الرسائل <ChevronLeft size={11} />
            </Link>
            <Link to="/admin/events" onClick={onClose}
              className="text-xs font-bold text-purple-500 hover:underline flex items-center gap-1">
              الفعاليات <ChevronLeft size={11} />
            </Link>
          </div>
          {onOpenShortcuts && (
            <button
              onClick={() => { onClose(); onOpenShortcuts() }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors font-bold"
            >
              <Keyboard size={12} /> اختصارات
            </button>
          )}
        </div>
      </div>
    </>
  )
}
