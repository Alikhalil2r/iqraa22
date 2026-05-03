import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import {
  Inbox, Clock, CheckCircle, XCircle, AlertTriangle, Eye,
  ChevronRight, ChevronLeft, Filter, Search, X, Rocket,
  Globe, Smartphone, Palette, TrendingUp, Brain, Cloud,
  Phone, Mail, Building2, DollarSign, Calendar, FileText
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  new:         { label:'جديد',       color:'#7c3aed', bg:'#f3f0ff', Icon:Inbox },
  in_progress: { label:'قيد التنفيذ',color:'#2563eb', bg:'#eff6ff', Icon:Clock },
  approved:    { label:'موافق عليه', color:'#059669', bg:'#ecfdf5', Icon:CheckCircle },
  completed:   { label:'مكتمل',      color:'#16a34a', bg:'#f0fdf4', Icon:CheckCircle },
  rejected:    { label:'مرفوض',      color:'#dc2626', bg:'#fef2f2', Icon:XCircle },
  on_hold:     { label:'معلّق',      color:'#d97706', bg:'#fffbeb', Icon:AlertTriangle },
}
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label:'منخفضة', color:'#6b7280' },
  medium: { label:'متوسطة', color:'#d97706' },
  high:   { label:'عالية',  color:'#dc2626' },
  urgent: { label:'عاجل',   color:'#7c2d12' },
}
const SERVICE_ICONS: Record<string, React.ElementType> = { web:Globe, mobile:Smartphone, design:Palette, marketing:TrendingUp, ai:Brain, cloud:Cloud, other:Rocket }

function RequestDrawer({ req, onClose }: { req: any; onClose: () => void }) {
  const qc = useQueryClient()
  const [status, setStatus]   = useState(req.status)
  const [priority, setPriority] = useState(req.priority)
  const [notes, setNotes]     = useState(req.admin_notes || '')
  const [saving, setSaving]   = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await adminApi.patch(`/api/platform/admin/requests/${req.id}`, { status, priority, admin_notes: notes })
      qc.invalidateQueries({ queryKey: ['platform-requests'] })
      onClose()
    } finally { setSaving(false) }
  }

  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new
  const SvcIcon = SERVICE_ICONS[req.service_type] || Rocket

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold">{req.ticket_number}</p>
            <h3 className="font-black text-gray-800 text-base leading-tight mt-0.5">{req.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={16}/></button>
        </div>
        <div className="flex-1 p-5 space-y-5">
          {/* Client info */}
          <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
            <p className="text-xs font-black text-gray-500 mb-3">معلومات العميل</p>
            <div className="flex items-center gap-2 text-sm text-gray-700"><Mail size={14} className="text-gray-400"/>{req.client_email}</div>
            {req.client_phone   && <div className="flex items-center gap-2 text-sm text-gray-700"><Phone size={14} className="text-gray-400"/>{req.client_phone}</div>}
            {req.client_company && <div className="flex items-center gap-2 text-sm text-gray-700"><Building2 size={14} className="text-gray-400"/>{req.client_company}</div>}
          </div>
          {/* Service & budget */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <p className="text-xs text-purple-400 mb-1">نوع الخدمة</p>
              <div className="flex items-center gap-1.5"><SvcIcon size={14} className="text-purple-600"/><p className="text-sm font-black text-purple-700">{req.service_type}</p></div>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-400 mb-1">الميزانية</p>
              <p className="text-sm font-black text-blue-700">
                {req.budget_min || req.budget_max ? `${req.budget_min||0} - ${req.budget_max||'∞'} ر.ع` : 'لم تحدد'}
              </p>
            </div>
            {req.expected_date && (
              <div className="p-3 bg-green-50 rounded-xl col-span-2">
                <p className="text-xs text-green-400 mb-1">تاريخ التسليم المتوقع</p>
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-green-600"/><p className="text-sm font-black text-green-700">{new Date(req.expected_date).toLocaleDateString('ar-SA')}</p></div>
              </div>
            )}
          </div>
          {/* Description */}
          {req.description && (
            <div>
              <p className="text-xs font-black text-gray-500 mb-2">وصف المشروع</p>
              <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed">{req.description}</div>
            </div>
          )}
          {/* Status update */}
          <div>
            <p className="text-xs font-black text-gray-500 mb-2">تحديث الحالة</p>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field w-full text-sm">
              {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 mb-2">الأولوية</p>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="input-field w-full text-sm">
              {Object.entries(PRIORITY_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-black text-gray-500 mb-2">ملاحظات داخلية</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-field w-full text-sm" placeholder="ملاحظات للفريق الداخلي..."/>
          </div>
        </div>
        <div className="p-5 border-t border-gray-100">
          <button onClick={save} disabled={saving} className="w-full py-3 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : null}
            حفظ التحديثات
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RequestsAdmin() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [selected, setSelected] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['platform-requests', statusFilter, page],
    queryFn: () => adminApi.get(`/api/platform/admin/requests?status=${statusFilter}&page=${page}&limit=20`),
    staleTime: 30_000,
  })
  const requests: any[] = data?.requests || []
  const pages = data?.pages || 1
  const total = data?.total || 0

  const filtered = search
    ? requests.filter(r => r.client_name?.toLowerCase().includes(search.toLowerCase()) || r.title?.toLowerCase().includes(search.toLowerCase()) || r.ticket_number?.includes(search))
    : requests

  const { data: statsData } = useQuery({ queryKey:['platform-stats'], queryFn: () => adminApi.get('/api/platform/admin/stats'), staleTime:60_000 })
  const stats = statsData?.requests || {}

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">طلبات الخدمة</h1>
          <p className="text-gray-500 text-sm">{total} طلب إجمالي</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'طلبات جديدة',    val: stats.new_count || 0,    color:'#7c3aed', bg:'bg-purple-50' },
          { label:'قيد المعالجة',   val: stats.in_progress || 0,  color:'#2563eb', bg:'bg-blue-50' },
          { label:'مكتملة',         val: stats.completed || 0,    color:'#059669', bg:'bg-green-50' },
          { label:'إجمالي الطلبات', val: stats.total || 0,        color:'#374151', bg:'bg-gray-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
            <p className="text-2xl font-black" style={{ color:s.color }}>{s.val}</p>
            <p className="text-xs text-gray-500 mt-1 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute top-3 right-3 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم العميل أو رقم التذكرة..." className="input-field w-full pr-9 text-sm"/>
          {search && <button onClick={() => setSearch('')} className="absolute top-3 left-3 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
        </div>
        <div className="flex gap-1 flex-wrap">
          {[['all','الكل'], ...Object.entries(STATUS_CONFIG).map(([k,v]) => [k,v.label])].map(([k,lbl]) => (
            <button key={k} onClick={() => { setStatusFilter(k); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${statusFilter===k ? 'text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={statusFilter===k ? { background:'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto"/></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Inbox size={36} className="mx-auto mb-3 opacity-30"/>
            <p className="font-bold">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['رقم التذكرة','العميل','الخدمة','عنوان المشروع','الأولوية','الحالة','التاريخ',''].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-black text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(req => {
                  const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.new
                  const pc = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.medium
                  const SvcIcon = SERVICE_ICONS[req.service_type] || Rocket
                  const StatusIcon = sc.Icon
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-black text-purple-600">{req.ticket_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-800">{req.client_name}</p>
                        <p className="text-xs text-gray-400">{req.client_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <SvcIcon size={14} className="text-purple-500"/>
                          <span className="text-xs text-gray-600 font-bold">{req.service_type || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-48">
                        <p className="text-sm text-gray-700 font-bold truncate">{req.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-[11px] font-black" style={{ color:pc.color, background:pc.color+'15' }}>{pc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit" style={{ color:sc.color, background:sc.bg }}>
                          <StatusIcon size={12}/><span className="text-[11px] font-black">{sc.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(req)} className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"><Eye size={14}/></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"><ChevronRight size={16}/></button>
          <span className="text-sm font-bold text-gray-600">{page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"><ChevronLeft size={16}/></button>
        </div>
      )}

      {selected && <RequestDrawer req={selected} onClose={() => setSelected(null)}/>}
    </div>
  )
}
