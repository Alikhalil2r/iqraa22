import React, { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { studentsApi } from '../../api/client'
import { Printer, Download, Search, Filter, GraduationCap, CreditCard, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const ACADEMIC_YEAR = '2024/2025'

function QRPlaceholder({ value }: { value: string }) {
  const size = 7
  const grid = React.useMemo(() => {
    const arr: boolean[][] = []
    for (let i = 0; i < size; i++) {
      arr[i] = []
      for (let j = 0; j < size; j++) {
        const seed = (value.charCodeAt((i * size + j) % value.length) + i * 7 + j * 13) % 3
        arr[i][j] = seed === 0
      }
    }
    arr[0][0] = arr[0][1] = arr[1][0] = arr[1][1] = true
    arr[0][5] = arr[0][6] = arr[1][5] = arr[1][6] = true
    arr[5][0] = arr[5][1] = arr[6][0] = arr[6][1] = true
    return arr
  }, [value])

  return (
    <div className="grid gap-px p-1 bg-white rounded" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, width: 36, height: 36 }}>
      {grid.map((row, i) =>
        row.map((cell, j) => (
          <div key={`${i}-${j}`} className={`rounded-[1px] ${cell ? 'bg-gray-800' : 'bg-white'}`} />
        ))
      )}
    </div>
  )
}

function IdCard({ student, schoolName, primaryColor }: { student: any; schoolName: string; primaryColor: string }) {
  const initials = (student.name || '؟').split(' ').slice(0, 2).map((w: string) => w[0]).join('')

  return (
    <div className="id-card relative overflow-hidden rounded-2xl shadow-lg border border-gray-200"
      style={{ width: 200, height: 295, background: '#fff', fontFamily: 'Cairo, sans-serif', pageBreakInside: 'avoid' }}>

      {/* Header */}
      <div className="relative px-3 pt-3 pb-6" style={{ background: primaryColor }}>
        <div className="absolute bottom-0 left-0 right-0 h-5 rounded-t-3xl bg-white" />
        <p className="text-white text-center text-[9px] font-black leading-tight opacity-90">{schoolName}</p>
        <p className="text-white text-center text-[7px] opacity-70 mt-0.5">بطاقة الطالب — {ACADEMIC_YEAR}</p>
      </div>

      {/* Photo */}
      <div className="flex justify-center -mt-7 relative z-10">
        {student.photo ? (
          <img src={student.photo} alt={student.name}
            className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md"
            style={{ border: '3px solid white' }} />
        ) : (
          <div className="w-14 h-14 rounded-full border-3 border-white shadow-md flex items-center justify-center text-white font-black text-lg"
            style={{ border: '3px solid white', background: primaryColor }}>
            {initials}
          </div>
        )}
      </div>

      {/* Student Info */}
      <div className="px-3 pt-2 text-center">
        <p className="font-black text-gray-800 text-[11px] leading-tight">{student.name}</p>
        {student.name_en && <p className="text-gray-400 text-[8px] mt-0.5">{student.name_en}</p>}
        <div className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black"
          style={{ background: primaryColor + '15', color: primaryColor }}>
          {student.class_name || 'غير محدد'}
        </div>
      </div>

      {/* Details */}
      <div className="mx-3 mt-2 rounded-xl bg-gray-50 p-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[8px] text-gray-400 font-bold">رقم الطالب</span>
          <span className="text-[9px] font-black text-gray-700">{student.student_number || '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[8px] text-gray-400 font-bold">الجنس</span>
          <span className="text-[9px] font-black text-gray-700">{student.gender === 'M' ? 'ذكر' : student.gender === 'F' ? 'أنثى' : '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[8px] text-gray-400 font-bold">ولي الأمر</span>
          <span className="text-[9px] font-black text-gray-700 max-w-[80px] truncate">{student.parent_name || '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[8px] text-gray-400 font-bold">الهاتف</span>
          <span className="text-[8px] font-bold text-gray-600 dir-ltr">{student.parent_phone || '—'}</span>
        </div>
      </div>

      {/* Footer with QR */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-end justify-between"
        style={{ background: 'linear-gradient(to top, ' + primaryColor + '10, transparent)' }}>
        <div className="text-left">
          <p className="text-[6px] text-gray-400">للتحقق من الهوية</p>
          <p className="text-[6px] text-gray-400">امسح الرمز</p>
        </div>
        <QRPlaceholder value={student.student_number || student.id || '000'} />
      </div>

      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
        <GraduationCap size={120} />
      </div>
    </div>
  )
}

export default function StudentIdCards() {
  const [search, setSearch]       = useState('')
  const [classFilter, setClass]   = useState('all')
  const [selectedIds, setSelected] = useState<Set<string>>(new Set())
  const printRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['students-id-cards'],
    queryFn: () => studentsApi.list({ status: 'active' }).then(r => r.data)
  })

  const students: any[] = data?.students || []
  const classes = Array.from(new Set(students.map((s: any) => s.class_name).filter(Boolean))).sort()

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name?.includes(search) || s.student_number?.includes(search)
    const matchClass  = classFilter === 'all' || s.class_name === classFilter
    return matchSearch && matchClass
  })

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#1e40af'
  const schoolName = 'مدرسة اقرأ الخاصة'

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(s => s.id)))
  }

  const handlePrint = () => {
    const printStudents = selectedIds.size > 0
      ? filtered.filter(s => selectedIds.has(s.id))
      : filtered

    if (printStudents.length === 0) {
      toast.error('لا يوجد طلاب للطباعة')
      return
    }

    const style = `
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
      @page { margin: 10mm; }
      body { font-family: 'Cairo', sans-serif; margin: 0; direction: rtl; }
      .print-grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start; }
      .id-card { width: 200px; height: 295px; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; page-break-inside: avoid; background: white; position: relative; }
      .card-header { padding: 12px; padding-bottom: 24px; position: relative; }
      .photo-circle { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: 900; margin: -28px auto 0; border: 3px solid white; position: relative; z-index: 10; }
      .name { text-align: center; font-weight: 900; font-size: 11px; margin-top: 8px; color: #1f2937; }
      .class-badge { text-align: center; font-size: 8px; font-weight: 900; padding: 2px 8px; border-radius: 20px; display: inline-block; margin: 4px auto; }
      .details-box { margin: 8px; background: #f9fafb; border-radius: 10px; padding: 8px; }
      .detail-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .detail-label { font-size: 8px; color: #9ca3af; font-weight: 700; }
      .detail-value { font-size: 9px; font-weight: 900; color: #374151; }
      .card-footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 12px; display: flex; align-items: flex-end; justify-content: space-between; }
      .qr-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; padding: 4px; background: white; border-radius: 4px; width: 36px; height: 36px; }
      .qr-cell { border-radius: 1px; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `

    const generateCard = (s: any) => {
      const initials = (s.name || '؟').split(' ').slice(0, 2).map((w: string) => w[0]).join('')
      const photoHtml = s.photo
        ? `<img src="${s.photo}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:3px solid white;margin:-28px auto 0;display:block;position:relative;z-index:10;" />`
        : `<div class="photo-circle" style="background:${primaryColor}">${initials}</div>`

      return `
        <div class="id-card">
          <div class="card-header" style="background:${primaryColor}; padding-bottom:28px;">
            <div style="position:absolute;bottom:0;left:0;right:0;height:20px;background:white;border-radius:16px 16px 0 0;"></div>
            <div style="text-align:center;color:white;font-size:9px;font-weight:900;opacity:0.9;">${schoolName}</div>
            <div style="text-align:center;color:white;font-size:7px;opacity:0.7;">بطاقة الطالب — ${ACADEMIC_YEAR}</div>
          </div>
          ${photoHtml}
          <div class="name">${s.name}</div>
          ${s.name_en ? `<div style="text-align:center;color:#9ca3af;font-size:8px;">${s.name_en}</div>` : ''}
          <div style="text-align:center;margin:4px 0;">
            <span class="class-badge" style="background:${primaryColor}20;color:${primaryColor};">
              ${s.class_name || 'غير محدد'}
            </span>
          </div>
          <div class="details-box">
            <div class="detail-row"><span class="detail-label">رقم الطالب</span><span class="detail-value">${s.student_number || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">الجنس</span><span class="detail-value">${s.gender === 'M' ? 'ذكر' : s.gender === 'F' ? 'أنثى' : '—'}</span></div>
            <div class="detail-row"><span class="detail-label">ولي الأمر</span><span class="detail-value" style="max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.parent_name || '—'}</span></div>
            <div class="detail-row"><span class="detail-label">الهاتف</span><span class="detail-value" style="direction:ltr;">${s.parent_phone || '—'}</span></div>
          </div>
          <div class="card-footer" style="background:linear-gradient(to top, ${primaryColor}15, transparent);">
            <div><div style="font-size:6px;color:#9ca3af;">للتحقق من الهوية</div><div style="font-size:6px;color:#9ca3af;">امسح الرمز</div></div>
            <div style="width:36px;height:36px;background:white;border-radius:4px;padding:2px;display:grid;grid-template-columns:repeat(7,1fr);gap:1px;">
              ${Array.from({length: 49}, (_, idx) => {
                const i = Math.floor(idx / 7), j = idx % 7
                const seed = ((s.student_number || s.id || '0').charCodeAt(idx % 10) + i * 7 + j * 13) % 3
                const on = seed === 0 || (i < 2 && j < 2) || (i < 2 && j > 4) || (i > 4 && j < 2)
                return `<div style="background:${on ? '#1f2937' : 'white'};border-radius:1px;"></div>`
              }).join('')}
            </div>
          </div>
        </div>
      `
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>بطاقات الطلاب — ${schoolName}</title>
        <style>${style}</style>
      </head>
      <body>
        <h2 style="font-family:Cairo;margin-bottom:16px;color:#1f2937;">بطاقات هوية الطلاب — ${schoolName} — ${ACADEMIC_YEAR}</h2>
        <div class="print-grid">
          ${printStudents.map(generateCard).join('')}
        </div>
        <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
      </body>
      </html>
    `

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast.error('يرجى السماح بالنوافذ المنبثقة'); return }
    win.document.write(html)
    win.document.close()
    toast.success(`جارٍ طباعة ${printStudents.length} بطاقة`)
  }

  return (
    <div className="space-y-6 animate-fadeUp">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <CreditCard size={22} className="text-blue-600" /> بطاقات هوية الطلاب
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {filtered.length} طالب
            {selectedIds.size > 0 && ` · ${selectedIds.size} محدد للطباعة`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-50 transition-all"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-90 transition-all"
            style={{ background: 'var(--color-primary)' }}
          >
            <Printer size={16} />
            {selectedIds.size > 0 ? `طباعة (${selectedIds.size})` : 'طباعة الكل'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card !py-3 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث باسم الطالب أو الرقم..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={classFilter} onChange={e => setClass(e.target.value)}
            className="text-sm border-none outline-none bg-transparent text-gray-700 font-bold cursor-pointer">
            <option value="all">كل الفصول</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">لا يوجد طلاب</p>
        </div>
      ) : (
        <div ref={printRef} className="flex flex-wrap gap-4">
          {filtered.map(student => (
            <div key={student.id} className="relative" style={{ display: 'inline-block' }}>
              {/* Selection checkbox */}
              <button
                onClick={() => toggleSelect(student.id)}
                className={`absolute top-2 left-2 z-20 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  selectedIds.has(student.id)
                    ? 'border-transparent text-white'
                    : 'border-gray-300 bg-white hover:border-blue-400'
                }`}
                style={selectedIds.has(student.id) ? { background: 'var(--color-primary)' } : {}}
              >
                {selectedIds.has(student.id) && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <div
                className={`cursor-pointer transition-all ${selectedIds.has(student.id) ? 'ring-2 ring-offset-2 rounded-2xl' : 'hover:scale-[1.02]'}`}
                style={selectedIds.has(student.id) ? { '--tw-ring-color': primaryColor } as any : {}}
                onClick={() => toggleSelect(student.id)}
              >
                <IdCard student={student} schoolName={schoolName} primaryColor={primaryColor} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print hint */}
      {filtered.length > 0 && (
        <div className="card !bg-blue-50 !border-blue-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Printer size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-black text-blue-800">تلميح للطباعة</p>
            <p className="text-[10px] text-blue-600">يمكنك تحديد بطاقات معينة بالنقر عليها ثم الطباعة، أو اضغط "طباعة الكل" لطباعة جميع البطاقات</p>
          </div>
        </div>
      )}
    </div>
  )
}
