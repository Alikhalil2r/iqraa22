import React from 'react'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  badge?: string
  actions?: React.ReactNode
  variant?: 'default' | 'banner'
}

export default function PageHeader({ title, subtitle, icon: Icon, badge, actions, variant = 'default' }: PageHeaderProps) {
  if (variant === 'banner') {
    return (
      <div className="dash-welcome-banner">
        <div className="dash-welcome-pattern" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            {badge && (
              <span className="dash-welcome-badge">{badge}</span>
            )}
            <h1 className="dash-welcome-title flex items-center gap-2.5">
              {Icon && <Icon size={26} className="opacity-90 flex-shrink-0" />}
              {title}
            </h1>
            {subtitle && <p className="dash-welcome-sub">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="dash-page-header">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {Icon && (
            <div className="dash-page-icon">
              <Icon size={18} strokeWidth={2.2} />
            </div>
          )}
          <h1 className="dash-page-title">{title}</h1>
          {badge && <span className="dash-page-badge">{badge}</span>}
        </div>
        {subtitle && <p className="dash-page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
