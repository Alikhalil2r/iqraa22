import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, GraduationCap, Users, BarChart3, Palette, Settings, MessageSquare, UserCheck, ClipboardCheck, Bus, Calendar, Newspaper, X, Command } from 'lucide-react'

const SHORTCUTS = [
  { label: 'لوحة المعلومات', path: '/admin', icon: BarChart3, color: '#6366f1', keys: ['d'] },
  { label: 'الطلاب', path: '/admin/students', icon: GraduationCap, color: '#10b981', keys: ['s'] },
  { label: 'الموظفون', path: '/admin/employees', icon: Users, color: '#8b5cf6', keys: ['e'] },
  { label: 'الحضور والغياب', path: '/admin/attendance', icon: UserCheck, color: '#3b82f6', keys: ['a'] },
  { label: 'النتائج الدراسية', path: '/admin/grades', icon: ClipboardCheck, color: '#0ea5e9', keys: ['g'] },
  { label: 'الحافلات', path: '/admin/buses', icon: Bus, color: '#f59e0b', keys: [] },
  { label: 'الرسائل', path: '/admin/messages', icon: MessageSquare, color: '#ef4444', keys: ['m'] },
  { label: 'الأخبار', path: '/admin/news', icon: Newspaper, color: '#6366f1', keys: [] },
  { label: 'التقارير', path: '/admin/reports', icon: BarChart3, color: '#10b981', keys: ['r'] },
  { label: 'التصميم', path: '/admin/theme', icon: Palette, color: '#ec4899', keys: [] },
  { label: 'الإعدادات', path: '/admin/settings', icon: Settings, color: '#64748b', keys: [] },
  { label: 'الفعاليات', path: '/admin/events', icon: Calendar, color: '#0ea5e9', keys: [] },
]

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = SHORTCUTS.filter(s =>
    !query || s.label.toLowerCase().includes(query.toLowerCase()) || s.path.includes(query)
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') {
        const item = filtered[selected]
        if (item) { navigate(item.path); onClose() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, filtered, selected, navigate, onClose])

  const go = (path: string) => { navigate(path); onClose() }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-20 p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <Search size={20} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="ابحث في لوحة التحكم..."
            className="flex-1 text-base outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-xs font-mono">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Search size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">لا توجد نتائج لـ "{query}"</p>
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-colors ${selected === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.color + '20' }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <span className="font-bold text-gray-700 text-sm flex-1">{item.label}</span>
                <span className="text-xs text-gray-400 font-mono">{item.path}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">↑↓</kbd> للتنقل</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Enter</kbd> للفتح</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Esc</kbd> للإغلاق</span>
        </div>
      </div>
    </div>
  )
}
