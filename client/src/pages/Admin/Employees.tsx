import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import {
  Users, Phone, DollarSign, Mail, MapPin, CreditCard, Award,
  BookOpen, User, Briefcase, FileText, Calendar, TrendingUp, X
} from 'lucide-react'
import toast from 'react-hot-toast'

const EMP_TYPES   = [{ value: 'full-time', label: 'دوام كامل' }, { value: 'part-time', label: 'دوام جزئي' }, { value: 'contract', label: 'عقد مؤقت' }]
const EMP_STATUS  = [{ value: 'active', label: 'نشط' }, { value: 'inactive', label: 'غير نشط' }, { value: 'on-leave', label: 'إجازة' }]
const GENDER_OPTS = [{ value: 'M', label: 'ذكر' }, { value: 'F', label: 'أنثى' }]
const CURR_OPTS   = [{ value: 'OMR', label: 'ر.ع.' }, { value: 'USD', label: 'دولار' }, { value: 'EUR', label: 'يورو' }]

const emptyEmp = {
  name: '', nameEn: '', employeeNumber: '', gender: 'M', dateOfBirth: '', nationality: 'عُماني',
  position: '', department: '', employeeType: 'full-time', contractType: '', joinDate: '', endDate: '',
  salary: '', salaryCurrency: 'OMR', allowances: '', deductions: '',
  phone: '', email: '', address: '',
  qualification: '', specialization: '', experience: '',
  status: 'active', photo: '', civilId: '', passportNumber: '', notes: ''
}

type FormTab = 'personal' | 'professional' | 'financial' | 'documents'

const FORM_TABS: { id: FormTab; label: string; icon: React.ReactNode }[] = [
  { id: 'personal',     label: 'الشخصية',    icon: <User size={13} /> },
  { id: 'professional', label: 'الوظيفية',   icon: <Briefcase size={13} /> },
  { id: 'financial',    label: 'المالية',    icon: <DollarSign size={13} /> },
  { id: 'documents',    label: 'المستندات',  icon: <FileText size={13} /> },
]

export default function Employees() {
  const [modal,    setModal]    = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [editing,  setEditing]  = useState<any>(null)
  const [form,     setForm]     = useState(emptyEmp)
  const [formTab,  setFormTab]  = useState<FormTab>('personal')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeesApi.list().then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => employeesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); closeModal(); toast.success('✅ تم إضافة الموظف') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => employeesApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); closeModal(); toast.success('✅ تم تعديل بيانات الموظف') },
    onError: (e: any) => toast.error(e.response?.data?.error || 'حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('تم الحذف') },
    onError: () => toast.error('حدث خطأ في الحذف')
  })

  const f = (k: keyof typeof emptyEmp) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const openAdd = () => { setEditing(null); setViewMode(false); setForm(emptyEmp); setFormTab('personal'); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row); setViewMode(false); setFormTab('personal')
    setForm({
      name: row.name || '', nameEn: row.name_en || '', employeeNumber: row.employee_number || '',
      gender: row.gender || 'M', dateOfBirth: row.date_of_birth?.split('T')[0] || '', nationality: row.nationality || 'عُماني',
      position: row.position || '', department: row.department || '', employeeType: row.employee_type || 'full-time',
      contractType: row.contract_type || '', joinDate: row.join_date?.split('T')[0] || '', endDate: row.end_date?.split('T')[0] || '',
      salary: row.salary || '', salaryCurrency: row.salary_currency || 'OMR',
      allowances: row.allowances || '', deductions: row.deductions || '',
      phone: row.phone || '', email: row.email || '', address: row.address || '',
      qualification: row.qualification || '', specialization: row.specialization || '', experience: row.experience || '',
      status: row.status || 'active', photo: row.photo || '', civilId: row.civil_id || '',
      passportNumber: row.passport_number || '', notes: row.notes || ''
    })
    setModal(true)
  }
  const openView = (row: any) => { openEdit(row); setViewMode(true) }
  const closeModal = () => { setModal(false); setEditing(null); setViewMode(false) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return toast.error('الاسم مطلوب')
    if (editing) updateMut.mutate({ id: editing.id, ...form })
    else createMut.mutate(form)
  }

  const emps = data?.employees || []
  const activeCount   = emps.filter((e: any) => e.status === 'active').length
  const onLeaveCount  = emps.filter((e: any) => e.status === 'on-leave').length
  const totalSalaries = emps.reduce((s: number, e: any) => s + (parseFloat(e.salary) || 0), 0)

  const columns = [
    {
      key: 'photo', label: '', width: '48px',
      render: (_: any, row: any) => (
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center text-indigo-400 flex-shrink-0">
          {row.photo
            ? <img src={row.photo} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            : <Users size={16} />}
        </div>
      )
    },
    {
      key: 'name', label: 'الموظف', sortable: true,
      render: (v: string, row: any) => (
        <div>
          <p className="font-bold text-gray-800">{v}</p>
          <p className="text-[10px] text-gray-400">#{row.employee_number || '—'}</p>
        </div>
      )
    },
    { key: 'position',   label: 'المنصب',      sortable: true },
    { key: 'department', label: 'القسم',        sortable: true },
    {
      key: 'employee_type', label: 'نوع العقد',
      render: (v: string) => <span className="badge-info">{EMP_TYPES.find(t => t.value === v)?.label || v}</span>
    },
    {
      key: 'salary', label: 'الراتب',
      render: (v: any, row: any) => v
        ? <span className="flex items-center gap-1 font-bold text-emerald-600 text-sm"><DollarSign size={12} />{parseFloat(v).toLocaleString()} {row.salary_currency}</span>
        : <span className="text-gray-300">—</span>
    },
    {
      key: 'status', label: 'الحالة',
      render: (v: string) => (
        <span className={v === 'active' ? 'badge-success' : v === 'on-leave' ? 'badge-warning' : 'badge-danger'}>
          {v === 'active' ? 'نشط' : v === 'on-leave' ? 'إجازة' : 'غير نشط'}
        </span>
      )
    },
    {
      key: 'phone', label: 'الهاتف',
      render: (v: string) => v
        ? <a href={`tel:${v}`} className="flex items-center gap-1 text-green-500 text-xs hover:underline"><Phone size={11} />{v}</a>
        : <span className="text-gray-300">—</span>
    },
    {
      key: 'join_date', label: 'تاريخ الانضمام',
      render: (v: string) => v ? <span className="text-xs text-gray-400">{new Date(v).toLocaleDateString('ar-OM')}</span> : <span className="text-gray-300">—</span>
    },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">إدارة الموظفين</h1>
        <p className="text-sm text-gray-400 mt-1">سجل شامل للكوادر البشرية والموارد</p>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'إجمالي الموظفين',  value: data?.total || 0,                   color: '#6366f1', icon: <Users size={18} /> },
            { label: 'نشطون',             value: activeCount,                         color: '#10b981', icon: <TrendingUp size={18} /> },
            { label: 'في إجازة',          value: onLeaveCount,                        color: '#f59e0b', icon: <Calendar size={18} /> },
            { label: 'إجمالي الرواتب',   value: totalSalaries.toLocaleString() + ' OMR', color: '#0ea5e9', icon: <DollarSign size={18} /> },
          ].map(card => (
            <div key={card.label} className="card flex items-center gap-3 !py-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.color + '18', color: card.color }}>{card.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-gray-400">{card.label}</p>
                <p className="text-lg font-black" style={{ color: card.color }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        title={`الموظفون (${data?.total || 0})`}
        data={emps}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row => deleteMut.mutate(row.id)}
        deleteMessage={row => `حذف الموظف "${row.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        searchKeys={['name', 'employee_number', 'position', 'department', 'phone']}
        addLabel="إضافة موظف"
        loading={isLoading}
        emptyMessage="لا يوجد موظفون مسجلون"
        exportFilename="قائمة_الموظفين"
      />

      {/* Modal */}
      <Modal open={modal} onClose={closeModal}
        title={viewMode ? `ملف الموظف: ${editing?.name}` : editing ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
        size="xl">

        {/* Employee header (view mode) */}
        {viewMode && editing && (
          <div className="flex items-center gap-4 p-4 bg-gradient-to-l from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 mb-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-100 flex items-center justify-center">
              {editing.photo
                ? <img src={editing.photo} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                : <span className="text-2xl font-black text-indigo-400">{editing.name?.[0]}</span>}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-800 text-lg">{editing.name}</h3>
              <p className="text-sm text-indigo-600 font-bold">{editing.position}</p>
              <p className="text-xs text-gray-400">{editing.department}</p>
            </div>
            <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${editing.status === 'active' ? 'bg-green-100 text-green-700' : editing.status === 'on-leave' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {editing.status === 'active' ? '● نشط' : editing.status === 'on-leave' ? '● إجازة' : '● غير نشط'}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          {FORM_TABS.map(t => (
            <button key={t.id} onClick={() => setFormTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${formTab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Tab */}
          {formTab === 'personal' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="الاسم بالعربي" required>
                <Input value={form.name} onChange={f('name')} readOnly={viewMode} />
              </FormField>
              <FormField label="الاسم بالإنجليزي">
                <Input value={form.nameEn} onChange={f('nameEn')} readOnly={viewMode} />
              </FormField>
              <FormField label="الجنس">
                <Select value={form.gender} onChange={f('gender')} options={GENDER_OPTS} disabled={viewMode} />
              </FormField>
              <FormField label="تاريخ الميلاد">
                <Input type="date" value={form.dateOfBirth} onChange={f('dateOfBirth')} readOnly={viewMode} />
              </FormField>
              <FormField label="الجنسية">
                <Input value={form.nationality} onChange={f('nationality')} readOnly={viewMode} />
              </FormField>
              <FormField label="الهاتف">
                <Input type="tel" value={form.phone} onChange={f('phone')} readOnly={viewMode} />
              </FormField>
              <FormField label="البريد الإلكتروني" className="col-span-2">
                <Input type="email" value={form.email} onChange={f('email')} readOnly={viewMode} />
              </FormField>
              <FormField label="رابط الصورة الشخصية" className="col-span-2">
                <Input type="url" value={form.photo} onChange={f('photo')} readOnly={viewMode} placeholder="https://..." />
                {form.photo && <img src={form.photo} className="mt-2 w-16 h-16 rounded-xl object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
              </FormField>
              <FormField label="العنوان" className="col-span-2">
                <Textarea value={form.address} onChange={f('address')} readOnly={viewMode} style={{ minHeight: '70px' }} />
              </FormField>
            </div>
          )}

          {/* Professional Tab */}
          {formTab === 'professional' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="رقم الموظف">
                <Input value={form.employeeNumber} onChange={f('employeeNumber')} readOnly={viewMode} />
              </FormField>
              <FormField label="المنصب / المسمى الوظيفي" required>
                <Input value={form.position} onChange={f('position')} readOnly={viewMode} />
              </FormField>
              <FormField label="القسم / الإدارة" required>
                <Input value={form.department} onChange={f('department')} readOnly={viewMode} />
              </FormField>
              <FormField label="نوع العقد">
                <Select value={form.employeeType} onChange={f('employeeType')} options={EMP_TYPES} disabled={viewMode} />
              </FormField>
              <FormField label="تاريخ الانضمام">
                <Input type="date" value={form.joinDate} onChange={f('joinDate')} readOnly={viewMode} />
              </FormField>
              <FormField label="تاريخ انتهاء العقد">
                <Input type="date" value={form.endDate} onChange={f('endDate')} readOnly={viewMode} />
              </FormField>
              <FormField label="الحالة الوظيفية">
                <Select value={form.status} onChange={f('status')} options={EMP_STATUS} disabled={viewMode} />
              </FormField>
              <FormField label="سنوات الخبرة">
                <Input type="number" value={form.experience} onChange={f('experience')} readOnly={viewMode} />
              </FormField>
              <FormField label="المؤهل العلمي">
                <Input value={form.qualification} onChange={f('qualification')} readOnly={viewMode} placeholder="بكالوريوس، ماجستير..." />
              </FormField>
              <FormField label="التخصص">
                <Input value={form.specialization} onChange={f('specialization')} readOnly={viewMode} placeholder="رياضيات، علوم..." />
              </FormField>
              <FormField label="ملاحظات" className="col-span-2">
                <Textarea value={form.notes} onChange={f('notes')} readOnly={viewMode} style={{ minHeight: '80px' }} />
              </FormField>
            </div>
          )}

          {/* Financial Tab */}
          {formTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="الراتب الأساسي" required>
                  <Input type="number" value={form.salary} onChange={f('salary')} readOnly={viewMode} placeholder="0.000" />
                </FormField>
                <FormField label="العملة">
                  <Select value={form.salaryCurrency} onChange={f('salaryCurrency')} options={CURR_OPTS} disabled={viewMode} />
                </FormField>
                <FormField label="البدلات">
                  <Input type="number" value={form.allowances} onChange={f('allowances')} readOnly={viewMode} placeholder="0.000" />
                </FormField>
                <FormField label="الاستقطاعات">
                  <Input type="number" value={form.deductions} onChange={f('deductions')} readOnly={viewMode} placeholder="0.000" />
                </FormField>
              </div>
              {(form.salary || form.allowances || form.deductions) && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 mb-3">ملخص الراتب</p>
                  <div className="space-y-2">
                    {[
                      { label: 'الراتب الأساسي', value: parseFloat(form.salary) || 0, color: 'text-gray-700' },
                      { label: 'البدلات',         value: parseFloat(form.allowances) || 0, color: 'text-emerald-600' },
                      { label: 'الاستقطاعات',     value: -(parseFloat(form.deductions) || 0), color: 'text-red-500' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{r.label}</span>
                        <span className={`font-bold ${r.color}`}>{r.value >= 0 ? '' : '- '}{Math.abs(r.value).toLocaleString()} {form.salaryCurrency}</span>
                      </div>
                    ))}
                    <div className="border-t border-emerald-200 pt-2 flex justify-between">
                      <span className="font-black text-gray-700 text-sm">صافي الراتب</span>
                      <span className="font-black text-emerald-700 text-base">
                        {((parseFloat(form.salary) || 0) + (parseFloat(form.allowances) || 0) - (parseFloat(form.deductions) || 0)).toLocaleString()} {form.salaryCurrency}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {formTab === 'documents' && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="رقم الهوية الوطنية">
                <Input value={form.civilId} onChange={f('civilId')} readOnly={viewMode} />
              </FormField>
              <FormField label="رقم جواز السفر">
                <Input value={form.passportNumber} onChange={f('passportNumber')} readOnly={viewMode} />
              </FormField>
              <FormField label="نوع العقد التفصيلي" className="col-span-2">
                <Input value={form.contractType} onChange={f('contractType')} readOnly={viewMode} placeholder="مدة العقد، شروط التجديد..." />
              </FormField>
              <div className="col-span-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-600 font-bold">لرفع الوثائق والملفات: يمكن استخدام خاصية رابط الصورة في تبويب الشخصية لإضافة روابط Google Drive أو Dropbox للوثائق الرسمية.</p>
              </div>
            </div>
          )}

          {!viewMode && (
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="submit" className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 font-black"
                disabled={createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editing ? 'حفظ التعديلات' : 'إضافة الموظف'}
              </button>
              <button type="button" onClick={() => viewMode ? setViewMode(false) : closeModal()}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          )}
          {viewMode && (
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setViewMode(false)}
                className="btn-primary flex-1 py-3 font-black">تعديل البيانات</button>
              <button type="button" onClick={closeModal}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إغلاق</button>
            </div>
          )}
        </form>
      </Modal>
    </>
  )
}
