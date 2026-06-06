import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, ArrowRight, Search, GraduationCap } from 'lucide-react'

export default function NotFoundPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const ADMIN_ROLES = ['super_admin','admin','teacher','accountant','librarian','hr_manager','guard']
  const homeLink = user?.role && ADMIN_ROLES.includes(user.role)
    ? '/admin'
    : user?.role === 'parent'
    ? '/parent'
    : '/school'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="text-center max-w-lg page-enter">
        <div className="relative mb-8">
          <div className="text-[10rem] font-black text-indigo-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center">
              <GraduationCap size={44} style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-3">
          الصفحة غير موجودة
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تمت إزالتها أو نُقلت إلى مكان آخر.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-white hover:shadow-md transition-all"
          >
            <ArrowRight size={18} /> العودة للخلف
          </button>
          <Link
            to={homeLink}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold hover:opacity-90 transition-all shadow-lg"
            style={{ background: 'var(--color-primary)' }}
          >
            <Home size={18} /> الصفحة الرئيسية
          </Link>
        </div>

        <div className="mt-12 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-3 font-bold">هل تبحث عن؟</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: 'لوحة التحكم', href: '/admin' },
              { label: 'الطلاب', href: '/admin/students' },
              { label: 'التقارير', href: '/admin/reports' },
              { label: 'بوابة الأولياء', href: '/parent/login' },
              { label: 'موقع المدرسة', href: '/school' },
            ].map(link => (
              <Link key={link.href} to={link.href}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
