import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { MessageSquare, Send, Plus, X, User } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_LABEL: Record<string, string> = {
  admin: 'الإدارة',
  teacher: 'معلم/ة',
}

export default function ParentMessages() {
  const [compose, setCompose] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [newMsg, setNewMsg] = useState({ toUserId: '', subject: '', body: '', priority: 'normal' })
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['parent-messages'],
    queryFn: () => parentApi.messages().then(r => r.data),
    refetchInterval: 30000
  })

  const { data: recipientsData } = useQuery({
    queryKey: ['parent-message-recipients'],
    queryFn: () => parentApi.messageRecipients().then(r => r.data),
    enabled: compose
  })

  const { data: threadData } = useQuery({
    queryKey: ['parent-message-thread', selected?.id],
    queryFn: () => selected ? parentApi.getMessage(selected.id).then(r => r.data) : null,
    enabled: !!selected,
    refetchInterval: 15000
  })

  const sendMut = useMutation({
    mutationFn: () => parentApi.sendMessage(newMsg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-messages'] })
      qc.invalidateQueries({ queryKey: ['parent-dash'] })
      setCompose(false)
      setNewMsg({ toUserId: '', subject: '', body: '', priority: 'normal' })
      toast.success('تم إرسال رسالتك بنجاح')
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'حدث خطأ في الإرسال')
  })

  const replyMut = useMutation({
    mutationFn: (body: string) => parentApi.replyMessage(selected!.id, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parent-messages'] })
      qc.invalidateQueries({ queryKey: ['parent-message-thread', selected?.id] })
      setReplyText('')
      toast.success('تم إرسال الرد')
    },
    onError: () => toast.error('حدث خطأ في إرسال الرد')
  })

  const handleSelect = async (msg: any) => {
    setSelected(msg)
    if (!msg.is_read && msg.from_role !== 'parent') {
      await parentApi.markMessageRead(msg.id)
      qc.invalidateQueries({ queryKey: ['parent-messages'] })
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try { await replyMut.mutateAsync(replyText) }
    finally { setSending(false) }
  }

  const messages = data?.messages || []
  const recipients = recipientsData?.recipients || []
  const thread = threadData?.message
  const replies = threadData?.replies || []

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><MessageSquare size={22}/>الرسائل</h1>
          <p className="text-sm text-gray-400 mt-1">التواصل مع الإدارة والمعلمين</p>
        </div>
        <button onClick={() => setCompose(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm" style={{background:'var(--color-accent)'}}>
          <Plus size={16}/>رسالة جديدة
        </button>
      </div>

      {compose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCompose(false)}/>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-black text-gray-800">رسالة جديدة</h3>
              <button onClick={() => setCompose(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">المستلم</label>
                <select
                  className="input-field"
                  value={newMsg.toUserId}
                  onChange={e => setNewMsg({ ...newMsg, toUserId: e.target.value })}
                >
                  <option value="">الإدارة (افتراضي)</option>
                  {recipients.filter((r: any) => r.role === 'teacher').map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name} — {ROLE_LABEL[r.role] || r.role}</option>
                  ))}
                  {recipients.filter((r: any) => r.role === 'admin').map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name} — {ROLE_LABEL[r.role] || r.role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">موضوع الرسالة</label>
                <input className="input-field" placeholder="اكتب موضوع رسالتك..." value={newMsg.subject} onChange={e => setNewMsg({ ...newMsg, subject: e.target.value })}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الأولوية</label>
                <select className="input-field" value={newMsg.priority} onChange={e => setNewMsg({ ...newMsg, priority: e.target.value })}>
                  <option value="normal">عادية</option>
                  <option value="high">عاجلة</option>
                  <option value="urgent">طارئة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">نص الرسالة</label>
                <textarea className="input-field min-h-[120px] resize-none" placeholder="اكتب رسالتك هنا..." value={newMsg.body} onChange={e => setNewMsg({ ...newMsg, body: e.target.value })}/>
              </div>
              <div className="flex gap-3">
                <button onClick={() => sendMut.mutate()} disabled={!newMsg.subject || !newMsg.body || sendMut.isPending}
                  className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{background:'var(--color-accent)'}}>
                  {sendMut.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}
                  إرسال
                </button>
                <button onClick={() => setCompose(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ minHeight: '500px' }}>
        <div className="flex flex-col lg:flex-row h-full">
          <div className="lg:w-80 flex-shrink-0 border-l border-gray-100">
            <div className="flex-1 overflow-y-auto max-h-[70vh] lg:max-h-[calc(100vh-230px)]">
              {isLoading ? (
                <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"/></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16 text-gray-400 px-4">
                  <MessageSquare size={40} className="mx-auto mb-3 text-gray-200"/>
                  <p className="font-bold">لا توجد رسائل بعد</p>
                  <p className="text-sm mt-1">أرسل رسالتك الأولى للإدارة أو المعلم</p>
                </div>
              ) : messages.map((msg: any) => {
                const isFromMe = msg.from_role === 'parent'
                return (
                  <div key={msg.id}
                    onClick={() => handleSelect(msg)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${selected?.id === msg.id ? 'bg-amber-50' : 'hover:bg-gray-50'} ${!msg.is_read && !isFromMe ? 'border-r-4' : ''}`}
                    style={!msg.is_read && !isFromMe ? { borderRightColor: 'var(--color-accent)' } : {}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-gray-800 truncate">{msg.subject}</span>
                      <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString('ar-OM')}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{msg.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{isFromMe ? `إلى: ${msg.to_name}` : `من: ${msg.from_name}`}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-black text-gray-800">{thread?.subject || selected.subject}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><User size={11}/>{thread?.from_name || selected.from_name}</span>
                  <span>{new Date(thread?.created_at || selected.created_at).toLocaleString('ar-OM')}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh] lg:max-h-none">
                <div className="bg-gray-100 rounded-2xl rounded-tr-sm p-4">
                  <p className="text-xs font-bold text-gray-500 mb-1">{thread?.from_name || selected.from_name}</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{thread?.body || selected.body}</p>
                </div>
                {replies.map((r: any) => (
                  <div key={r.id} className={`flex ${r.from_role === 'parent' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`rounded-2xl p-4 max-w-[85%] ${r.from_role === 'parent' ? 'bg-amber-100 rounded-tr-sm' : 'text-white rounded-tl-sm'}`}
                      style={r.from_role !== 'parent' ? { background: 'var(--color-primary)' } : {}}>
                      <p className={`text-xs font-bold mb-1 ${r.from_role === 'parent' ? 'text-gray-500' : 'text-white/70'}`}>{r.from_name}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleReply() }}
                    placeholder="اكتب ردك هنا... (Ctrl+Enter للإرسال)"
                    className="flex-1 input-field resize-none h-16 text-sm"
                    rows={2}
                  />
                  <button onClick={handleReply} disabled={!replyText.trim() || sending}
                    className="px-5 rounded-xl text-white font-bold disabled:opacity-40 flex items-center gap-2"
                    style={{ background: 'var(--color-accent)' }}>
                    {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-16">
              <MessageSquare size={48} className="text-gray-200"/>
              <p className="font-bold">اختر رسالة لعرضها والرد عليها</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
