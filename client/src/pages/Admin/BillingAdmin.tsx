import React, { useState } from 'react'
import { Check, Zap, Star, Building2, Crown, Shield, CreditCard, Calendar, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'free',
    name: 'مجاني',
    nameEn: 'Free',
    price: 0,
    period: 'دائمًا',
    color: '#64748b',
    icon: <Shield size={22} />,
    description: 'مثالي للتجربة والمدارس الصغيرة',
    features: [
      'حتى 50 طالب',
      'حتى 10 موظفين',
      'لوحة التحكم الأساسية',
      'إدارة الحضور',
      'الرسائل الأساسية',
      '1 GB تخزين',
    ],
    limitations: ['لا يوجد تقارير متقدمة', 'لا يوجد دعم فني', 'لا يوجد نسخ احتياطي'],
    current: false,
  },
  {
    id: 'basic',
    name: 'الأساسي',
    nameEn: 'Basic',
    price: 29,
    period: 'شهرياً',
    color: '#3b82f6',
    icon: <Zap size={22} />,
    description: 'للمدارس المتوسطة الحجم',
    popular: false,
    features: [
      'حتى 200 طالب',
      'حتى 30 موظف',
      'جميع ميزات المجاني',
      'تقارير متقدمة + PDF',
      'إدارة الرسوم الدراسية',
      'جدول الامتحانات',
      'معرض الصور',
      '10 GB تخزين',
      'دعم فني بالبريد',
    ],
    limitations: [],
    current: true,
  },
  {
    id: 'pro',
    name: 'الاحترافي',
    nameEn: 'Pro',
    price: 79,
    period: 'شهرياً',
    color: '#6366f1',
    icon: <Star size={22} />,
    description: 'للمدارس الكبيرة والمتميزة',
    popular: true,
    features: [
      'طلاب غير محدودين',
      'موظفون غير محدودون',
      'جميع ميزات الأساسي',
      'لوحة الإدارة العليا',
      'تطبيق جوال (iOS + Android)',
      'تكامل الرسائل SMS',
      'إشعارات فورية',
      'نسخ احتياطي تلقائي',
      '100 GB تخزين',
      'دعم فني 24/7',
      'تخصيص كامل للألوان والشعار',
    ],
    limitations: [],
    current: false,
  },
  {
    id: 'enterprise',
    name: 'المؤسسي',
    nameEn: 'Enterprise',
    price: null,
    period: 'حسب الاتفاق',
    color: '#f59e0b',
    icon: <Crown size={22} />,
    description: 'للمجموعات التعليمية الكبرى',
    features: [
      'كل مدارس غير محدودة',
      'لوحة تحكم لكل المجموعة',
      'جميع ميزات الاحترافي',
      'تكامل مع أنظمة الحكومة',
      'API خاص',
      'تخزين غير محدود',
      'مدير حساب مخصص',
      'SLA 99.9% uptime',
      'تدريب الفريق',
      'نشر على domain خاص',
    ],
    limitations: [],
    current: false,
  },
]

const INVOICES = [
  { id: 'INV-001', date: '2025-04-01', amount: 29, status: 'مدفوعة', plan: 'الأساسي' },
  { id: 'INV-002', date: '2025-03-01', amount: 29, status: 'مدفوعة', plan: 'الأساسي' },
  { id: 'INV-003', date: '2025-02-01', amount: 29, status: 'مدفوعة', plan: 'الأساسي' },
]

export default function BillingAdmin() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const getPrice = (price: number | null) => {
    if (price === null) return null
    if (price === 0) return 0
    return billing === 'yearly' ? Math.round(price * 0.8) : price
  }

  const handleUpgrade = (planId: string) => {
    toast.success(`سيتم توجيهك لبوابة الدفع لترقية إلى الخطة: ${planId}`, { duration: 4000 })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800">الاشتراك والفواتير</h1>
        <p className="text-gray-500 text-sm mt-0.5">إدارة خطة اشتراكك والفواتير المالية</p>
      </div>

      {/* Current Plan Banner */}
      <div className="rounded-2xl p-5 flex items-center gap-4 text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent, #8b5cf6))' }}>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Zap size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white/70 text-sm font-bold">خطتك الحالية</p>
          <p className="text-2xl font-black">الأساسي — 29 ر.ع / شهرياً</p>
          <p className="text-white/70 text-sm mt-0.5">التجديد القادم: 1 يونيو 2025</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">نشط</span>
          <button className="bg-white text-gray-800 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => toast('سيتم توجيهك لإلغاء الاشتراك')}>
            إلغاء الاشتراك
          </button>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-black text-gray-800">خطط الاشتراك</h2>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${billing === 'monthly' ? 'text-gray-800' : 'text-gray-400'}`}>شهري</span>
          <button onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`w-12 h-6 rounded-full transition-colors relative ${billing === 'yearly' ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${billing === 'yearly' ? 'right-1' : 'left-1'}`} />
          </button>
          <span className={`text-sm font-bold ${billing === 'yearly' ? 'text-gray-800' : 'text-gray-400'}`}>
            سنوي <span className="text-green-600">(وفر 20%)</span>
          </span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map(plan => {
          const price = getPrice(plan.price)
          return (
            <div key={plan.id} className={`relative rounded-2xl border-2 flex flex-col overflow-hidden transition-all hover:shadow-lg ${plan.current ? 'shadow-lg' : 'shadow-sm'}`}
              style={{ borderColor: plan.current ? plan.color : '#e2e8f0' }}>
              {plan.popular && (
                <div className="absolute top-3 left-3 text-[10px] font-black text-white px-2 py-1 rounded-full" style={{ background: plan.color }}>
                  الأكثر شيوعاً
                </div>
              )}
              {plan.current && (
                <div className="absolute top-3 right-3 text-[10px] font-black text-white px-2 py-1 rounded-full bg-green-500">
                  خطتك الحالية
                </div>
              )}
              <div className="p-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-white" style={{ background: plan.color }}>
                  {plan.icon}
                </div>
                <h3 className="text-lg font-black text-gray-800">{plan.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                <div className="my-4">
                  {price === null ? (
                    <p className="text-2xl font-black text-gray-800">تواصل معنا</p>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black" style={{ color: plan.color }}>{price}</span>
                      <span className="text-gray-400 text-sm mb-1">{price === 0 ? '' : 'ر.ع'} / {plan.period}</span>
                    </div>
                  )}
                  {billing === 'yearly' && price !== null && price > 0 && (
                    <p className="text-xs text-green-600 font-bold mt-1">وفر {Math.round(plan.price! * 12 * 0.2)} ر.ع سنوياً</p>
                  )}
                </div>
                <button
                  onClick={() => plan.current ? toast('أنت على هذه الخطة بالفعل') : handleUpgrade(plan.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${plan.current ? 'bg-gray-100 text-gray-500 cursor-default' : 'text-white hover:opacity-90'}`}
                  style={!plan.current ? { background: plan.color } : {}}>
                  {plan.current ? 'خطتك الحالية' : plan.price === null ? 'تواصل مع المبيعات' : 'ترقية الآن'}
                </button>
              </div>
              <div className="border-t border-gray-100 p-5 flex-1 space-y-2">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                    <span className="text-xs text-gray-600">{f}</span>
                  </div>
                ))}
                {plan.limitations.map(l => (
                  <div key={l} className="flex items-start gap-2 opacity-40">
                    <span className="text-sm flex-shrink-0 mt-0.5">✕</span>
                    <span className="text-xs text-gray-500 line-through">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Usage Stats */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={17} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-black text-gray-800">استخدام الخطة الحالية</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'الطلاب', used: 87, max: 200, color: '#6366f1' },
            { label: 'الموظفون', used: 12, max: 30, color: '#10b981' },
            { label: 'التخزين', used: 3.2, max: 10, unit: 'GB', color: '#f59e0b' },
          ].map(u => (
            <div key={u.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-bold text-gray-700">{u.label}</span>
                <span className="text-xs text-gray-400">{u.used} / {u.max} {u.unit || ''}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(u.used / u.max) * 100}%`, background: u.color }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{Math.round((u.used / u.max) * 100)}% مستخدم</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={17} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-black text-gray-800">سجل الفواتير</h2>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-right px-5 py-3 font-bold text-gray-500">رقم الفاتورة</th>
            <th className="text-right px-5 py-3 font-bold text-gray-500">التاريخ</th>
            <th className="text-right px-5 py-3 font-bold text-gray-500">الخطة</th>
            <th className="text-right px-5 py-3 font-bold text-gray-500">المبلغ</th>
            <th className="text-right px-5 py-3 font-bold text-gray-500">الحالة</th>
            <th className="text-right px-5 py-3 font-bold text-gray-500">تحميل</th>
          </tr></thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-black text-gray-700">{inv.id}</td>
                <td className="px-5 py-3 text-gray-500 flex items-center gap-1"><Calendar size={12} /> {new Date(inv.date).toLocaleDateString('ar-OM')}</td>
                <td className="px-5 py-3"><span className="badge-info">{inv.plan}</span></td>
                <td className="px-5 py-3 font-bold">{inv.amount} ر.ع</td>
                <td className="px-5 py-3"><span className="badge-success">{inv.status}</span></td>
                <td className="px-5 py-3">
                  <button onClick={() => toast('سيتم تحميل الفاتورة PDF')} className="text-xs text-indigo-600 font-bold hover:text-indigo-800">تحميل PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Methods */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={17} style={{ color: 'var(--color-primary)' }} />
            <h2 className="font-black text-gray-800">طرق الدفع</h2>
          </div>
          <button onClick={() => toast('سيتم فتح نافذة إضافة بطاقة جديدة')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>+ إضافة بطاقة</span>
          </button>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
          <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
            <CreditCard size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-700">•••• •••• •••• 4242</p>
            <p className="text-xs text-gray-400">تنتهي 12/2026</p>
          </div>
          <span className="mr-auto badge-success">افتراضية</span>
        </div>
      </div>
    </div>
  )
}
