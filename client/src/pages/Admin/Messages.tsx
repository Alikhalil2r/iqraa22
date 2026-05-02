import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '../../api/client'
import { MessageSquare, Send, Clock, User, Mail, Reply, Inbox, PaperclipIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Messages() {
  const [selected, setSelected] = useState<any>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [box, setBox] = useState('inbox')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['messages', box],
    queryFn: () => messagesApi.list({ box }).then(r => r.data),
    refetchInterval: 30000
  })
  const { data: threadData } = useQuery({
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">رسائل أولياء الأمور</h1>
          <p className="text-sm text-gray-400 mt-1">التواصل المباشر مع أولياء الأمور</p>
        </div>
        {unread > 0 && <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-black">{unread} رسائل غير مقروءة</span>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{height:'calc(100vh - 220px)', minHeight:'500px'}}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0 border-l border-gray-100 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 p-2 gap-1">
              {[['inbox','الوارد'],['sent','المرسل'],['all','الكل']].map(([v,l]) => (
                <button key={v} onClick={()=>{setBox(v);setSelected(null)}}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${box===v ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                  style={box===v?{background:'var(--color-primary)'}:{}}>
                  {l}
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
                      {msg.reply_count > 0 && <span className="text-[9px] text-gray-400">{msg.reply_count} رد</span>}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Thread */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                <h3 className="font-black text-gray-800">{selected.subject}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><User size={11}/>{selected.from_name}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={11}/>{new Date(selected.created_at).toLocaleString('ar-OM')}</span>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Original */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center text-sm font-black flex-shrink-0">
                    {threadData?.message?.from_name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-2xl rounded-tr-sm p-4">
                      <p className="text-xs font-bold text-gray-500 mb-1">{threadData?.message?.from_name}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{threadData?.message?.body}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 mr-2">{new Date(threadData?.message?.created_at||'').toLocaleString('ar-OM')}</p>
                  </div>
                </div>
                {/* Replies */}
                {threadData?.replies?.map((r: any) => (
                  <div key={r.id} className={`flex gap-3 ${r.from_role === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 text-white" style={{background: r.from_role==='admin'?'var(--color-primary)':'#e5e7eb', color: r.from_role==='admin'?'white':'#6b7280'}}>
                      {r.from_name?.[0]}
                    </div>
                    <div className={`flex-1 ${r.from_role==='admin'?'items-end':'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl p-4 max-w-[85%] ${r.from_role==='admin' ? 'text-white rounded-tl-sm' : 'bg-gray-100 rounded-tr-sm'}`}
                        style={r.from_role==='admin' ? {background:'var(--color-primary)'} : {}}>
                        <p className={`text-xs font-bold mb-1 ${r.from_role==='admin'?'text-white/70':'text-gray-500'}`}>{r.from_name}</p>
                        <p className="text-sm leading-relaxed">{r.body}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleString('ar-OM')}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Reply box */}
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
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="text-gray-200 mb-3"/>
              <p className="font-bold">اختر رسالة لعرضها</p>
              <p className="text-sm mt-1">ستظهر تفاصيل الرسالة هنا</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
