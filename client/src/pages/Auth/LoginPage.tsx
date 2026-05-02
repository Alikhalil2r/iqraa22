import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Eye, EyeOff, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return toast.error('أدخل اسم المستخدم وكلمة المرور')
    setLoading(true)
    try {
      await login(username, password, 'admin')
      navigate('/admin')
      toast.success('مرحباً بك في لوحة التحكم')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'بيانات الدخول غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{background:'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'}}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-16 text-white">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-8">
            <GraduationCap size={48} className="text-white"/>
          </div>
          <h1 className="text-4xl font-black mb-4">نظام إدارة المدرسة</h1>
          <p className="text-xl text-white/80 leading-relaxed">منصة احترافية متكاملة لإدارة شؤون المدرسة من طلاب وموظفين وأولياء أمور</p>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[['👨‍🎓','إدارة الطلاب'],['👩‍💼','الموارد البشرية'],['📊','التقارير']].map(([icon,label])=>(
              <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-sm font-bold text-white/90">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-10 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--color-primary)'}}>
                <Shield size={22} className="text-white"/>
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800">لوحة التحكم</h2>
                <p className="text-sm text-gray-400">دخول المشرفين والمعلمين</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
                <input className="input-field" placeholder="أدخل اسم المستخدم" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input className="input-field pl-12" type={showPass?'text':'password'} placeholder="أدخل كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : null}
                {loading ? 'جارٍ الدخول...' : 'دخول'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <Link to="/parent-login" className="text-sm font-bold hover:underline" style={{color:'var(--color-primary)'}}>
                بوابة أولياء الأمور ←
              </Link>
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <p className="text-xs text-amber-700 font-bold text-center">بيانات تجريبية: admin / admin2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
