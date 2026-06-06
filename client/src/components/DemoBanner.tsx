import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, MapPin, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSchoolDisplay } from '../hooks/useSchoolDisplay'
import { isDemoMode } from '../config/appMode'

export default function DemoBanner() {
  const [hidden, setHidden] = useState(() => sessionStorage.getItem('sales-banner-hidden') === '1')
  const { t, isRTL } = useLanguage()
  const { schoolName } = useSchoolDisplay()
  const Arrow = isRTL ? ArrowLeft : ArrowRight
  const demo = isDemoMode()

  if (hidden) return null

  const dismiss = () => {
    sessionStorage.setItem('sales-banner-hidden', '1')
    setHidden(true)
  }

  const prefix = demo ? 'site.demo' : 'site.sales'

  return (
    <div className={`relative z-[60] overflow-hidden border-b animate-banner-enter ${demo ? 'border-amber-500/20' : 'border-emerald-500/20'}`}>
      <div className={`absolute inset-0 bg-gradient-to-l ${demo ? 'from-[#1c1608] via-[#2a2210] to-[#1c1608]' : 'from-[#041f16] via-[#064e3b] to-[#041f16]'}`} />
      <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,${demo ? 'rgba(251,191,36,0.08)' : 'rgba(16,185,129,0.08)'}_50%,transparent_75%)] animate-shimmer bg-[length:200%_100%]`} />
      <div className={`absolute bottom-0 inset-x-0 h-px bg-gradient-to-l from-transparent ${demo ? 'via-amber-400/60' : 'via-emerald-400/60'} to-transparent`} />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
        <div className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 animate-icon-float border ${demo ? 'bg-amber-500/15 border-amber-400/25' : 'bg-emerald-500/15 border-emerald-400/25'}`}>
          <Sparkles size={15} className={demo ? 'text-amber-400' : 'text-emerald-400'} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap sm:flex-nowrap">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black flex-shrink-0 border ${demo ? 'bg-amber-500/20 border-amber-400/30 text-amber-300' : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${demo ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {t(`${prefix}.banner`)}
            </span>
            <p className={`text-[11px] sm:text-xs font-bold leading-snug text-center sm:text-start ${demo ? 'text-amber-100/90' : 'text-emerald-100/90'}`}>
              <span className="text-white font-black">{schoolName}</span>
              <span className={`mx-1.5 ${demo ? 'text-amber-500/50' : 'text-emerald-500/50'}`}>·</span>
              <span className={`inline-flex items-center gap-0.5 ${demo ? 'text-amber-200/70' : 'text-emerald-200/70'}`}>
                <MapPin size={10} className="inline" /> {t(`${prefix}.location`)}
              </span>
              <span className={`mx-1.5 hidden md:inline ${demo ? 'text-amber-500/40' : 'text-emerald-500/40'}`}>—</span>
              <span className={`hidden md:inline ${demo ? 'text-amber-200/50' : 'text-emerald-200/60'}`}>{t(`${prefix}.note`)}</span>
            </p>
          </div>
        </div>

        <Link
          to="/platform/offer"
          className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black flex-shrink-0 transition-colors ${demo ? 'bg-amber-500 text-amber-950 hover:bg-amber-400' : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'}`}
        >
          {t(`${prefix}.offer`)} <Arrow size={12} />
        </Link>

        <button
          type="button"
          onClick={dismiss}
          className={`flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5 transition-all ${demo ? 'text-amber-200/40 hover:text-amber-100' : 'text-emerald-200/40 hover:text-emerald-100'}`}
          title={t(`${prefix}.dismiss`)}
          aria-label={t(`${prefix}.dismiss`)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
