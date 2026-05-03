import React, { useState } from 'react'
import { Download, FileText, Table2, ChevronDown, FileSpreadsheet } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
  filename: string
  columns: { key: string; label: string }[]
  className?: string
}

function toCSV(data: any[], columns: { key: string; label: string }[]) {
  const header = columns.map(c => `"${c.label}"`).join(',')
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')
  )
  return '\uFEFF' + [header, ...rows].join('\r\n')
}

export function exportToCSV(data: any[], columns: { key: string; label: string }[], filename: string) {
  const csv = toCSV(data, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toLocaleDateString('ar').replace(/\//g, '-')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToJSON(data: any[], filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toLocaleDateString('ar').replace(/\//g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportToExcel(data: any[], columns: { key: string; label: string }[], filename: string) {
  const XLSX = await import('xlsx')
  const header = columns.map(c => c.label)
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      return String(val)
    })
  )
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])

  // Column widths
  ws['!cols'] = columns.map(() => ({ wch: 20 }))

  // RTL + Arabic header styling
  if (!ws['!rows']) ws['!rows'] = []

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات')

  const dateStr = new Date().toLocaleDateString('ar').replace(/\//g, '-')
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`)
}

export default function ExportButton({ data, filename, columns, className = '' }: ExportButtonProps) {
  const [open, setOpen] = useState(false)

  if (!data || data.length === 0) return null

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all"
      >
        <Download size={15} />
        تصدير
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[170px] animate-fade-in">
            <button
              onClick={() => { exportToCSV(data, columns, filename); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Table2 size={16} className="text-green-600" />
              تصدير CSV
            </button>
            <button
              onClick={() => { exportToExcel(data, columns, filename); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
            >
              <FileSpreadsheet size={16} className="text-emerald-600" />
              تصدير Excel
            </button>
            <button
              onClick={() => { exportToJSON(data, filename); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
            >
              <FileText size={16} className="text-blue-600" />
              تصدير JSON
            </button>
          </div>
        </>
      )}
    </div>
  )
}
