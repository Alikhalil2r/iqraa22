import React from 'react'

interface DevSignatureProps {
  variant?: 'dark' | 'light' | 'sidebar'
  className?: string
}

export default function DevSignature({ variant = 'dark', className = '' }: DevSignatureProps) {
  if (variant === 'sidebar') {
    return (
      <div className={`px-3 pt-2 pb-3 ${className}`}>
        <div className="group flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl cursor-default
          transition-all duration-500 hover:bg-gradient-to-br hover:from-violet-50 hover:to-indigo-50
          border border-transparent hover:border-indigo-100">
          <div className="flex items-center gap-1.5">
            <svg width="10" height="11" viewBox="0 0 10 11" className="text-indigo-400 group-hover:text-indigo-500 transition-colors flex-shrink-0">
              <polygon points="5,0.5 9.5,3 9.5,8 5,10.5 0.5,8 0.5,3"
                fill="none" stroke="currentColor" strokeWidth="1"/>
            </svg>
            <span className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-300 group-hover:text-indigo-400 transition-colors">
              Crafted by
            </span>
          </div>
          <p className="text-[10px] font-black tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent leading-none">
            NexGen Solutions
          </p>
          <p className="text-[9px] font-bold text-gray-300 group-hover:text-indigo-400 transition-colors tracking-wider">
            ALI Khalil
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'light') {
    return (
      <div className={`flex justify-center ${className}`}>
        <div className="group inline-flex flex-col items-center gap-1 cursor-default select-none">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-gray-200 group-hover:to-indigo-200 transition-colors" />
            <svg width="8" height="9" viewBox="0 0 10 11" className="text-gray-300 group-hover:text-indigo-400 transition-all duration-300">
              <polygon points="5,0.5 9.5,3 9.5,8 5,10.5 0.5,8 0.5,3"
                fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1"/>
            </svg>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-gray-200 group-hover:to-indigo-200 transition-colors" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-300">Built by</span>
            <span className="text-[10px] font-black tracking-tight bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent
              group-hover:from-violet-600 group-hover:to-indigo-700 transition-all duration-300">
              NexGen Solutions
            </span>
            <span className="text-[9px] font-bold text-gray-300">·</span>
            <span className="text-[9px] font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">ALI Khalil</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="group relative inline-flex flex-col items-center gap-1.5 cursor-default select-none
          transition-all duration-500"
      >
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 w-12 bg-gradient-to-r from-transparent via-white/10 to-white/20
            group-hover:via-violet-500/30 group-hover:to-indigo-400/40 transition-all duration-500" />

          <div className="relative flex items-center justify-center w-6 h-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/0 to-indigo-500/0
              group-hover:from-violet-500/20 group-hover:to-indigo-500/20 transition-all duration-500 blur-sm" />
            <svg width="14" height="16" viewBox="0 0 10 11"
              className="text-white/20 group-hover:text-violet-400 transition-all duration-500 relative z-10">
              <polygon points="5,0.5 9.5,3 9.5,8 5,10.5 0.5,8 0.5,3"
                fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.8"/>
            </svg>
          </div>

          <div className="h-px flex-1 w-12 bg-gradient-to-l from-transparent via-white/10 to-white/20
            group-hover:via-violet-500/30 group-hover:to-indigo-400/40 transition-all duration-500" />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20
            group-hover:text-white/40 transition-colors duration-300">
            Crafted with Excellence by
          </span>

          <div className="flex items-baseline gap-1.5 flex-wrap justify-center">
            <span className="text-[11px] font-black tracking-tight
              bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent
              group-hover:from-violet-300 group-hover:via-indigo-300 group-hover:to-violet-300
              transition-all duration-500">
              NexGen Solutions
            </span>
            <span className="text-white/15 text-[9px]">—</span>
            <span className="text-[10px] font-bold text-white/30
              group-hover:text-white/60 transition-colors duration-300 tracking-wide">
              ALI Khalil
            </span>
          </div>
        </div>

        <div className="absolute -inset-3 rounded-2xl opacity-0 group-hover:opacity-100
          bg-gradient-to-br from-violet-500/5 to-indigo-500/5 transition-opacity duration-500 -z-10 blur-md" />
      </div>
    </div>
  )
}
