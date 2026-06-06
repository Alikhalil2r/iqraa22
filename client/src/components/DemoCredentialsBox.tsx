import React from 'react'
import { DEMO_CREDENTIALS, DEMO_SCHOOL_NAME, DEMO_SCHOOL_NAME_EN } from '../constants/demoSchool'

interface Props {
  lang?: 'ar' | 'en'
  className?: string
  /** staff = إدارة ومعلم ومحاسب (صفحة /login) | parent = ولي أمر فقط */
  variant?: 'staff' | 'parent'
}

export default function DemoCredentialsBox({ lang = 'ar', className = '', variant = 'staff' }: Props) {
  const credentials = DEMO_CREDENTIALS.filter(c =>
    variant === 'parent' ? c.user === 'parent1' : c.user !== 'parent1'
  )

  if (credentials.length === 0) return null

  const schoolName = lang === 'ar' ? DEMO_SCHOOL_NAME : DEMO_SCHOOL_NAME_EN

  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <p className="text-xs font-black text-amber-800 mb-2 text-center">
        {lang === 'ar' ? `🔑 حسابات تجريبية — ${schoolName}` : `Demo accounts — ${schoolName}`}
      </p>
      <div className="space-y-1.5">
        {credentials.map(c => (
          <div key={c.user} className="flex items-center justify-between gap-2 text-[11px] font-bold text-amber-900/80 bg-white/70 rounded-lg px-3 py-1.5">
            <span>{lang === 'ar' ? c.role : c.roleEn}</span>
            <code className="font-mono text-amber-700" dir="ltr">{c.user} / {c.pass}</code>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-amber-600/80 text-center mt-2">
        {lang === 'ar' ? 'للتجربة والعرض — كلمة المرور موحّدة لجميع الحسابات' : 'For demo only — same password for all accounts'}
      </p>
    </div>
  )
}
