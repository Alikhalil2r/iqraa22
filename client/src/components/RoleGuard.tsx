import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, AppRole } from '../context/AuthContext'

interface RoleGuardProps {
  children: React.ReactNode
  roles?: AppRole[]
  permission?: string
  fallback?: string
}

export default function RoleGuard({ children, roles, permission, fallback = '/admin' }: RoleGuardProps) {
  const { user, isLoading, hasPermission } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role) && user.role !== 'super_admin') {
    return <Navigate to={fallback} replace />
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
