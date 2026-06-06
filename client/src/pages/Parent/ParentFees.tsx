import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { useParentChild } from '../../context/ParentChildContext'
import { DollarSign, Calendar, CheckCircle, AlertTriangle } from 'lucide-react'

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'مدفوع', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  unpaid:  { label: 'غير مدفوع', color: 'text-red-700', bg: 'bg-red-50' },
  partial: { label: 'جزئي', color: 'text-amber-700', bg: 'bg-amber-50' },
  waived:  { label: 'معفى', color: 'text-gray-600', bg: 'bg-gray-100' },
}

export default function ParentFees() {
  const { childParams, selectedChildId } = useParentChild()
  const { data, isLoading } = useQuery({
    queryKey: ['parent-fees', selectedChildId],
    queryFn: () => parentApi.fees(childParams).then(r => r.data),
  })
  const fees = data?.fees || []
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
          <DollarSign size={22} style={{ color: 'var(--color-primary)' }} />
          الرسوم الدراسية
        </h1>
        <p className="text-sm text-gray-500 mt-1">متابعة الرسوم والمدفوعات</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center py-4">
          <p className="text-xl font-black text-gray-800">{summary.total || '0.00'} <span className="text-xs">ر.ع</span></p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">إجمالي الرسوم</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-xl font-black text-emerald-600">{summary.paid || '0.00'} <span className="text-xs">ر.ع</span></p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">المدفوع</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-xl font-black text-red-600">{summary.remaining || '0.00'} <span className="text-xs">ر.ع</span></p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">المتبقي</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-xl font-black text-amber-600">{summary.unpaidCount || 0}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">فواتير معلقة</p>
        </div>
      </div>

      {fees.length === 0 ? (
        <div className="card text-center py-16">
          <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-bold">لا توجد رسوم مسجلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fees.map((fee: any) => {
            const st = STATUS[fee.status] || STATUS.unpaid
            return (
              <div key={fee.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{fee.fee_type}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="font-black text-gray-800">{fee.description || fee.fee_type}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-gray-400">
                    {fee.due_date && <span className="flex items-center gap-1"><Calendar size={11} /> الاستحقاق: {new Date(fee.due_date).toLocaleDateString('ar-OM')}</span>}
                    {fee.paid_date && <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={11} /> دُفع: {new Date(fee.paid_date).toLocaleDateString('ar-OM')}</span>}
                    {fee.academic_year && <span>{fee.academic_year}</span>}
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-gray-800">{parseFloat(fee.amount).toFixed(2)} <span className="text-xs text-gray-400">ر.ع</span></p>
                  {parseFloat(fee.paid_amount) > 0 && fee.status === 'partial' && (
                    <p className="text-[10px] text-emerald-600">مدفوع: {parseFloat(fee.paid_amount).toFixed(2)} ر.ع</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(summary.unpaidCount || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">لديك {summary.unpaidCount} فاتورة غير مسددة. للاستفسار تواصل مع إدارة المدرسة.</p>
        </div>
      )}
    </div>
  )
}
