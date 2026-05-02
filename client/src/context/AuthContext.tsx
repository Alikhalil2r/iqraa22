/* @refresh reset */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi } from '../api/client'

interface User {
  id: string
  name: string
  username: string
  role: 'admin' | 'parent' | 'teacher'
  schoolId: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string, role: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isParent: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  // Verify token on mount and when token changes
  useEffect(() => {
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    // Validate token is not expired before hitting the server
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        // Token already expired locally — clean up without a server request
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setIsLoading(false)
        return
      }
    } catch {
      // Invalid token format
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      setIsLoading(false)
      return
    }

    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = useCallback(async (username: string, password: string, role: string) => {
    const res = await authApi.login({ username, password, role })
    const { token: newToken, user: newUser } = res.data
    // Only store the token — user data is fetched from server via /auth/me
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, logout,
      isAdmin: user?.role === 'admin' || user?.role === 'teacher',
      isParent: user?.role === 'parent',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
