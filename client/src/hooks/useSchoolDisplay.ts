import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

/** اسم المدرسة والشعار حسب اللغة النشطة */
export function useSchoolDisplay() {
  const { lang, t } = useLanguage()
  const { theme } = useTheme()

  const schoolName =
    lang === 'en' && theme.schoolNameEn
      ? theme.schoolNameEn
      : theme.schoolName

  const tagline =
    lang === 'en' && theme.taglineEn
      ? theme.taglineEn
      : theme.tagline

  const location = t('site.location')

  return { schoolName, tagline, location, lang, theme }
}
