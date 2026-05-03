import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { parentApi } from '../../api/client'
import { Clock, BookOpen } from 'lucide-react'

const DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس']

export default function ParentSchedule() {
  const { data, isLoading } = useQuery({
    queryKey: ['parent-schedule'],
    queryFn: () => parentApi.schedule().then(r => r.data)
  })

  const schedule = data?.schedule || []
  const byDay: Record<number, any[]> = {}
  schedule.forEach((s: any) => {
    if (!byDay[s.day_of_week]) byDay[s.day_of_week] = []
    byDay[s.day_of_week].push(s)
  })

  const SUBJECT_COLORS = ['#6366f1','#10b981','#f59e0b','#0ea5e9','#8b5cf6','#ec4899','#14b8a6']

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Clock size={22}/>الجدول الدراسي</h1>
        <p className="text-sm text-gray-400 mt-1">جدول الحصص الأسبوعي</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin"/></div>
      ) : schedule.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-200"/>
          <p className="font-bold">لا يوجد جدول دراسي مسجل بعد</p>
          <p className="text-sm mt-1">تواصل مع المدرسة لمعرفة الجدول</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day, i) => {
            const dayItems = byDay[i] || []
            return (
              <div key={day} className="card">
                <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{background:'var(--color-primary)'}}>
                    {i+1}
                  </div>
                  {day}
                  <span className="text-xs text-gray-400 font-normal">({dayItems.length} حصة)</span>
                </h3>
                {dayItems.length === 0 ? (
                  <p className="text-sm text-gray-300 text-center py-3">لا توجد حصص</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayItems.sort((a:any,b:any)=>a.start_time?.localeCompare(b.start_time)).map((item: any, j: number) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="w-2 h-12 rounded-full flex-shrink-0" style={{background:SUBJECT_COLORS[j%SUBJECT_COLORS.length]}}/>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{item.subject_name}</p>
                          {item.teacher_name && <p className="text-xs text-gray-400 truncate">{item.teacher_name}</p>}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                            <Clock size={10}/>{item.start_time} — {item.end_time}
                            {item.room && <span>• {item.room}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
