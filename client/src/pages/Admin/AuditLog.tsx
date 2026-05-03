import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, Search, Filter, RefreshCw, Download, ChevronLeft, ChevronRight, Eye, User, Clock } from 'lucide-react'
import { exportToCSV } from '../../components/ExportButton'

const API = (path: string) =>
  fetch(`/api${path}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json())

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'تسجيل دخول', LOGOUT: 'تسجيل خروج',
  CREATE_STUDENT: 'إضافة طالب', UPDATE_STUDENT: 'تعديل طالب', DELETE_STUDENT: 'حذف طالب',
  CREATE_EMPLOYEE: 'إضافة موظف', UPDATE_EMPLOYEE: 'تعديل موظف', DELETE_EMPLOYEE: 'حذف موظف',
  CREATE_GRADE: 'إضافة درجة', UPDATE_GRADE: 'تعديل درجة',
  CREATE_INVOICE: 'إنشاء فاتورة', PAY_INVOICE: 'سداد فاتورة',
  ENABLE_2FA: 'تفعيل 2FA', DISABLE_2FA: 'إلغاء 2FA',
  UPDATE_SETTINGS: 'تعديل الإعدادات', UPDATE_THEME: 'تعديل الثيم',
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#10b981', LOGOUT: '#6b7280',
  CREATE_STUDENT: '#3b82f6', UPDATE_STUDENT: '#f59e0b', DELETE_STUDENT: '#ef4444',
  CREATE_EMPLOYEE: '#3b82f6', UPDATE_EMPLOYEE: '#f59e0b', DELETE_EMPLOYEE: '#ef4444',
  ENABLE_2FA: '#10b981', DISABLE_2FA: '#f59e0b',
  CREATE_INVOICE: '#6366f1', PAY_INVOICE: '#10b981',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مشرف عام', admin: 'مدير', teacher: 'معلم',
  accountant: 'محاسب', librarian: 'أمين مكتبة', hr_manager: 'مدير موارد', guard: 'حارس',
}

function formatDateTime(dt: string) {
  return new Date(dt).toLocaleString('ar-SA', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

export default function AuditLog() {
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [filterAction, setAction] = useState('')
  const [fromDate, setFrom]       = useState('')
  const [toDate, setTo]           = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '50' })
  if (filterAction) params.set('action', filterAction)
  if (fromDate)     params.set('from', fromDate)
  if (toDate)       params.set('to', toDate)

  const logsQ = useQuery({
    queryKey: ['audit-logs', page, filterAction, fromDate, toDate],
    queryFn: () => API(`/audit?${params}`),
    staleTime: 30_000,
  })
  const statsQ = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => API('/audit/stats'),
    staleTime: 60_000,
  })
  const actionsQ = useQuery({
    queryKey: ['audit-actions'],
    queryFn: () => API('/audit/actions'),
    staleTime: 5 * 60_000,
  })

  const logs = (logsQ.data?.logs || []).filter((l: any) =>
    !search || l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  )
  const stats = statsQ.data || {}
  const total = logsQ.data?.total || 0
  const pages = logsQ.data?.pages || 1

  function handleExport() {
    exportToCSV(logs, [
      { key: 'created_at', label: 'التاريخ' }, { key: 'user_name', label: 'المستخدم' },
      { key: 'user_role', label: 'الدور' }, { key: 'action', label: 'الإجراء' },
      { key: 'entity_type', label: 'النوع' }, { key: 'description', label: 'الوصف' },
      { key: 'ip_address', label: 'IP' },
    ], 'سجل_النشاط')
  }

  return (
    <div className="space-y-6 animate-fadeUp">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Shield size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black">سجل النشاط</h1>
              <p className="text-blue-200 text-sm mt-0.5">Enterprise Audit Log — تتبع كامل لكل العمليات</p>
            </div>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-bold transition-all backdrop-blur">
            <Download size={14} /> تصدير CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجراءات اليوم', value: stats.today || 0, color: '#3b82f6', icon: <Clock size={18}/> },
          { label: 'إجراءات الأسبوع', value: stats.week || 0, color: '#6366f1', icon: <Shield size={18}/> },
          { label: 'الإجمالي', value: total, color: '#10b981', icon: <Eye size={18}/> },
          { label: 'أنواع الإجراءات', value: (actionsQ.data || []).length, color: '#f59e0b', icon: <Filter size={18}/> },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: s.color + '18', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">{s.label}</p>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px] relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
            className="input-field pr-9 py-2.5 text-sm w-full" />
        </div>
        <select value={filterAction} onChange={e => { setAction(e.target.value); setPage(1) }}
          className="input-field py-2.5 text-sm min-w-[160px]">
          <option value="">كل الإجراءات</option>
          {(actionsQ.data || []).map((a: string) => (
            <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="date" value={fromDate} onChange={e => { setFrom(e.target.value); setPage(1) }}
            className="input-field py-2.5 text-sm" />
          <input type="date" value={toDate} onChange={e => { setTo(e.target.value); setPage(1) }}
            className="input-field py-2.5 text-sm" />
        </div>
        {(filterAction || fromDate || toDate) && (
          <button onClick={() => { setAction(''); setFrom(''); setTo(''); setPage(1) }}
            className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
            مسح
          </button>
        )}
        <button onClick={() => logsQ.refetch()} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
          <RefreshCw size={15} className={`text-gray-500 ${logsQ.isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top active users */}
      {(stats.byUser || []).length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stats.byUser.map((u: any, i: number) => (
            <div key={u.user_name} className="card !py-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 flex-shrink-0">{i+1}</div>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-800 truncate">{u.user_name}</p>
                <p className="text-[10px] text-gray-400">{ROLE_LABELS[u.user_role] || u.user_role} · {u.count} إجراء</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <p className="font-black text-gray-700">السجلات</p>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold">{total.toLocaleString()} إجمالي</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                {['التاريخ','المستخدم','الدور','الإجراء','الوصف','IP'].map(h => (
                  <th key={h} className="table-header text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logsQ.isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={`al-skel-${i}`}>
                    {[...Array(6)].map((__, j) => (
                      <td key={`al-td-${j}`} className="table-cell"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <Shield size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">لا توجد سجلات</p>
                </td></tr>
              ) : logs.map((log: any) => {
                const color = ACTION_COLORS[log.action] || '#6b7280'
                return (
                  <tr key={log.id} className="table-row">
                    <td className="table-cell text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-gray-500" />
                        </div>
                        <span className="font-bold text-gray-800 text-sm">{log.user_name || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-bold">
                        {ROLE_LABELS[log.user_role] || log.user_role || '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs px-2 py-1 rounded-lg font-black"
                        style={{ background: color + '18', color }}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-600 max-w-[240px] truncate">{log.description || '—'}</td>
                    <td className="table-cell text-xs text-gray-400 font-mono">{log.ip_address || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500 font-bold">صفحة {page} من {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronRight size={15} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all">
                <ChevronLeft size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
