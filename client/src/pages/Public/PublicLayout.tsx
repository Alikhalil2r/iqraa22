import React, { useState } from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'
import { Menu, X, Phone, Mail, MapPin, BookOpen, Users, GraduationCap, ExternalLink } from 'lucide-react'

export default function PublicLayout() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const { theme } = useTheme()
  const { data } = useQuery({ queryKey:['public-school'], queryFn:()=>publicApi.school().then(r=>r.data) })

  const school = data?.school
  const navLinks = [
    { to:'/', label:'الرئيسية', end:true },
    { to:'/about', label:'عن المدرسة' },
    { to:'/news', label:'الأخبار' },
    { to:'/contact', label:'تواصل معنا' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="text-white py-2 px-4 hidden sm:block" style={{background:'var(--color-primary-dark)'}}>
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            {school?.phone && <a href={`tel:${school.phone}`} className="flex items-center gap-1.5 hover:text-white/80 transition"><Phone size={12}/>{school.phone}</a>}
            {school?.email && <a href={`mailto:${school.email}`} className="flex items-center gap-1.5 hover:text-white/80 transition"><Mail size={12}/>{school.email}</a>}
          </div>
          <div className="flex items-center gap-4">
            <Link to="/parent-login" className="flex items-center gap-1.5 hover:text-white/80 transition"><Users size={12}/>بوابة أولياء الأمور</Link>
            <Link to="/login" className="flex items-center gap-1.5 hover:text-white/80 transition"><GraduationCap size={12}/>لوحة التحكم</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            {theme.logoUrl ? (
              <img src={theme.logoUrl} className="h-12 w-auto" alt={theme.schoolName}/>
            ) : (
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:'var(--color-primary)'}}>
                <BookOpen size={22} className="text-white"/>
              </div>
            )}
            <div>
              <h1 className="font-black text-gray-900 leading-none text-base">{theme.schoolName}</h1>
              {theme.tagline && <p className="text-xs text-gray-400 mt-0.5">{theme.tagline}</p>}
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 mr-auto">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({isActive})=>`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive?'text-white':'text-gray-600 hover:bg-gray-100'}`}
                style={({isActive})=>isActive?{background:'var(--color-primary)'}:{}}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/parent-login" className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold flex-shrink-0"
            style={{background:'var(--color-accent)'}}>
            <Users size={16}/>بوابة الأولياء
          </Link>
          <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 mr-auto" onClick={()=>setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 p-3 space-y-1 bg-white">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={()=>setMobileMenu(false)}
                className={({isActive})=>`flex px-4 py-3 rounded-xl font-bold text-sm ${isActive?'text-white':'text-gray-700 hover:bg-gray-100'}`}
                style={({isActive})=>isActive?{background:'var(--color-primary)'}:{}}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/parent-login" onClick={()=>setMobileMenu(false)} className="flex items-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm" style={{background:'var(--color-accent)'}}>
              <Users size={16}/>بوابة أولياء الأمور
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      {/* Footer */}
      <footer className="text-white py-12 mt-16" style={{background:'var(--color-primary-dark)'}}>
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><BookOpen size={18} className="text-white"/></div>
              <div>
                <p className="font-black">{theme.schoolName}</p>
                {theme.tagline && <p className="text-xs text-white/60">{theme.tagline}</p>}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-black mb-3 text-white/80 text-sm uppercase tracking-wider">روابط سريعة</h4>
            <div className="space-y-2">
              {navLinks.map(l=><Link key={l.to} to={l.to} className="block text-sm text-white/60 hover:text-white transition">{l.label}</Link>)}
            </div>
          </div>
          <div>
            <h4 className="font-black mb-3 text-white/80 text-sm uppercase tracking-wider">تواصل معنا</h4>
            <div className="space-y-2">
              {school?.address && <p className="text-sm text-white/60 flex items-start gap-2"><MapPin size={13} className="mt-0.5 flex-shrink-0"/>{school.address}</p>}
              {school?.phone && <a href={`tel:${school.phone}`} className="text-sm text-white/60 hover:text-white flex items-center gap-2"><Phone size={13}/>{school.phone}</a>}
              {school?.email && <a href={`mailto:${school.email}`} className="text-sm text-white/60 hover:text-white flex items-center gap-2"><Mail size={13}/>{school.email}</a>}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-white/10 text-center text-white/40 text-xs">
          جميع الحقوق محفوظة © {new Date().getFullYear()} {theme.schoolName}
        </div>
      </footer>
    </div>
  )
}
