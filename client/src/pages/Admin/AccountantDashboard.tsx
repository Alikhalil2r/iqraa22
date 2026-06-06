import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { feesApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { DollarSign, Users, AlertTriangle, CheckCircle, ChevronLeft, FileText } from 'lucide-react'
import PageHeader from '../../components/dashboard/PageHeader'

export default function AccountantDashboard() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['accountant-fees'],
    queryFn: () => feesApi.list().then(r => r.data),
  })

  const fees: any[] = data?.fees || []
  const stats = data?.stats || {}
  const unpaid = fees.filter(f => f.status !== 'paid')
  const overdue = fees.filter(f => f.status === 'overdue' || (f.status === 'unpaid' && f.due_date && new Date(f.due_date) < new Date()))

  return (
    <div>
      <PageHeader
        title="لوحة المحاسب"
        subtitle={`مرحباً ${user?.name} — متابعة الرسوم وأولياء الأمور`}
        icon={DollarSign}
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'إجمالي الرسوم', value: `${Number(stats.total_amount || 0).toFixed(0)} ر.ع`, icon: DollarSign, color: '#f59e0b' },
              { label: 'المحصّل', value: `${Number(stats.collected || 0).toFixed(0)} ر.ع`, icon: CheckCircle, color: '#10b981' },
              { label: 'متبقٍ', value: `${Number(stats.pending || 0).toFixed(0)} ر.ع`, icon: AlertTriangle, color: '#ef4444' },
              { label: 'غير مدفوع', value: unpaid.length, icon: Users, color: '#6366f1' },
            ].map(s => (
              <div key={s.label} className="card flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.color + '18', color: s.color }}>
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400">{s.label}</p>
                  <p className="text-xl font-black text-gray-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-800">رسوم مستحقة / متأخرة</h3>
                <Link to="/admin/fees" className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
                  إدارة الرسوم <ChevronLeft size={12} />
                </Link>
              </div>
              {overdue.length === 0 && unpaid.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">لا توجد رسوم معلقة حالياً</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {(overdue.length ? overdue : unpaid).slice(0, 8).map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{f.student_name || 'طالب'}</p>
                        <p className="text-[10px] text-gray-400">{f.fee_type} — {f.description?.slice(0, 40)}</p>
                      </div>
                      <span className="text-sm font-black text-amber-600">{(f.amount - (f.paid_amount || 0)).toFixed(0)} ر.ع</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card space-y-3">
              <h3 className="font-black text-gray-800 mb-2">اختصارات المحاسب</h3>
              {[
                { to: '/admin/fees', label: 'إدارة رسوم الطلاب', icon: DollarSign },
                { to: '/admin/reports', label: 'التقارير المالية', icon: FileText },
                { to: '/admin/pdf-reports', label: 'تقارير PDF', icon: FileText },
              ].map(link => (
                <Link key={link.to} to={link.to}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group">
                  <link.icon size={18} className="text-amber-600" />
                  <span className="font-bold text-sm text-gray-700 flex-1">{link.label}</span>
                  <ChevronLeft size={14} className="text-gray-300 group-hover:text-amber-500" />
                </Link>
              ))}
              <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                يمكنك عرض حسابات أولياء الأمور من إدارة المستخدمين (تصفية: ولي أمر) وربط الطلاب من صفحة الطلاب.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
