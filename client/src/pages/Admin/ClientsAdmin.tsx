import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import {
  Users, Search, X, Building2, Phone, Mail, ExternalLink,
  ChevronRight, ChevronLeft, Plus, FolderOpen, TrendingUp
} from 'lucide-react'

const CLIENT_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label:'نشط',    color:'#059669', bg:'#ecfdf5' },
  inactive: { label:'غير نشط',color:'#6b7280', bg:'#f3f4f6' },
  vip:      { label:'VIP',    color:'#7c3aed', bg:'#f3f0ff' },
  prospect: { label:'محتمل',  color:'#d97706', bg:'#fffbeb' },
}

export default function ClientsAdmin() {
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['platform-clients', search, page],
    queryFn:  () => adminApi.get(`/api/platform/admin/clients?search=${encodeURIComponent(search)}&page=${page}&limit=20`),
    staleTime: 30_000,
  })
  const clients: any[] = data?.clients || []
  const pages = data?.pages || 1
  const total = data?.total || 0

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">إدارة العملاء (CRM)</h1>
          <p className="text-gray-500 text-sm">{total} عميل مسجّل</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute top-3 right-3 text-gray-400"/>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="بحث بالاسم أو الإيميل أو الشركة..."
          className="input-field w-full pr-9 text-sm"/>
        {search && <button onClick={() => setSearch('')} className="absolute top-3 left-3 text-gray-400 hover:text-gray-600"><X size={14}/></button>}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <Users size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="font-bold">لا يوجد عملاء</p>
          <p className="text-xs mt-1">سيظهر العملاء هنا بمجرد استلام الطلبات الأولى</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c: any) => {
            const sc = CLIENT_STATUSES[c.status] || CLIENT_STATUSES.active
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                      {c.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-sm">{c.name}</p>
                      {c.company && <p className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={10}/>{c.company}</p>}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-[10px] font-black" style={{ color:sc.color, background:sc.bg }}>{sc.label}</span>
                </div>
                <div className="space-y-1.5 mb-4">
                  {c.email && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail size={12}/>{c.email}</div>}
                  {c.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={12}/>{c.phone}</div>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-base font-black text-purple-600">{c.request_count || 0}</p>
                      <p className="text-[10px] text-gray-400">طلب</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-black text-blue-600">{c.project_count || 0}</p>
                      <p className="text-[10px] text-gray-400">مشروع</p>
                    </div>
                    {c.total_revenue > 0 && (
                      <div className="text-center">
                        <p className="text-base font-black text-green-600">{c.total_revenue}</p>
                        <p className="text-[10px] text-gray-400">ر.ع</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {c.email && <a href={`mailto:${c.email}`} className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 hover:bg-purple-100 transition-colors"><Mail size={13}/></a>}
                    {c.phone && <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"><Phone size={13}/></a>}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-300">
                  عضو منذ {new Date(c.created_at).toLocaleDateString('ar-SA')}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16}/></button>
          <span className="text-sm font-bold text-gray-600">{page} / {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40"><ChevronLeft size={16}/></button>
        </div>
      )}
    </div>
  )
}
