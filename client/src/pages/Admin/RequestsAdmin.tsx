import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Inbox, Clock, CheckCircle, XCircle, AlertTriangle, Eye,
  ChevronRight, ChevronLeft, Filter, Search, X, Rocket,
  Globe, Smartphone, Palette, TrendingUp, Brain, Cloud,
  Phone, Mail, Building2, DollarSign, Calendar, FileText,
  Send, Star, History, MessageSquare, Copy, ExternalLink,
  Loader2, RefreshCw, Check, Badge
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  new:         { label:'جديد',        color:'#7c3aed', bg:'#f3f0ff', Icon:Inbox },
  in_progress: { label:'قيد التنفيذ', color:'#2563eb', bg:'#eff6ff', Icon:Clock },
  approved:    { label:'موافق عليه',  color:'#059669', bg:'#ecfdf5', Icon:CheckCircle },
  completed:   { label:'مكتمل',       color:'#16a34a', bg:'#f0fdf4', Icon:CheckCircle },
  rejected:    { label:'مرفوض',       color:'#dc2626', bg:'#fef2f2', Icon:XCircle },
  on_hold:     { label:'معلّق',       color:'#d97706', bg:'#fffbeb', Icon:AlertTriangle },
  cancelled:   { label:'ملغي',        color:'#6b7280', bg:'#f3f4f6', Icon:XCircle },
}
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label:'منخفضة', color:'#6b7280' },
  medium: { label:'متوسطة', color:'#d97706' },
  high:   { label:'عالية',  color:'#dc2626' },
  urgent: { label:'عاجل',   color:'#7c2d12' },
}
const SERVICE_ICONS: Record<string, React.ElementType> = { web:Globe, mobile:Smartphone, design:Palette, marketing:TrendingUp, ai:Brain, cloud:Cloud, other:Rocket }
const SERVICE_LABEL: Record<string, string> = { web:'تطوير موقع', mobile:'تطبيق جوال', design:'تصميم UI/UX', marketing:'تسويق رقمي', ai:'ذكاء اصطناعي', cloud:'حوسبة سحابية', other:'أخرى' }

function formatDate(d: string) { return new Date(d).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) }

// ─── Request Drawer ───────────────────────────────────────────────────────────
function RequestDrawer({ req, onClose }: { req: any; onClose: () => void }) {
  const { user }  = useAuth()
  const qc        = useQueryClient()
  const msgEnd    = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<'info' | 'messages' | 'history'>('info')
  const [status,   setStatus]   = useState(req.status)
  const [priority, setPriority] = useState(req.priority || 'medium')
  const [notes,    setNotes]    = useState(req.admin_notes || '')
  const [msgText,  setMsgText]  = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch messages
  const { data: messages = [], refetch: refetchMsgs } = useQuery({
    queryKey: ['ticket-messages', req.id],
    queryFn: () => adminApi.get(`/api/platform/admin/tickets/${req.id}/messages`),
    enabled: tab === 'messages',
    refetchInterval: tab === 'messages' ? 10000 : false,
  })

  // Fetch history
  const { data: history = [] } = useQuery({
    queryKey: ['ticket-history', req.id],
    queryFn: () => adminApi.get(`/api/platform/admin/tickets/${req.id}/history`),
    enabled: tab === 'history',
  })

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const save = useMutation({
    mutationFn: () => adminApi.patch(`/api/platform/admin/requests/${req.id}`, { status, priority, admin_notes: notes }),
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['platform-requests'] }) }
  })

  const sendMsg = useMutation({
    mutationFn: () => adminApi.post(`/api/platform/admin/tickets/${req.id}/messages`, {
      content: msgText, sender_type: 'admin', sender_name: user?.name || 'الإدارة',
      is_internal: isInternal
    }),
    onSuccess: () => { setMsgText(''); refetchMsgs() }
  })

  const copyLink = () => {
    const url = `${window.location.origin}/platform/track/${req.ticket_number}?email=${encodeURIComponent(req.client_email || '')}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('تم نسخ رابط التتبع')
  }

  const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new
  const SvcIcon = SERVICE_ICONS[req.service_type] || Rocket

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="w-full max-w-2xl bg-white h-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-sm font-black text-violet-600">{req.ticket_number}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black" style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              {req.priority && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black" style={{ background: (PRIORITY_CONFIG[req.priority]?.color || '#6b7280') + '18', color: PRIORITY_CONFIG[req.priority]?.color || '#6b7280' }}>
                  {PRIORITY_CONFIG[req.priority]?.label}
                </span>
              )}
            </div>
            <h3 className="font-black text-gray-800 text-base leading-tight line-clamp-2">{req.title}</h3>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={copyLink} title="نسخ رابط التتبع للعميل"
              className="p-2 rounded-xl bg-gray-100 hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors">
              {copied ? <Check size={14} className="text-emerald-600"/> : <Copy size={14}/>}
            </button>
            <a href={`/platform/track/${req.ticket_number}?email=${encodeURIComponent(req.client_email || '')}`} target="_blank" rel="noreferrer"
              className="p-2 rounded-xl bg-gray-100 hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors" title="فتح صفحة التتبع">
              <ExternalLink size={14}/>
            </a>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
              <X size={14}/>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([['info','التفاصيل', FileText], ['messages','المحادثة', MessageSquare], ['history','السجل', History]] as const).map(([t, lbl, Icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black transition-colors border-b-2 ${
                tab === t ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              <Icon size={14}/> {lbl}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <div className="p-5 space-y-5">
              {/* Client */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs font-black text-gray-500 mb-3">معلومات العميل</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {req.client_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-sm text-gray-800">{req.client_name}</p>
                    {req.client_company && <p className="text-xs text-gray-400">{req.client_company}</p>}
                  </div>
                </div>
                <div className="space-y-1.5 mt-3">
                  <a href={`mailto:${req.client_email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600 transition-colors">
                    <Mail size={13} className="text-gray-400"/>{req.client_email}
                  </a>
                  {req.client_phone && (
                    <a href={`tel:${req.client_phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600 transition-colors">
                      <Phone size={13} className="text-gray-400"/>{req.client_phone}
                    </a>
                  )}
                </div>
                <button onClick={copyLink}
                  className="mt-3 w-full py-2 rounded-xl border border-violet-200 text-violet-600 text-xs font-black hover:bg-violet-50 transition-colors flex items-center justify-center gap-1.5">
                  {copied ? <Check size={12}/> : <Copy size={12}/>}
                  {copied ? 'تم النسخ!' : 'نسخ رابط التتبع للعميل'}
                </button>
              </div>

              {/* Service & Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-violet-50 rounded-xl">
                  <p className="text-xs text-violet-400 mb-1">نوع الخدمة</p>
                  <div className="flex items-center gap-1.5">
                    <SvcIcon size={13} className="text-violet-600"/>
                    <p className="text-sm font-black text-violet-700">{SERVICE_LABEL[req.service_type] || req.service_type || '—'}</p>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-400 mb-1">الميزانية</p>
                  <p className="text-sm font-black text-blue-700">
                    {req.budget_min || req.budget_max ? `${req.budget_min||0} — ${req.budget_max||'∞'} ر.ع` : 'لم تحدد'}
                  </p>
                </div>
                {req.expected_date && (
                  <div className="p-3 bg-green-50 rounded-xl col-span-2">
                    <p className="text-xs text-green-400 mb-1">تاريخ التسليم المتوقع</p>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-green-600"/>
                      <p className="text-sm font-black text-green-700">{new Date(req.expected_date).toLocaleDateString('ar-SA')}</p>
                    </div>
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

              {/* Rating */}
              {req.client_rating && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-xs font-black text-amber-600 mb-2">تقييم العميل</p>
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(n => <Star key={n} size={16} className={n<=req.client_rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}/>)}
                  </div>
                  {req.client_feedback && <p className="text-xs text-gray-600 italic">"{req.client_feedback}"</p>}
                </div>
              )}

              {/* Edit Controls */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-black text-gray-500 mb-1.5">تحديث الحالة</p>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400">
                    {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 mb-1.5">الأولوية</p>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400">
                    {Object.entries(PRIORITY_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-500 mb-1.5">ملاحظات داخلية</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 resize-none"
                    placeholder="ملاحظات للفريق فقط (غير مرئية للعميل)..."/>
                </div>
              </div>
            </div>
          )}

          {/* ── MESSAGES TAB ── */}
          {tab === 'messages' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {(messages as any[]).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <MessageSquare size={36} className="mb-2 opacity-30"/>
                    <p className="text-sm font-bold">لا توجد رسائل بعد</p>
                    <p className="text-xs mt-1">راسل العميل مباشرة من هنا</p>
                  </div>
                ) : (messages as any[]).map((msg: any) => {
                  const isAdmin = msg.sender_type === 'admin'
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                        msg.is_internal ? 'bg-amber-50 border border-amber-200' :
                        isAdmin ? 'bg-violet-600 text-white' : 'bg-gray-100'
                      }`}>
                        <p className={`text-[10px] font-black mb-1 ${
                          isAdmin && !msg.is_internal ? 'text-violet-200' : 'text-gray-400'
                        }`}>
                          {msg.sender_name}{msg.is_internal && ' 🔒 داخلي'}
                        </p>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin && !msg.is_internal ? 'text-violet-300' : 'text-gray-400'}`}>
                          {formatDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={msgEnd}/>
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-4 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded accent-amber-500"/>
                  🔒 ملاحظة داخلية (غير مرئية للعميل)
                </label>
                <div className="flex gap-2">
                  <input
                    value={msgText} onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey && msgText.trim()) { e.preventDefault(); sendMsg.mutate() } }}
                    placeholder={isInternal ? 'ملاحظة داخلية للفريق...' : 'رد على العميل...'}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                  <button onClick={() => msgText.trim() && sendMsg.mutate()} disabled={!msgText.trim() || sendMsg.isPending}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white transition-colors flex items-center gap-1.5">
                    {sendMsg.isPending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <div className="p-5 space-y-1">
              {/* Created */}
              <div className="flex gap-3 pb-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Inbox size={14} className="text-violet-600"/>
                  </div>
                  {history.length > 0 && <div className="w-0.5 flex-1 bg-gray-100 mt-1"/>}
                </div>
                <div className="pb-2 flex-1">
                  <p className="text-sm font-bold text-gray-800">تم إنشاء الطلب</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(req.created_at)}</p>
                </div>
              </div>

              {(history as any[]).map((h: any, i: number) => (
                <div key={i} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <History size={14} className="text-gray-500"/>
                    </div>
                    {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1"/>}
                  </div>
                  <div className="pb-2 flex-1">
                    <p className="text-sm font-bold text-gray-800">{h.note || `تغيير ${h.field}`}</p>
                    {h.old_value && h.new_value && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        من <span className="font-bold">{h.old_value}</span> إلى <span className="font-bold text-violet-600">{h.new_value}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.created_at)} · {h.changed_by || 'الإدارة'}</p>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <History size={32} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">لا يوجد سجل تغييرات</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'info' && (
          <div className="p-5 border-t border-gray-100 flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-sm text-gray-700 transition-colors">إغلاق</button>
            <button onClick={() => save.mutate()} disabled={save.isPending}
              className="flex-1 py-3 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              {save.isPending ? <Loader2 size={14} className="animate-spin"/> : null}
              حفظ التحديثات
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RequestsAdmin() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [selected, setSelected] = useState<any>(null)

  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['platform-requests', statusFilter, page],
    queryFn: () => adminApi.get(`/api/platform/admin/requests?status=${statusFilter}&page=${page}&limit=20`),
    staleTime: 30_000,
  })
  const requests: any[] = data?.requests || []
  const pages = data?.pages || 1
  const total = data?.total || 0

  const filtered = search
    ? requests.filter(r =>
        r.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.ticket_number?.includes(search.toUpperCase()))
    : requests

  const { data: statsData } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => adminApi.get('/api/platform/admin/stats'),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
  const stats = statsData?.requests || {}

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Inbox size={24} className="text-violet-600"/> طلبات الخدمة
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} طلب إجمالي · آخر تحديث {new Date().toLocaleTimeString('ar-SA', {hour:'2-digit',minute:'2-digit'})}</p>
        </div>
        <button onClick={() => refetch()} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors" title="تحديث">
          <RefreshCw size={16}/>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'جديد',           val: stats.new_count  || 0, color:'#7c3aed', bg:'bg-purple-50 border-purple-100' },
          { label:'قيد المعالجة',   val: stats.in_progress||0,  color:'#2563eb', bg:'bg-blue-50 border-blue-100' },
          { label:'مكتملة',         val: stats.completed  ||0,  color:'#059669', bg:'bg-green-50 border-green-100' },
          { label:'الإجمالي',       val: stats.total      ||0,  color:'#374151', bg:'bg-gray-50 border-gray-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border`}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.val}</p>
            <p className="text-xs text-gray-500 mt-1 font-bold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute top-3 right-3.5 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو رقم التذكرة أو العنوان..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"/>
          {search && <button onClick={() => setSearch('')} className="absolute top-3 left-3 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
        </div>
        <div className="flex gap-1 flex-wrap">
          {[['all','الكل'], ...Object.entries(STATUS_CONFIG).map(([k,v]) => [k, v.label])].map(([k, lbl]) => (
            <button key={k} onClick={() => { setStatusFilter(k); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                statusFilter === k ? 'text-white shadow-sm shadow-violet-600/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={statusFilter === k ? { background:'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-violet-600 rounded-full animate-spin mx-auto"/>
          </div>
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
                  {['التذكرة','العميل','الخدمة','المشروع','الأولوية','الحالة','تاريخ',''].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-black text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(req => {
                  const sc  = STATUS_CONFIG[req.status] || STATUS_CONFIG.new
                  const pc  = PRIORITY_CONFIG[req.priority] || PRIORITY_CONFIG.medium
                  const SvcI = SERVICE_ICONS[req.service_type] || Rocket
                  const SI   = sc.Icon
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-black text-violet-600">{req.ticket_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-800">{req.client_name}</p>
                        <p className="text-xs text-gray-400">{req.client_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <SvcI size={13} className="text-violet-500"/>
                          <span className="text-xs text-gray-600 font-bold">{SERVICE_LABEL[req.service_type] || req.service_type || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-52">
                        <p className="text-sm text-gray-700 font-bold truncate">{req.title}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-[11px] font-black" style={{ color:pc.color, background:pc.color+'15' }}>{pc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg w-fit text-[11px] font-black" style={{ color:sc.color, background:sc.bg }}>
                          <SI size={11}/> {sc.label}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(req.created_at).toLocaleDateString('ar-SA')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(req)}
                          className="p-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                          <Eye size={14}/>
                        </button>
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
