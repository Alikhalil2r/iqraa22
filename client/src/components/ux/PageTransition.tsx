import React from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTransition({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className={`page-enter ${className}`.trim()}>
      {children}
    </div>
  )
}
