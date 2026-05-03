import React, { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  ArrowRight, Building2, Calendar, DollarSign, Send,
  Clock, CheckCircle2, Circle, AlertCircle, Loader2,
  TrendingUp, MessageSquare, Paperclip, Edit3, Save, X
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  planning:    { label: 'تخطيط',      color: '#8b5cf6', icon: Circle },
  in_progress: { label: 'قيد التنفيذ', color: '#f59e0b', icon: Loader2 },
  review:      { label: 'مراجعة',     color: '#3b82f6', icon: AlertCircle },
  completed:   { label: 'مكتمل',      color: '#10b981', icon: CheckCircle2 },
  on_hold:     { label: 'موقوف',      color: '#6b7280', icon: Clock },
}

const PHASES = [
  { key: 'planning',    label: 'التخطيط',      icon: '📋' },
  { key: 'design',      label: 'التصميم',      icon: '🎨' },
  { key: 'development', label: 'التطوير',      icon: '💻' },
  { key: 'testing',     label: 'الاختبار',     icon: '🔍' },
  { key: 'delivery',    label: 'التسليم',      icon: '🚀' },
]

export default function ProjectDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc       = useQueryClient()
  const msgEnd   = useRef<HTMLDivElement>(null)

  const [msgText,  setMsgText]  = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [editData, setEditData] = useState<any>({})

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-detail', id],
    queryFn: () => adminApi.get(`/api/platform/admin/projects/${id}`),
    enabled: !!id,
    refetchInterval: 15000
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['project-messages', id],
    queryFn: () => adminApi.get(`/api/platform/admin/projects/${id}/messages`),
    enabled: !!id,
    refetchInterval: 10000
  })

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const updateProject = useMutation({
    mutationFn: (data: any) => adminApi.patch(`/api/platform/admin/projects/${id}`, data),
    onSuccess: () => { toast.success('تم التحديث'); qc.invalidateQueries({ queryKey: ['project-detail', id] }); setEditing(false) }
  })

  const sendMsg = useMutation({
    mutationFn: () => adminApi.post(`/api/platform/admin/projects/${id}/messages`, {
      content: msgText, sender_name: user?.name || 'المسؤول', is_internal: isInternal
    }),
    onSuccess: () => { setMsgText(''); qc.invalidateQueries({ queryKey: ['project-messages', id] }) }
  })

  if (isLoading) {
    return (
      <div dir="rtl" className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded-xl w-48"/>
        <div className="h-40 bg-gray-200 rounded-2xl"/>
        <div className="h-80 bg-gray-200 rounded-2xl"/>
      </div>
    )
  }

  if (!project) {
    return (
      <div dir="rtl" className="text-center py-20">
        <AlertCircle size={48} className="mx-auto mb-4 text-gray-300"/>
        <p className="text-gray-500">المشروع غير موجود</p>
        <button onClick={() => navigate('/admin/projects')} className="mt-4 px-5 py-2 rounded-xl bg-violet-600 text-white font-bold text-sm">العودة للمشاريع</button>
      </div>
    )
  }

  const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG['planning']
  const phaseIdx = PHASES.findIndex(p => p.key === (project.phase || 'planning'))

  return (
    <div dir="rtl" className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/admin/projects')} className="text-gray-500 hover:text-violet-600 font-bold flex items-center gap-1 transition-colors">
          <ArrowRight size={14}/> المشاريع
        </button>
        <span className="text-gray-300">/</span>
        <span className="font-black text-gray-800">{project.title}</span>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gray-400">{project.project_number}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black" style={{ background: sc.color + '18', color: sc.color }}>
                {sc.label}
              </span>
            </div>
            <h1 className="text-xl font-black text-gray-800">{project.title}</h1>
            {project.client_name && (
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <Building2 size={13}/> {project.client_name}{project.client_company && ` · ${project.client_company}`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <button onClick={() => { setEditing(true); setEditData({ status: project.status, progress: project.progress, phase: project.phase || 'planning', budget: project.budget, paid: project.paid }) }}
                className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700 transition-colors flex items-center gap-1.5">
                <Edit3 size={14}/> تعديل
              </button>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-bold text-gray-700"><X size={14}/></button>
                <button onClick={() => updateProject.mutate(editData)} disabled={updateProject.isPending}
                  className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors flex items-center gap-1.5">
                  {updateProject.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} حفظ
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { icon: TrendingUp,   label: 'التقدم',   value: `${project.progress || 0}%`, color: '#8b5cf6' },
            { icon: DollarSign,   label: 'الميزانية', value: `${Number(project.budget || 0).toLocaleString()} ﷼`, color: '#10b981' },
            { icon: DollarSign,   label: 'المحصّل',   value: `${Number(project.paid || 0).toLocaleString()} ﷼`, color: '#f59e0b' },
            { icon: Calendar,     label: 'الموعد',    value: project.end_date ? new Date(project.end_date).toLocaleDateString('ar-SA') : 'غير محدد', color: '#3b82f6' },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <s.icon size={14} style={{ color: s.color }} className="mb-1"/>
              <p className="text-xs text-gray-400 font-bold">{s.label}</p>
              <p className="text-sm font-black text-gray-800">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5">
            <span>نسبة الإنجاز</span>
            <span>{project.progress || 0}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${project.progress || 0}%` }}/>
          </div>
        </div>

        {/* Edit Panel */}
        {editing && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">الحالة</label>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">المرحلة</label>
              <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" value={editData.phase} onChange={e => setEditData({ ...editData, phase: e.target.value })}>
                {PHASES.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">نسبة التقدم</label>
              <input type="number" min={0} max={100} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" value={editData.progress} onChange={e => setEditData({ ...editData, progress: parseInt(e.target.value) })}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">المحصّل (﷼)</label>
              <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" value={editData.paid} onChange={e => setEditData({ ...editData, paid: parseFloat(e.target.value) })}/>
            </div>
          </div>
        )}

        {/* Phase Timeline */}
        <div>
          <p className="text-xs font-bold text-gray-400 mb-3">مراحل المشروع</p>
          <div className="flex items-center gap-1 overflow-x-auto">
            {PHASES.map((ph, i) => {
              const done    = i < phaseIdx
              const current = i === phaseIdx
              return (
                <React.Fragment key={ph.key}>
                  <div className={`flex flex-col items-center gap-1 flex-shrink-0 px-2 py-1.5 rounded-xl transition-all ${current ? 'bg-violet-50 border border-violet-300' : done ? 'opacity-60' : 'opacity-40'}`}>
                    <span className="text-lg">{ph.icon}</span>
                    <span className={`text-[10px] font-bold ${current ? 'text-violet-700' : done ? 'text-gray-500' : 'text-gray-400'}`}>{ph.label}</span>
                    {done && <CheckCircle2 size={10} className="text-emerald-500"/>}
                    {current && <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"/>}
                  </div>
                  {i < PHASES.length - 1 && (
                    <div className={`h-0.5 flex-1 min-w-[20px] rounded-full transition-colors ${i < phaseIdx ? 'bg-emerald-400' : 'bg-gray-200'}`}/>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-black text-gray-800 mb-2">وصف المشروع</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
          {project.technologies && (
            <div className="flex flex-wrap gap-2 mt-3">
              {project.technologies.split(',').map((t: string) => (
                <span key={t} className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold">{t.trim()}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{ height: '480px' }}>
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare size={18} className="text-violet-600"/>
          <h2 className="font-black text-gray-800">سجل التواصل</h2>
          <span className="mr-auto text-xs text-gray-400">{messages.length} رسالة</span>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare size={36} className="mb-2 opacity-30"/>
              <p className="text-sm">لا توجد رسائل بعد</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMine = msg.sender_name === (user?.name || 'المسؤول')
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.is_internal ? 'bg-amber-50 border border-amber-200' :
                    isMine ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className={`text-xs font-bold mb-0.5 ${isMine && !msg.is_internal ? 'text-violet-200' : 'text-gray-400'}`}>
                      {msg.sender_name}{msg.is_internal && ' · 🔒 داخلي'}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine && !msg.is_internal ? 'text-violet-300' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={msgEnd}/>
        </div>

        {/* Message Input */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-gray-600">
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded accent-amber-500"/>
              🔒 ملاحظة داخلية
            </label>
          </div>
          <div className="flex gap-2">
            <input
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && msgText.trim()) { e.preventDefault(); sendMsg.mutate() } }}
              placeholder="اكتب رسالة أو ملاحظة..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
            <button
              onClick={() => msgText.trim() && sendMsg.mutate()}
              disabled={!msgText.trim() || sendMsg.isPending}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5"
            >
              {sendMsg.isPending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
