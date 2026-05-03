import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { BookOpen, Plus, Pencil, Trash2, Clock, MapPin, Calendar, Download, Filter } from 'lucide-react'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'
import { printTable } from '../../utils/printExport'

const api = (path: string, method = 'GET', data?: any) =>
  axios({ method, url: `/api${path}`, data, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

const SUBJECTS = ['الرياضيات','العلوم','اللغة العربية','اللغة الإنجليزية','التربية الإسلامية','التاريخ','الجغرافيا','التربية الفنية','التربية البدنية','الحاسب الآلي','الفيزياء','الكيمياء','الأحياء'].map(v => ({ value: v, label: v }))
const TERMS = ['الفصل الأول','الفصل الثاني','الفصل الثالث','كامل السنة'].map(v => ({ value: v, label: v }))
const EXAM_TYPES = [
  { value: 'written', label: 'تحريري' },
  { value: 'oral', label: 'شفهي' },
  { value: 'practical', label: 'عملي' },
  { value: 'final', label: 'نهائي' },
  { value: 'mid', label: 'منتصف الفصل' },
]
const YEARS = ['2024-2025','2023-2024','2025-2026'].map(v => ({ value: v, label: v }))

const emptyForm = { subjectName: '', className: '', examDate: '', startTime: '', endTime: '', room: '', examType: 'written', academicYear: '2024-2025', term: 'الفصل الأول', notes: '', maxScore: '100' }

const TYPE_COLORS: Record<string, string> = { written: 'badge-info', oral: 'badge-success', practical: 'badge-warning', final: 'badge-danger', mid: 'badge-info' }
const TYPE_LABELS: Record<string, string> = { written: 'تحريري', oral: 'شفهي', practical: 'عملي', final: 'نهائي', mid: 'منتصف الفصل' }

function groupByDate(exams: any[]) {
  const groups: Record<string, any[]> = {}
  exams.forEach(e => {
    const d = e.exam_date?.split('T')[0] || e.exam_date
    if (!groups[d]) groups[d] = []
    groups[d].push(e)
  })
  return groups
}

export default function ExamsAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [filterTerm, setFilterTerm] = useState('')
  const [filterYear, setFilterYear] = useState('2024-2025')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['exams', filterYear, filterTerm],
    queryFn: () => api(`/exams?academicYear=${filterYear}${filterTerm ? `&term=${filterTerm}` : ''}`).then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => api('/exams', 'POST', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); closeModal(); toast.success('تمت إضافة الامتحان') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api(`/exams/${id}`, 'PUT', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/exams/${id}`, 'DELETE'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exams'] }); toast.success('تم الحذف') }
  })

  const exams = data?.exams || []
  const grouped = groupByDate(exams)
  const dates = Object.keys(grouped).sort()

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (e: any) => {
    setEditing(e)
    setForm({ subjectName: e.subject_name, className: e.class_name || '', examDate: e.exam_date?.split('T')[0] || '', startTime: e.start_time || '', endTime: e.end_time || '', room: e.room || '', examType: e.exam_type || 'written', academicYear: e.academic_year || '2024-2025', term: e.term || 'الفصل الأول', notes: e.notes || '', maxScore: String(e.max_score || 100) })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm) }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.subjectName || !form.examDate) return toast.error('المادة والتاريخ مطلوبان')
    const payload = { ...form, maxScore: Number(form.maxScore) }
    if (editing) updateMut.mutate({ id: editing.id, ...payload })
    else createMut.mutate(payload)
  }

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handlePrint = () => {
    printTable(
      `جدول الامتحانات — ${filterYear}`,
      filterTerm || 'جميع الفصول',
      [
        { header: 'المادة', key: 'subject_name' },
        { header: 'الصف', key: 'class_name' },
        { header: 'التاريخ', key: 'exam_date_fmt' },
        { header: 'الوقت', key: 'time_range' },
        { header: 'القاعة', key: 'room' },
        { header: 'النوع', key: 'exam_type_label' },
        { header: 'الدرجة الكاملة', key: 'max_score' },
      ],
      exams.map((e: any) => ({
        ...e,
        exam_date_fmt: new Date(e.exam_date).toLocaleDateString('ar-OM'),
        time_range: e.start_time ? `${e.start_time} — ${e.end_time || ''}` : '—',
        exam_type_label: TYPE_LABELS[e.exam_type] || e.exam_type,
        room: e.room || '—',
        class_name: e.class_name || '—',
      }))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">جدول الامتحانات</h1>
          <p className="text-gray-500 text-sm mt-0.5">إدارة مواعيد الامتحانات وتوزيعها على الصفوف</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={14} /> طباعة الجدول
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> إضافة امتحان
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الامتحانات', value: exams.length, color: '#6366f1' },
          { label: 'تحريري', value: exams.filter((e: any) => e.exam_type === 'written').length, color: '#3b82f6' },
          { label: 'شفهي / عملي', value: exams.filter((e: any) => ['oral','practical'].includes(e.exam_type)).length, color: '#10b981' },
          { label: 'نهائي', value: exams.filter((e: any) => e.exam_type === 'final').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-400 font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-gray-400" />
        <Select value={filterYear} onChange={e => setFilterYear(e.target.value)} options={YEARS} />
        <div className="flex gap-2 flex-wrap">
          {[{ value: '', label: 'جميع الفصول' }, ...TERMS].map(t => (
            <button key={t.value} onClick={() => setFilterTerm(t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterTerm === t.value ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={filterTerm === t.value ? { background: 'var(--color-primary)' } : {}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exam Schedule by Date */}
      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}</div>
      ) : exams.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold text-lg">لا توجد امتحانات مجدولة</p>
          <p className="text-sm mt-1">أضف أول امتحان لهذه الفترة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dates.map(date => (
            <div key={date} className="card overflow-hidden p-0">
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100" style={{ background: 'var(--color-primary)10' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--color-primary)' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="font-black text-gray-800">
                    {new Date(date).toLocaleDateString('ar-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">{grouped[date].length} امتحان</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped[date].map((exam: any) => (
                  <div key={exam.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary)15', color: 'var(--color-primary)' }}>
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-800">{exam.subject_name}</span>
                        <span className={TYPE_COLORS[exam.exam_type] || 'badge-info'}>{TYPE_LABELS[exam.exam_type] || exam.exam_type}</span>
                        {exam.class_name && <span className="badge-info">{exam.class_name}</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        {exam.start_time && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={10} /> {exam.start_time}{exam.end_time ? ` — ${exam.end_time}` : ''}
                          </span>
                        )}
                        {exam.room && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin size={10} /> {exam.room}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">الدرجة: {exam.max_score}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(exam)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(exam)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل امتحان' : 'إضافة امتحان جديد'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="المادة الدراسية" required>
              <Select value={form.subjectName} onChange={set('subjectName')} options={SUBJECTS} required />
            </FormField>
            <FormField label="الصف / الفصل">
              <Input value={form.className} onChange={set('className')} placeholder="الصف الأول أ" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="تاريخ الامتحان" required>
              <Input type="date" value={form.examDate} onChange={set('examDate')} required />
            </FormField>
            <FormField label="نوع الامتحان">
              <Select value={form.examType} onChange={set('examType')} options={EXAM_TYPES} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="وقت البدء">
              <Input type="time" value={form.startTime} onChange={set('startTime')} />
            </FormField>
            <FormField label="وقت الانتهاء">
              <Input type="time" value={form.endTime} onChange={set('endTime')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="القاعة / الغرفة">
              <Input value={form.room} onChange={set('room')} placeholder="قاعة 101" />
            </FormField>
            <FormField label="الدرجة الكاملة">
              <Input type="number" value={form.maxScore} onChange={set('maxScore')} min="1" max="1000" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="الفصل الدراسي">
              <Select value={form.term} onChange={set('term')} options={TERMS} />
            </FormField>
            <FormField label="السنة الدراسية">
              <Select value={form.academicYear} onChange={set('academicYear')} options={YEARS} />
            </FormField>
          </div>
          <FormField label="ملاحظات">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="أي ملاحظات إضافية..." rows={2} />
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الامتحان'}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="حذف الامتحان" message={`هل أنت متأكد من حذف امتحان "${deleteTarget?.subject_name}"؟`}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
