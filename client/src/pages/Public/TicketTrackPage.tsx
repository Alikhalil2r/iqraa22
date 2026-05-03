import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Search, ArrowRight, CheckCircle2, Clock, Circle, Loader2,
  AlertCircle, Send, Star, MessageSquare, History, Phone, Mail,
  Globe, Smartphone, Palette, TrendingUp, Brain, Cloud, Rocket,
  ChevronRight, RefreshCw
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  new:         { label: 'جديد — في انتظار المراجعة',  color: '#8b5cf6', icon: Circle,       desc: 'تم استلام طلبك وسيتم مراجعته قريباً' },
  in_progress: { label: 'قيد التنفيذ',                color: '#f59e0b', icon: Loader2,      desc: 'يعمل فريقنا على طلبك الآن' },
  approved:    { label: 'تم الموافقة',                color: '#3b82f6', icon: CheckCircle2, desc: 'تمت الموافقة على طلبك وسيبدأ العمل قريباً' },
  completed:   { label: 'مكتمل',                      color: '#10b981', icon: CheckCircle2, desc: 'تم إنجاز طلبك بنجاح' },
  on_hold:     { label: 'في الانتظار',                color: '#6b7280', icon: Clock,        desc: 'طلبك في الانتظار مؤقتاً' },
  rejected:    { label: 'مرفوض',                      color: '#ef4444', icon: AlertCircle,  desc: 'لم يتم قبول الطلب' },
}
const STEPS = ['new', 'approved', 'in_progress', 'completed']
const SVC_ICONS: Record<string, any> = { web: Globe, mobile: Smartphone, design: Palette, marketing: TrendingUp, ai: Brain, cloud: Cloud }
const SVC_LABEL: Record<string, string> = { web: 'تطوير موقع', mobile: 'تطبيق جوال', design: 'تصميم UI/UX', marketing: 'تسويق رقمي', ai: 'ذكاء اصطناعي', cloud: 'حوسبة سحابية' }

function formatDate(d: string) { return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }

// ─── Lookup Form ──────────────────────────────────────────────────────────────
function LookupForm() {
  const navigate = useNavigate()
  const [ticket, setTicket] = useState('')
  const [email,  setEmail]  = useState('')
  const [err,    setErr]    = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket.trim()) { setErr('أدخل رقم التذكرة'); return }
    setErr('')
    const path = `/track/${ticket.trim().toUpperCase()}${email ? `?email=${encodeURIComponent(email)}` : ''}`
    navigate(path)
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-black text-xl">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs">&lt;/&gt;</span>
            اكسبو التقنية
          </Link>
          <Link to="/request" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold transition-colors">ابدأ مشروعاً جديداً</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-violet-600/30">
              <Search size={36} className="text-white"/>
            </div>
            <h1 className="text-3xl font-black mb-3">تتبع طلبك</h1>
            <p className="text-gray-400">أدخل رقم التذكرة لمتابعة حالة طلبك والتواصل مع الفريق</p>
          </div>

          <form onSubmit={submit} className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">رقم التذكرة *</label>
              <input
                value={ticket}
                onChange={e => setTicket(e.target.value)}
                placeholder="TKT-2026-XXXXX"
                dir="ltr"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 font-mono text-lg transition-all text-center tracking-widest"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">بريدك الإلكتروني (اختياري — للتحقق)</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="your@email.com"
                dir="ltr"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
            {err && <p className="text-red-400 text-sm text-center">{err}</p>}
            <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-black text-lg transition-all hover:shadow-lg hover:shadow-violet-600/30 flex items-center justify-center gap-2">
              <Search size={20}/> متابعة الطلب
            </button>
          </form>

          <div className="mt-6 p-5 rounded-2xl bg-white/3 border border-white/8">
            <p className="text-xs text-gray-500 text-center mb-3 font-bold">لم تتقدم بطلب بعد؟</p>
            <Link to="/request" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors text-sm font-bold">
              <Rocket size={15}/> قدّم طلبك الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ ticket, email, onDone }: { ticket: string; email: string; onDone: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover,  setHover]  = useState(0)
  const [feedback, setFeedback] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!rating) return
    await fetch(`${API}/api/platform/track/${ticket}/rate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, rating, feedback })
    })
    setDone(true)
    setTimeout(onDone, 2000)
  }

  if (done) return (
    <div className="text-center py-4">
      <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400"/>
      <p className="font-bold text-emerald-400">شكراً على تقييمك!</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}
            className="text-3xl transition-transform hover:scale-110">
            <Star size={32} className={`transition-colors ${n <= (hover||rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`}/>
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
            placeholder="أخبرنا رأيك في الخدمة..."
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
          />
          <button onClick={submit} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-sm transition-colors">
            إرسال التقييم
          </button>
        </>
      )}
    </div>
  )
}

// ─── Ticket Detail ────────────────────────────────────────────────────────────
function TicketDetail() {
  const { ticket } = useParams<{ ticket: string }>()
  const navigate   = useNavigate()
  const params     = new URLSearchParams(window.location.search)
  const email      = params.get('email') || ''

  const [msgText, setMsgText]     = useState('')
  const [sending, setSending]     = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [tab, setTab] = useState<'messages' | 'history'>('messages')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['ticket-track', ticket, email],
    queryFn: async () => {
      const url = `${API}/api/platform/track/${ticket}${email ? `?email=${encodeURIComponent(email)}` : ''}`
      const r = await fetch(url)
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Not found') }
      return r.json()
    },
    refetchInterval: 30000
  })

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgText.trim() || sending) return
    setSending(true)
    try {
      const r = await fetch(`${API}/api/platform/track/${ticket}/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: data?.client_name, content: msgText })
      })
      if (r.ok) { setMsgText(''); refetch() }
    } finally { setSending(false) }
  }

  if (isLoading) return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin mx-auto"/>
        <p className="text-gray-400">جارٍ تحميل التذكرة...</p>
      </div>
    </div>
  )

  if (isError || !data) return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-sm">
        <AlertCircle size={64} className="mx-auto mb-4 text-red-400"/>
        <h2 className="text-xl font-black mb-2">التذكرة غير موجودة</h2>
        <p className="text-gray-400 mb-6 text-sm">تأكد من رقم التذكرة والبريد الإلكتروني</p>
        <button onClick={() => navigate('/track')} className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold transition-colors">
          المحاولة مرة أخرى
        </button>
      </div>
    </div>
  )

  const st = STATUS[data.status] || STATUS.new
  const StIcon = st.icon
  const SvcIcon = SVC_ICONS[data.service_type] || Rocket
  const stepIdx = STEPS.indexOf(data.status)

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/track')} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
              <ArrowRight size={18}/>
            </button>
            <Link to="/" className="flex items-center gap-2 font-black text-lg">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-[10px]">&lt;/&gt;</span>
              اكسبو التقنية
            </Link>
          </div>
          <button onClick={() => refetch()} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="تحديث">
            <RefreshCw size={16}/>
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 space-y-5">
        {/* Header Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-black text-violet-400">{data.ticket_number}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black" style={{ background: st.color + '20', color: st.color }}>
                  {st.label}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black leading-snug mb-1">{data.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                <span className="flex items-center gap-1.5"><SvcIcon size={13}/> {SVC_LABEL[data.service_type] || data.service_type}</span>
                <span>·</span>
                <span>مقدم {formatDate(data.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-sm">
                {data.client_name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm">{data.client_name}</p>
                <p className="text-xs text-gray-400">{data.client_email}</p>
              </div>
            </div>
          </div>

          {/* Status Description */}
          <div className="mt-4 p-4 rounded-2xl border flex items-center gap-3" style={{ background: st.color + '10', borderColor: st.color + '30' }}>
            <StIcon size={18} style={{ color: st.color }} className={data.status === 'in_progress' ? 'animate-spin' : ''}/>
            <p className="text-sm font-bold" style={{ color: st.color }}>{st.desc}</p>
          </div>
        </div>

        {/* Progress Stepper */}
        {data.status !== 'rejected' && (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
            <p className="text-xs font-black text-gray-400 mb-5">مراحل الطلب</p>
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const sc = STATUS[step]
                const done = stepIdx >= i
                const current = stepIdx === i
                return (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        done ? 'border-violet-500 bg-violet-600' : 'border-white/20 bg-white/5'
                      } ${current ? 'ring-4 ring-violet-500/30' : ''}`}>
                        {done ? <CheckCircle2 size={18} className="text-white"/> : <Circle size={18} className="text-gray-600"/>}
                      </div>
                      <p className={`text-[10px] font-black text-center max-w-[70px] ${done ? 'text-violet-300' : 'text-gray-600'}`}>
                        {sc.label.split(' — ')[0]}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${i < stepIdx ? 'bg-violet-500' : 'bg-white/10'}`}/>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Messages + History */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mb-3">
              {([['messages', 'المحادثة', MessageSquare], ['history', 'سجل التغييرات', History]] as const).map(([t, lbl, Icon]) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    tab === t ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-gray-400 hover:text-white'
                  }`}>
                  <Icon size={14}/> {lbl}
                </button>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl flex flex-col overflow-hidden" style={{ minHeight: '420px' }}>
              {tab === 'messages' ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '350px' }}>
                    {(data.messages || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500">
                        <MessageSquare size={36} className="mb-2 opacity-30"/>
                        <p className="text-sm">لا توجد رسائل بعد</p>
                        <p className="text-xs mt-1">يمكنك مراسلة الفريق من هنا</p>
                      </div>
                    ) : (data.messages as any[]).map((msg: any) => {
                      const isAdmin = msg.sender_type === 'admin'
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            isAdmin
                              ? 'bg-white/10 border border-white/10'
                              : 'bg-violet-600'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-black ${isAdmin ? 'text-violet-300' : 'text-violet-200'}`}>
                                {isAdmin ? '🎯 فريق اكسبو' : '👤 أنت'}
                              </span>
                              <span className="text-[10px] text-gray-500">{formatDate(msg.created_at)}</span>
                            </div>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Message Input */}
                  {data.status !== 'completed' && data.status !== 'rejected' && (
                    <div className="border-t border-white/10 p-4">
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                          value={msgText} onChange={e => setMsgText(e.target.value)}
                          placeholder="اكتب رسالتك للفريق..."
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-all"
                        />
                        <button type="submit" disabled={!msgText.trim() || sending}
                          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition-colors flex items-center gap-2 text-sm font-bold">
                          {sending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              ) : (
                /* History */
                <div className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: '450px' }}>
                  {(data.history || []).length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <History size={36} className="mx-auto mb-2 opacity-30"/>
                      <p className="text-sm">لا يوجد سجل تغييرات بعد</p>
                    </div>
                  ) : (data.history as any[]).map((h: any, i: number) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"/>
                        {i < data.history.length - 1 && <div className="w-0.5 flex-1 bg-white/10 mt-1"/>}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-white font-bold">{h.note || `تم تغيير ${h.field} إلى "${h.new_value}"`}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(h.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            {/* Request Info */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-xs font-black text-gray-400">تفاصيل الطلب</p>
              {[
                { label: 'الخدمة', value: SVC_LABEL[data.service_type] || data.service_type || '—' },
                { label: 'الميزانية', value: data.budget_min || data.budget_max ? `${data.budget_min || 0} — ${data.budget_max || '∞'} ر.ع` : 'لم تحدد' },
                { label: 'التاريخ المتوقع', value: data.expected_date ? new Date(data.expected_date).toLocaleDateString('ar-SA') : 'غير محدد' },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {data.description && (
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
                <p className="text-xs font-black text-gray-400 mb-2">وصف المشروع</p>
                <p className="text-sm text-gray-300 leading-relaxed">{data.description}</p>
              </div>
            )}

            {/* Rating — only when completed and not rated */}
            {data.status === 'completed' && !data.client_rating && !showRating && (
              <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-5">
                <p className="text-sm font-black text-amber-300 mb-1">⭐ قيّم خدمتنا</p>
                <p className="text-xs text-gray-400 mb-4">رأيك يساعدنا على التحسين المستمر</p>
                <button onClick={() => setShowRating(true)} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-900 font-black text-sm transition-colors">
                  أضف تقييمك
                </button>
              </div>
            )}
            {data.status === 'completed' && !data.client_rating && showRating && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-sm font-black mb-4">قيّم تجربتك</p>
                <StarRating ticket={ticket!} email={email} onDone={() => { setShowRating(false); refetch() }}/>
              </div>
            )}
            {data.client_rating && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-4 text-center">
                <p className="text-xs text-emerald-400 font-bold mb-2">تقييمك</p>
                <div className="flex justify-center gap-1 mb-2">
                  {[1,2,3,4,5].map(n => <Star key={n} size={20} className={n <= data.client_rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}/>)}
                </div>
                {data.client_feedback && <p className="text-xs text-gray-400">"{data.client_feedback}"</p>}
              </div>
            )}

            {/* New Request CTA */}
            <Link to="/request" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors text-sm font-bold">
              <Rocket size={15}/> قدّم طلباً جديداً
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function TicketTrackPage() {
  const { ticket } = useParams<{ ticket?: string }>()
  if (ticket) return <TicketDetail/>
  return <LookupForm/>
}
