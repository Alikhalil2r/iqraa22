import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, studentsApi, employeesApi } from '../../api/client'
import { UserCheck, Users, GraduationCap, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, BarChart2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

type PersonType = 'student' | 'employee'
type AttStatus = 'present' | 'absent' | 'late' | 'excused'

const STATUS_CONFIG: Record<AttStatus, {label:string, color:string, bg:string, icon:any}> = {
  present: { label:'حاضر', color:'text-green-700', bg:'bg-green-100 border-green-300', icon: CheckCircle },
  absent:  { label:'غائب', color:'text-red-700', bg:'bg-red-100 border-red-300', icon: XCircle },
  late:    { label:'متأخر', color:'text-amber-700', bg:'bg-amber-100 border-amber-300', icon: Clock },
  excused: { label:'معذور', color:'text-blue-700', bg:'bg-blue-100 border-blue-300', icon: CheckCircle },
}

export default function Attendance() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [personType, setPersonType] = useState<PersonType>('student')
  const [localStatus, setLocalStatus] = useState<Record<string, AttStatus>>({})
  const [saving, setSaving] = useState(false)
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState<AttStatus|''>('')
  const qc = useQueryClient()

  const { data: studentsData } = useQuery({
    queryKey: ['students-att'],
    queryFn: () => studentsApi.list().then(r => r.data),
    enabled: personType === 'student'
  })
  const { data: employeesData } = useQuery({
    queryKey: ['employees-att'],
    queryFn: () => employeesApi.list().then(r => r.data),
    enabled: personType === 'employee'
  })
  const { data: attData, refetch } = useQuery({
    queryKey: ['attendance', date, personType],
    queryFn: () => attendanceApi.list({ date, personType }).then(r => r.data)
  })

  React.useEffect(() => {
    const map: Record<string, AttStatus> = {}
    attData?.attendance?.forEach((a: any) => { map[a.person_id] = a.status })
    setLocalStatus(map)
  }, [attData])

  const allPersons = personType === 'student' ? (studentsData?.students || []) : (employeesData?.employees || [])
  const classes = useMemo(() => [...new Set(allPersons.map((p: any) => p.class_name || p.department).filter(Boolean))].sort(), [allPersons])

  const persons = useMemo(() => {
    let filtered = allPersons
    if (filterClass) filtered = filtered.filter((p: any) => (p.class_name || p.department) === filterClass)
    if (filterStatus) filtered = filtered.filter((p: any) => localStatus[p.id] === filterStatus)
    return filtered
  }, [allPersons, filterClass, filterStatus, localStatus])

  const totalPresent = Object.values(localStatus).filter(s=>s==='present').length
  const totalAbsent = Object.values(localStatus).filter(s=>s==='absent').length
  const totalLate = Object.values(localStatus).filter(s=>s==='late').length
  const totalExcused = Object.values(localStatus).filter(s=>s==='excused').length
  const totalMarked = Object.keys(localStatus).length
  const pctPresent = totalMarked > 0 ? Math.round(totalPresent / totalMarked * 100) : 0

  const markAll = (status: AttStatus) => {
    const map: Record<string, AttStatus> = { ...localStatus }
    persons.forEach((p: any) => { map[p.id] = status })
    setLocalStatus(map)
  }

  const saveAll = async () => {
    if (Object.keys(localStatus).length === 0) return toast.error('لم تقم بتسجيل أي حضور')
    setSaving(true)
    try {
      const records = Object.entries(localStatus).map(([personId, status]) => ({
        personType, personId, date, status
      }))
      await attendanceApi.bulkMark({ records })
      toast.success(`تم حفظ الحضور (${records.length} شخص)`)
      refetch()
    } catch { toast.error('حدث خطأ في الحفظ') }
    finally { setSaving(false) }
  }

  const changeDate = (days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800">الحضور والغياب</h1>
          <p className="text-sm text-gray-400 mt-1">تسجيل حضور وغياب الطلاب والموظفين يومياً</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <UserCheck size={16}/>}
          حفظ الحضور
        </button>
      </div>

      {/* Controls */}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><ChevronRight size={18}/></button>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input-field w-44 text-center"/>
          <button onClick={() => changeDate(1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" disabled={date >= today}><ChevronLeft size={18}/></button>
          {date === today && <span className="text-[10px] text-green-600 font-black bg-green-50 px-2 py-0.5 rounded-lg">اليوم</span>}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {([['student','الطلاب',GraduationCap],['employee','الموظفون',Users]] as const).map(([v,l,Icon]) => (
            <button key={v} onClick={()=>{setPersonType(v);setFilterClass('')}}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${personType===v ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              style={personType===v ? {background:'var(--color-primary)'} : {}}>
              <Icon size={16}/>{l}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mr-auto flex-wrap">
          {classes.length > 0 && (
            <select className="input-field py-1.5 text-xs w-40" value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
              <option value="">كل {personType==='student'?'الفصول':'الأقسام'}</option>
              {classes.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select className="input-field py-1.5 text-xs w-36" value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)}>
            <option value="">كل الحالات</option>
            {(Object.entries(STATUS_CONFIG) as [AttStatus, any][]).map(([s,cfg])=>(
              <option key={s} value={s}>{cfg.label}</option>
            ))}
          </select>
          <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200">الكل حاضر</button>
          <button onClick={() => markAll('absent')} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200">الكل غائب</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label:'الكل', value: allPersons.length, color:'#6366f1', bg:'bg-indigo-50' },
          { label:'حاضر', value: totalPresent, color:'#10b981', bg:'bg-green-50' },
          { label:'غائب', value: totalAbsent, color:'#ef4444', bg:'bg-red-50' },
          { label:'متأخر', value: totalLate, color:'#f59e0b', bg:'bg-amber-50' },
          { label:'معذور', value: totalExcused, color:'#0ea5e9', bg:'bg-sky-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-black" style={{color:s.color}}>{s.value}</p>
            <p className="text-xs text-gray-500 font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance rate bar */}
      {totalMarked > 0 && (
        <div className="card !py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><BarChart2 size={13}/>نسبة الحضور اليوم</span>
            <span className="text-sm font-black" style={{color:pctPresent>=80?'#10b981':pctPresent>=60?'#f59e0b':'#ef4444'}}>{pctPresent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${pctPresent}%`,background:pctPresent>=80?'#10b981':pctPresent>=60?'#f59e0b':'#ef4444'}}/>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>تم تسجيل {totalMarked} من {allPersons.length}</span>
            <span>{allPersons.length - totalMarked} لم يُسجَّل بعد</span>
          </div>
        </div>
      )}

      {/* Grid */}
      {persons.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <UserCheck size={40} className="mx-auto mb-3 text-gray-200"/>
          <p className="mb-2">
            {filterClass || filterStatus ? 'لا توجد نتائج للفلتر المحدد' : `لا يوجد ${personType === 'student' ? 'طلاب' : 'موظفون'} مسجلون`}
          </p>
          {(filterClass || filterStatus) && (
            <button onClick={()=>{setFilterClass('');setFilterStatus('')}} className="text-xs text-blue-500 hover:underline">إزالة الفلتر</button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {persons.map((person: any) => {
            const status = localStatus[person.id]
            return (
              <div key={person.id} className={`bg-white rounded-2xl p-4 border-2 transition-all hover:shadow-md ${status ? STATUS_CONFIG[status].bg : 'border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{background:'var(--color-primary)'}}>
                    {person.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{person.name}</p>
                    <p className="text-xs text-gray-400 truncate">{personType==='student' ? person.class_name : person.department}</p>
                  </div>
                  {status && (
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${status==='present'?'bg-green-500':status==='absent'?'bg-red-500':status==='late'?'bg-amber-500':'bg-blue-500'}`}/>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.entries(STATUS_CONFIG) as [AttStatus, any][]).map(([s, cfg]) => (
                    <button key={s} onClick={() => setLocalStatus(prev => ({...prev, [person.id]: s}))}
                      className={`py-1.5 rounded-lg text-[11px] font-bold transition-all border ${status===s ? cfg.bg + ' ' + cfg.color + ' scale-105' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
