import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Home } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getPublicBreadcrumbKey } from '../../i18n/usePublicNav'

export function getBreadcrumbLabel(pathname: string, t: (k: string) => string): string | null {
  const key = getPublicBreadcrumbKey(pathname)
  return key ? t(key) : null
}

export default function PublicBreadcrumb() {
  const { pathname } = useLocation()
  const { t, isRTL } = useLanguage()
  const label = getBreadcrumbLabel(pathname, t)
  if (!label) return null

  const Chevron = isRTL ? ChevronRight : ChevronLeft

  return (
    <nav aria-label={t('site.breadcrumb.aria')} className="public-breadcrumb">
      <Link to="/school" className="public-breadcrumb-link">
        <Home size={13} />
        <span>{t('site.breadcrumb.home')}</span>
      </Link>
      <Chevron size={12} className={`text-gray-300 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
      <span className="public-breadcrumb-current">{label}</span>
    </nav>
  )
}
