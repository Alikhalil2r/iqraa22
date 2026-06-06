import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { BookOpen, Calendar, ClipboardList, Home } from 'lucide-react'

const links = [
  { to: '/student', label: 'الرئيسية', icon: Home, end: true },
  { to: '/student/grades', label: 'الدرجات', icon: BookOpen },
  { to: '/student/homework', label: 'الواجبات', icon: ClipboardList },
  { to: '/student/schedule', label: 'الجدول', icon: Calendar },
]

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-emerald-700 text-white px-4 py-3">
        <h1 className="font-black text-lg">بوابة الطالب</h1>
        <p className="text-xs text-emerald-100">متابعة الدرجات والواجبات والجدول الدراسي</p>
      </header>
      <nav className="flex gap-1 p-2 bg-white border-b overflow-x-auto">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${
                isActive ? 'bg-emerald-100 text-emerald-800' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <l.icon size={16} /> {l.label}
          </NavLink>
        ))}
      </nav>
      <main className="p-4 max-w-3xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
