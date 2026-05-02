import React, { useState, useMemo } from 'react'
import { Search, Plus, Trash2, Edit, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps {
  title: string
  data: any[]
  columns: Column[]
  onAdd?: () => void
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  searchKeys?: string[]
  addLabel?: string
  loading?: boolean
  emptyMessage?: string
  filters?: React.ReactNode
}

export default function DataTable({
  title, data = [], columns, onAdd, onEdit, onDelete,
  searchKeys = [], addLabel = 'إضافة', loading, emptyMessage = 'لا توجد بيانات', filters
}: DataTableProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const perPage = 15

  const filtered = useMemo(() => {
    let result = data
    if (search && searchKeys.length > 0) {
      result = result.filter(row =>
        searchKeys.some(key => String(row[key] || '').toLowerCase().includes(search.toLowerCase()))
      )
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const va = a[sortKey] || ''
        const vb = b[sortKey] || ''
        return sortDir === 'asc' ? String(va).localeCompare(String(vb), 'ar') : String(vb).localeCompare(String(va), 'ar')
      })
    }
    return result
  }, [data, search, sortKey, sortDir, searchKeys])

  const pages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page-1)*perPage, page*perPage)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="card !p-0 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-black text-gray-800 flex-1">{title}</h2>
        {searchKeys.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input
              className="pr-9 pl-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:bg-white w-52"
              placeholder="بحث..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        )}
        {filters}
        {onAdd && (
          <button onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16}/>{addLabel}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/80">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`table-header ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    style={col.width ? {width:col.width} : {}}
                    onClick={() => col.sortable && handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && <th className="table-header w-24">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-16">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"/>
                  <span className="text-sm">جارٍ التحميل...</span>
                </div>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-16 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Filter size={32} className="text-gray-200"/>
                  <span className="text-sm">{search ? 'لا نتائج للبحث' : emptyMessage}</span>
                </div>
              </td></tr>
            ) : paginated.map((row, i) => (
              <tr key={row.id || i} className="table-row">
                {columns.map(col => (
                  <td key={col.key} className="table-cell">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] || '—')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit size={15}/>
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15}/>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
          <p className="text-gray-400 text-xs">
            عرض {Math.min((page-1)*perPage+1, filtered.length)}–{Math.min(page*perPage, filtered.length)} من {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
              <ChevronRight size={18}/>
            </button>
            {Array.from({length:Math.min(5,pages)}, (_,i) => {
              const p = Math.max(1, Math.min(pages-4, page-2)) + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page===p ? 'text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                  style={page===p ? {background:'var(--color-primary)'} : {}}>
                  {p}
                </button>
              )
            })}
            <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
              <ChevronLeft size={18}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
