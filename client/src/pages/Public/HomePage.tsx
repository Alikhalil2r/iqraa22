import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Globe, Smartphone, Palette, TrendingUp, Brain, Cloud,
  ChevronDown, ChevronUp, ArrowLeft, Star, CheckCircle, Sparkles,
  Phone, Mail, MessageCircle, Shield, Zap, Award, Users,
  BarChart3, Code2, Layers, Rocket, ExternalLink, Quote, Menu, X
} from 'lucide-react'
import DevSignature from '../../components/DevSignature'
import ServiceQualityStrip from '../../components/ServiceQualityStrip'
import { platformApi } from '../../api/platformApi'
import { parseFeatures } from '../../utils/parseFeatures'

const ICON_MAP: Record<string, React.ElementType> = {
  Globe, Smartphone, Palette, TrendingUp, Brain, Cloud, Shield, Zap, Award, Users, BarChart3, Code2, Layers, Rocket
}
const PORTFOLIO_CATEGORIES = ['all', 'web', 'mobile', 'ai', 'design', 'cloud']
const CATEGORY_LABELS: Record<string, string> = { all:'الكل', web:'مواقع', mobile:'تطبيقات', ai:'ذكاء اصطناعي', design:'تصميم', cloud:'سحابي' }

function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(18)].map((_, i) => (
        <div key={i} className="absolute rounded-full animate-pulse" style={{
          width: 4 + (i % 4) * 2, height: 4 + (i % 4) * 2,
          left: `${(i * 17 + 5) % 100}%`, top: `${(i * 23 + 10) % 100}%`,
          background: ['#7c3aed','#2563eb','#06b6d4','#10b981'][i % 4],
          opacity: 0.25 + (i % 4) * 0.1,
          animationDelay: `${(i % 4) * 0.7}s`, animationDuration: `${2 + (i % 3)}s`,
        }} />
      ))}
    </div>
  )
}

function FaqItem({ q, a, open: defaultOpen }: { q: string; a: string; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${open ? 'border-purple-300 bg-purple-50/60' : 'border-gray-200 bg-white hover:border-purple-200'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-4 text-right gap-4">
        <span className={`font-bold text-sm md:text-base transition-colors ${open ? 'text-purple-700' : 'text-gray-800'}`}>{q}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${open ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </div>
      </button>
      {open && <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-purple-100 pt-4">{a}</div>}
    </div>
  )
}

export default function HomePage() {
  const [portfolioCat, setPortfolioCat] = useState('all')
  const [menuOpen, setMenuOpen] = useState(false)

  const servicesQ     = useQuery({ queryKey: ['plat-services'], queryFn: () => platformApi.services().then(r => r.data), staleTime: 600_000, retry: 2 })
  const portfolioQ    = useQuery({ queryKey: ['plat-portfolio', portfolioCat], queryFn: () => platformApi.portfolio(portfolioCat).then(r => r.data), staleTime: 300_000, retry: 2 })
  const testimonialsQ = useQuery({ queryKey: ['plat-testimonials'], queryFn: () => platformApi.testimonials().then(r => r.data), staleTime: 600_000, retry: 2 })
  const faqQ          = useQuery({ queryKey: ['plat-faq'], queryFn: () => platformApi.faq().then(r => r.data), staleTime: 600_000, retry: 2 })
  const pricingQ      = useQuery({ queryKey: ['plat-pricing'], queryFn: () => platformApi.pricing().then(r => r.data), staleTime: 600_000, retry: 2 })
  const cfgQ          = useQuery({ queryKey: ['plat-settings'], queryFn: () => platformApi.settings().then(r => r.data), staleTime: 600_000, retry: 2 })

  const services     = Array.isArray(servicesQ.data) ? servicesQ.data : []
  const portfolio    = Array.isArray(portfolioQ.data) ? portfolioQ.data : []
  const testimonials = Array.isArray(testimonialsQ.data) ? testimonialsQ.data : []
  const faq          = Array.isArray(faqQ.data) ? faqQ.data : []
  const pricing      = Array.isArray(pricingQ.data) ? pricingQ.data : []
  const cfg          = (cfgQ.data || {}) as Record<string, string>
  const usingDemoContent = servicesQ.isError || (!servicesQ.isLoading && services.length === 0)

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }

  const defaultServices = [
    { id:'s1', title:'تطوير المواقع',     icon:'Globe',       color:'#7c3aed', description:'مواقع احترافية بأحدث التقنيات وأعلى معايير الأداء', features:['تصميم متجاوب','سرعة فائقة','SEO محسّن','لوحة تحكم كاملة'], price_from:299 },
    { id:'s2', title:'تطبيقات الجوال',   icon:'Smartphone',  color:'#2563eb', description:'تطبيقات iOS وAndroid بتجربة مستخدم استثنائية',       features:['iOS & Android','UI/UX احترافي','تحديثات مجانية','دعم فني'], price_from:499 },
    { id:'s3', title:'تصميم UI/UX',      icon:'Palette',     color:'#059669', description:'تصاميم تحوّل الزوار لعملاء وترفع معدل التحويل',       features:['تصميم احترافي','Figma/Adobe XD','Prototype كامل','تسليم سريع'], price_from:199 },
    { id:'s4', title:'التسويق الرقمي',   icon:'TrendingUp',  color:'#dc2626', description:'استراتيجيات تسويق رقمي شاملة لرفع مبيعاتك',          features:['SEO/SEM','إدارة السوشيال','إعلانات مدفوعة','تقارير تفصيلية'], price_from:149 },
    { id:'s5', title:'الذكاء الاصطناعي', icon:'Brain',       color:'#9333ea', description:'دمج الذكاء الاصطناعي في عمليات عملك لتحسين الكفاءة',  features:['Chatbots ذكية','تحليل البيانات','أتمتة العمليات','دعم API'], price_from:799 },
    { id:'s6', title:'الحوسبة السحابية', icon:'Cloud',       color:'#0284c7', description:'بنية تحتية سحابية آمنة وقابلة للتوسع',                features:['AWS/Azure/GCP','نسخ احتياطي','حماية متقدمة','مراقبة 24/7'], price_from:399 },
  ]
  const defaultPortfolio = [
    { id:'p1', title:'منصة تجارة إلكترونية متكاملة', description:'منصة تسوق كاملة مع إدارة المخزون والمدفوعات', category:'web', client_name:'سوق العرب', technologies:['Next.js','Node.js','PostgreSQL'], is_featured:true },
    { id:'p2', title:'تطبيق إدارة المطاعم',           description:'تطبيق iOS/Android لإدارة الطلبات والطاولات',  category:'mobile', client_name:'مطاعم الفخر', technologies:['Flutter','Firebase'], is_featured:true },
    { id:'p3', title:'نظام CRM للعيادات الطبية',       description:'إدارة المرضى والمواعيد والفواتير الطبية',      category:'web', client_name:'مركز الشفاء', technologies:['React','Express','PostgreSQL'], is_featured:true },
    { id:'p4', title:'منصة تعليمية تفاعلية',           description:'e-learning كامل مع دروس مباشرة وامتحانات',     category:'web', client_name:'أكاديمية المستقبل', technologies:['React','WebRTC','Node.js'], is_featured:false },
    { id:'p5', title:'تطبيق التوصيل الذكي',            description:'توصيل مع تتبع GPS وإدارة السائقين',            category:'mobile', client_name:'برق للتوصيل', technologies:['React Native','Google Maps'], is_featured:false },
    { id:'p6', title:'لوحة تحليلات الأعمال',           description:'لوحة ذكاء اصطناعي لدعم قرارات الأعمال',       category:'ai', client_name:'مجموعة الخليج', technologies:['Python','React','TensorFlow'], is_featured:false },
  ]
  const defaultTestimonials = [
    { id:'t1', client_name:'أحمد الكندي',    client_position:'المدير التنفيذي', company:'شركة النجوم',    content:'الفريق المحترف أنجز موقعنا في وقت قياسي. نسبة التحويل ارتفعت 340% بعد الإطلاق.', rating:5 },
    { id:'t2', client_name:'سارة البلوشية',  client_position:'مؤسسة',           company:'متجر سارة',      content:'تطبيق الجوال غيّر طريقة عمل متجرنا كلياً. المبيعات تضاعفت وتجربة العملاء أصبحت استثنائية.', rating:5 },
    { id:'t3', client_name:'محمد الريامي',   client_position:'مدير التسويق',    company:'مجموعة الريامي', content:'استراتيجية التسويق الرقمي أحدثت فارقاً هائلاً. ROI وصل 800% خلال 6 أشهر فقط.', rating:5 },
  ]
  const defaultFaq = [
    { id:'f1', question:'كم يستغرق تطوير موقع إلكتروني؟', answer:'يعتمد على الحجم: البسيطة 2-4 أسابيع، المتوسطة 1-3 أشهر، الكبيرة 3-6 أشهر. نلتزم بالجدول الزمني المتفق عليه.' },
    { id:'f2', question:'ما هي تقنيات التطوير التي تستخدمونها؟', answer:'نستخدم أحدث التقنيات: React, Next.js, Node.js, Python, Flutter للجوال، وقواعد بيانات PostgreSQL, MongoDB, Redis.' },
    { id:'f3', question:'هل تقدمون ضماناً بعد التسليم؟', answer:'نعم، ضمان مجاني 3 أشهر يشمل إصلاح الأخطاء والتحديثات الأمنية بعد التسليم.' },
    { id:'f4', question:'كيف أتابع تقدم مشروعي؟', answer:'نوفر بوابة إلكترونية للعملاء تتيح متابعة التقدم والتواصل مع الفريق واستلام الملفات لحظةً بلحظة.' },
    { id:'f5', question:'هل تدعمون اللغة العربية والـ RTL؟', answer:'نعم، لدينا خبرة واسعة في بناء منصات عربية احترافية بدعم كامل للغة العربية واتجاه RTL.' },
    { id:'f6', question:'ما هي خيارات الدفع المتاحة؟', answer:'نقبل الدفع بالتحويل البنكي، البطاقات الائتمانية، والدفع على مراحل حسب تقدم المشروع.' },
  ]

  const svcList  = services.length  ? services  : defaultServices
  const portList = portfolio.length ? portfolio : defaultPortfolio
  const testList = testimonials.length ? testimonials : defaultTestimonials
  const faqList  = faq.length ? faq : defaultFaq
  const pricList = pricing.length ? pricing : [
    { id:'pr1', name:'الأساسي',  price:299, currency:'OMR', period:'لكل مشروع', description:'للشركات الناشئة',    features:['موقع 5 صفحات','تصميم احترافي','متجاوب مع الجوال','SEO أساسي','استضافة شهر مجاني','دعم 30 يوم'], is_popular:false },
    { id:'pr2', name:'الأعمال', price:799, currency:'OMR', period:'لكل مشروع', description:'للشركات المتوسطة',   features:['موقع 15 صفحة','تصميم مخصص بالكامل','لوحة تحكم CMS','متكامل مع الدفع','SEO متقدم','دعم 6 أشهر'], is_popular:true },
    { id:'pr3', name:'المؤسسي', price:0,   currency:'OMR', period:'حسب المشروع', description:'للمؤسسات الكبيرة', features:['حل مخصص بالكامل','هندسة معمارية متقدمة','تكامل API كامل','ذكاء اصطناعي مدمج','SLA مضمون','دعم 24/7'], is_popular:false },
  ]

  const companyName = cfg.company_name_ar || 'اكسبو التقنية'
  const phone       = cfg.company_phone    || '+968 9999 9999'
  const email       = cfg.company_email    || 'info@expo-tech.com'
  const whatsapp    = cfg.company_whatsapp || '96899999999'
  const address     = cfg.company_address  || 'مسقط، سلطنة عُمان'

  return (
    <div className="font-['Cairo',sans-serif] bg-white overflow-x-hidden" dir="rtl">

      {/* ───── NAV ───────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Code2 size={18} className="text-white"/>
            </div>
            <span className="text-lg font-black text-gray-900">{companyName}</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-600">
            {[['services','خدماتنا'],['portfolio','أعمالنا'],['process','كيف نعمل'],['pricing','الأسعار'],['faq','الأسئلة']].map(([id,lbl]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-purple-600 transition-colors">{lbl}</button>
            ))}
            <Link to="/platform/offer" className="hover:text-purple-600 transition-colors flex items-center gap-1.5 text-amber-600">
              <Sparkles size={13} /> عرض المدارس
            </Link>
            <a href="/platform/blog" className="hover:text-purple-600 transition-colors">المدونة</a>
            <a href="/platform/track" className="hover:text-purple-600 transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
              تتبع طلبك
            </a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="/login" className="text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors">دخول الإدارة</a>
            <button onClick={() => scrollTo('contact')} className="text-sm font-black text-white px-5 py-2 rounded-xl hover:opacity-90 hover:shadow-lg transition-all" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>ابدأ مشروعك</button>
          </div>
          <button className="md:hidden p-2 rounded-lg text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t px-4 py-3 space-y-1">
            {[['services','خدماتنا'],['portfolio','أعمالنا'],['process','كيف نعمل'],['pricing','الأسعار'],['faq','الأسئلة'],['contact','تواصل معنا']].map(([id,lbl]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-purple-50 transition-colors">{lbl}</button>
            ))}
            <Link to="/platform/offer" className="block text-center bg-amber-500 text-white font-black py-2.5 rounded-xl text-sm mt-2">عرض المدارس — 250 ر.ع</Link>
            <a href="/login" className="block text-center bg-purple-600 text-white font-black py-2.5 rounded-xl text-sm mt-1">دخول الإدارة</a>
          </div>
        )}
      </nav>

      {/* ───── HERO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden" style={{ background:'linear-gradient(135deg,#0f0c29 0%,#302b63 45%,#24243e 75%,#0f0c29 100%)' }}>
        <Particles/>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background:'radial-gradient(circle,#7c3aed,transparent)' }}/>
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-15" style={{ background:'radial-gradient(circle,#2563eb,transparent)' }}/>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-black mb-6">
                <Zap size={13} className="text-yellow-400"/> شريك نموّك الرقمي الموثوق
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
                نبني{' '}
                <span className="text-purple-300" style={{ background:'linear-gradient(90deg,#a78bfa,#60a5fa,#34d399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>المستقبل</span>
                <br/>الرقمي معاً
              </h1>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                من المواقع الاحترافية إلى تطبيقات الجوال والذكاء الاصطناعي — نحوّل أفكارك إلى منتجات رقمية تُحدث فارقاً حقيقياً في سوقك.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link to="/platform/request" className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white text-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  ابدأ مشروعك الآن <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                </Link>
                <button onClick={() => scrollTo('portfolio')} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-white text-sm border border-white/20 hover:bg-white/10 transition-all">
                  استعرض أعمالنا
                </button>
              </div>
              <div className="mt-10 flex items-center gap-5 justify-center lg:justify-start">
                <div className="flex -space-x-2 space-x-reverse">
                  {['#7c3aed','#2563eb','#059669','#dc2626'].map((c,i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-2 border-white/20 flex items-center justify-center text-white text-xs font-black" style={{ background:c }}>
                      {['أ','م','ف','س'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex">{[...Array(5)].map((_,i) => <Star key={i} size={11} className="text-yellow-400 fill-yellow-400"/>)}</div>
                  <p className="text-gray-400 text-xs mt-0.5">200+ عميل راضٍ</p>
                </div>
              </div>
            </div>
            {/* Floating visual */}
            <div className="hidden lg:block relative">
              <div className="relative w-full max-w-md mx-auto aspect-square">
                <div className="absolute inset-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                      <Rocket size={36} className="text-white"/>
                    </div>
                    <p className="text-white font-black text-xl">{cfg.stats_projects || '500+'}  مشروع</p>
                    <p className="text-gray-400 text-sm">مكتمل بنجاح</p>
                  </div>
                </div>
                {[
                  { lbl:'مواقع احترافية', Icon:Globe,       color:'#7c3aed', cls:'top-2 right-2' },
                  { lbl:'تطبيقات جوال',   Icon:Smartphone,  color:'#2563eb', cls:'top-10 left-0' },
                  { lbl:'ذكاء اصطناعي',  Icon:Brain,        color:'#059669', cls:'bottom-10 right-0' },
                  { lbl:'تسويق رقمي',    Icon:TrendingUp,   color:'#dc2626', cls:'bottom-2 left-10' },
                ].map(({ lbl, Icon, color, cls }) => (
                  <div key={lbl} className={`absolute ${cls} flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 bg-white/10 backdrop-blur text-white text-xs font-bold shadow-lg`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:color }}><Icon size={13}/></div>
                    {lbl}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 animate-bounce">
          <span className="text-xs font-bold">اسحب للأسفل</span>
          <ChevronDown size={18}/>
        </div>
      </section>

      {/* ───── STATS BAR ─────────────────────────────────────── */}
      <section className="py-14" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb)' }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: cfg.stats_projects  || '500+', lbl:'مشروع منجز', Icon:Rocket },
            { val: cfg.stats_clients   || '200+', lbl:'عميل راضٍ',  Icon:Users  },
            { val: cfg.stats_experience|| '8+',   lbl:'سنة خبرة',   Icon:Award  },
            { val: cfg.stats_team      || '50+',  lbl:'خبير متخصص', Icon:Zap    },
          ].map(({ val, lbl, Icon }) => (
            <div key={lbl} className="text-center group">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Icon size={22} className="text-white"/>
              </div>
              <div className="text-3xl font-black text-white mb-1">{val}</div>
              <div className="text-purple-200 text-sm font-medium">{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── SERVICE QUALITY ───────────────────────────────── */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <ServiceQualityStrip variant="platform" />
        </div>
      </section>

      {/* ───── SERVICES ──────────────────────────────────────── */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-black mb-4">خدماتنا</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">ماذا نقدم لك؟</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">حلول رقمية شاملة مصمّمة لتحقيق أهداف عملك وتعزيز تنافسيتك في السوق</p>
            {usingDemoContent && (
              <p className="mt-3 text-xs font-bold text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
                عرض تجريبي — المحتوى الافتراضي حتى تُفعّل لوحة إدارة المنصة
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {svcList.map((svc: any) => {
              const Icon = ICON_MAP[svc.icon] || Globe
              const features = parseFeatures(svc.features)
              return (
                <div key={svc.id} className="group bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity" style={{ background:svc.color }}/>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background:`linear-gradient(135deg,${svc.color},${svc.color}bb)` }}>
                    <Icon size={26} className="text-white"/>
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">{svc.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">{svc.description}</p>
                  <ul className="space-y-2">
                    {features.slice(0,4).map((f,i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle size={13} style={{ color:svc.color }} className="flex-shrink-0"/>{f}
                      </li>
                    ))}
                  </ul>
                  {svc.price_from && (
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">يبدأ من</span>
                      <span className="font-black text-sm" style={{ color:svc.color }}>{svc.price_from} {cfg.currency || 'ريال'}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── WHY US ────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black mb-4">لماذا نحن؟</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight">نبني علاقات طويلة الأمد، لا مجرد مشاريع</h2>
              <p className="text-gray-500 text-sm leading-loose mb-8">نؤمن بأن نجاح عميلنا هو نجاحنا. نستثمر وقتنا في فهم أعمالك عمقاً قبل كتابة أي سطر كود.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { Icon:Shield,    title:'جودة مضمونة',        desc:'ضمان 3 أشهر بعد التسليم',     color:'#7c3aed' },
                  { Icon:Zap,       title:'تسليم سريع',          desc:'نلتزم بالمواعيد دائماً',      color:'#2563eb' },
                  { Icon:Users,     title:'فريق خبراء',          desc:'50+ متخصص محترف',              color:'#059669' },
                  { Icon:BarChart3, title:'نتائج قابلة للقياس', desc:'تحليلات وتقارير شاملة',        color:'#dc2626' },
                ].map(({ Icon, title, desc, color }) => (
                  <div key={title} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background:color+'15', color }}>
                      <Icon size={18}/>
                    </div>
                    <p className="font-black text-gray-800 text-sm mb-1">{title}</p>
                    <p className="text-gray-400 text-xs">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num:'98%',  lbl:'رضا العملاء',        sub:'بناءً على 200+ تقييم', color:'#7c3aed' },
                { num:'3x',   lbl:'متوسط نمو العملاء', sub:'مشاريعنا المنجزة',      color:'#2563eb' },
                { num:'<2s',  lbl:'سرعة التحميل',       sub:'معيارنا الأدنى',       color:'#059669' },
                { num:'24/7', lbl:'دعم فني',             sub:'للمشاريع النشطة',      color:'#dc2626' },
              ].map(({ num, lbl, sub, color }) => (
                <div key={num} className="p-6 rounded-3xl text-white text-center hover:scale-105 transition-transform" style={{ background:`linear-gradient(135deg,${color},${color}cc)` }}>
                  <p className="text-4xl font-black mb-1">{num}</p>
                  <p className="font-bold text-sm">{lbl}</p>
                  <p className="text-white/70 text-xs mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── PORTFOLIO ─────────────────────────────────────── */}
      <section id="portfolio" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-black mb-4">أعمالنا</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">مشاريع تتحدث عن نفسها</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {PORTFOLIO_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setPortfolioCat(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${portfolioCat===cat ? 'text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-200'}`}
                style={portfolioCat===cat ? { background:'linear-gradient(135deg,#7c3aed,#2563eb)' } : {}}>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portList.map((item: any) => {
              const techs: string[] = Array.isArray(item.technologies) ? item.technologies : (item.technologies || [])
              return (
                <div key={item.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-44 relative overflow-hidden flex items-center justify-center" style={{ background:'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)' }}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"/>
                      : <div className="text-center text-white opacity-60"><Layers size={38} className="mx-auto mb-2"/><p className="text-sm font-bold">{item.title}</p></div>
                    }
                    {item.is_featured && <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-lg">⭐ مميز</div>}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {item.project_url && <a href={item.project_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-800 hover:bg-purple-600 hover:text-white transition-colors"><ExternalLink size={16}/></a>}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-black text-gray-800 text-sm">{item.title}</h3>
                      <span className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold flex-shrink-0">{CATEGORY_LABELS[item.category] || item.category}</span>
                    </div>
                    <p className="text-gray-500 text-xs mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">{techs.slice(0,3).map(t => <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-bold">{t}</span>)}</div>
                      {item.client_name && <span className="text-[10px] text-gray-400">{item.client_name}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── PROCESS ───────────────────────────────────────── */}
      <section id="process" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-black mb-4">كيف نعمل</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">من الفكرة إلى الإطلاق</h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">منهجية عمل واضحة ومجربة تضمن تسليم مشروعك في الوقت المحدد وبالجودة المطلوبة</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step:'01', title:'الاستشارة', desc:'نفهم أهدافك واحتياجات عملك بعمق', Icon:MessageCircle, color:'#7c3aed' },
              { step:'02', title:'التصميم',   desc:'نضع الخطة والتصميم ونعرضها عليك',  Icon:Palette,       color:'#2563eb' },
              { step:'03', title:'التطوير',   desc:'نبني المشروع بأعلى معايير الجودة', Icon:Code2,         color:'#059669' },
              { step:'04', title:'الإطلاق',   desc:'نطلق المشروع ونتابعه معك باستمرار',Icon:Rocket,        color:'#dc2626' },
            ].map(({ step, title, desc, Icon, color }) => (
              <div key={step} className="text-center group">
                <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all" style={{ background:`linear-gradient(135deg,${color},${color}cc)` }}>
                  <Icon size={24}/>
                </div>
                <div className="text-xs font-black mb-1" style={{ color }}>{step}</div>
                <h3 className="font-black text-gray-800 mb-1">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="py-20" style={{ background:'linear-gradient(135deg,#0f0c29,#302b63)' }}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black mb-4">الأسعار</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">شفافية كاملة في التسعير</h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">اختر الخطة التي تناسب مشروعك. لا توجد تكاليف خفية.</p>
          </div>
          <Link to="/platform/offer"
            className="block mb-10 p-6 md:p-8 rounded-3xl border border-amber-400/30 bg-gradient-to-l from-amber-500/15 via-purple-500/10 to-transparent hover:border-amber-400/50 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black mb-3">
                  <Sparkles size={12} /> عرض حصري للمدارس
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white mb-2">نظام إدارة مدارس — 250 ر.ع لعامين</h3>
                <p className="text-gray-400 text-sm max-w-xl">استضافة + دومين .com + 5 جيجا + دعم فني مستمر + خصم 50% على التجديد السنوي لعامين</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-center">
                  <span className="block text-white/40 line-through text-sm font-bold">500</span>
                  <span className="block text-4xl font-black text-amber-300">250 <span className="text-lg">ر.ع</span></span>
                </div>
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 text-amber-950 font-black text-sm group-hover:scale-105 transition-transform">
                  اكتشف العرض <ArrowLeft size={16} />
                </span>
              </div>
            </div>
          </Link>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            {pricList.map((plan: any) => {
              const features = parseFeatures(plan.features)
              return (
                <div key={plan.id} className={`rounded-3xl p-7 relative transition-all hover:scale-105 ${plan.is_popular ? 'scale-105 shadow-2xl shadow-purple-900/50' : 'bg-white/5 backdrop-blur border border-white/10'}`}
                  style={plan.is_popular ? { background:'linear-gradient(160deg,#7c3aed,#4f46e5,#2563eb)' } : {}}>
                  {plan.is_popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-yellow-400 text-yellow-900 text-xs font-black rounded-full shadow-lg">⭐ الأكثر طلباً</div>}
                  <div className="mb-6">
                    <h3 className="font-black text-white text-xl mb-1">{plan.name}</h3>
                    <p className="text-gray-300 text-xs mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-2">
                      {plan.price > 0
                        ? <><span className="text-4xl font-black text-white">{plan.price}</span><span className="text-gray-300 text-sm">{plan.currency}</span><span className="text-gray-400 text-xs">/ {plan.period}</span></>
                        : <span className="text-2xl font-black text-white">تواصل معنا</span>
                      }
                    </div>
                  </div>
                  <ul className="space-y-3 mb-7">
                    {features.map((f,i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-200">
                        <CheckCircle size={13} className={plan.is_popular ? 'text-yellow-300' : 'text-green-400'}/>{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/platform/request" className={`block text-center w-full py-3 rounded-2xl font-black text-sm transition-all ${plan.is_popular ? 'bg-white text-purple-700 hover:bg-yellow-50' : 'border border-white/30 text-white hover:bg-white/10'}`}>
                    {plan.price > 0 ? 'ابدأ الآن' : 'احصل على عرض سعر'}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-black mb-4">آراء العملاء</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">ماذا يقول عملاؤنا؟</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testList.map((t: any) => (
              <div key={t.id} className="bg-white p-6 rounded-3xl border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all">
                <Quote size={26} className="text-purple-200 mb-4"/>
                <p className="text-gray-700 text-sm leading-loose mb-6 min-h-16">{t.content}</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                    {t.client_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-sm">{t.client_name}</p>
                    <p className="text-gray-400 text-xs truncate">{t.client_position} · {t.company}</p>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[...Array(t.rating||5)].map((_,i) => <Star key={i} size={11} className="text-yellow-400 fill-yellow-400"/>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black mb-4">الأسئلة الشائعة</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">لديك سؤال؟</h2>
          </div>
          <div className="space-y-3">
            {faqList.map((item: any, i: number) => <FaqItem key={item.id} q={item.question} a={item.answer} open={i===0}/>)}
          </div>
        </div>
      </section>

      {/* ───── CTA / CONTACT ─────────────────────────────────── */}
      <section id="contact" className="py-20 relative overflow-hidden" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb)' }}>
        <Particles/>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">جاهز لبدء مشروعك؟</h2>
          <p className="text-purple-200 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            تواصل معنا اليوم واحصل على استشارة مجانية. سنساعدك على تحويل فكرتك إلى واقع رقمي ناجح.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-xl mx-auto">
            {[
              { href:`tel:${phone.replace(/\s/g,'')}`, Icon:Phone, lbl:phone },
              { href:`mailto:${email}`, Icon:Mail, lbl:email },
              { href:`https://wa.me/${whatsapp}`, Icon:MessageCircle, lbl:'واتساب' },
            ].map(({ href, Icon, lbl }) => (
              <a key={lbl} href={href} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-white text-sm font-bold backdrop-blur border border-white/20">
                <Icon size={16}/>{lbl}
              </a>
            ))}
          </div>
          <Link to="/platform/request" className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-white text-purple-700 font-black text-base hover:shadow-2xl hover:-translate-y-1 transition-all">
            <Rocket size={18}/> ابدأ مشروعك الآن <ArrowLeft size={16}/>
          </Link>
        </div>
      </section>

      {/* ───── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background:'#0a0a0f' }} className="text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
                  <Code2 size={18} className="text-white"/>
                </div>
                <span className="text-xl font-black text-white">{companyName}</span>
              </div>
              <p className="text-sm leading-loose mb-5 max-w-xs">{cfg.company_tagline || 'نبني المستقبل الرقمي — شريكك الموثوق في التحول الرقمي'}</p>
              <div className="flex gap-3">
                {[{ href:`tel:${phone.replace(/\s/g,'')}`, Icon:Phone }, { href:`mailto:${email}`, Icon:Mail }, { href:`https://wa.me/${whatsapp}`, Icon:MessageCircle }].map(({ href, Icon }, i) => (
                  <a key={i} href={href} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-purple-600/30 flex items-center justify-center transition-all text-gray-400 hover:text-white border border-white/10">
                    <Icon size={15}/>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-black text-sm mb-4">خدماتنا</h4>
              <ul className="space-y-2 text-xs">
                {['تطوير المواقع','تطبيقات الجوال','تصميم UI/UX','التسويق الرقمي','حلول الذكاء الاصطناعي','الحوسبة السحابية'].map(l => (
                  <li key={l}><button onClick={() => scrollTo('services')} className="hover:text-white transition-colors text-right">{l}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black text-sm mb-4">روابط سريعة</h4>
              <ul className="space-y-2 text-xs">
                {[['#portfolio','أعمالنا'],['#pricing','الأسعار'],['#faq','الأسئلة الشائعة'],['#contact','تواصل معنا'],['/platform/offer','عرض المدارس 250 ر.ع'],['/platform/blog','المدونة التقنية'],['/platform/track','تتبع طلبك'],['/platform/request','ابدأ مشروعك'],['/school','نموذج مدرسة النور'],['/login','دخول الإدارة']].map(([to,lbl]) => (
                  <li key={lbl}><Link to={to} className="hover:text-white transition-colors">{lbl}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} {companyName}. جميع الحقوق محفوظة.</p>
            <p className="hidden md:block text-gray-500">{address}</p>
          </div>
          <div className="mt-5 pt-4 border-t border-white/5">
            <DevSignature variant="dark" scope="platform" />
          </div>
        </div>
      </footer>
    </div>
  )
}
