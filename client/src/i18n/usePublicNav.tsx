import React, { useMemo } from 'react'
import {
  Home, Info, Award, GraduationCap, Newspaper, Trophy, PenTool, Calendar,
  Image, Video, Heart, Briefcase, Mail,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

const SCHOOL_BASE = '/school'

export type PublicNavItem = {
  to: string
  label: string
  end?: boolean
  hint?: string
  icon?: React.ReactNode
}

export type PublicNavGroup = {
  id: string
  label: string
  subtitle: string
  accent: string
  iconBg: string
  icon?: React.ReactNode
  items: PublicNavItem[]
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  about: <Info size={15} />,
  life: <Newspaper size={15} />,
  media: <Image size={15} />,
}

const ITEM_ICONS: Record<string, React.ReactNode> = {
  '/school': <Home size={15} />,
  '/school/about': <Info size={15} />,
  '/school/hall-of-fame': <Award size={15} />,
  '/school/alumni': <GraduationCap size={15} />,
  '/school/news': <Newspaper size={15} />,
  '/school/achievements': <Trophy size={15} />,
  '/school/articles': <PenTool size={15} />,
  '/school/calendar': <Calendar size={15} />,
  '/school/gallery': <Image size={15} />,
  '/school/videos': <Video size={15} />,
  '/school/learning-support': <Heart size={15} />,
  '/school/jobs': <Briefcase size={15} />,
  '/school/contact': <Mail size={15} />,
}

export type PublicFooterSection = {
  title: string
  accent: string
  links: PublicNavItem[]
}

export function usePublicNav() {
  const { t } = useLanguage()

  return useMemo(() => {
    const groups: PublicNavGroup[] = [
      {
        id: 'about',
        label: t('site.nav.group.about'),
        subtitle: t('site.nav.group.aboutSub'),
        accent: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
        items: [
          { to: `${SCHOOL_BASE}/about`, label: t('site.nav.about'), hint: t('site.nav.hint.about') },
          { to: `${SCHOOL_BASE}/hall-of-fame`, label: t('site.nav.hallOfFame'), hint: t('site.nav.hint.hallOfFame') },
          { to: `${SCHOOL_BASE}/alumni`, label: t('site.nav.alumni'), hint: t('site.nav.hint.alumni') },
        ],
      },
      {
        id: 'life',
        label: t('site.nav.group.life'),
        subtitle: t('site.nav.group.lifeSub'),
        accent: 'from-amber-500 via-orange-400 to-amber-500',
        iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
        items: [
          { to: `${SCHOOL_BASE}/news`, label: t('site.nav.news'), hint: t('site.nav.hint.news') },
          { to: `${SCHOOL_BASE}/achievements`, label: t('site.nav.achievements'), hint: t('site.nav.hint.achievements') },
          { to: `${SCHOOL_BASE}/articles`, label: t('site.nav.articles'), hint: t('site.nav.hint.articles') },
          { to: `${SCHOOL_BASE}/calendar`, label: t('site.nav.calendar'), hint: t('site.nav.hint.calendar') },
        ],
      },
      {
        id: 'media',
        label: t('site.nav.group.media'),
        subtitle: t('site.nav.group.mediaSub'),
        accent: 'from-sky-500 via-blue-500 to-indigo-500',
        iconBg: 'bg-sky-50 text-sky-600 group-hover:bg-sky-100',
        items: [
          { to: `${SCHOOL_BASE}/gallery`, label: t('site.nav.gallery'), hint: t('site.nav.hint.gallery') },
          { to: `${SCHOOL_BASE}/videos`, label: t('site.nav.videos'), hint: t('site.nav.hint.videos') },
        ],
      },
    ]

    const standalone: PublicNavItem[] = [
      { to: SCHOOL_BASE, label: t('site.nav.home'), end: true },
      { to: `${SCHOOL_BASE}/learning-support`, label: t('site.nav.learningSupport') },
      { to: `${SCHOOL_BASE}/jobs`, label: t('site.nav.jobs') },
      { to: `${SCHOOL_BASE}/contact`, label: t('site.nav.contact') },
    ]

    const footerSections: PublicFooterSection[] = [
      { title: t('site.footer.sectionAbout'), accent: 'from-emerald-500 to-teal-500', links: groups[0].items },
      { title: t('site.footer.sectionLife'), accent: 'from-amber-500 to-orange-500', links: groups[1].items },
      {
        title: t('site.footer.sectionMedia'),
        accent: 'from-sky-500 to-blue-500',
        links: [...groups[2].items, ...standalone.slice(1)],
      },
    ]

    const withIcons = (item: PublicNavItem) => ({ ...item, icon: ITEM_ICONS[item.to] })
    const groupsWithIcons = groups.map(g => ({
      ...g,
      icon: GROUP_ICONS[g.id],
      items: g.items.map(withIcons),
    }))
    const standaloneWithIcons = standalone.map(withIcons)

    return {
      groups: groupsWithIcons,
      standalone: standaloneWithIcons,
      footerSections,
      schoolBase: SCHOOL_BASE,
    }
  }, [t])
}

/** مسار الصفحة → مفتاح الترجمة */
export const PUBLIC_BREADCRUMB_KEYS: Record<string, string> = {
  '/school/about': 'site.nav.about',
  '/school/news': 'site.nav.news',
  '/school/contact': 'site.nav.contact',
  '/school/hall-of-fame': 'site.nav.hallOfFame',
  '/school/alumni': 'site.nav.alumni',
  '/school/achievements': 'site.nav.achievements',
  '/school/gallery': 'site.nav.gallery',
  '/school/articles': 'site.nav.articles',
  '/school/learning-support': 'site.nav.learningSupport',
  '/school/calendar': 'site.nav.calendar',
  '/school/videos': 'site.nav.videos',
  '/school/jobs': 'site.nav.jobs',
  '/school/admission': 'site.nav.admission',
  '/school/privacy': 'site.nav.privacy',
}

export function getPublicBreadcrumbKey(pathname: string): string | null {
  if (pathname === '/school' || pathname === '/school/') return null
  if (PUBLIC_BREADCRUMB_KEYS[pathname]) return PUBLIC_BREADCRUMB_KEYS[pathname]
  if (pathname.startsWith('/school/news/')) return 'site.breadcrumb.newsDetail'
  return null
}
