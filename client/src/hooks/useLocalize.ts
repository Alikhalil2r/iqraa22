import { useCallback, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  pickLocalized, fieldLocalized, localizeNewsItem, localizeFaqItem,
  localizeEventItem, localizeGalleryItem, localizeAchievementItem, type NewsLike,
} from '../i18n/localize'

export function useLocalize() {
  const { lang, isRTL, t } = useLanguage()

  const pick = useCallback(
    (ar?: string | null, en?: string | null, fallback = '') =>
      pickLocalized(lang, ar, en, fallback),
    [lang]
  )

  const field = useCallback(
    (obj: Record<string, unknown> | null | undefined, base: string, fallback = '') =>
      fieldLocalized(lang, obj, base, fallback),
    [lang]
  )

  const category = useCallback(
    (ar?: string | null, en?: string | null) => {
      if (lang === 'en' && en?.trim()) return en.trim()
      if (lang === 'en' && ar) {
        const key = `cat.${ar}`
        const tr = t(key)
        if (tr !== key) return tr
      }
      return ar || en || ''
    },
    [lang, t]
  )

  const localizeNews = useCallback(
    <T extends NewsLike>(item: T): T => localizeNewsItem(lang, item, category),
    [lang, category]
  )

  const dateLocale = lang === 'en' ? 'en-US' : 'ar-OM'

  const dirClass = useMemo(() => (isRTL ? 'rtl-content' : 'ltr-content'), [isRTL])

  const localizeFaq = useCallback(
    <T extends Parameters<typeof localizeFaqItem>[1]>(item: T) => localizeFaqItem(lang, item),
    [lang]
  )
  const localizeEvent = useCallback(
    <T extends Parameters<typeof localizeEventItem>[1]>(item: T) =>
      localizeEventItem(lang, item, category),
    [lang, category]
  )
  const localizeGallery = useCallback(
    <T extends Parameters<typeof localizeGalleryItem>[1]>(item: T) =>
      localizeGalleryItem(lang, item, category),
    [lang, category]
  )
  const localizeAchievement = useCallback(
    <T extends Parameters<typeof localizeAchievementItem>[1]>(item: T) =>
      localizeAchievementItem(lang, item, category),
    [lang, category]
  )

  return {
    lang, isRTL, t, pick, field, category, localizeNews, localizeFaq,
    localizeEvent, localizeGallery, localizeAchievement, dateLocale, dirClass,
  }
}
