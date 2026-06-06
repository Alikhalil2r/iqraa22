import React from 'react'

type Props = {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  gradient?: string
}

export default function PublicPageBanner({
  title,
  subtitle,
  icon,
  gradient = 'from-emerald-800 to-emerald-900',
}: Props) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-20 text-center relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 end-20 w-64 h-64 rounded-full border-2 border-white" />
        <div className="absolute bottom-10 start-20 w-96 h-96 rounded-full border border-white" />
      </div>
      {icon && <div className="mb-4 flex justify-center text-amber-400/80 relative z-10">{icon}</div>}
      <h1 className="text-3xl md:text-5xl font-black relative z-10">{title}</h1>
      {subtitle && <p className="text-white/60 mt-3 text-sm relative z-10 max-w-2xl mx-auto px-4">{subtitle}</p>}
    </div>
  )
}
