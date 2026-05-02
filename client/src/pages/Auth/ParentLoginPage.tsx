import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Users, Eye, EyeOff, MessageSquare, BookOpen, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ParentLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password, 'parent')
      navigate('/parent')
      toast.success('مرحباً بك في بوابة الأولياء')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'بيانات الدخول غير صحيحة')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'}}>
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Info */}
        <div className="text-white order-2 lg:order-1">
          <h1 className="text-3xl font-black mb-4" style={{color:'var(--color-accent)'}}>بوابة أولياء الأمور</h1>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">متابعة أبنائك بكل سهولة - نتائج، حضور، رسائل وأكثر</p>
          <div className="space-y-4">
            {[
              [BookOpen, 'النتائج الدراسية', 'تتبع درجات ابنك في كل المواد بشكل لحظي'],
              [BarChart3, 'سجل الحضور', 'معرفة أيام الحضور والغياب والتأخر'],
              [MessageSquare, 'التواصل مع الإدارة', 'إرسال واستقبال الرسائل مباشرة'],
            ].map(([Icon, title, desc]) => (
              <div key={String(title)} className="flex items-start gap-4 bg-white/5 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--color-accent)'}}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">{String(title)}</p>
                  <p className="text-sm text-gray-400">{String(desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Form */}
        <div className="order-1 lg:order-2">
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--color-accent)'}}>
                <Users size={22} className="text-white"/>
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-800">دخول ولي الأمر</h2>
                <p className="text-sm text-gray-400">تابع ابنك من أي مكان</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
                <input className="input-field" placeholder="أدخل اسم المستخدم" value={username} onChange={e=>setUsername(e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input className="input-field pl-12" type={showPass?'text':'password'} placeholder="أدخل كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)}/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 text-base font-bold text-white rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2" style={{background:'var(--color-accent)'}}>
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                {loading ? 'جارٍ الدخول...' : 'دخول بوابة الأولياء'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600">← دخول الإدارة والمعلمين</Link>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-bold text-center">بيانات تجريبية: parent1 / parent123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
