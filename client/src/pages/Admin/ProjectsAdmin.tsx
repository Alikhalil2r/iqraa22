import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import {
  FolderOpen, Clock, CheckCircle, AlertTriangle, PauseCircle,
  Plus, X, TrendingUp, DollarSign, Users, Search
} from 'lucide-react'

const STATUS_CFG: Record<string, { label:string; color:string; bg:string; Icon:React.ElementType }> = {
  planning:    { label:'تخطيط',    color:'#6b7280', bg:'#f3f4f6', Icon:Clock },
  in_progress: { label:'قيد التنفيذ',color:'#2563eb', bg:'#eff6ff', Icon:TrendingUp },
  review:      { label:'مراجعة',   color:'#d97706', bg:'#fffbeb', Icon:AlertTriangle },
  completed:   { label:'مكتمل',    color:'#059669', bg:'#ecfdf5', Icon:CheckCircle },
  on_hold:     { label:'معلّق',    color:'#dc2626', bg:'#fef2f2', Icon:PauseCircle },
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(100, value||0)}%`, background:'linear-gradient(90deg,#7c3aed,#2563eb)' }}/>
    </div>
  )
}

export default function ProjectsAdmin() {
  const qc = useQueryClient()
  const [statusFilter, setStatus] = useState('all')
  const [showNew, setShowNew]     = useState(false)
  const [newForm, setNewForm]     = useState({ title:'', description:'', budget:'', start_date:'', end_date:'' })

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['platform-projects', statusFilter],
    queryFn:  () => adminApi.get(`/api/platform/admin/projects?status=${statusFilter}`),
    staleTime: 30_000,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id:string; data:any }) => adminApi.patch(`/api/platform/admin/projects/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-projects'] }),
  })
  const createMut = useMutation({
    mutationFn: (data: any) => adminApi.post('/api/platform/admin/projects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey:['platform-projects'] }); setShowNew(false); setNewForm({ title:'', description:'', budget:'', start_date:'', end_date:'' }) },
  })

  const projectList: any[] = Array.isArray(projects) ? projects : []

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">إدارة المشاريع</h1>
          <p className="text-gray-500 text-sm">{projectList.length} مشروع</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-white text-sm hover:opacity-90 transition-all" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
          <Plus size={16}/> مشروع جديد
        </button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {[['all','الكل'], ...Object.entries(STATUS_CFG).map(([k,v]) => [k,v.label])].map(([k,lbl]) => (
          <button key={k} onClick={() => setStatus(k)}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${statusFilter===k ? 'text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
            style={statusFilter===k ? { background:'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* New project modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-gray-900">إضافة مشروع جديد</h3>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={16}/></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-black text-gray-600 mb-1">عنوان المشروع *</label>
                <input value={newForm.title} onChange={e => setNewForm(f => ({...f, title:e.target.value}))} className="input-field w-full text-sm" placeholder="اسم المشروع"/></div>
              <div><label className="block text-xs font-black text-gray-600 mb-1">وصف المشروع</label>
                <textarea value={newForm.description} onChange={e => setNewForm(f => ({...f, description:e.target.value}))} rows={2} className="input-field w-full text-sm" placeholder="وصف مختصر"/></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-black text-gray-600 mb-1">الميزانية (ر.ع)</label>
                  <input type="number" value={newForm.budget} onChange={e => setNewForm(f => ({...f, budget:e.target.value}))} className="input-field w-full text-sm"/></div>
                <div><label className="block text-xs font-black text-gray-600 mb-1">تاريخ البدء</label>
                  <input type="date" value={newForm.start_date} onChange={e => setNewForm(f => ({...f, start_date:e.target.value}))} className="input-field w-full text-sm"/></div>
                <div><label className="block text-xs font-black text-gray-600 mb-1">تاريخ الانتهاء</label>
                  <input type="date" value={newForm.end_date} onChange={e => setNewForm(f => ({...f, end_date:e.target.value}))} className="input-field w-full text-sm"/></div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => createMut.mutate(newForm)} disabled={!newForm.title || createMut.isPending}
                className="flex-1 py-2.5 rounded-xl font-black text-white text-sm disabled:opacity-50 hover:opacity-90 transition-all" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                {createMut.isPending ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
              </button>
              <button onClick={() => setShowNew(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="h-52 bg-gray-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : projectList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <FolderOpen size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="font-bold">لا توجد مشاريع</p>
          <p className="text-xs mt-1">ابدأ بإنشاء مشروع جديد أو تحويل طلب إلى مشروع</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectList.map((p: any) => {
            const sc = STATUS_CFG[p.status] || STATUS_CFG.planning
            const StatusIcon = sc.Icon
            const progress = p.progress || 0
            const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date).getTime() - Date.now()) / 86400000) : null
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-bold mb-0.5">{p.project_number}</p>
                    <h3 className="font-black text-gray-800 text-sm leading-tight truncate">{p.title}</h3>
                    {p.client_name && <p className="text-xs text-gray-400 mt-0.5">{p.client_name}{p.client_company ? ` · ${p.client_company}` : ''}</p>}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg mr-2 flex-shrink-0" style={{ color:sc.color, background:sc.bg }}>
                    <StatusIcon size={11}/><span className="text-[10px] font-black">{sc.label}</span>
                  </div>
                </div>
                {p.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{p.description}</p>}
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span className="font-bold">التقدم</span>
                    <span className="font-black text-purple-600">{progress}%</span>
                  </div>
                  <ProgressBar value={progress}/>
                  <input type="range" min={0} max={100} value={progress} className="w-full mt-1 accent-purple-600 h-1"
                    onChange={e => updateMut.mutate({ id:p.id, data:{ progress:parseInt(e.target.value) } })}/>
                </div>
                {/* Meta */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {p.budget && <div className="flex items-center gap-1 text-gray-500"><DollarSign size={11}/>{p.budget} ر.ع</div>}
                    {daysLeft !== null && <div className={`flex items-center gap-1 font-bold ${daysLeft < 7 ? 'text-red-500' : 'text-gray-500'}`}><Clock size={11}/>{daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}</div>}
                  </div>
                  <select value={p.status} onChange={e => updateMut.mutate({ id:p.id, data:{ status:e.target.value } })}
                    className="text-[10px] font-black border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500" style={{ color:sc.color }}>
                    {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
