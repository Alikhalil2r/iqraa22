import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import {
  Bell, MessageSquare, Calendar, BookOpen, CalendarCheck,
  DollarSign, CheckCheck, Megaphone, Info, Trash2, Clock, ClipboardList, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  message:      { icon: MessageSquare, color: '#3b82f6', bg: '#eff6ff', label: 'رسالة' },
  broadcast:    { icon: Megaphone,     color: '#8b5cf6', bg: '#f5f3ff', label: 'إشعار عام' },
  grade:        { icon: BookOpen,      color: '#10b981', bg: '#f0fdf4', label: 'نتائج' },
  attendance:   { icon: CalendarCheck, color: '#f59e0b', bg: '#fffbeb', label: 'حضور' },
  fee:          { icon: DollarSign,    color: '#ef4444', bg: '#fef2f2', label: 'رسوم' },
  homework:     { icon: ClipboardList, color: '#6366f1', bg: '#eef2ff', label: 'واجب' },
  conduct:      { icon: Shield,        color: '#14b8a6', bg: '#f0fdfa', label: 'سلوك' },
  event:        { icon: Calendar,      color: '#0ea5e9', bg: '#f0f9ff', label: 'فعالية' },
  announcement: { icon: Megaphone,     color: '#8b5cf6', bg: '#f5f3ff', label: 'إعلان' },
}

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || { icon: Info, color: '#6366f1', bg: '#f5f3ff', label: 'إشعار' }
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)   return 'الآن'
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`
  return new Date(dateStr).toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' })
}

function groupByDate(notifications: any[]) {
  const groups: Record<string, any[]> = {}
  notifications.forEach(n => {
    const d = new Date(n.created_at)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let key: string
    if (d.toDateString() === today.toDateString()) key = 'اليوم'
    else if (d.toDateString() === yesterday.toDateString()) key = 'أمس'
    else key = d.toLocaleDateString('ar-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(n)
  })
  return groups
}

export default function ParentNotifications() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['parent-notifications'],
    queryFn: () => parentApi.notifications().then(r => r.data),
    refetchInterval: 30000,
  })

  const readMut = useMutation({
    mutationFn: (id: string) => parentApi.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-notifications'] })
      qc.invalidateQueries({ queryKey: ['parent-dash'] })
    }
  })

  const readAllMut = useMutation({
    mutationFn: () => parentApi.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-notifications'] })
      qc.invalidateQueries({ queryKey: ['parent-dash'] })
      toast.success('تم تحديد جميع الإشعارات كمقروءة')
    }
  })

  const notifications = data?.notifications || []
  const unread = data?.unread || 0
  const groups = groupByDate(notifications)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Bell size={22} style={{ color: 'var(--color-accent)' }} />
            الإشعارات
            {unread > 0 && (
              <span className="text-sm font-black px-2.5 py-0.5 rounded-xl bg-red-100 text-red-600 animate-pulse">
                {unread} جديد
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-1">جميع إشعارات وتنبيهات المدرسة</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => readAllMut.mutate()}
            disabled={readAllMut.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <CheckCheck size={16} className="text-green-600" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Bell size={36} className="text-gray-300" />
          </div>
          <h3 className="font-black text-gray-500 text-lg mb-1">لا توجد إشعارات</h3>
          <p className="text-gray-400 text-sm">ستظهر هنا جميع إشعارات المدرسة والتنبيهات</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{date}</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="space-y-2">
                {items.map((n: any) => {
                  const cfg = getTypeConfig(n.type)
                  const Icon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.is_read) readMut.mutate(n.id)
                        if (n.link) navigate(n.link)
                      }}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                        !n.is_read
                          ? 'border-blue-100 bg-blue-50/50 hover:bg-blue-50'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ background: cfg.bg }}
                      >
                        <Icon size={18} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-bold text-sm leading-snug ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {n.title}
                          </p>
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={10} className="text-gray-300" />
                          <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                          {!n.is_read && (
                            <span className="text-[9px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">جديد</span>
                          )}
                        </div>
                      </div>
                      {!n.is_read && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <p className="text-center text-xs text-gray-400 pb-4">
          {notifications.length} إشعار — الإشعارات تُحفظ لمدة 30 يوم
        </p>
      )}
    </div>
  )
}
