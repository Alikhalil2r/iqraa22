import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { messagesApi, dashboardApi } from '../api/client'
import {
  MessageSquare, AlertTriangle, CheckCircle,
  ChevronLeft, Bell, X, Keyboard
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

  if (!open) return null

  const unreadMessages = msgData?.count || 0
  const sAbs           = dashData?.todayAttendance?.students?.absent || 0
  const highAbsences   = sAbs > 5 ? sAbs : 0
  const alertCount     = (unreadMessages > 0 ? 1 : 0) + (highAbsences > 0 ? 1 : 0)
  const allClear       = alertCount === 0

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute left-0 md:left-auto md:right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-gray-600" />
            <span className="text-sm font-black text-gray-800">الإشعارات</span>
            {alertCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {alertCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-[120px]">
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
              {unreadMessages > 0 && (
                <Link
                  to="/admin/messages" onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{unreadMessages} رسالة غير مقروءة</p>
                    <p className="text-xs text-gray-400 mt-0.5">من أولياء الأمور — اضغط للرد</p>
                  </div>
                  <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </Link>
              )}

              {highAbsences > 0 && (
                <Link
                  to="/admin/attendance" onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{highAbsences} طالب غائب اليوم</p>
                    <p className="text-xs text-gray-400 mt-0.5">يُنصح بمراجعة سجل الغياب</p>
                  </div>
                  <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50/60">
          <Link
            to="/admin/messages" onClick={onClose}
            className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
          >
            كل الرسائل <ChevronLeft size={11} />
          </Link>
          {onOpenShortcuts && (
            <button
              onClick={() => { onClose(); onOpenShortcuts() }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors font-bold"
            >
              <Keyboard size={12} /> الاختصارات
            </button>
          )}
        </div>
      </div>
    </>
  )
}
