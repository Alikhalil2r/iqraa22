import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { MessageSquare, Send, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ParentMessages() {
  const [compose, setCompose] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [newMsg, setNewMsg] = useState({ subject:'', body:'', priority:'normal' })
  const [replyText, setReplyText] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['parent-messages'],
    queryFn: () => parentApi.messages().then(r => r.data),
    refetchInterval: 30000
  })

  const sendMut = useMutation({
    mutationFn: () => parentApi.sendMessage(newMsg),
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['parent-messages']})
      qc.invalidateQueries({queryKey:['parent-dash']})
      setCompose(false)
      setNewMsg({ subject:'', body:'', priority:'normal' })
      toast.success('✅ تم إرسال رسالتك للإدارة')
    },
    onError: () => toast.error('حدث خطأ في الإرسال')
  })

  const messages = data?.messages || []
  const unread = messages.filter((m:any) => !m.is_read && m.to_user_id).length

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><MessageSquare size={22}/>الرسائل</h1>
          <p className="text-sm text-gray-400 mt-1">التواصل المباشر مع إدارة المدرسة</p>
        </div>
        <button onClick={()=>setCompose(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm" style={{background:'var(--color-accent)'}}>
          <Plus size={16}/>رسالة جديدة
        </button>
      </div>

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setCompose(false)}/>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-black text-gray-800">رسالة جديدة للإدارة</h3>
              <button onClick={()=>setCompose(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">موضوع الرسالة</label>
                <input className="input-field" placeholder="اكتب موضوع رسالتك..." value={newMsg.subject} onChange={e=>setNewMsg({...newMsg,subject:e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">الأولوية</label>
                <select className="input-field" value={newMsg.priority} onChange={e=>setNewMsg({...newMsg,priority:e.target.value})}>
                  <option value="normal">عادية</option>
                  <option value="high">عاجلة</option>
                  <option value="urgent">طارئة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">نص الرسالة</label>
                <textarea className="input-field min-h-[120px] resize-none" placeholder="اكتب رسالتك هنا..." value={newMsg.body} onChange={e=>setNewMsg({...newMsg,body:e.target.value})}/>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>sendMut.mutate()} disabled={!newMsg.subject||!newMsg.body||sendMut.isPending}
                  className="flex-1 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{background:'var(--color-accent)'}}>
                  {sendMut.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}
                  إرسال
                </button>
                <button onClick={()=>setCompose(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"/></div>
      ) : messages.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 text-gray-200"/>
          <p className="font-bold">لا توجد رسائل بعد</p>
          <p className="text-sm mt-1">أرسل رسالتك الأولى للإدارة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg: any) => {
            const isFromMe = msg.from_role === 'parent'
            return (
              <div key={msg.id} className={`card cursor-pointer hover:shadow-md transition-all ${selected?.id===msg.id?'ring-2':''}  ${!msg.is_read && !isFromMe ? 'border-r-4' : ''}`}
                style={{...(selected?.id===msg.id ? {boxShadow:`0 0 0 2px var(--color-accent)`} : {}), ...(!msg.is_read&&!isFromMe?{borderRightColor:'var(--color-accent)'}:{})}}
                onClick={()=>setSelected(selected?.id===msg.id?null:msg)}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                    style={{background: isFromMe ? 'var(--color-accent)' : 'var(--color-primary)'}}>
                    {isFromMe ? 'أنت' : 'إدارة'[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-gray-800 text-sm truncate">{msg.subject}</h4>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(msg.created_at).toLocaleDateString('ar-OM')}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{msg.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-gray-400">{isFromMe ? `إلى: ${msg.to_name}` : `من: ${msg.from_name}`}</span>
                      {!msg.is_read && !isFromMe && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>}
                      {msg.reply_count > 0 && <span className="text-[9px] text-gray-400">{msg.reply_count} رد</span>}
                    </div>
                  </div>
                </div>
                {selected?.id === msg.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
