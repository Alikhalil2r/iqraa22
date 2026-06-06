import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import SkipLink from '../../components/ux/SkipLink'
import PageTransition from '../../components/ux/PageTransition'
import BackToTop from '../../components/ux/BackToTop'
import PublicBreadcrumb, { getBreadcrumbLabel } from '../../components/ux/PublicBreadcrumb'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useLanguage } from '../../context/LanguageContext'
import { usePublicNav, type PublicNavGroup, type PublicNavItem } from '../../i18n/usePublicNav'
import { useSchoolDisplay } from '../../hooks/useSchoolDisplay'
import { useLocalize } from '../../hooks/useLocalize'
import LanguageToggle from '../../components/LanguageToggle'
import {
  Menu, X, Moon, Sun, BookOpen, Home, Award, GraduationCap,
  Phone, MapPin, Clock, Users, Mail, ChevronLeft, ChevronRight, ChevronDown,
  Sparkles, Shield, Megaphone, AlertTriangle, Zap, Bell, Radio, Share2
} from 'lucide-react'
import DevSignature from '../../components/DevSignature'
import DemoBanner from '../../components/DemoBanner'
import { buildSocialLinks } from '../../utils/socialLinks'
import { DEMO_NEWS, withDemoFallback } from '../../data/demoPublicFallback'
import { usePublicSchool } from '../../context/PublicSchoolContext'

const SOCIAL_SVGS: Record<string, React.ReactNode> = {
  facebook: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  twitter: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[17px] h-[17px]"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  instagram: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[17px] h-[17px]"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
}

const SOCIAL_BRAND: Record<string, { color: string; ring: string; hoverBg: string; iconHover: string }> = {
  youtube:   { color: '#FF0000', ring: 'rgba(255,0,0,0.45)',   hoverBg: '#FF0000', iconHover: '#ffffff' },
  facebook:  { color: '#1877F2', ring: 'rgba(24,119,242,0.45)', hoverBg: '#1877F2', iconHover: '#ffffff' },
  twitter:   { color: '#e7e9ea', ring: 'rgba(255,255,255,0.35)', hoverBg: '#ffffff', iconHover: '#0f1419' },
  instagram: { color: '#E1306C', ring: 'rgba(225,48,108,0.45)', hoverBg: 'linear-gradient(135deg,#f58529,#dd2a7b,#8134af)', iconHover: '#ffffff' },
  whatsapp:  { color: '#25D366', ring: 'rgba(37,211,102,0.45)', hoverBg: '#25D366', iconHover: '#ffffff' },
}

function FooterSocialLinks({
  links,
  followLabel,
}: {
  links: { id: string; url: string; label: string }[]
  followLabel: string
}) {
  const active = links.filter(s => s.url && s.url !== '#')
  if (!active.length) return null

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black text-white/50 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center">
          <Share2 size={12} className="text-amber-400/90" />
        </span>
        {followLabel}
      </p>
      <div className="flex items-center gap-2.5 flex-wrap">
        {active.map(s => {
          const brand = SOCIAL_BRAND[s.id]
          const accent = brand?.color ?? '#10b981'
          return (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              className="group relative flex-shrink-0"
              style={{ ['--social-accent' as string]: accent, ['--social-ring' as string]: brand?.ring ?? 'rgba(16,185,129,0.4)', ['--social-icon-hover' as string]: brand?.iconHover ?? '#ffffff', ['--social-hover-bg' as string]: brand?.hoverBg ?? accent }}
            >
              <span
                className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"
                style={{ background: brand?.hoverBg?.includes('gradient') ? '#E1306C' : accent, opacity: 0.55 }}
              />
              <span
                className="footer-social-btn relative flex items-center justify-center w-11 h-11 rounded-2xl border backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#0a1628]"
                style={{
                  borderColor: `${accent}55`,
                  background: `linear-gradient(145deg, ${accent}18 0%, rgba(255,255,255,0.04) 100%)`,
                  color: accent,
                  boxShadow: `0 4px 14px ${accent}22`,
                }}
              >
                <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--social-icon-hover)]">
                  {SOCIAL_SVGS[s.id] || <span className="text-[9px] font-black">{s.label.slice(0, 2)}</span>}
                </span>
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="font-black text-sm text-white mb-5 flex items-center gap-2.5">
      <span className="w-8 h-0.5 rounded-full bg-gradient-to-l from-amber-400 to-amber-600" />
      {children}
    </h4>
  )
}

function navPillClass(active: boolean, dark: boolean, variant: 'default' | 'cta' = 'default') {
  if (variant === 'cta') {
    return active
      ? 'bg-gradient-to-l from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30'
      : dark
        ? 'text-amber-300 hover:bg-amber-500/15 border border-amber-500/20'
        : 'text-amber-700 hover:bg-amber-50 border border-amber-200/80 hover:border-amber-300'
  }
  return active
    ? 'bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/25'
    : dark
      ? 'text-slate-300 hover:bg-slate-700/80 hover:text-emerald-300'
      : 'text-gray-600 hover:bg-white hover:text-emerald-700 hover:shadow-sm'
}

function DesktopNav({
  dark,
  groups,
  standalone,
  isRTL,
}: {
  dark: boolean
  groups: PublicNavGroup[]
  standalone: PublicNavItem[]
  isRTL: boolean
}) {
  const ItemChevron = isRTL ? ChevronRight : ChevronLeft
  const [openId, setOpenId] = useState<string | null>(null)
  const location = useLocation()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenId(id)
  }
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenId(null), 150)
  }

  const isGroupActive = (group: PublicNavGroup) =>
    group.items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))

  const renderLink = (item: PublicNavItem, variant: 'default' | 'cta' = 'default') => (
    <NavLink key={item.to} to={item.to} end={item.end}
      className={({ isActive }) =>
        `group flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${navPillClass(isActive, dark, variant)}`
      }>
      {({ isActive }) => (
        <>
          <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'} ${isActive ? 'text-white/90' : ''}`}>
            {item.icon}
          </span>
          <span className="whitespace-nowrap">{item.label}</span>
        </>
      )}
    </NavLink>
  )

  return (
    <nav className="hidden lg:flex items-center justify-center flex-1 mx-2 min-w-0">
      <div className={`flex items-center gap-0.5 p-1.5 rounded-2xl border backdrop-blur-md max-w-full ${
        dark
          ? 'bg-slate-800/70 border-slate-700/60 shadow-lg shadow-black/20'
          : 'bg-white/70 border-gray-200/70 shadow-lg shadow-emerald-900/5'
      }`}>
        {renderLink(standalone[0])}

        {groups.map(group => {
          const active = isGroupActive(group)
          const isOpen = openId === group.id
          const highlighted = active || isOpen
          return (
            <div
              key={group.id}
              className="relative"
              onMouseEnter={() => open(group.id)}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : group.id)}
                className={`group flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                  highlighted ? navPillClass(true, dark) : navPillClass(false, dark)
                }`}
                aria-expanded={isOpen}
                aria-haspopup="true"
              >
                <span className={`transition-transform ${highlighted ? 'scale-110' : 'group-hover:scale-105'}`}>{group.icon}</span>
                <span className="whitespace-nowrap">{group.label}</span>
                <ChevronDown size={12} className={`opacity-70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div
                  className={`absolute top-[calc(100%+10px)] right-0 w-60 overflow-hidden rounded-2xl border z-50 animate-fadeUp shadow-2xl ${
                    dark ? 'bg-slate-800/95 border-slate-600/80 shadow-black/40' : 'bg-white/95 border-gray-100 shadow-emerald-900/10'
                  } backdrop-blur-xl`}
                  onMouseEnter={() => open(group.id)}
                  onMouseLeave={scheduleClose}
                >
                  <div className={`h-1 bg-gradient-to-l ${group.accent}`} />
                  <div className={`px-4 py-3 border-b ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
                    <p className={`text-xs font-black ${dark ? 'text-white' : 'text-gray-800'}`}>{group.label}</p>
                    <p className={`text-[10px] mt-0.5 ${dark ? 'text-slate-400' : 'text-gray-400'}`}>{group.subtitle}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {group.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setOpenId(null)}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                            isActive
                              ? dark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-gradient-to-l from-emerald-50 to-teal-50 text-emerald-800'
                              : dark ? 'hover:bg-slate-700/80 text-slate-200' : 'hover:bg-gray-50 text-gray-700'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                              isActive
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : dark ? 'bg-slate-700 text-emerald-400' : group.iconBg
                            }`}>
                              {item.icon}
                            </span>
                            <span className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                              <span className="block text-xs font-black leading-tight">{item.label}</span>
                              {item.hint && (
                                <span className={`block text-[10px] font-medium mt-0.5 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                                  {item.hint}
                                </span>
                              )}
                            </span>
                            <ItemChevron size={12} className={`flex-shrink-0 opacity-0 transition-all group-hover:opacity-60 ${isActive ? 'opacity-80 text-emerald-500' : 'text-gray-300'} ${isRTL ? '-translate-x-1 group-hover:translate-x-0' : 'translate-x-1 group-hover:translate-x-0'}`} />
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {standalone.slice(1, 3).map(item => renderLink(item))}
        {renderLink(standalone[3], 'cta')}
      </div>
    </nav>
  )
}

function MobileNav({
  dark,
  onClose,
  groups,
  standalone,
  isRTL,
}: {
  dark: boolean
  onClose: () => void
  groups: PublicNavGroup[]
  standalone: PublicNavItem[]
  isRTL: boolean
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const location = useLocation()
  const toggle = (id: string) => setExpanded(p => (p === id ? null : id))

  const mobileLink = (active: boolean, cta = false) =>
    active
      ? cta
        ? 'bg-gradient-to-l from-amber-500 to-orange-500 text-white shadow-md'
        : 'bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-md'
      : dark
        ? 'text-slate-200 hover:bg-slate-700/80'
        : 'text-gray-700 hover:bg-gray-50'

  return (
    <div className="space-y-1.5 p-1">
      <NavLink to={standalone[0].to} end onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${mobileLink(isActive)}`
        }>
        <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">{standalone[0].icon}</span>
        {standalone[0].label}
      </NavLink>

      {groups.map(group => {
        const isExp = expanded === group.id
        const hasActive = group.items.some(i => location.pathname === i.to)
        return (
          <div key={group.id} className={`rounded-2xl overflow-hidden border ${dark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-100 bg-gray-50/80'}`}>
            <button
              type="button"
              onClick={() => toggle(group.id)}
              className={`flex items-center justify-between w-full px-4 py-3.5 text-sm font-bold transition-all ${
                hasActive
                  ? dark ? 'text-emerald-400' : 'text-emerald-800'
                  : dark ? 'text-slate-200' : 'text-gray-800'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-slate-700 text-emerald-400' : group.iconBg}`}>
                  {group.icon}
                </span>
                <span className={isRTL ? 'text-right' : 'text-left'}>
                  <span className="block">{group.label}</span>
                  <span className={`block text-[10px] font-medium ${dark ? 'text-slate-500' : 'text-gray-400'}`}>{group.subtitle}</span>
                </span>
              </span>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isExp ? 'rotate-180 text-emerald-500' : 'text-gray-400'}`} />
            </button>
            {isExp && (
              <div className={`px-2 pb-2 space-y-1 border-t ${dark ? 'border-slate-700' : 'border-gray-100'}`}>
                <div className={`h-0.5 mx-2 mb-2 rounded-full bg-gradient-to-l ${group.accent}`} />
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to} onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${mobileLink(isActive)}`
                    }>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-slate-700' : 'bg-white shadow-sm'}`}>
                      {item.icon}
                    </span>
                    <span>
                      <span className="block text-xs">{item.label}</span>
                      {item.hint && <span className="block text-[10px] opacity-70 font-medium">{item.hint}</span>}
                    </span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {standalone.slice(1).map((item, i) => (
        <NavLink key={item.to} to={item.to} onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${mobileLink(isActive, i === 2)}`
          }>
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 2 ? 'bg-white/20' : dark ? 'bg-slate-700' : 'bg-emerald-50 text-emerald-600'}`}>
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

type AlertItem = { id: string | number; active: boolean; message: string; type: 'success' | 'warning' | 'danger' | 'info' | 'urgent' }

function alertMeta(t: (k: string) => string): Record<AlertItem['type'], { label: string; icon: React.ReactNode; bar: string; bg: string; border: string }> {
  return {
    success: { label: t('site.alert.announce'), icon: <Bell size={14} />, bar: 'from-emerald-400 to-teal-500', bg: 'from-emerald-950/90 via-emerald-900/80 to-emerald-950/90', border: 'border-emerald-500/25' },
    warning: { label: t('site.alert.warning'), icon: <Zap size={14} />, bar: 'from-amber-400 to-orange-500', bg: 'from-amber-950/90 via-amber-900/70 to-amber-950/90', border: 'border-amber-500/25' },
    danger:  { label: t('site.alert.urgent'), icon: <AlertTriangle size={14} />, bar: 'from-red-500 to-rose-600', bg: 'from-red-950/90 via-red-900/80 to-red-950/90', border: 'border-red-500/30' },
    info:    { label: t('site.alert.info'), icon: <Megaphone size={14} />, bar: 'from-sky-400 to-blue-500', bg: 'from-sky-950/90 via-sky-900/80 to-indigo-950/90', border: 'border-sky-500/25' },
    urgent:  { label: t('site.alert.urgent'), icon: <AlertTriangle size={14} />, bar: 'from-red-500 to-orange-600', bg: 'from-red-950/90 via-red-900/80 to-red-950/90', border: 'border-red-500/30' },
  }
}

function EmergencyAlerts({ alerts, t }: { alerts: AlertItem[]; t: (k: string) => string }) {
  const ALERT_META = alertMeta(t)
  const visible = alerts.filter(a => a.active)
  if (!visible.length) return null

  return (
    <div className="relative z-50 space-y-0">
      {visible.map((alert, idx) => {
        const meta = ALERT_META[alert.type] || ALERT_META.info
        return (
          <div
            key={alert.id}
            className={`relative overflow-hidden border-b backdrop-blur-md bg-gradient-to-l ${meta.bg} ${meta.border} animate-alert-enter`}
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <div className={`absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b ${meta.bar}`} />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)] animate-shimmer bg-[length:200%_100%] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
              <div className={`flex items-center gap-2 flex-shrink-0 px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 ${alert.type === 'urgent' || alert.type === 'danger' ? 'animate-ticker-glow' : ''}`}>
                <span className="text-white/90">{meta.icon}</span>
                <span className="text-[10px] font-black text-white/90">{meta.label}</span>
              </div>

              <p className="flex-1 text-xs sm:text-sm font-bold text-white/90 leading-snug min-w-0">
                {alert.message}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NewsTicker({
  news,
  alertFallback,
  schoolBase,
  t,
  isRTL,
}: {
  news: { title: string }[]
  alertFallback?: string[]
  schoolBase: string
  t: (k: string) => string
  isRTL: boolean
}) {
  const items = news.length
    ? news.map(n => n.title)
    : (alertFallback?.length ? alertFallback : [t('site.ticker.latest')])
  if (!items.length) return null
  const doubled = [...items, ...items]
  const MoreChevron = isRTL ? ChevronLeft : ChevronRight

  return (
    <div className="relative z-40 overflow-hidden border-b border-emerald-700/30">
      <div className="absolute inset-0 bg-gradient-to-l from-[#042f23] via-[#064e3b] to-[#042f23]" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15),transparent_70%)]" />

      <div className="relative flex items-center h-9 sm:h-10">
        <Link
          to={`${schoolBase}/news`}
          className={`relative z-10 flex items-center gap-2 px-3 sm:px-4 h-full bg-emerald-800/80 flex-shrink-0 hover:bg-emerald-700/80 transition-colors group ${isRTL ? 'border-l border-emerald-600/30' : 'border-r border-emerald-600/30'}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 animate-live-pulse" />
          </span>
          <Radio size={13} className="text-emerald-300 group-hover:text-white transition-colors hidden sm:block" />
          <span className="text-[10px] sm:text-xs font-black text-white whitespace-nowrap">{t('site.ticker.urgent')}</span>
        </Link>

        <div className="flex-1 overflow-hidden ticker-fade-edges py-2">
          <div className="ticker-track flex w-max gap-0 whitespace-nowrap">
            {doubled.map((title, i) => (
              <span key={i} className="inline-flex items-center gap-3 px-6 text-xs sm:text-sm font-medium text-emerald-100/85">
                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                {title}
              </span>
            ))}
          </div>
        </div>

        <Link
          to={`${schoolBase}/news`}
          className={`hidden sm:flex items-center gap-1 px-3 h-full text-[10px] font-bold text-emerald-400/80 hover:text-emerald-300 flex-shrink-0 transition-colors ${isRTL ? 'border-r border-emerald-700/30' : 'border-l border-emerald-700/30'}`}
        >
          {t('site.ticker.more')} <MoreChevron size={12} />
        </Link>
      </div>
    </div>
  )
}

export default function PublicLayout() {
  const location = useLocation()
  const [mobileMenu, setMobileMenu] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === '1')
  const [scrolled, setScrolled] = useState(false)
  const { t, isRTL } = useLanguage()
  const { pick, lang } = useLocalize()
  const { groups, standalone, footerSections, schoolBase } = usePublicNav()
  const { schoolName, location: schoolLocation, theme } = useSchoolDisplay()
  const { slug, query: schoolQuery } = usePublicSchool()
  const PortalChevron = isRTL ? ChevronLeft : ChevronRight

  const { data: schoolData } = useQuery({
    queryKey: ['public-school', slug],
    queryFn: () => publicApi.schoolBySlug(slug).then(r => r.data).catch(() => publicApi.school().then(r => r.data)),
  })
  const { data: newsData } = useQuery({ queryKey: ['public-news', slug], queryFn: () => publicApi.news(schoolQuery).then(r => r.data) })
  const { data: alertsData } = useQuery({ queryKey: ['public-alerts', slug], queryFn: () => publicApi.alerts(schoolQuery).then(r => r.data) })

  const school = schoolData?.school
  const news = withDemoFallback(newsData?.news, DEMO_NEWS).map((n: { title: string; title_en?: string }) => ({
    title: pick(n.title, n.title_en),
  }))
  const socialLinks = buildSocialLinks(school?.social)
  const emergencyAlerts: AlertItem[] = React.useMemo(
    () => (alertsData?.alerts || []).map((a: { id: string; message: string; message_en?: string; alert_type: string }) => ({
      id: a.id,
      active: true,
      message: pick(a.message, a.message_en),
      type: (['success', 'warning', 'danger', 'info', 'urgent'].includes(a.alert_type) ? a.alert_type : 'info') as AlertItem['type'],
    })),
    [alertsData, pick, lang]
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark', dark ? '1' : '0')
  }, [dark])

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    setMobileMenu(false)
  }, [location.pathname])

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased ${dark ? 'dark bg-slate-900 text-slate-100' : 'bg-white text-gray-900'}`}>
      <SkipLink />
      <DemoBanner />
      <EmergencyAlerts alerts={emergencyAlerts} t={t} />
      <NewsTicker
        news={news}
        alertFallback={emergencyAlerts.map(a => a.message)}
        schoolBase={schoolBase}
        t={t}
        isRTL={isRTL}
      />

      <header className={`sticky top-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'shadow-xl shadow-emerald-900/5 backdrop-blur-xl ' + (dark ? 'bg-slate-900/90' : 'bg-white/90')
          : dark ? 'bg-slate-900' : 'bg-gradient-to-b from-white to-emerald-50/30'
      }`}>
        <div className={`h-0.5 transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-60'} bg-gradient-to-l from-emerald-600 via-amber-500 to-emerald-600`} />
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          <Link to={schoolBase} className="flex items-center gap-3 flex-shrink-0 group">
            <div className="relative">
              {theme.logoUrl
                ? <img src={theme.logoUrl} className="h-12 w-auto rounded-2xl shadow-lg group-hover:scale-105 transition-all" alt={schoolName} />
                : <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-all">
                    <BookOpen size={24} strokeWidth={2.5} />
                  </div>
              }
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-black">★</span>
              </div>
            </div>
            <div>
              <h1 className={`text-base font-black leading-tight ${dark ? 'text-emerald-400' : 'text-emerald-900'}`}>{schoolName}</h1>
              <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-amber-600">{schoolLocation}</p>
            </div>
          </Link>

          <DesktopNav dark={dark} groups={groups} standalone={standalone} isRTL={isRTL} />

          <div className="flex items-center gap-1 flex-shrink-0">
            <LanguageToggle variant={dark ? 'dark' : 'compact'} className="hidden sm:inline-flex" />
            <button onClick={() => setDark(!dark)}
              className={`p-2.5 rounded-xl transition-all ${dark ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              aria-label={dark ? t('common.lightMode') : t('common.darkMode')}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/parent/login"
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-bold bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:-translate-y-0.5 transition-all flex-shrink-0">
              <Users size={14} />{t('site.parentLogin')}
            </Link>
            <button className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              onClick={() => setMobileMenu(!mobileMenu)}>
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className={`lg:hidden border-t p-3 max-h-[75vh] overflow-y-auto animate-fadeUp ${dark ? 'bg-slate-900/95 border-slate-700 backdrop-blur-xl' : 'bg-white/95 border-gray-100 backdrop-blur-xl'}`}>
            <MobileNav dark={dark} onClose={() => setMobileMenu(false)} groups={groups} standalone={standalone} isRTL={isRTL} />
            <div className="flex items-center gap-2 mt-2">
              <LanguageToggle variant={dark ? 'dark' : 'compact'} className="flex-1 justify-center" />
            </div>
            <Link to="/parent/login" onClick={() => setMobileMenu(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm bg-emerald-600 mt-2">
              <Users size={16} />{t('auth.parentPortal')}
            </Link>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {getBreadcrumbLabel(location.pathname, t) && (
          <div className="max-w-7xl mx-auto px-4 pt-3">
            <PublicBreadcrumb />
          </div>
        )}
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <BackToTop />

      <footer className="relative mt-8 overflow-hidden bg-[#0a0f1a] text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-emerald-600/8 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-amber-500/6 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.06)_0%,_transparent_55%)]" />
        </div>

        <div className="relative h-1.5 bg-gradient-to-l from-emerald-600 via-amber-500 to-emerald-500" />

        {/* شريط دعوة للعمل */}
        <div className="relative border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
              <p className="text-lg font-black text-white">{t('site.footer.ctaTitle')}</p>
              <p className="text-sm text-white/45 mt-1">{t('site.footer.ctaSub')}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to={`${schoolBase}/admission`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 hover:-translate-y-0.5 transition-all">
                {t('site.nav.admission')}
              </Link>
              <Link to={`${schoolBase}/contact`}
                className="px-5 py-2.5 rounded-xl border border-white/15 text-white/80 text-sm font-bold hover:bg-white/5 transition-all">
                {t('site.nav.contact')}
              </Link>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-14 lg:py-16">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-8">
            {/* العلامة التجارية */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-500/40 to-amber-500/30 blur-sm" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-xl">
                    <BookOpen size={26} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <p className="font-black text-xl leading-tight">{schoolName}</p>
                  {theme.tagline && <p className="text-xs text-amber-400/90 font-bold mt-1">{theme.tagline}</p>}
                  <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-[10px] font-black text-amber-300">
                    <Sparkles size={10} /> {t('site.footer.demoBadge')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-white/45 leading-relaxed">
                {(pick(school?.aboutText, school?.aboutTextEn) || t('site.footer.aboutFallback')).slice(0, 200)}
              </p>

              {school?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                {([
                  school.stats.students ? { v: school.stats.students, l: t('site.stats.students'), icon: <Users size={14} /> } : null,
                  school.stats.teachers ? { v: school.stats.teachers, l: t('site.stats.teachers'), icon: <GraduationCap size={14} /> } : null,
                  school.stats.classrooms ? { v: school.stats.classrooms, l: t('site.stats.classrooms'), icon: <BookOpen size={14} /> } : null,
                  school.stats.years ? { v: school.stats.years, l: t('site.stats.years'), icon: <Award size={14} /> } : null,
                ].filter((x) => x !== null) as { v: string; l: string; icon: React.ReactNode }[]).map(s => (
                  <div key={s.l} className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 hover:border-emerald-500/20 transition-colors">
                    <div className="flex items-center gap-1.5 text-emerald-400/80 mb-0.5">{s.icon}<span className="text-[10px] text-white/35">{s.l}</span></div>
                    <p className="text-sm font-black text-white">{s.v}</p>
                  </div>
                ))}
              </div>
              )}

              <FooterSocialLinks links={socialLinks} followLabel={t('site.contact.socialTitle')} />
            </div>

            {/* روابط منظمة */}
            <div className="lg:col-span-4">
              <FooterHeading>{t('site.footer.explore')}</FooterHeading>
              <div className="space-y-5">
                {footerSections.map(sec => (
                  <div key={sec.title}>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                      <span className={`w-4 h-0.5 rounded-full bg-gradient-to-l ${sec.accent}`} />
                      {sec.title}
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {sec.links.map(l => (
                        <Link key={l.to} to={l.to}
                          className="group flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-white/45 hover:text-emerald-300 hover:bg-white/[0.04] transition-all">
                          <span className="text-emerald-600/50 group-hover:text-amber-400 transition-colors">{l.icon}</span>
                          <span className="truncate">{l.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <Link to={schoolBase}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400/80 hover:text-emerald-300 transition-colors">
                  <Home size={13} /> {t('site.footer.backHome')}
                </Link>
              </div>
            </div>

            {/* تواصل + بوابات */}
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 backdrop-blur-sm">
                <FooterHeading>{t('site.footer.contact')}</FooterHeading>
                <div className="space-y-3">
                  {[
                    school?.address && { icon: <MapPin size={15} />, content: school.address, href: undefined },
                    school?.phone && { icon: <Phone size={15} />, content: school.phone, href: `tel:${school.phone}` },
                    school?.email && { icon: <Mail size={15} />, content: school.email, href: `mailto:${school.email}` },
                    { icon: <Clock size={15} />, content: school?.officeHours || t('site.footer.hoursDefault'), href: undefined },
                  ].filter(Boolean).map((item, i) => {
                    const row = item as { icon: React.ReactNode; content: string; href?: string }
                    const inner = (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0 text-amber-400 group-hover:scale-105 transition-transform">
                          {row.icon}
                        </div>
                        <span className="text-xs text-white/55 group-hover:text-white/80 transition-colors leading-relaxed">{row.content}</span>
                      </>
                    )
                    return row.href ? (
                      <a key={i} href={row.href} className="group flex items-center gap-3">{inner}</a>
                    ) : (
                      <div key={i} className="group flex items-center gap-3">{inner}</div>
                    )
                  })}
                </div>
              </div>

              <div>
                <FooterHeading>{t('site.footer.portals')}</FooterHeading>
                <div className="space-y-3">
                  <Link to="/parent/login"
                    className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-l from-emerald-600/25 to-emerald-700/15 border border-emerald-500/25 hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-900/20 transition-all">
                    <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Users size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-emerald-300">{t('site.footer.parentPortal')}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">{t('site.footer.parentHint')}</p>
                    </div>
                    <PortalChevron size={16} className={`text-emerald-500/50 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </Link>
                  <Link to="/login"
                    className="group flex items-center gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all">
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Shield size={20} className="text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white/80">{t('site.footer.adminPanel')}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">{t('site.footer.adminHint')}</p>
                    </div>
                    <PortalChevron size={16} className={`text-white/25 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/[0.06] bg-black/20">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-white/35">
              <span>© {new Date().getFullYear()} {schoolName}</span>
              <span className="text-white/15 hidden sm:inline">·</span>
              <Link to={`${schoolBase}/privacy`} className="hover:text-white/60 transition-colors">{t('site.footer.privacy')}</Link>
              <span className="text-white/15">·</span>
              <span className="text-white/25">{t('site.footer.demoData')}</span>
            </div>
            <DevSignature variant="dark" scope="school" />
          </div>
        </div>
      </footer>
    </div>
  )
}
