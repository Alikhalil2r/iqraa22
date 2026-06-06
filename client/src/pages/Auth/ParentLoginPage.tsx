import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Users, Eye, EyeOff, MessageSquare, BookOpen, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import DemoCredentialsBox from '../../components/DemoCredentialsBox'

export default function ParentLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t, lang, toggleLang } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password, 'parent')
      navigate('/parent')
      toast.success(lang === 'ar' ? 'مرحباً بك في بوابة الأولياء' : 'Welcome to the parent portal')
    } catch (err: any) {
      toast.error(err.response?.data?.error || (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'}}>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Info */}
        <div className="text-white order-2 lg:order-1">
          <h1 className="text-3xl font-black mb-4" style={{color:'var(--color-accent)'}}>
            {lang === 'ar' ? 'بوابة أولياء الأمور' : 'Parent Portal'}
          </h1>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            {lang === 'ar' ? 'متابعة أبنائك بكل سهولة - نتائج، حضور، رسائل وأكثر' : 'Track your children easily — grades, attendance, messages & more'}
          </p>
          <div className="space-y-4">
            {[
              { Icon: BookOpen,      title: lang === 'ar' ? 'النتائج الدراسية'        : 'Academic Results',      desc: lang === 'ar' ? 'تتبع درجات ابنك في كل المواد بشكل لحظي' : 'Track your child\'s grades in real time' },
              { Icon: BarChart3,     title: lang === 'ar' ? 'سجل الحضور'              : 'Attendance Record',     desc: lang === 'ar' ? 'معرفة أيام الحضور والغياب والتأخر'      : 'Know attendance, absence, and late days' },
              { Icon: MessageSquare, title: lang === 'ar' ? 'التواصل مع الإدارة'     : 'Contact Administration', desc: lang === 'ar' ? 'إرسال واستقبال الرسائل مباشرة'          : 'Send and receive messages directly' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-white/5 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--color-accent)'}}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">{title}</p>
                  <p className="text-sm text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Form */}
        <div className="order-1 lg:order-2">
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--color-accent)'}}>
                  <Users size={22} className="text-white"/>
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800">{t('auth.parentTitle')}</h2>
                  <p className="text-sm text-gray-400">{t('auth.parentSub')}</p>
                </div>
              </div>
              <button onClick={toggleLang}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-black transition-all flex-shrink-0"
                title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}>
                <span className={lang === 'ar' ? 'text-green-600' : 'text-gray-400'}>ع</span>
                <span className="text-gray-300 mx-0.5">|</span>
                <span className={lang === 'en' ? 'text-green-600' : 'text-gray-400'}>EN</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auth.username')}</label>
                <input className="input-field"
                  placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                  value={username} onChange={e=>setUsername(e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('auth.password')}</label>
                <div className="relative">
                  <input className="input-field pl-12" type={showPass?'text':'password'}
                    placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                    value={password} onChange={e=>setPassword(e.target.value)}/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 text-base font-bold text-white rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{background:'var(--color-accent)'}}>
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                {loading
                  ? (lang === 'ar' ? 'جارٍ الدخول...' : 'Logging in...')
                  : (lang === 'ar' ? 'دخول بوابة الأولياء' : 'Login to Parent Portal')}
              </button>
            </form>
            <div className="mt-4 flex flex-col items-center gap-2">
              <Link to="/school" className="text-sm text-gray-400 hover:text-gray-600">
                ← {lang === 'ar' ? 'العودة لموقع المدرسة' : 'Back to school site'}
              </Link>
              <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600">
                {t('auth.adminPortal')}
              </Link>
            </div>
            <DemoCredentialsBox lang={lang} variant="parent" className="mt-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
