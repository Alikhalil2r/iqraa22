import { useLanguage } from '../context/LanguageContext'

type Variant = 'light' | 'dark' | 'compact'

export default function LanguageToggle({ variant = 'light', className = '' }: { variant?: Variant; className?: string }) {
  const { lang, toggleLang, t } = useLanguage()

  const base =
    variant === 'dark'
      ? 'border-white/20 hover:bg-white/10 text-white'
      : variant === 'compact'
        ? 'border-gray-200 hover:bg-gray-50 text-gray-700'
        : 'border-gray-200 hover:bg-gray-50 text-gray-700 bg-white/80'

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-black transition-all ${base} ${className}`}
      title={t('common.langSwitch')}
      aria-label={t('common.langSwitch')}
    >
      <span className={lang === 'ar' ? 'text-emerald-600' : 'text-gray-400'}>ع</span>
      <span className="text-gray-300 mx-0.5">|</span>
      <span className={lang === 'en' ? 'text-emerald-600' : 'text-gray-400'}>EN</span>
    </button>
  )
}
