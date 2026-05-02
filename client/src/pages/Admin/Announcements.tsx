import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '../../api/client'
import {
  Megaphone, Send, Users, Clock, CheckCircle, AlertCircle,
  Sparkles, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const TEMPLATES = [
  { label: 'اجتماع أولياء الأمور', title: 'دعوة لاجتماع أولياء الأمور', body: 'يسرنا دعوتكم لحضور اجتماع أولياء الأمور الذي سيُعقد قريباً. يرجى الحضور في الموعد المحدد.' },
  { label: 'إجازة رسمية', title: 'إشعار بإجازة رسمية', body: 'تُعلمكم إدارة المدرسة بأن المدرسة ستكون في إجازة رسمية. نتمنى للجميع إجازة طيبة.' },
  { label: 'دفع الرسوم', title: 'تذكير بدفع الرسوم الدراسية', body: 'نذكركم بضرورة سداد الرسوم الدراسية في الموعد المحدد. لمزيد من المعلومات تواصلوا مع الإدارة.' },
  { label: 'فعالية مدرسية', title: 'دعوة لحضور فعالية مدرسية', body: 'يسعدنا دعوتكم لحضور الفعالية المدرسية القادمة. سيكون برنامجاً ثرياً يليق بأبنائنا الطلاب.' },
  { label: 'اختبارات قادمة', title: 'تنبيه: اختبارات نهاية الفصل', body: 'نُذكر أولياء الأمور الكرام بأن اختبارات نهاية الفصل ستبدأ قريباً. نرجو متابعة مذاكرة أبنائكم.' },
]

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'الآن'
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`
  return new Date(dateStr).toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Announcements() {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [lastResult, setLastResult] = useState<{ sentTo: number } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => messagesApi.broadcasts().then(r => r.data),
  })

  const sendMut = useMutation({
    mutationFn: () => messagesApi.broadcast({ title, body }),
    onSuccess: (res) => {
      const sent = res.data?.sentTo || 0
      setLastResult({ sentTo: sent })
      toast.success(`تم إرسال الإشعار لـ ${sent} ولي أمر بنجاح ✓`)
      setTitle('')
      setBody('')
      qc.invalidateQueries({ queryKey: ['broadcasts'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'حدث خطأ في الإرسال')
    }
  })

  const broadcasts = data?.broadcasts || []

  const handleTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitle(tpl.title)
    setBody(tpl.body)
    setShowTemplates(false)
  }

  const canSend = title.trim().length >= 3 && body.trim().length >= 10

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <Megaphone size={22} style={{ color: 'var(--color-primary)' }} />
          إشعارات أولياء الأمور
        </h1>
        <p className="text-sm text-gray-400 mt-1">إرسال إشعارات وتنبيهات مباشرة لجميع أولياء الأمور</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Compose Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-700 flex items-center gap-2">
                <Send size={16} style={{ color: 'var(--color-primary)' }} />
                إنشاء إشعار جديد
              </h2>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-all"
              >
                <Sparkles size={12} className="text-amber-500" />
                قوالب جاهزة
                {showTemplates ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
              </button>
            </div>

            {/* Templates */}
            {showTemplates && (
              <div className="mb-4 space-y-2 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs font-black text-amber-700 mb-2">اختر قالباً جاهزاً:</p>
                {TEMPLATES.map(tpl => (
                  <button
                    key={tpl.label}
                    onClick={() => handleTemplate(tpl)}
                    className="w-full text-right px-3 py-2 rounded-xl bg-white hover:bg-amber-50 border border-amber-100 text-sm font-bold text-gray-700 transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-600 mb-1.5 block">عنوان الإشعار *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="مثال: دعوة لاجتماع أولياء الأمور"
                  maxLength={300}
                  className="input-field w-full"
                />
                <p className="text-[10px] text-gray-400 mt-1">{title.length}/300</p>
              </div>
              <div>
                <label className="text-xs font-black text-gray-600 mb-1.5 block">نص الإشعار *</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="اكتب نص الإشعار هنا بالتفصيل..."
                  rows={5}
                  maxLength={2000}
                  className="input-field w-full resize-none leading-relaxed"
                />
                <p className="text-[10px] text-gray-400 mt-1">{body.length}/2000</p>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <AlertCircle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700 font-bold leading-relaxed">
                  سيُرسل هذا الإشعار فوراً لجميع أولياء الأمور المسجلين في المدرسة.
                  تأكد من صحة المحتوى قبل الإرسال.
                </p>
              </div>

              <button
                onClick={() => sendMut.mutate()}
                disabled={!canSend || sendMut.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMut.isPending ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {sendMut.isPending ? 'جارٍ الإرسال...' : 'إرسال لجميع أولياء الأمور'}
              </button>
            </div>
          </div>

          {/* Last result */}
          {lastResult && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="font-black text-green-800 text-sm">تم الإرسال بنجاح!</p>
                <p className="text-xs text-green-600">
                  وصل الإشعار إلى <span className="font-black">{lastResult.sentTo}</span> ولي أمر
                </p>
              </div>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-black text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              الإشعارات السابقة
              <span className="text-xs font-black px-2 py-0.5 rounded-xl bg-gray-100 text-gray-500 mr-auto">
                {broadcasts.length}
              </span>
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-3 border-gray-200 border-t-blue-500 animate-spin" />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-10">
                <Megaphone size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-bold">لا توجد إشعارات سابقة</p>
                <p className="text-xs text-gray-300">أرسل أول إشعار لأولياء الأمور</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {broadcasts.map((b: any) => (
                  <div key={b.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <p className="font-black text-gray-800 text-sm leading-snug truncate">{b.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{b.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        <Users size={9} />
                        {b.recipient_count} مستقبل
                      </span>
                      <span className="text-[10px] text-gray-400">{timeAgo(b.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
