import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import translations, { Lang } from '../i18n/translations'

interface LanguageContextType {
  lang:       Lang
  isRTL:      boolean
  toggleLang: () => void
  setLang:    (l: Lang) => void
  t:          (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType>(null!)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    return saved === 'en' ? 'en' : 'ar'
  })

  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    localStorage.setItem('lang', lang)
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])

  const toggleLang = useCallback(() =>
    setLangState(prev => prev === 'ar' ? 'en' : 'ar'), [])

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    let str = translations[lang][key] ?? translations['ar'][key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, isRTL: lang === 'ar', toggleLang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
