import React, { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

const SECTIONS = [
  {
    title: 'التنقل السريع',
    items: [
      { keys: ['Alt', '1'], desc: 'لوحة المعلومات' },
      { keys: ['Alt', '2'], desc: 'الطلاب' },
      { keys: ['Alt', '3'], desc: 'الموظفون' },
      { keys: ['Alt', '4'], desc: 'الحضور والغياب' },
      { keys: ['Alt', '5'], desc: 'النتائج الدراسية' },
      { keys: ['Alt', '6'], desc: 'رسائل الأولياء' },
      { keys: ['Alt', '7'], desc: 'التقارير' },
    ]
  },
  {
    title: 'أوامر عامة',
    items: [
      { keys: ['⌘', 'K'], desc: 'بحث سريع في النظام' },
      { keys: ['?'], desc: 'عرض اختصارات لوحة المفاتيح' },
      { keys: ['Esc'], desc: 'إغلاق النوافذ المنبثقة' },
    ]
  }
]

interface Props { open: boolean; onClose: () => void }

export default function ShortcutsModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Keyboard size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-black text-gray-800">اختصارات لوحة المفاتيح</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 px-2">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <span className="text-sm text-gray-700 font-bold">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && <span className="text-gray-300 text-[10px] mx-0.5">+</span>}
                          <kbd className="min-w-[28px] px-2 py-1 bg-gray-100 text-gray-600 text-[11px] font-mono rounded-md border border-gray-200 font-bold shadow-sm text-center">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl">
          <p className="text-[10px] text-gray-400 text-center">
            اضغط{' '}
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 shadow-sm font-mono text-[10px]">?</kbd>
            {' '}في أي وقت لعرض هذه القائمة
          </p>
        </div>
      </div>
    </div>
  )
}
