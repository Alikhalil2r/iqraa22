import React, { useState, useMemo } from 'react'
import { Search, Plus, Trash2, Edit, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'
import ExportButton from './ExportButton'
import { useDebounce } from '../hooks/useDebounce'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
  width?: string
  exportable?: boolean
}

interface DataTableProps {
  title: string
  data: any[]
  columns: Column[]
  onAdd?: () => void
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  deleteMessage?: (row: any) => string
  searchKeys?: string[]
  addLabel?: string
  loading?: boolean
  emptyMessage?: string
  filters?: React.ReactNode
  exportFilename?: string
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={`skel-td-${i}`} className="table-cell">
          <div className="skeleton h-4 rounded-lg" style={{ width: `${55 + (i * 17) % 40}%` }} />
        </td>
      ))}
      <td className="table-cell">
        <div className="flex gap-1">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton w-8 h-8 rounded-lg" />
        </div>
      </td>
    </tr>
  )
}

export default function DataTable({
  title, data = [], columns, onAdd, onEdit, onDelete,
  deleteMessage, searchKeys = [], addLabel = 'إضافة', loading,
  emptyMessage = 'لا توجد بيانات', filters, exportFilename
}: DataTableProps) {
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 280)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [confirmRow, setConfirmRow] = useState<any>(null)
  const perPage = 15

  const filtered = useMemo(() => {
    let result = data
    if (search && searchKeys.length > 0) {
      const q = search.toLowerCase()
      result = result.filter(row =>
        searchKeys.some(key => String(row[key] || '').toLowerCase().includes(q))
      )
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const va = a[sortKey] || ''
        const vb = b[sortKey] || ''
        return sortDir === 'asc'
          ? String(va).localeCompare(String(vb), 'ar')
          : String(vb).localeCompare(String(va), 'ar')
      })
    }
    return result
  }, [data, search, sortKey, sortDir, searchKeys])

  const pages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const exportColumns = columns
    .filter(c => c.exportable !== false && !c.render)
    .map(c => ({ key: c.key, label: c.label }))

  const confirmDelete = (row: any) => setConfirmRow(row)
  const doDelete = () => {
    if (confirmRow && onDelete) {
      onDelete(confirmRow)
      setConfirmRow(null)
    }
  }

  return (
    <>
      <div className="card dash-data-table !p-0 overflow-hidden hover-lift">
        {/* Header */}
        <div className="dash-data-table-header p-4 md:p-5 flex flex-wrap items-center gap-3">
          <h2 className="text-base md:text-lg font-black text-gray-800 flex-1 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full" style={{ background: 'var(--color-primary)' }} />
            {title}
          </h2>
          {searchKeys.length > 0 && (
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="pr-9 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': 'color-mix(in srgb, var(--color-primary) 20%, transparent)', width: searchInput ? '14rem' : '12rem' } as any}
                placeholder="بحث..."
                value={searchInput}
                onChange={e => { setSearchInput(e.target.value); setPage(1) }}
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setPage(1) }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
          {filters}
          {exportFilename && data.length > 0 && (
            <ExportButton
              data={filtered}
              filename={exportFilename}
              columns={exportColumns.length > 0 ? exportColumns : columns.map(c => ({ key: c.key, label: c.label }))}
            />
          )}
          {onAdd && (
            <button onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={15} />{addLabel}
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`table-header ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                    style={col.width ? { width: col.width } : {}}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className={`transition-colors text-xs ${sortKey === col.key ? 'text-blue-500' : 'text-gray-300'}`}>
                          {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="table-header w-24">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={`skel-${i}`} cols={columns.length} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Filter size={28} className="text-gray-300" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-500">
                          {searchInput ? `لا نتائج لـ "${searchInput}"` : emptyMessage}
                        </p>
                        {searchInput && (
                          <button onClick={() => setSearchInput('')} className="text-xs text-blue-500 hover:underline mt-1">
                            مسح البحث
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((row, i) => (
                  <tr key={row.id || i} className="table-row group">
                    {columns.map(col => (
                      <td key={col.key} className="table-cell">
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="تعديل"
                            >
                              <Edit size={15} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => confirmDelete(row)}
                              className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <p className="text-gray-400 text-xs">
            {loading ? (
              <div className="skeleton h-3 w-36 rounded inline-block" />
            ) : filtered.length > 0 ? (
              `عرض ${Math.min((page - 1) * perPage + 1, filtered.length)}–${Math.min(page * perPage, filtered.length)} من ${filtered.length} سجل`
            ) : null}
          </p>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
              >
                <ChevronRight size={18} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(pages - 4, page - 2)) + i
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'text-white shadow-sm' : 'hover:bg-gray-100 text-gray-600'}`}
                    style={page === p ? { background: 'var(--color-primary)' } : {}}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!confirmRow}
        title="تأكيد الحذف"
        message={
          confirmRow
            ? (deleteMessage ? deleteMessage(confirmRow) : `هل تريد حذف هذا السجل بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.`)
            : ''
        }
        confirmLabel="نعم، احذف"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmRow(null)}
      />
    </>
  )
}
