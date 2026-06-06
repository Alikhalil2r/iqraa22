import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { useParentChild } from '../../context/ParentChildContext'
import { Shield, Award, AlertTriangle, Star, Calendar } from 'lucide-react'

const TYPE: Record<string, { label: string; icon: React.ReactNode; color: string; border: string }> = {
  reward:   { label: 'مكافأة', icon: <Award size={14} />, color: 'text-emerald-700', border: 'border-emerald-400' },
  incident: { label: 'مخالفة', icon: <AlertTriangle size={14} />, color: 'text-red-700', border: 'border-red-400' },
  warning:  { label: 'تحذير', icon: <AlertTriangle size={14} />, color: 'text-amber-700', border: 'border-amber-400' },
  note:     { label: 'ملاحظة', icon: <Star size={14} />, color: 'text-blue-700', border: 'border-blue-400' },
}

export default function ParentConduct() {
  const { childParams, selectedChildId } = useParentChild()
  const { data, isLoading } = useQuery({
    queryKey: ['parent-conduct', selectedChildId],
    queryFn: () => parentApi.conduct(childParams).then(r => r.data),
  })
  const records = data?.records || []
  const summary = data?.summary || {}

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <Shield size={22} style={{ color: 'var(--color-primary)' }} />
          سجل السلوك
        </h1>
        <p className="text-sm text-gray-500 mt-1">متابعة السلوك والإنجازات السلوكية</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center py-4">
          <p className="text-2xl font-black text-gray-700">{summary.total || 0}</p>
          <p className="text-[10px] text-gray-400 font-bold">إجمالي السجلات</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-black text-emerald-600">{summary.rewards || 0}</p>
          <p className="text-[10px] text-gray-400 font-bold">مكافآت</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-black text-red-600">{summary.incidents || 0}</p>
          <p className="text-[10px] text-gray-400 font-bold">مخالفات</p>
        </div>
        <div className="card text-center py-4">
          <p className={`text-2xl font-black ${(summary.points || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {summary.points > 0 ? '+' : ''}{summary.points || 0}
          </p>
          <p className="text-[10px] text-gray-400 font-bold">نقاط السلوك</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card text-center py-16">
          <Shield size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-bold">لا توجد سجلات سلوكية</p>
          <p className="text-sm text-gray-400 mt-1">سجل نظيف — استمر!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r: any) => {
            const t = TYPE[r.record_type] || TYPE.note
            return (
              <div key={r.id} className={`card border-r-4 ${t.border}`}>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-xl bg-gray-50 ${t.color}`}>
                    {t.icon} {t.label}
                  </span>
                  {r.category && <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">{r.category}</span>}
                  {r.points !== 0 && r.points != null && (
                    <span className={`text-[10px] font-black ${r.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.points > 0 ? '+' : ''}{r.points} نقطة
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 mr-auto flex items-center gap-1">
                    <Calendar size={10} />{new Date(r.record_date).toLocaleDateString('ar-OM')}
                  </span>
                </div>
                <h3 className="font-black text-gray-800">{r.title}</h3>
                {r.description && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.description}</p>}
                {r.action_taken && <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">الإجراء: {r.action_taken}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
