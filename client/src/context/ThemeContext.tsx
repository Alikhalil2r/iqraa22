/* @refresh reset */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { publicApi } from '../api/client'

interface Theme {
  primaryColor: string
  primaryDark: string
  primaryLight: string
  accentColor: string
  accentDark: string
  logoUrl?: string
  schoolName: string
  schoolNameEn?: string
  tagline?: string
  taglineEn?: string
  favicon?: string
}

const defaultTheme: Theme = {
  primaryColor: '#065f46',
  primaryDark: '#064e3b',
  primaryLight: '#10b981',
  accentColor: '#f59e0b',
  accentDark: '#d97706',
  schoolName: 'مدرسة النور العالمية',
  tagline: 'نور العلم يضيء المستقبل'
}

interface ThemeContextType {
  theme: Theme
  applyTheme: (t: Partial<Theme>) => void
}

const ThemeContext = createContext<ThemeContextType>(null!)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  const applyTheme = (t: Partial<Theme>) => {
    const merged = { ...theme, ...t }
    setTheme(merged)
    document.documentElement.style.setProperty('--color-primary', merged.primaryColor)
    document.documentElement.style.setProperty('--color-primary-dark', merged.primaryDark || merged.primaryColor)
    document.documentElement.style.setProperty('--color-primary-light', merged.primaryLight || merged.primaryColor)
    document.documentElement.style.setProperty('--color-accent', merged.accentColor)
    document.documentElement.style.setProperty('--color-accent-dark', merged.accentDark || merged.accentColor)
    if (merged.schoolName) document.title = merged.schoolName
  }

  useEffect(() => {
    publicApi.school()
      .then(res => {
        if (res.data?.theme) applyTheme(res.data.theme)
      })
      .catch(() => applyTheme(defaultTheme))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
