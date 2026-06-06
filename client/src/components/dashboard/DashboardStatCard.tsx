import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, LucideIcon } from 'lucide-react'

interface DashboardStatCardProps {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  sub?: string
  color?: string
  href?: string
  badge?: string
  delay?: number
}

export default function DashboardStatCard({
  icon: Icon, label, value, sub, color = 'var(--color-primary)', href, badge, delay = 0,
}: DashboardStatCardProps) {
  const content = (
    <div
      className="dash-stat-card group"
      style={{ '--stat-color': color, animationDelay: `${delay}s` } as React.CSSProperties}
    >
      <div className="dash-stat-icon">
        <Icon size={21} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="dash-stat-label">{label}</p>
        <p className="dash-stat-value animate-count">{value}</p>
        {sub && <p className="dash-stat-sub">{sub}</p>}
      </div>
      {badge && (
        <span className="dash-stat-badge">{badge}</span>
      )}
      {href && !badge && (
        <ChevronLeft size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:-translate-x-0.5 transition-all flex-shrink-0" />
      )}
    </div>
  )

  return href ? <Link to={href} className="block stagger-item">{content}</Link> : <div className="stagger-item">{content}</div>
}
