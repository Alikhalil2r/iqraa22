import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, ArrowRight, CheckCircle, Sparkles, GraduationCap,
  Server, Globe, Headphones, Shield, Zap, Clock, Users, BarChart3,
  MessageSquare, Calendar, CreditCard, Bus, BookOpen, Star, Gift,
  Percent, Phone, Mail, MessageCircle, Code2, ChevronDown
} from 'lucide-react'
import DevSignature from '../../components/DevSignature'

const API = (p: string) => fetch(`/api${p}`).then(r => r.json())

const INCLUDED = [
  { icon: GraduationCap, label: 'نظام إدارة مدرسي متكامل', desc: 'طلاب، موظفون، درجات، حضور، رسوم' },
  { icon: Server,        label: 'استضافة سحابية آمنة',      desc: 'خوادم سريعة مع نسخ احتياطي يومي' },
  { icon: Globe,         label: 'دومين .com مجاني',         desc: 'اسم نطاق احترافي لمدرستك لعامين' },
  { icon: Shield,        label: 'مساحة 5 جيجابايت',         desc: 'ملفات، صور، مستندات — بلا قلق' },
  { icon: Headphones,    label: 'دعم فني مستمر',            desc: 'فريق جاهز لمساعدتك على مدار الساعة' },
  { icon: Zap,           label: 'تحديثات مجانية',           desc: 'ميزات جديدة وتحسينات أمنية دورية' },
]

const MODULES = [
  { icon: Users,         title: 'إدارة الطلاب والموظفين' },
  { icon: BookOpen,      title: 'الدرجات والواجبات' },
  { icon: Calendar,      title: 'الحضور والجداول' },
  { icon: CreditCard,    title: 'الرسوم والفواتير' },
  { icon: MessageSquare, title: 'الرسائل والإشعارات' },
  { icon: Bus,           title: 'النقل المدرسي' },
  { icon: BarChart3,     title: 'تقارير ولوحات تحكم' },
  { icon: Globe,         title: 'موقع مدرسي احترافي' },
]

const FAQ = [
  { q: 'ماذا يشمل عرض الـ 250 ريال؟', a: 'اشتراك كامل لنظام إدارة المدارس لمدة عامين، مع الاستضافة السحابية، مساحة 5 جيجابايت، ودومين .com — كل ذلك في باقة واحدة بلا تكاليف خفية.' },
  { q: 'كيف يعمل خصم الـ 50% على التجديد؟', a: 'عند انتهاء العامين، تحصل على خصم 50% على تجديد الاشتراك السنوي لمدة عامين إضافيين — وفّر نصف التكلفة واستمر بخدمة متميزة.' },
  { q: 'هل الدعم الفني مشمول فعلاً؟', a: 'نعم. دعم فني مستمر عبر الهاتف، البريد، وواتساب — مساعدة في الإعداد، التدريب، وحل أي مشكلة تقنية.' },
  { q: 'هل يمكنني تجربة النظام قبل الاشتراك؟', a: 'بالتأكيد! جرّب النظام التجريبي على موقع مدرسة النور، أو اطلب عرضاً حياً من فريقنا قبل اتخاذ القرار.' },
  { q: 'كم يستغرق تفعيل الحساب؟', a: 'خلال 24–48 ساعة عمل من تأكيد الدفع: نُفعّل حسابك، نربط الدومين، ونُسلّمك لوحة التحكم جاهزة للعمل.' },
]

function FaqItem({ q, a, open: def }: { q: string; a: string; open?: boolean }) {
  const [open, setOpen] = useState(def || false)
  return (
    <div className={`offer-faq-item ${open ? 'open' : ''}`}>
      <button type="button" onClick={() => setOpen(!open)} className="offer-faq-btn">
        <span>{q}</span>
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="offer-faq-answer">{a}</p>}
    </div>
  )
}

function OfferBadge() {
  return (
    <div className="offer-countdown">
      <Sparkles size={14} className="text-amber-300" />
      <span className="text-amber-100 text-xs font-bold">عرض حصري للمدارس — أماكن محدودة</span>
      <span className="offer-countdown-unit">50%</span>
      <span className="text-[10px] text-white/60">خصم على التجديد لعامين</span>
    </div>
  )
}

export default function OfferPage() {
  const { data: cfg = {} as Record<string, string> } = useQuery({
    queryKey: ['plat-settings'],
    queryFn: () => API('/platform/settings'),
    staleTime: 600_000,
  })

  const companyName = cfg.company_name_ar || 'اكسبو التقنية'
  const phone = cfg.company_phone || '+968 9999 9999'
  const email = cfg.company_email || 'info@expo-tech.com'
  const whatsapp = cfg.company_whatsapp || '96899999999'

  return (
    <div className="offer-page font-['Cairo',sans-serif]" dir="rtl">
      {/* Nav */}
      <nav className="offer-nav">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/platform" className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold transition-colors">
            <ArrowRight size={16} /> {companyName}
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-black">
            <Sparkles size={12} /> عرض حصري
          </div>
          <Link to="/school" className="hidden sm:flex text-xs font-bold text-white/50 hover:text-white transition-colors">
            تجربة النظام
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="offer-hero">
        <div className="offer-hero-glow offer-hero-glow-1" />
        <div className="offer-hero-glow offer-hero-glow-2" />
        <div className="offer-hero-glow offer-hero-glow-3" />

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-16 md:pb-24">
          <OfferBadge />

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center mt-10">
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-black mb-6 offer-badge-pulse">
                <Gift size={14} /> اشترك الآن ووفّر 50% لعامين
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-5">
                نظام إدارة مدارس
                <br />
                <span className="offer-gradient-text">بسعر لا يُصدَّق</span>
              </h1>

              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                باقة اشتراك لعامين كاملين — نظام متكامل، استضافة، دومين .com، ومساحة 5 جيجا —
                مع <strong className="text-white">دعم فني مستمر</strong> وخصم <strong className="text-amber-300">50%</strong> على تجديد الاشتراك السنوي لأول عامين.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                <Link to="/platform/request?intent=school-offer" className="offer-cta-primary group">
                  اشترك بالعرض الآن
                  <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
                <Link to="/school" className="offer-cta-secondary">
                  جرّب النظام مجاناً
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start text-xs text-gray-400">
                {['بدون رسوم خفية', 'تفعيل خلال 48 ساعة', 'ضمان استرداد 14 يوم'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-400" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Price card */}
            <div className="offer-price-card">
              <div className="offer-discount-ribbon">
                <Percent size={14} />
                خصم 50%
              </div>

              <div className="text-center mb-6">
                <p className="text-purple-200 text-sm font-bold mb-1">باقة العامين — كل شيء مشمول</p>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-2xl text-white/40 line-through font-bold">500</span>
                  <span className="text-6xl md:text-7xl font-black text-white tracking-tight">250</span>
                  <div className="text-right">
                    <span className="block text-lg font-black text-amber-300">ر.ع</span>
                    <span className="block text-[10px] text-white/50">عماني</span>
                  </div>
                </div>
                <p className="text-emerald-300 text-sm font-black">لعامين كاملين فقط — وفّر 250 ر.ع</p>
                <p className="text-white/40 text-xs mt-2">≈ 10.4 ر.ع شهرياً — أقل من فنجان قهوة يومياً!</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'نظام إدارة مدرسي كامل لعامين',
                  'استضافة سحابية + SSL مجاني',
                  'دومين .com لمدرستك',
                  'مساحة تخزين 5 جيجابايت',
                  'دعم فني مستمر 24/7',
                  'خصم 50% على التجديد السنوي (عامان)',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/90">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={12} className="text-emerald-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link to="/platform/request?intent=school-offer" className="offer-cta-primary w-full justify-center text-base py-4">
                احجز مكانك — العرض محدود
              </Link>

              <div className="flex items-center justify-center gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                ))}
                <span className="text-white/50 text-xs mr-2">+50 مدرسة تثق بنا</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Value props */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">لماذا هذا العرض استثنائي؟</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">كل ما تحتاجه مدرستك للتحول الرقمي — في صفقة واحدة لا تتكرر</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INCLUDED.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="offer-feature-card">
                <div className="offer-feature-icon">
                  <Icon size={22} />
                </div>
                <h3 className="font-black text-gray-900 mb-1">{label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 50% renewal highlight */}
      <section className="offer-renewal-section py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="offer-renewal-banner">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-amber-200 text-xs font-black mb-4">
                  <Percent size={14} /> ميزة حصرية للمشتركين
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  خصم 50% على تجديد
                  <br />
                  <span className="text-amber-300">الاشتراك السنوي لعامين</span>
                </h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  بعد انتهاء باقة العامين، استمر معنا بأفضل سعر: ادفع نصف تكلفة التجديد السنوي لمدة عامين إضافيين.
                  استثمر مرة واحدة، واستمتع بتوفير حقيقي على المدى الطويل.
                </p>
                <ul className="space-y-2">
                  {['يُطبَّق تلقائياً على حسابك', 'يشمل كل مزايا الباقة', 'دعم فني مستمر بدون انقطاع'].map(t => (
                    <li key={t} className="flex items-center gap-2 text-sm text-white/80">
                      <CheckCircle size={15} className="text-emerald-400" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="offer-savings-visual">
                <div className="text-center">
                  <p className="text-white/50 text-sm font-bold mb-2">مثال على التوفير السنوي</p>
                  <div className="flex items-end justify-center gap-4 mb-4">
                    <div>
                      <div className="h-24 w-16 rounded-t-xl bg-white/10 flex items-end justify-center pb-2">
                        <span className="text-xs text-white/40 font-bold">100%</span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">بدون عرض</p>
                    </div>
                    <div>
                      <div className="h-12 w-16 rounded-t-xl bg-gradient-to-t from-amber-500 to-amber-300 flex items-end justify-center pb-2">
                        <span className="text-xs text-amber-900 font-black">50%</span>
                      </div>
                      <p className="text-[10px] text-amber-300 mt-1 font-bold">مع العرض</p>
                    </div>
                  </div>
                  <p className="text-3xl font-black text-amber-300">وفّر نصف التكلفة</p>
                  <p className="text-white/50 text-xs mt-1">على أول عامين من التجديد</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">نظام شامل — ليس موقعاً فقط</h2>
            <p className="text-gray-500">كل ما تحتاجه إدارة مدرستك في منصة واحدة ذكية</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {MODULES.map(({ icon: Icon, title }) => (
              <div key={title} className="offer-module-pill">
                <Icon size={18} className="text-purple-600" />
                <span>{title}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/school" className="inline-flex items-center gap-2 text-purple-600 font-black text-sm hover:underline">
              شاهد النظام الحي على موقع مدرسة النور <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="offer-support-card">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-5">
                  <Headphones size={28} className="text-emerald-400" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-3">دعم فني مستمر — لن تكون وحدك</h2>
                <p className="text-white/70 leading-relaxed">
                  فريق متخصص يرافقك من لحظة التسجيل: إعداد الحساب، ربط الدومين، تدريب الموظفين،
                  وحل أي استفسار تقني — عبر الهاتف، البريد، أو واتساب.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Phone, label: 'اتصال مباشر', val: phone },
                  { icon: Mail, label: 'بريد إلكتروني', val: email },
                  { icon: MessageCircle, label: 'واتساب', val: 'رد فوري' },
                  { icon: Clock, label: 'زمن الاستجابة', val: '< 2 ساعة' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="offer-support-stat">
                    <Icon size={18} className="text-purple-300 mb-2" />
                    <p className="text-[10px] text-white/40 font-bold">{label}</p>
                    <p className="text-sm font-black text-white truncate">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">أسئلة شائعة عن العرض</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FaqItem key={item.q} q={item.q} a={item.a} open={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="offer-final-cta py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <div className="offer-final-price">
            <span className="text-white/40 line-through text-xl font-bold">500 ر.ع</span>
            <span className="text-5xl md:text-6xl font-black text-white mx-3">250 ر.ع</span>
            <span className="text-amber-300 font-black">/ عامان</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white mt-6 mb-4">
            حوّل مدرستك رقمياً اليوم
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            العرض يشمل الاستضافة، الدومين، 5 جيجا، ودعم فني مستمر — مع خصم 50% على التجديد لعامين.
            لا تفوّت الفرصة.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/platform/request?intent=school-offer" className="offer-cta-primary text-base px-10 py-4">
              ابدأ الاشتراك الآن
            </Link>
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('مرحباً، أريد الاشتراك في عرض نظام إدارة المدارس (250 ر.ع لعامين)')}`}
              target="_blank" rel="noopener noreferrer"
              className="offer-cta-whatsapp">
              <MessageCircle size={18} /> تواصل عبر واتساب
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a14] py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Code2 size={14} className="text-white" />
            </div>
            <span className="font-bold">{companyName}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-white/40">
            <Link to="/platform" className="hover:text-white transition-colors">الرئيسية</Link>
            <Link to="/platform/request?intent=school-offer" className="hover:text-white transition-colors">طلب اشتراك</Link>
            <Link to="/school" className="hover:text-white transition-colors">تجربة النظام</Link>
            <Link to="/login" className="hover:text-white transition-colors">دخول الإدارة</Link>
          </div>
          <DevSignature variant="dark" scope="platform" />
        </div>
      </footer>
    </div>
  )
}
