import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '../../api/client'
import api from '../../api/client'
import { MessageSquare, Send, Clock, User, Inbox, Plus, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { FormField, Input } from '../../components/FormField'

function ComposeModal({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: () => void }) {
  const [form, setForm] = useState({ toUserId: '', subject: '', body: '' })
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  const { data: usersData } = useQuery({
    queryKey: ['parent-users'],
    queryFn: () => api.get('/users?role=parent').then(r => r.data),
    enabled: open
  })

  const users = (usersData?.users || []).filter((u: any) =>
    !search || u.name?.includes(search) || u.username?.includes(search)
  )

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.toUserId || !form.subject || !form.body) return toast.error('يرجى ملء جميع الحقول')
    setSending(true)
    try {
      await messagesApi.send(form)
      toast.success('تم إرسال الرسالة بنجاح')
      setForm({ toUserId: '', subject: '', body: '' })
      setSearch('')
      onSent()
      onClose()
    } catch { toast.error('حدث خطأ في الإرسال') }
    finally { setSending(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="إنشاء رسالة جديدة" size="md">
      <form onSubmit={handleSend} className="space-y-4">
        <FormField label="البحث عن ولي الأمر" required>
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم ولي الأمر..."
              className="input-field pr-9 text-sm"
            />
          </div>
          {search && users.length > 0 && (
            <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto shadow-lg">
              {users.slice(0, 8).map((u: any) => (
                <button key={u.id} type="button"
                  onClick={() => { setForm({ ...form, toUserId: u.id }); setSearch(u.name) }}
                  className="w-full text-right px-4 py-2.5 hover:bg-blue-50 text-sm font-bold text-gray-700 border-b border-gray-100 last:border-0 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black flex-shrink-0">
                    {u.name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{u.name}</p>
                    <p className="text-[10px] text-gray-400">{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {form.toUserId && (
            <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">✓</div>
              <span className="text-sm font-bold text-blue-700 flex-1">تم اختيار ولي الأمر</span>
              <button type="button" onClick={()=>{setForm({...form,toUserId:''});setSearch('')}} className="text-blue-400 hover:text-blue-600">
                <X size={14}/>
              </button>
            </div>
          )}
        </FormField>
        <FormField label="الموضوع" required>
          <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="موضوع الرسالة" />
        </FormField>
        <FormField label="نص الرسالة" required>
          <textarea
            value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            placeholder="اكتب رسالتك هنا..."
            className="input-field resize-none h-32 text-sm"
            rows={4}
          />
        </FormField>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1 py-3 flex items-center justify-center gap-2" disabled={sending}>
            {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}
            إرسال الرسالة
          </button>
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">إلغاء</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Messages() {
  const [selected, setSelected] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [box, setBox] = useState('inbox')
  const [compose, setCompose] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['messages', box],
    queryFn: () => messagesApi.list({ box }).then(r => r.data),
    refetchInterval: 30000
  })
  const { data: threadData, refetch: refetchThread } = useQuery({
    queryKey: ['message-thread', selected?.id],
    queryFn: () => selected ? messagesApi.get(selected.id).then(r => r.data) : null,
    enabled: !!selected,
    refetchInterval: 15000
  })

  const replyMut = useMutation({
    mutationFn: (body: string) => messagesApi.reply(selected!.id, { body }),
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['messages']})
      qc.invalidateQueries({queryKey:['message-thread', selected?.id]})
      setReplyText('')
      toast.success('تم إرسال الرد')
    }
  })

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try { await replyMut.mutateAsync(replyText) }
    finally { setSending(false) }
  }

  const handleSelect = async (msg: any) => {
    setSelected(msg)
    if (!msg.is_read && box === 'inbox') {
      await messagesApi.markRead(msg.id)
      qc.invalidateQueries({queryKey:['messages']})
      qc.invalidateQueries({queryKey:['unread-count']})
    }
  }

  const messages = data?.messages || []
  const unread = messages.filter((m: any) => !m.is_read && box === 'inbox').length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">رسائل أولياء الأمور</h1>
          <p className="text-sm text-gray-400 mt-1">التواصل المباشر مع أولياء الأمور</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-black">{unread} غير مقروءة</span>}
          <button onClick={() => setCompose(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> رسالة جديدة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{height:'calc(100vh - 230px)', minHeight:'500px'}}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 p-2 gap-1">
              {[['inbox','الوارد'],['sent','المرسل'],['all','الكل']].map(([v,l]) => (
                <button key={v} onClick={()=>{setBox(v);setSelected(null)}}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${box===v ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  style={box===v?{background:'var(--color-primary)'}:{}}>
                  {l}{v==='inbox'&&unread>0&&` (${unread})`}
                </button>
              ))}
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div> :
                messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Inbox size={32} className="mb-2 text-gray-200"/>
                    <p className="text-sm">لا توجد رسائل</p>
                    <button onClick={()=>setCompose(true)} className="mt-3 text-xs text-blue-500 hover:underline font-bold">إرسال رسالة أولى</button>
                  </div>
                ) : messages.map((msg: any) => (
                  <div key={msg.id} onClick={() => handleSelect(msg)}
                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${selected?.id === msg.id ? 'bg-blue-50' : 'hover:bg-gray-50'} ${!msg.is_read && box==='inbox' ? 'border-r-4' : ''}`}
                    style={!msg.is_read && box==='inbox' ? {borderRightColor:'var(--color-primary)'} : {}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-gray-800 truncate">{box==='sent'?msg.to_name:msg.from_name}</span>
                      <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleDateString('ar')}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-600 truncate">{msg.subject}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{msg.body?.substring(0,60)}...</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {!msg.is_read && box==='inbox' && <span className="w-2 h-2 rounded-full bg-blue-500"/>}
                      {msg.reply_count > 0 && <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded">{msg.reply_count} رد</span>}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Thread */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-start justify-between">
                <div>
                  <h3 className="font-black text-gray-800">{selected.subject}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><User size={11}/>{selected.from_name}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11}/>{new Date(selected.created_at).toLocaleString('ar-OM')}</span>
                  </div>
                </div>
                <button onClick={()=>setSelected(null)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors md:hidden">
                  <X size={16}/>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center text-sm font-black flex-shrink-0">
                    {threadData?.message?.from_name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl rounded-tr-sm p-4">
                      <p className="text-xs font-bold text-gray-500 mb-1">{threadData?.message?.from_name}</p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{threadData?.message?.body}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 mr-2">{new Date(threadData?.message?.created_at||'').toLocaleString('ar-OM')}</p>
                  </div>
                </div>
                {threadData?.replies?.map((r: any) => (
                  <div key={r.id} className={`flex gap-3 ${r.from_role === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 text-white" style={{background: r.from_role==='admin'?'var(--color-primary)':'#e5e7eb', color: r.from_role==='admin'?'white':'#6b7280'}}>
                      {r.from_name?.[0]}
                    </div>
                    <div className={`flex-1 ${r.from_role==='admin'?'items-end':'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl p-4 max-w-[85%] ${r.from_role==='admin' ? 'text-white rounded-tl-sm' : 'bg-gray-100 rounded-tr-sm'}`}
                        style={r.from_role==='admin' ? {background:'var(--color-primary)'} : {}}>
                        <p className={`text-xs font-bold mb-1 ${r.from_role==='admin'?'text-white/70':'text-gray-500'}`}>{r.from_name}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.body}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleString('ar-OM')}</p>
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
                    className="px-5 rounded-xl text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{background:'var(--color-primary)'}}>
                    {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}
                    إرسال
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
              <MessageSquare size={48} className="text-gray-200"/>
              <div className="text-center">
                <p className="font-bold">اختر رسالة لعرضها</p>
                <p className="text-sm mt-1">أو أنشئ رسالة جديدة لولي أمر</p>
              </div>
              <button onClick={()=>setCompose(true)} className="btn-primary flex items-center gap-2">
                <Plus size={16}/> رسالة جديدة
              </button>
            </div>
          )}
        </div>
      </div>

      <ComposeModal
        open={compose}
        onClose={() => setCompose(false)}
        onSent={() => qc.invalidateQueries({queryKey:['messages']})}
      />
    </div>
  )
}
