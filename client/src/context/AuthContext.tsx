/* @refresh reset */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi } from '../api/client'

export type AppRole = 'super_admin' | 'admin' | 'teacher' | 'parent' | 'accountant' | 'librarian' | 'hr_manager' | 'guard'

export const ROLE_LABELS: Record<AppRole, { ar: string; en: string }> = {
  super_admin: { ar: 'مدير النظام العليا', en: 'Super Admin' },
  admin:       { ar: 'مدير النظام', en: 'System Admin' },
  teacher:     { ar: 'معلم', en: 'Teacher' },
  parent:      { ar: 'ولي أمر', en: 'Parent' },
  accountant:  { ar: 'محاسب', en: 'Accountant' },
  librarian:   { ar: 'أمين المكتبة', en: 'Librarian' },
  hr_manager:  { ar: 'مدير شؤون موظفين', en: 'HR Manager' },
  guard:       { ar: 'حارس / مشرف', en: 'Guard' },
}

export const ADMIN_ROLES: AppRole[] = ['super_admin','admin','teacher','accountant','librarian','hr_manager','guard']

interface User {
  id: string
  name: string
  username: string
  role: AppRole
  schoolId: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string, role: string, schoolSlug?: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isParent: boolean
  hasPermission: (permission: string) => boolean
}

const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin:  ['*'],
  admin:        ['dashboard','students','employees','attendance','grades','buses','messages','news','events','fees','schedule','reports','library','homework','conduct','leaves','settings','users','id_cards','teacher_dashboard','exams','gallery','announcements','pdf_reports','billing','super_admin'],
  teacher:      ['dashboard','students','attendance','grades','homework','conduct','messages','schedule','teacher_dashboard','exams'],
  accountant:   ['dashboard','fees','reports','students','pdf_reports'],
  librarian:    ['dashboard','library','students'],
  hr_manager:   ['dashboard','employees','leaves','reports','attendance','pdf_reports'],
  guard:        ['dashboard','attendance','buses','students'],
  parent:       [],
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null)
  const [token, setToken]         = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) { setUser(null); setIsLoading(false); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem('token'); setToken(null); setUser(null); setIsLoading(false); return
      }
    } catch { localStorage.removeItem('token'); setToken(null); setUser(null); setIsLoading(false); return }

    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('token'); setToken(null); setUser(null) })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = useCallback(async (username: string, password: string, role: string, schoolSlug?: string) => {
    const res = await authApi.login({ username, password, role, ...(schoolSlug ? { schoolSlug } : {}) })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token'); setToken(null); setUser(null)
  }, [])

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    const perms = ROLE_PERMISSIONS[user.role] || []
    return perms.includes('*') || perms.includes(permission) ||
      perms.some(p => permission.startsWith(p.replace('.*', '')))
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, login, logout,
      isAdmin: ADMIN_ROLES.includes(user?.role as AppRole),
      isParent: user?.role === 'parent',
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
