import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { CalendarCheck, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const STATUS = {
  present: { label:'حاضر', color:'text-green-600', bg:'bg-green-100', icon: CheckCircle },
  absent:  { label:'غائب', color:'text-red-600', bg:'bg-red-100', icon: XCircle },
  late:    { label:'متأخر', color:'text-amber-600', bg:'bg-amber-100', icon: Clock },
  excused: { label:'معذور', color:'text-blue-600', bg:'bg-blue-100', icon: CheckCircle },
}

export default function ParentAttendance() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))

  const { data, isLoading } = useQuery({
    queryKey: ['parent-att', month, year],
    queryFn: () => parentApi.attendance({ month, year }).then(r => r.data)
  })

  const records = data?.attendance || []
  const stats = data?.stats || {}
  const total = (Object.values(stats) as number[]).reduce((s: number, v: any) => s + (parseInt(v) || 0), 0)
  const rate = total > 0 ? Math.round(((stats.present as number) || 0) / total * 100) : 0

  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><CalendarCheck size={22}/>سجل الحضور والغياب</h1>
        <p className="text-sm text-gray-400 mt-1">متابعة حضور وغياب ابنك يومياً</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select className="input-field w-36" value={month} onChange={e=>setMonth(e.target.value)}>
          {months.map((m,i)=><option key={i+1} value={String(i+1)}>{m}</option>)}
        </select>
        <select className="input-field w-28" value={year} onChange={e=>setYear(e.target.value)}>
          {['2024','2025','2026'].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center" style={{borderTop:'3px solid #10b981'}}>
          <p className="text-4xl font-black text-green-600">{rate}%</p>
          <p className="text-xs text-gray-400 font-bold mt-1">نسبة الحضور</p>
        </div>
        {Object.entries(STATUS).map(([key, cfg]) => (
          <div key={key} className="card text-center">
            <cfg.icon size={20} className={`${cfg.color} mx-auto mb-1`}/>
            <p className="text-2xl font-black text-gray-800">{stats[key] || 0}</p>
            <p className="text-xs text-gray-400 font-bold">{cfg.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar-style list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"/></div>
      ) : records.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <AlertCircle size={40} className="mx-auto mb-3 text-gray-200"/>
          <p className="font-bold">لا توجد سجلات حضور لهذه الفترة</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="font-black text-gray-700 mb-4">السجل اليومي</h3>
          <div className="space-y-2">
            {records.map((r: any) => {
              const s = STATUS[r.status as keyof typeof STATUS] || STATUS.present
              const Icon = s.icon
              return (
                <div key={r.id} className={`flex items-center gap-4 p-3.5 rounded-2xl ${s.bg}`}>
                  <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-sm font-black text-gray-800">{new Date(r.date).getDate()}</span>
                    <span className="text-[9px] text-gray-400">{months[new Date(r.date).getMonth()]}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-black ${s.color}`}>{new Date(r.date).toLocaleDateString('ar-OM', {weekday:'long'})}</p>
                    {r.check_in_time && <p className="text-xs text-gray-500">دخل: {r.check_in_time}</p>}
                    {r.notes && <p className="text-xs text-gray-400 italic">{r.notes}</p>}
                  </div>
                  <div className={`flex items-center gap-1.5 font-black text-sm ${s.color}`}>
                    <Icon size={16}/>{s.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
