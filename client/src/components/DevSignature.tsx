import React from 'react'
import { Link } from 'react-router-dom'
import { Code2 } from 'lucide-react'

type Variant = 'dark' | 'light' | 'sidebar'
type Scope = 'school' | 'platform'

interface DevSignatureProps {
  variant?: Variant
  scope?: Scope
  className?: string
}

const variantStyles: Record<Variant, { wrap: string; text: string; link: string; icon: string }> = {
  dark: {
    wrap: 'justify-center',
    text: 'text-white/25',
    link: 'text-white/35 hover:text-white/55',
    icon: 'from-emerald-600/80 to-emerald-800/80',
  },
  light: {
    wrap: 'justify-center',
    text: 'text-gray-400',
    link: 'text-gray-500 hover:text-emerald-700',
    icon: 'from-emerald-500 to-emerald-700',
  },
  sidebar: {
    wrap: 'justify-start px-3',
    text: 'text-gray-400',
    link: 'text-gray-500 hover:text-emerald-700',
    icon: 'from-emerald-500 to-emerald-700',
  },
}

const platformVariantStyles: Record<Variant, { text: string; link: string; icon: string }> = {
  dark: {
    text: 'text-white/30',
    link: 'text-white/45 hover:text-white/75',
    icon: 'from-violet-500 to-blue-500',
  },
  light: {
    text: 'text-gray-400',
    link: 'text-gray-500 hover:text-violet-600',
    icon: 'from-violet-500 to-blue-500',
  },
  sidebar: {
    text: 'text-gray-400',
    link: 'text-gray-500 hover:text-violet-600',
    icon: 'from-violet-500 to-blue-500',
  },
}

export default function DevSignature({ variant = 'light', scope = 'platform', className = '' }: DevSignatureProps) {
  const base = variantStyles[variant]
  const platform = platformVariantStyles[variant]
  const styles = scope === 'school' ? base : { ...base, ...platform }

  const label = scope === 'school' ? 'تنفيذ تقني بواسطة' : 'تصميم وتطوير'

  const linkContent = (
    <>
      <span
        className={`w-4 h-4 rounded-md flex items-center justify-center bg-gradient-to-br ${styles.icon}`}
      >
        <Code2 size={9} className="text-white" />
      </span>
      <span>اكسبو التقنية</span>
    </>
  )

  return (
    <div className={`flex items-center gap-2 text-[10px] font-bold ${base.wrap} ${className}`}>
      <span className={styles.text}>{label}</span>
      {scope === 'school' ? (
        <a
          href="/platform"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 transition-colors ${styles.link}`}
          title="اكسبو التقنية — الشركة المنفّذة (يفتح في نافذة جديدة)"
        >
          {linkContent}
        </a>
      ) : (
        <Link
          to="/platform"
          className={`inline-flex items-center gap-1.5 transition-colors ${styles.link}`}
          title="اكسبو التقنية"
        >
          {linkContent}
        </Link>
      )}
    </div>
  )
}
