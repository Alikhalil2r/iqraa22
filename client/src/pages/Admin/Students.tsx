import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi, busesApi, gradesApi, attendanceApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import {
  GraduationCap, Phone, Bus, User, BookOpen, UserCheck,
  ClipboardCheck, Award, TrendingUp, AlertTriangle, X, ChevronLeft, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const GENDER_OPTIONS  = [{ value: 'M', label: 'ذكر' }, { value: 'F', label: 'أنثى' }]
const STATUS_OPTIONS  = [{ value: 'active', label: 'نشط' }, { value: 'inactive', label: 'غير نشط' }, { value: 'transferred', label: 'محوّل' }]
const BLOOD_TYPES     = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(v => ({ value: v, label: v }))
const RELATION_OPTIONS = ['أب', 'أم', 'جد', 'جدة', 'عم', 'خال', 'أخ', 'أخت', 'وصي'].map(v => ({ value: v, label: v }))

const emptyStudent = {
  name: '', nameEn: '', studentNumber: '', gender: 'M', dateOfBirth: '', nationality: 'عُماني',
  className: '', academicYear: '2024-2025', status: 'active',
  parentName: '', parentPhone: '', parentEmail: '', parentRelation: 'أب',
  address: '', bloodType: '', medicalNotes: '', busId: '', photo: '', notes: ''
}

function gradeColor(pct: number) {
  if (pct >= 90) return '#10b981'
  if (pct >= 75) return '#3b82f6'
  if (pct >= 60) return '#f59e0b'
  return '#ef4444'
}

function StudentProfile({ student, onClose }: { student: any; onClose: () => void }) {
  const [tab, setTab] = useState<'info'|'grades'|'attendance'>('info')

  const { data: gradesData } = useQuery({
    queryKey: ['student-grades', student.id],
    queryFn: () => studentsApi.grades(student.id).then(r => r.data),
    enabled: tab === 'grades'
  })
  const { data: attData } = useQuery({
    queryKey: ['student-attendance', student.id],
    queryFn: () => studentsApi.attendance(student.id).then(r => r.data),
    enabled: tab === 'attendance'
  })

  const grades = gradesData?.grades || []
  const attendance = attData?.attendance || []
  const avgGrade = grades.length ? grades.reduce((s: number, g: any) => s + parseFloat(g.percentage || 0), 0) / grades.length : null
  const presRate = attendance.length ? (attendance.filter((a: any) => a.status === 'present').length / attendance.length * 100) : null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-6 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
          <button onClick={onClose} className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-xl transition-colors">
            <X size={18} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-black overflow-hidden flex-shrink-0">
              {student.photo
                ? <img src={student.photo} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                : student.name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-black">{student.name}</h2>
              {student.name_en && <p className="text-white/70 text-sm">{student.name_en}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-xl">{student.class_name || 'بدون فصل'}</span>
                <span className="bg-white/20 backdrop-blur-sm text-xs font-bold px-3 py-1 rounded-xl">{student.student_number || 'بدون رقم'}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-xl ${student.status === 'active' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                  {student.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>
              {/* Quick stats */}
              {(avgGrade !== null || presRate !== null) && (
                <div className="flex gap-4 mt-3">
                  {avgGrade !== null && <div className="text-center"><p className="text-xl font-black">{avgGrade.toFixed(1)}%</p><p className="text-[10px] text-white/60">متوسط الدرجات</p></div>}
                  {presRate !== null && <div className="text-center"><p className="text-xl font-black">{presRate.toFixed(0)}%</p><p className="text-[10px] text-white/60">نسبة الحضور</p></div>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4">
          {([['info','المعلومات',User],['grades','الدرجات',ClipboardCheck],['attendance','الحضور',UserCheck]] as const).map(([v,l,Icon])=>(
            <button key={v} onClick={()=>setTab(v)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-all ${tab===v?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon size={15}/>{l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {tab === 'info' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-black text-gray-700 text-sm uppercase tracking-wide">المعلومات الأساسية</h4>
                {[
                  ['الجنس', student.gender === 'M' ? 'ذكر' : 'أنثى'],
                  ['تاريخ الميلاد', student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('ar-OM') : '—'],
                  ['الجنسية', student.nationality || '—'],
                  ['العام الدراسي', student.academic_year || '—'],
                  ['فصيلة الدم', student.blood_type || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500 font-bold">{k}</span>
                    <span className="text-sm font-black text-gray-800">{v as string}</span>
                  </div>
                ))}
                {student.bus_number && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="text-sm text-gray-500 font-bold flex items-center gap-1"><Bus size={13}/>الحافلة</span>
                    <span className="text-sm font-black text-blue-600">{student.bus_number}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h4 className="font-black text-gray-700 text-sm uppercase tracking-wide">ولي الأمر</h4>
                {[
                  ['الاسم', student.parent_name || '—'],
                  ['الصلة', student.parent_relation || '—'],
                  ['الهاتف', student.parent_phone || '—'],
                  ['البريد', student.parent_email || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500 font-bold">{k}</span>
                    <span className="text-sm font-black text-gray-800 truncate max-w-[150px]">{v as string}</span>
                  </div>
                ))}
                {student.parent_phone && (
                  <a href={`tel:${student.parent_phone}`} className="flex items-center justify-center gap-2 w-full py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors">
                    <Phone size={16}/> اتصال بولي الأمر
                  </a>
                )}
              </div>
              {student.medical_notes && (
                <div className="md:col-span-2 p-4 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-xs font-black text-amber-700 mb-1">ملاحظات طبية</p>
                  <p className="text-sm text-amber-900">{student.medical_notes}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'grades' && (
            <div>
              {grades.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardCheck size={36} className="mx-auto mb-2 text-gray-200"/>
                  <p>لا توجد درجات مسجلة لهذا الطالب</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      {l:'عدد المواد',v:grades.length,c:'#6366f1'},
                      {l:'المتوسط',v:(grades.reduce((s:number,g:any)=>s+parseFloat(g.percentage||0),0)/grades.length).toFixed(1)+'%',c:'#3b82f6'},
                      {l:'الناجح',v:grades.filter((g:any)=>g.status==='pass').length,c:'#10b981'},
                    ].map(s=>(
                      <div key={s.l} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-black" style={{color:s.c}}>{s.v}</p>
                        <p className="text-[10px] text-gray-400">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {grades.map((g: any) => {
                      const pct = parseFloat(g.percentage || 0)
                      return (
                        <div key={g.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                            style={{ background: gradeColor(pct) }}>
                            {g.grade_letter || '—'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 text-sm">{g.subject_name}</p>
                            <p className="text-[10px] text-gray-400">{g.term} — {g.academic_year}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm" style={{color:gradeColor(pct)}}>{pct.toFixed(1)}%</p>
                            <p className="text-[10px] text-gray-400">{g.score}/{g.max_score}</p>
                          </div>
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{width:`${Math.min(pct,100)}%`,background:gradeColor(pct)}}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'attendance' && (
            <div>
              {attendance.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <UserCheck size={36} className="mx-auto mb-2 text-gray-200"/>
                  <p>لا توجد سجلات حضور لهذا الطالب</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  {(() => {
                    const pres = attendance.filter((a:any)=>a.status==='present').length
                    const abs = attendance.filter((a:any)=>a.status==='absent').length
                    const late = attendance.filter((a:any)=>a.status==='late').length
                    const rate = Math.round(pres/attendance.length*100)
                    return (
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                          {l:'حاضر',v:pres,c:'#10b981',bg:'bg-emerald-50'},
                          {l:'غائب',v:abs,c:'#ef4444',bg:'bg-red-50'},
                          {l:'متأخر',v:late,c:'#f59e0b',bg:'bg-amber-50'},
                          {l:'نسبة الحضور',v:rate+'%',c:'#6366f1',bg:'bg-indigo-50'},
                        ].map(s=>(
                          <div key={s.l} className={`${s.bg} rounded-xl p-3 text-center`}>
                            <p className="text-xl font-black" style={{color:s.c}}>{s.v}</p>
                            <p className="text-[10px] text-gray-400">{s.l}</p>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {attendance.slice(0, 50).map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50">
                        <span className="text-sm text-gray-600">{new Date(a.date).toLocaleDateString('ar-OM', {weekday:'short',day:'numeric',month:'short'})}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${a.status==='present'?'bg-green-100 text-green-700':a.status==='absent'?'bg-red-100 text-red-700':a.status==='late'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}`}>
                          {a.status==='present'?'حاضر':a.status==='absent'?'غائب':a.status==='late'?'متأخر':'معذور'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Students() {
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form,    setForm]    = useState(emptyStudent)
  const [profile, setProfile] = useState<any>(null)
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentsApi.list().then(r => r.data)
  })
  const { data: busesData } = useQuery({
    queryKey: ['buses'],
    queryFn: () => busesApi.list().then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => studentsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); closeModal(); toast.success('تم إضافة الطالب بنجاح') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'حدث خطأ أثناء الإضافة')
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => studentsApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); closeModal(); toast.success('تم تعديل بيانات الطالب') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'حدث خطأ أثناء التعديل')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => studentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('تم حذف الطالب') },
    onError: () => toast.error('لم يتمكن النظام من الحذف')
  })

  const openAdd = () => { setEditing(null); setForm(emptyStudent); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      name: row.name || '', nameEn: row.name_en || '', studentNumber: row.student_number || '',
      gender: row.gender || 'M', dateOfBirth: row.date_of_birth?.split('T')[0] || '',
      nationality: row.nationality || 'عُماني', className: row.class_name || '',
      academicYear: row.academic_year || '2024-2025', status: row.status || 'active',
      parentName: row.parent_name || '', parentPhone: row.parent_phone || '',
      parentEmail: row.parent_email || '', parentRelation: row.parent_relation || 'أب',
      address: row.address || '', bloodType: row.blood_type || '',
      medicalNotes: row.medical_notes || '', busId: row.bus_id || '',
      photo: row.photo || '', notes: row.notes || ''
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('الاسم بالعربي مطلوب')
    const d = { ...form, busId: form.busId || null }
    if (editing) updateMut.mutate({ id: editing.id, ...d })
    else createMut.mutate(d)
  }

  const buses = busesData?.buses || []
  const busOptions = [{ value: '', label: 'لا حافلة' }, ...buses.map((b: any) => ({ value: b.id, label: `${b.bus_number} — ${b.route_name || ''}` }))]

  const allStudents = data?.students || []
  const classes = [...new Set(allStudents.map((s: any) => s.class_name).filter(Boolean))].sort()

  const students = allStudents.filter((s: any) => {
    const matchClass = !filterClass || s.class_name === filterClass
    const matchStatus = !filterStatus || s.status === filterStatus
    return matchClass && matchStatus
  })

  const activeCount   = allStudents.filter((s: any) => s.status === 'active').length
  const inactiveCount = allStudents.filter((s: any) => s.status !== 'active').length

  const columns = [
    {
      key: 'photo', label: '', width: '52px', exportable: false,
      render: (_: any, row: any) => (
        <button onClick={() => setProfile(row)} className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0 hover:ring-2 ring-blue-400 transition-all">
          {row.photo
            ? <img src={row.photo} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            : <GraduationCap size={16} />}
        </button>
      )
    },
    {
      key: 'name', label: 'اسم الطالب', sortable: true,
      render: (v: string, row: any) => (
        <button onClick={() => setProfile(row)} className="text-right hover:text-blue-600 transition-colors">
          <p className="font-bold text-gray-800 hover:text-blue-600">{v}</p>
          <p className="text-xs text-gray-400">{row.student_number}</p>
        </button>
      )
    },
    { key: 'class_name',  label: 'الفصل',  sortable: true },
    { key: 'academic_year', label: 'العام الدراسي', sortable: true },
    {
      key: 'gender', label: 'الجنس',
      render: (v: string) => <span className={v === 'M' ? 'badge-info' : 'badge-warning'}>{v === 'M' ? 'ذكر' : 'أنثى'}</span>
    },
    {
      key: 'status', label: 'الحالة', sortable: true,
      render: (v: string) => (
        <span className={v === 'active' ? 'badge-success' : v === 'inactive' ? 'badge-danger' : 'badge-warning'}>
          {v === 'active' ? 'نشط' : v === 'inactive' ? 'غير نشط' : 'محوّل'}
        </span>
      )
    },
    {
      key: 'parent_name', label: 'ولي الأمر', exportable: true,
      render: (v: string, row: any) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{v || '—'}</span>
          {row.parent_phone && (
            <a href={`tel:${row.parent_phone}`} className="text-green-500 hover:text-green-700 transition-colors" title={row.parent_phone}>
              <Phone size={13} />
            </a>
          )}
        </div>
      )
    },
    {
      key: 'bus_number', label: 'الحافلة', exportable: false,
      render: (v: string) => v
        ? <span className="flex items-center gap-1 text-blue-600 text-xs font-bold"><Bus size={12} />{v}</span>
        : <span className="text-gray-300 text-xs">—</span>
    },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">إدارة الطلاب</h1>
        <p className="text-sm text-gray-400 mt-1">إضافة وتعديل وحذف بيانات الطلاب — انقر على اسم الطالب لعرض بروفايله الكامل</p>
      </div>

      {/* Quick stats */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'إجمالي الطلاب', value: allStudents.length, color: '#6366f1' },
            { label: 'طلاب نشطون',    value: activeCount,      color: '#10b981' },
            { label: 'غير نشط/محوّل', value: inactiveCount,    color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="card !py-3 flex items-center gap-3">
              <div className="w-2 h-8 rounded-full" style={{ background: s.color }} />
              <div>
                <p className="text-xs text-gray-400 font-bold">{s.label}</p>
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        title={`قائمة الطلاب (${students.length}${allStudents.length !== students.length ? ` من ${allStudents.length}` : ''})`}
        data={students}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row => deleteMut.mutate(row.id)}
        deleteMessage={row => `هل تريد حذف الطالب "${row.name}" بشكل نهائي؟ سيتم حذف جميع سجلاته.`}
        searchKeys={['name', 'student_number', 'parent_name', 'class_name']}
        addLabel="إضافة طالب"
        loading={isLoading}
        emptyMessage="لا يوجد طلاب مسجلون بعد"
        exportFilename="قائمة_الطلاب"
        filters={
          <div className="flex gap-2 flex-wrap">
            <select className="input-field py-2 text-sm w-44" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              <option value="">كل الفصول</option>
              {classes.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input-field py-2 text-sm w-36" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="transferred">محوّل</option>
            </select>
          </div>
        }
      />

      {/* Student Profile Modal */}
      {profile && <StudentProfile student={profile} onClose={() => setProfile(null)} />}

      {/* Form Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الاسم بالعربي" required>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل" />
            </FormField>
            <FormField label="الاسم بالإنجليزي">
              <Input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} placeholder="Full Name" />
            </FormField>
            <FormField label="رقم الطالب">
              <Input value={form.studentNumber} onChange={e => setForm({ ...form, studentNumber: e.target.value })} placeholder="2024-001" />
            </FormField>
            <FormField label="الجنس">
              <Select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} options={GENDER_OPTIONS} />
            </FormField>
            <FormField label="تاريخ الميلاد">
              <Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            </FormField>
            <FormField label="الجنسية">
              <Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
            </FormField>
            <FormField label="الفصل الدراسي">
              <Input value={form.className} onChange={e => setForm({ ...form, className: e.target.value })} placeholder="الصف الخامس - أ" />
            </FormField>
            <FormField label="العام الدراسي">
              <Input value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} />
            </FormField>
            <FormField label="الحالة">
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
            </FormField>
            <FormField label="الحافلة المدرسية">
              <Select value={form.busId} onChange={e => setForm({ ...form, busId: e.target.value })} options={busOptions} />
            </FormField>
          </div>

          <hr className="border-gray-100" />
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <User size={14} /> بيانات ولي الأمر
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="اسم ولي الأمر">
              <Input value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} />
            </FormField>
            <FormField label="صلة القرابة">
              <Select value={form.parentRelation} onChange={e => setForm({ ...form, parentRelation: e.target.value })} options={RELATION_OPTIONS} />
            </FormField>
            <FormField label="رقم الهاتف">
              <Input value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value })} placeholder="+968 9X XXX XXXX" />
            </FormField>
            <FormField label="البريد الإلكتروني">
              <Input type="email" value={form.parentEmail} onChange={e => setForm({ ...form, parentEmail: e.target.value })} />
            </FormField>
          </div>

          <hr className="border-gray-100" />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="فصيلة الدم">
              <Select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })} options={[{ value: '', label: 'غير محدد' }, ...BLOOD_TYPES]} />
            </FormField>
            <FormField label="رابط الصورة">
              <Input value={form.photo} onChange={e => setForm({ ...form, photo: e.target.value })} placeholder="https://..." />
            </FormField>
          </div>
          <FormField label="ملاحظات طبية">
            <Textarea value={form.medicalNotes} onChange={e => setForm({ ...form, medicalNotes: e.target.value })} placeholder="حساسية، أمراض مزمنة، دواء..." />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3 justify-center" disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending)
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جارٍ الحفظ...</>
                : editing ? 'حفظ التعديلات' : 'إضافة الطالب'}
            </button>
            <button type="button" onClick={closeModal} className="btn-ghost flex-1 py-3 justify-center">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
