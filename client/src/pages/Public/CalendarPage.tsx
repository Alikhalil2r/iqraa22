import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Flag, Tag } from 'lucide-react'
import { DEMO_EVENTS, withDemoFallback } from '../../data/demoPublicFallback'

function PageBanner({ title, subtitle, icon, gradient = 'from-cyan-800 to-cyan-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  أكاديمي:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  اختبارات: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  إجازة:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  فعالية:   { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },
  حفل:      { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200' },
  رحلة:     { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
}

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const target = new Date(targetDate).getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return <span className="text-emerald-500 font-bold text-xs">انتهى</span>
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-black">
      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md">{days} يوم</span>
      {days < 30 && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md">{hours} ساعة</span>}
    </div>
  )
}

const TYPE_BG: Record<string, string> = {
  أكاديمي: 'bg-emerald-500', اختبارات: 'bg-red-500', إجازة: 'bg-amber-500', فعالية: 'bg-sky-500',
  حفل: 'bg-yellow-500', رحلة: 'bg-orange-500', 'نشاط مدرسي': 'bg-purple-500', 'إداري': 'bg-teal-500',
}

export default function CalendarPage() {
  const { data: eventsData } = useQuery({ queryKey: ['public-events'], queryFn: () => publicApi.events().then(r => r.data) })
  const [filter, setFilter] = useState('all')
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())

  const calendarEvents = useMemo(() => withDemoFallback(eventsData?.events, DEMO_EVENTS).map((e: any) => {
    const type = e.event_type || 'فعالية'
    return {
      id: e.id,
      title: e.title,
      date: (e.start_date || '').split('T')[0],
      type,
      description: e.description || '',
      location: e.location || '',
      color: TYPE_BG[type] || 'bg-sky-500',
    }
  }), [eventsData])

  const today = new Date().toISOString().split('T')[0]
  const types = useMemo<string[]>(() => {
    const ts = calendarEvents.map(e => String(e.type)).filter((t): t is string => Boolean(t))
    return ['all', ...Array.from(new Set<string>(ts))]
  }, [calendarEvents])

  const filtered = calendarEvents
    .filter(e => filter === 'all' || e.type === filter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const upcoming = filtered.filter(e => e.date >= today)
  const past = filtered.filter(e => e.date < today)

  const monthEvents = calendarEvents.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear
  })

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }

  return (
    <div>
      <PageBanner title="التقويم الدراسي" subtitle="جميع المواعيد والفعاليات المدرسية في مكان واحد" icon={<Calendar size={36} />} gradient="from-cyan-800 to-cyan-900" />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-l from-cyan-700 to-cyan-800 text-white p-4 flex items-center justify-between">
                <button onClick={prevMonth} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition"><ChevronRight size={16} /></button>
                <span className="font-black">{MONTHS_AR[viewMonth]} {viewYear}</span>
                <button onClick={nextMonth} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition"><ChevronLeft size={16} /></button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 mb-2">
                  {['أح','إث','ث','أر','خ','ج','س'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
                  {[...Array(daysInMonth)].map((_, i) => {
                    const day = i + 1
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const hasEvent = monthEvents.some(e => e.date === dateStr)
                    const isToday = dateStr === today
                    return (
                      <div key={day} className={`aspect-square flex flex-col items-center justify-center rounded-xl text-[11px] font-bold cursor-default transition-all ${isToday ? 'bg-cyan-600 text-white shadow-lg' : hasEvent ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-50'}`}>
                        {day}
                        {hasEvent && !isToday && <div className="w-1 h-1 bg-amber-500 rounded-full mt-0.5" />}
                      </div>
                    )
                  })}
                </div>
              </div>
              {monthEvents.length > 0 && (
                <div className="border-t border-gray-100 p-4">
                  <p className="text-xs font-black text-gray-500 mb-3">أحداث {MONTHS_AR[viewMonth]}</p>
                  <div className="space-y-2">
                    {monthEvents.map(e => (
                      <div key={e.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.color}`} />
                        <span className="flex-1 text-gray-700 font-bold">{e.title}</span>
                        <span className="text-gray-400">{new Date(e.date).getDate()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Events List */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-6">
              {types.map(t => {
                const style = TYPE_COLORS[t] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
                return (
                  <button key={t} onClick={() => setFilter(t)} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${filter === t ? `${style.bg} ${style.text} ${style.border}` : 'bg-gray-100 text-gray-500 border-transparent hover:border-gray-200'}`}>
                    {t === 'all' ? '📅 الكل' : t}
                  </button>
                )
              })}
            </div>

            {upcoming.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Flag size={16} className="text-cyan-600" />
                  <h3 className="font-black text-gray-800">الأحداث القادمة</h3>
                  <span className="bg-cyan-100 text-cyan-700 text-[10px] font-black px-2 py-0.5 rounded-lg">{upcoming.length}</span>
                </div>
                <div className="space-y-3">
                  {upcoming.map(event => {
                    const d = new Date(event.date)
                    const style = TYPE_COLORS[event.type] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
                    return (
                      <div key={event.id} className={`flex items-start gap-4 p-5 rounded-2xl ${style.bg} border ${style.border} hover:shadow-md transition-all`}>
                        <div className={`flex-shrink-0 w-14 h-14 ${event.color} text-white rounded-2xl flex flex-col items-center justify-center shadow-lg`}>
                          <span className="text-xs font-bold opacity-80">{MONTHS_AR[d.getMonth()].substring(0, 3)}</span>
                          <span className="text-xl font-black leading-none">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 className={`font-black text-sm ${style.text}`}>{event.title}</h4>
                            <CountdownTimer targetDate={event.date} />
                          </div>
                          {event.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{event.description}</p>}
                          <div className="flex gap-3 mt-2 flex-wrap">
                            <span className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar size={9} />{DAYS_AR[d.getDay()]}، {d.toLocaleDateString('ar-OM')}</span>
                            {event.location && <span className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin size={9} />{event.location}</span>}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 text-[9px] font-black px-2 py-0.5 rounded-md ${style.bg} ${style.text} border ${style.border}`}>{event.type}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={16} className="text-gray-400" />
                  <h3 className="font-black text-gray-500">الأحداث السابقة</h3>
                </div>
                <div className="space-y-2">
                  {past.slice().reverse().map(event => {
                    const d = new Date(event.date)
                    return (
                      <div key={event.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 opacity-60 hover:opacity-80 transition-opacity">
                        <div className={`flex-shrink-0 w-10 h-10 ${event.color} text-white rounded-xl flex flex-col items-center justify-center text-[10px] font-black shadow`}>
                          {d.getDate()}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-600 line-through">{event.title}</p>
                          <p className="text-[10px] text-gray-400">{d.toLocaleDateString('ar-OM')}</p>
                        </div>
                        <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-md font-bold">{event.type}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
