import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Shield, Eye, EyeOff, GraduationCap, Users, BarChart3, BookOpen, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t, lang, toggleLang } = useLanguage()

  const FEATURES = [
    { icon: GraduationCap, label: lang === 'ar' ? 'إدارة الطلاب'      : 'Student Management', desc: lang === 'ar' ? 'سجلات، حضور، نتائج'       : 'Records, attendance, grades' },
    { icon: Users,         label: lang === 'ar' ? 'الموارد البشرية'    : 'Human Resources',    desc: lang === 'ar' ? 'الموظفون والرواتب'          : 'Employees & payroll' },
    { icon: BarChart3,     label: lang === 'ar' ? 'تقارير ذكية'        : 'Smart Reports',      desc: lang === 'ar' ? 'إحصائيات وتحليلات'          : 'Statistics & analytics' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return toast.error(lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter your username')
    if (!password) return toast.error(lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password')
    setLoading(true)
    try {
      await login(username.trim(), password, 'admin')
      navigate('/admin')
      toast.success(lang === 'ar' ? 'مرحباً بك في لوحة التحكم' : 'Welcome to the dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.error || (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-16 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border-4 border-white" />
          <div className="absolute bottom-20 left-20 w-40 h-40 rounded-full border-4 border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white" />
        </div>
        <div className="relative max-w-md text-center">
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <BookOpen size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-3">
            {lang === 'ar' ? 'نظام إدارة المدرسة' : 'School Management System'}
          </h1>
          <p className="text-lg text-white/80 leading-relaxed mb-10">
            {lang === 'ar'
              ? 'منصة احترافية متكاملة لإدارة شؤون المدرسة من طلاب وموظفين وأولياء أمور'
              : 'A complete professional platform to manage students, staff, and parents'}
          </p>
          <div className="grid grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <f.icon size={20} className="text-white" />
                </div>
                <p className="text-sm font-black">{f.label}</p>
                <p className="text-xs text-white/60 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md" style={{ background: 'var(--color-primary)' }}>
                  <Shield size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800">{t('auth.adminTitle')}</h2>
                  <p className="text-sm text-gray-400">{t('auth.adminSub')}</p>
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
              {/* Username */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('auth.username')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input-field pr-10"
                    placeholder={lang === 'ar' ? 'أدخل اسم المستخدم' : 'Enter username'}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t('auth.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input-field pr-10 pl-12"
                    type={showPass ? 'text' : 'password'}
                    placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base justify-center">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {lang === 'ar' ? 'جارٍ التحقق...' : 'Verifying...'}
                  </>
                ) : t('auth.loginBtn')}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-center">
              <Link to="/parent-login" className="text-sm font-bold hover:underline transition-colors" style={{ color: 'var(--color-primary)' }}>
                {t('auth.parentPortal')} ←
              </Link>
            </div>
          </div>

          {/* Back to site */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-white/70 text-sm hover:text-white transition-colors">
              ← {t('auth.backToSite')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
