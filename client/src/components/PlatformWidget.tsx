import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../api/client'
import {
  Inbox, FolderOpen, Building2, TrendingUp, ArrowLeft,
  Clock, CheckCircle, AlertCircle, DollarSign, Star
} from 'lucide-react'

export default function PlatformWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn:  () => adminApi.get('/api/platform/admin/stats'),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"/>
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"/>)}
      </div>
    </div>
  )

  const req  = data?.requests  || {}
  const proj = data?.projects  || {}
  const rev  = data?.revenue   || {}
  const clients = data?.clients || 0

  const newCount  = parseInt(req.new_count  || 0)
  const inProg    = parseInt(req.in_progress || 0)
  const completed = parseInt(req.completed   || 0)
  const total     = parseInt(req.total       || 0)
  const revenue   = parseFloat(rev.paid      || 0)
  const activePrj = parseInt(proj.active     || 0)

  return (
    <div className="card" style={{ borderTop: '3px solid #7c3aed' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-700 flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
            <TrendingUp size={13} className="text-violet-600"/>
          </div>
          منصة الأعمال
        </h3>
        <Link to="/admin/platform-analytics" className="text-[11px] font-black text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1">
          تفاصيل <ArrowLeft size={11}/>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Link to="/admin/requests?status=new" className="group">
          <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 hover:border-violet-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Inbox size={13} className="text-violet-500"/>
              <span className="text-[10px] font-bold text-violet-400">طلبات جديدة</span>
            </div>
            <p className="text-2xl font-black text-violet-700">{newCount}</p>
            {newCount > 0 && (
              <p className="text-[10px] text-violet-500 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse inline-block"/>
                تحتاج مراجعة
              </p>
            )}
          </div>
        </Link>

        <Link to="/admin/projects" className="group">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen size={13} className="text-blue-500"/>
              <span className="text-[10px] font-bold text-blue-400">مشاريع نشطة</span>
            </div>
            <p className="text-2xl font-black text-blue-700">{activePrj}</p>
            <p className="text-[10px] text-blue-400 mt-0.5">{parseInt(proj.total||0)} إجمالي</p>
          </div>
        </Link>

        <Link to="/admin/clients" className="group">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={13} className="text-emerald-500"/>
              <span className="text-[10px] font-bold text-emerald-400">العملاء</span>
            </div>
            <p className="text-2xl font-black text-emerald-700">{clients}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">عميل نشط</p>
          </div>
        </Link>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={13} className="text-amber-500"/>
            <span className="text-[10px] font-bold text-amber-400">الإيرادات</span>
          </div>
          <p className="text-2xl font-black text-amber-700">{revenue.toLocaleString()}</p>
          <p className="text-[10px] text-amber-400 mt-0.5">ر.ع محصّل</p>
        </div>
      </div>

      {/* Quick status bar */}
      {total > 0 && (
        <div className="flex gap-2 flex-wrap">
          {inProg > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black">
              <Clock size={10}/> {inProg} قيد التنفيذ
            </div>
          )}
          {completed > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 text-[10px] font-black">
              <CheckCircle size={10}/> {completed} مكتمل
            </div>
          )}
          {newCount > 3 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-500 text-[10px] font-black">
              <AlertCircle size={10}/> {newCount} بانتظار الرد
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
        <Link to="/admin/requests" className="flex-1 py-2 text-center text-[11px] font-black rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors">
          الطلبات
        </Link>
        <Link to="/admin/platform-analytics" className="flex-1 py-2 text-center text-[11px] font-black rounded-xl border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors">
          التحليلات
        </Link>
        <Link to="/admin/blog" className="flex-1 py-2 text-center text-[11px] font-black rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          المدونة
        </Link>
      </div>
    </div>
  )
}
