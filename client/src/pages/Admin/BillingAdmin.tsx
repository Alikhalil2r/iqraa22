import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '../../api/client'
import { Check, Zap, Star, Crown, Shield, CreditCard, Calendar, TrendingUp, Download, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const PLANS = [
  { id: 'free', name: 'مجاني', price: 0, period: 'دائمًا', color: '#64748b', icon: <Shield size={22} />, description: 'مثالي للتجربة والمدارس الصغيرة', features: ['حتى 50 طالب', 'حتى 10 موظفين', 'لوحة التحكم الأساسية', 'إدارة الحضور', 'الرسائل الأساسية'], limitations: ['لا تقارير متقدمة', 'لا نسخ احتياطي تلقائي'] },
  { id: 'basic', name: 'الأساسي', price: 29, period: 'شهرياً', color: '#3b82f6', icon: <Zap size={22} />, description: 'للمدارس المتوسطة', popular: false, features: ['حتى 200 طالب', 'حتى 30 موظف', 'تقارير + PDF', 'إدارة الرسوم', 'جدول الامتحانات', 'معرض الصور'], limitations: [] },
  { id: 'pro', name: 'الاحترافي', price: 79, period: 'شهرياً', color: '#6366f1', icon: <Star size={22} />, description: 'للمدارس الكبيرة', popular: true, features: ['طلاب وموظفون موسّعون', 'تحليل ذكي', 'إشعارات فورية', 'نسخ احتياطي', 'تخصيص كامل'], limitations: [] },
  { id: 'enterprise', name: 'المؤسسي', price: null, period: 'حسب الاتفاق', color: '#f59e0b', icon: <Crown size={22} />, description: 'للمجموعات التعليمية', features: ['مدارس متعددة', 'API خاص', 'مدير حساب مخصص', 'SLA مضمون'], limitations: [] },
]

const PLAN_LABELS: Record<string, string> = { free: 'مجاني', basic: 'الأساسي', pro: 'الاحترافي', enterprise: 'المؤسسي' }

function downloadInvoice(inv: any) {
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>فاتورة ${inv.invoice_number}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;direction:rtl}h1{color:#065f46}.row{display:flex;justify-content:space-between;margin:8px 0}</style></head><body>
<h1>فاتورة اشتراك</h1>
<div class="row"><span>رقم الفاتورة:</span><strong>${inv.invoice_number}</strong></div>
<div class="row"><span>الخطة:</span><strong>${PLAN_LABELS[inv.plan] || inv.plan}</strong></div>
<div class="row"><span>المبلغ:</span><strong>${inv.amount} ${inv.currency || 'OMR'}</strong></div>
<div class="row"><span>الحالة:</span><strong>${inv.status === 'paid' ? 'مدفوعة' : 'معلقة'}</strong></div>
<div class="row"><span>تاريخ الإصدار:</span><strong>${new Date(inv.created_at).toLocaleDateString('ar-OM')}</strong></div>
${inv.due_date ? `<div class="row"><span>تاريخ الاستحقاق:</span><strong>${new Date(inv.due_date).toLocaleDateString('ar-OM')}</strong></div>` : ''}
</body></html>`
  const w = window.open('', '_blank')
  if (w) { w.document.write(html); w.document.close(); w.print() }
}

export default function BillingAdmin() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const qc = useQueryClient()

  const { data: billingData, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: () => billingApi.get().then(r => r.data),
  })
  const { data: usageData } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => billingApi.usage().then(r => r.data),
  })

  const changePlan = useMutation({
    mutationFn: (plan: string) => billingApi.changePlan(plan, billing),
    onSuccess: () => {
      toast.success('تم تحديث الخطة وإنشاء الفاتورة')
      qc.invalidateQueries({ queryKey: ['billing'] })
      qc.invalidateQueries({ queryKey: ['billing-usage'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'فشل تغيير الخطة'),
  })

  const cancelPlan = useMutation({
    mutationFn: () => billingApi.cancel(),
    onSuccess: () => {
      toast.success('تم إلغاء الاشتراك والعودة للخطة المجانية')
      qc.invalidateQueries({ queryKey: ['billing'] })
      qc.invalidateQueries({ queryKey: ['billing-usage'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'فشل الإلغاء'),
  })

  const markPaid = useMutation({
    mutationFn: (id: string) => billingApi.markPaid(id),
    onSuccess: () => {
      toast.success('تم تسجيل الدفع')
      qc.invalidateQueries({ queryKey: ['billing'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'فشل تسجيل الدفع'),
  })

  const currentPlan = usageData?.plan || billingData?.school?.plan || 'basic'
  const invoices = billingData?.invoices || []
  const expires = usageData?.planExpiresAt || billingData?.school?.plan_expires_at

  const getPrice = (price: number | null) => {
    if (price === null) return null
    if (price === 0) return 0
    return billing === 'yearly' ? Math.round(price * 12 * 0.8) : price
  }

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan) return toast('أنت على هذه الخطة بالفعل')
    if (planId === 'enterprise') {
      window.open('/school/contact', '_blank')
      return
    }
    if (!window.confirm(`تأكيد الترقية إلى خطة ${PLAN_LABELS[planId]}؟`)) return
    changePlan.mutate(planId)
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>
  }

  const currentPlanInfo = PLANS.find(p => p.id === currentPlan) || PLANS[1]
  const currentPrice = getPrice(currentPlanInfo.price)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-800">الاشتراك والفواتير</h1>
        <p className="text-gray-500 text-sm mt-0.5">إدارة خطة اشتراكك والفواتير المالية</p>
      </div>

      <div className="rounded-2xl p-5 flex items-center gap-4 text-white flex-wrap" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent, #8b5cf6))' }}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">{currentPlanInfo.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-sm font-bold">خطتك الحالية</p>
          <p className="text-2xl font-black">{currentPlanInfo.name}{currentPrice ? ` — ${currentPrice} ر.ع / ${billing === 'yearly' ? 'سنوياً' : 'شهرياً'}` : ''}</p>
          {expires && <p className="text-white/70 text-sm mt-0.5">التجديد: {new Date(expires).toLocaleDateString('ar-OM')}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">نشط</span>
          {currentPlan !== 'free' && (
            <button className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              disabled={cancelPlan.isPending}
              onClick={() => { if (window.confirm('إلغاء الاشتراك والعودة للخطة المجانية؟')) cancelPlan.mutate() }}>
              إلغاء الاشتراك
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-black text-gray-800">خطط الاشتراك</h2>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${billing === 'monthly' ? 'text-gray-800' : 'text-gray-400'}`}>شهري</span>
          <button onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`w-12 h-6 rounded-full transition-colors relative ${billing === 'yearly' ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${billing === 'yearly' ? 'right-1' : 'left-1'}`} />
          </button>
          <span className={`text-sm font-bold ${billing === 'yearly' ? 'text-gray-800' : 'text-gray-400'}`}>سنوي <span className="text-green-600">(وفر 20%)</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map(plan => {
          const price = getPrice(plan.price)
          const isCurrent = plan.id === currentPlan
          return (
            <div key={plan.id} className={`relative rounded-2xl border-2 flex flex-col overflow-hidden transition-all hover:shadow-lg ${isCurrent ? 'shadow-lg' : 'shadow-sm'}`}
              style={{ borderColor: isCurrent ? plan.color : '#e2e8f0' }}>
              {plan.popular && <div className="absolute top-3 left-3 text-[10px] font-black text-white px-2 py-1 rounded-full" style={{ background: plan.color }}>الأكثر شيوعاً</div>}
              {isCurrent && <div className="absolute top-3 right-3 text-[10px] font-black text-white px-2 py-1 rounded-full bg-green-500">خطتك الحالية</div>}
              <div className="p-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-white" style={{ background: plan.color }}>{plan.icon}</div>
                <h3 className="text-lg font-black text-gray-800">{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                <div className="my-4">
                  {price === null ? <p className="text-2xl font-black text-gray-800">تواصل معنا</p> : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black" style={{ color: plan.color }}>{price}</span>
                      <span className="text-gray-400 text-sm mb-1">{price === 0 ? '' : 'ر.ع'} / {plan.period}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => isCurrent ? undefined : handleUpgrade(plan.id)}
                  disabled={changePlan.isPending || isCurrent}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${isCurrent ? 'bg-gray-100 text-gray-500 cursor-default' : 'text-white hover:opacity-90 disabled:opacity-50'}`}
                  style={!isCurrent ? { background: plan.color } : {}}>
                  {isCurrent ? 'خطتك الحالية' : plan.price === null ? 'تواصل مع المبيعات' : 'ترقية الآن'}
                </button>
              </div>
              <div className="border-t border-gray-100 p-5 flex-1 space-y-2">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2"><Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} /><span className="text-xs text-gray-600">{f}</span></div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {usageData && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><TrendingUp size={17} style={{ color: 'var(--color-primary)' }} /><h2 className="font-black text-gray-800">استخدام الخطة الحالية</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'الطلاب', used: usageData.currentStudents, max: usageData.maxStudents, color: '#6366f1' },
              { label: 'الموظفون', used: usageData.currentEmployees, max: usageData.maxEmployees, color: '#10b981' },
            ].map(u => (
              <div key={u.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-gray-700">{u.label}</span>
                  <span className="text-xs text-gray-400">{u.used} / {u.max}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (u.used / u.max) * 100)}%`, background: u.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={17} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-black text-gray-800">سجل الفواتير</h2>
        </div>
        {invoices.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">لا توجد فواتير بعد — ستُنشأ عند ترقية الخطة</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-right px-5 py-3 font-bold text-gray-500">رقم الفاتورة</th>
              <th className="text-right px-5 py-3 font-bold text-gray-500">التاريخ</th>
              <th className="text-right px-5 py-3 font-bold text-gray-500">الخطة</th>
              <th className="text-right px-5 py-3 font-bold text-gray-500">المبلغ</th>
              <th className="text-right px-5 py-3 font-bold text-gray-500">الحالة</th>
              <th className="text-right px-5 py-3 font-bold text-gray-500">إجراء</th>
            </tr></thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-black text-gray-700">{inv.invoice_number}</td>
                  <td className="px-5 py-3 text-gray-500"><Calendar size={12} className="inline ml-1" />{new Date(inv.created_at).toLocaleDateString('ar-OM')}</td>
                  <td className="px-5 py-3"><span className="badge-info">{PLAN_LABELS[inv.plan] || inv.plan}</span></td>
                  <td className="px-5 py-3 font-bold">{inv.amount} {inv.currency || 'OMR'}</td>
                  <td className="px-5 py-3"><span className={inv.status === 'paid' ? 'badge-success' : 'badge-warning'}>{inv.status === 'paid' ? 'مدفوعة' : 'معلقة'}</span></td>
                  <td className="px-5 py-3 flex gap-2">
                    <button onClick={() => downloadInvoice(inv)} className="text-xs text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1"><Download size={12} />طباعة</button>
                    {inv.status !== 'paid' && (
                      <button onClick={() => markPaid.mutate(inv.id)} className="text-xs text-green-600 font-bold hover:text-green-800">تسجيل الدفع</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3"><CreditCard size={17} style={{ color: 'var(--color-primary)' }} /><h2 className="font-black text-gray-800">الدفع</h2></div>
        <p className="text-sm text-gray-600 mb-4">يتم الدفع عبر التحويل البنكي أو بموافقة الإدارة. للاستفسار عن طرق الدفع:</p>
        <Link to="/school/contact" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline">
          <ExternalLink size={14} /> تواصل مع الدعم المالي
        </Link>
      </div>
    </div>
  )
}
