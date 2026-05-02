import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feesApi, studentsApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { exportToCSV } from '../../components/ExportButton'

const FEE_TYPES = ['رسوم دراسية','رسوم نشاط','رسوم نقل','رسوم كتب','رسوم امتحانات','رسوم تسجيل','رسوم مختبر','أخرى'].map(v=>({value:v,label:v}))
const FEE_STATUS = [
  {value:'unpaid',label:'غير مدفوع'},
  {value:'paid',label:'مدفوع'},
  {value:'partial',label:'مدفوع جزئياً'},
  {value:'waived',label:'معفى'},
]
const PAYMENT_METHODS = ['نقداً','بطاقة بنكية','تحويل بنكي','شيك','أونلاين'].map(v=>({value:v,label:v}))
const TERMS = ['الفصل الأول','الفصل الثاني','الفصل الثالث','كامل السنة'].map(v=>({value:v,label:v}))

const emptyFee = {
  studentId:'', feeType:'رسوم دراسية', description:'', amount:'', paidAmount:'0',
  dueDate:'', paidDate:'', paymentMethod:'', status:'unpaid',
  academicYear:'2024-2025', term:'الفصل الأول', referenceNumber:'', notes:''
}

function statusBadge(s: string) {
  if (s==='paid') return <span className="badge-success">مدفوع</span>
  if (s==='partial') return <span className="badge-warning">جزئي</span>
  if (s==='waived') return <span className="badge-info">معفى</span>
  return <span className="badge-danger">غير مدفوع</span>
}

export default function FeesAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyFee)
  const [filterStatus, setFilterStatus] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['fees', filterStatus],
    queryFn: () => feesApi.list({ status: filterStatus || undefined }).then(r => r.data)
  })
  const { data: studentsData } = useQuery({
    queryKey: ['students-select'],
    queryFn: () => studentsApi.list().then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => feesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['fees']}); closeModal(); toast.success('تم إضافة الرسوم') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({id,...d}: any) => feesApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['fees']}); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => feesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['fees']}); toast.success('تم الحذف') }
  })

  const openAdd = () => { setEditing(null); setForm(emptyFee); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      studentId: row.student_id||'', feeType: row.fee_type||'رسوم دراسية', description: row.description||'',
      amount: row.amount||'', paidAmount: row.paid_amount||'0', dueDate: row.due_date?.split('T')[0]||'',
      paidDate: row.paid_date?.split('T')[0]||'', paymentMethod: row.payment_method||'',
      status: row.status||'unpaid', academicYear: row.academic_year||'2024-2025',
      term: row.term||'الفصل الأول', referenceNumber: row.reference_number||'', notes: row.notes||''
    })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentId || !form.amount) return toast.error('الطالب والمبلغ مطلوبان')
    if (editing) updateMut.mutate({id:editing.id,...form})
    else createMut.mutate(form)
  }

  const fees = data?.fees || []
  const stats = data?.stats || {}
  const studentOptions = [{value:'',label:'اختر الطالب...'}, ...(studentsData?.students||[]).map((s:any)=>({value:s.id, label:`${s.name} — ${s.class_name||''}`}))]

  const columns = [
    { key:'student_name', label:'الطالب', sortable:true, render:(v:string,row:any)=>(
      <div><p className="font-bold text-gray-800">{v||'—'}</p><p className="text-xs text-gray-400">{row.class_name}</p></div>
    )},
    { key:'fee_type', label:'نوع الرسوم', sortable:true, render:(v:string)=><span className="text-sm font-bold text-gray-700">{v}</span> },
    { key:'academic_year', label:'العام الدراسي', render:(v:string,row:any)=><span className="text-xs text-gray-500">{v} — {row.term}</span> },
    { key:'amount', label:'المبلغ الكلي', sortable:true, render:(v:any)=>(
      <span className="font-black text-gray-800">{parseFloat(v).toLocaleString()} OMR</span>
    )},
    { key:'paid_amount', label:'المدفوع', render:(v:any,row:any)=>(
      <div>
        <span className="font-bold text-emerald-600">{parseFloat(v||0).toLocaleString()}</span>
        {parseFloat(v||0) < parseFloat(row.amount) && (
          <p className="text-[10px] text-red-500">متبقي: {(parseFloat(row.amount)-parseFloat(v||0)).toLocaleString()}</p>
        )}
      </div>
    )},
    { key:'due_date', label:'تاريخ الاستحقاق', render:(v:string)=>{
      if (!v) return <span className="text-gray-300">—</span>
      const overdue = new Date(v) < new Date()
      return <span className={overdue ? 'text-red-500 font-bold text-xs' : 'text-xs text-gray-500'}>{new Date(v).toLocaleDateString('ar-OM')}</span>
    }},
    { key:'status', label:'الحالة', render:(v:string)=>statusBadge(v) },
    { key:'payment_method', label:'طريقة الدفع', render:(v:string)=>v?<span className="text-xs text-gray-500">{v}</span>:<span className="text-gray-300">—</span> },
  ]

  const exportFees = () => exportToCSV(fees, [
    {key:'student_name',label:'الطالب'},
    {key:'class_name',label:'الفصل'},
    {key:'fee_type',label:'نوع الرسوم'},
    {key:'amount',label:'المبلغ'},
    {key:'paid_amount',label:'المدفوع'},
    {key:'status',label:'الحالة'},
    {key:'due_date',label:'الاستحقاق'},
  ], 'الرسوم_الدراسية')

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">الرسوم الدراسية</h1>
        <p className="text-sm text-gray-400 mt-1">إدارة رسوم الطلاب ومتابعة المدفوعات</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:'إجمالي الرسوم', value:`${parseFloat(stats.total_amount||0).toLocaleString()} OMR`, color:'#6366f1', icon: DollarSign },
          { label:'المبالغ المحصّلة', value:`${parseFloat(stats.collected||0).toLocaleString()} OMR`, color:'#10b981', icon: CheckCircle },
          { label:'المبالغ المعلّقة', value:`${parseFloat(stats.pending||0).toLocaleString()} OMR`, color:'#f59e0b', icon: Clock },
          { label:'فواتير متأخرة', value:stats.overdue_count||0, color:'#ef4444', icon: AlertCircle },
        ].map(s=>(
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:s.color+'15'}}>
              <s.icon size={20} style={{color:s.color}}/>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-bold">{s.label}</p>
              <p className="text-lg font-black leading-tight" style={{color:s.color}}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Collection Progress */}
      {parseFloat(stats.total_amount||0) > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-gray-700 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-600"/> نسبة التحصيل</h3>
            <span className="text-xl font-black text-emerald-600">
              {Math.round(parseFloat(stats.collected||0)/parseFloat(stats.total_amount||1)*100)}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
              style={{width:`${Math.min(100,Math.round(parseFloat(stats.collected||0)/parseFloat(stats.total_amount||1)*100))}%`}}/>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400">
            <span>محصّل: {parseInt(stats.paid_count||0)} فاتورة</span>
            <span>جزئي: {parseInt(stats.partial_count||0)}</span>
            <span>متأخر: {parseInt(stats.overdue_count||0)}</span>
          </div>
        </div>
      )}

      <DataTable
        title={`سجل الرسوم (${fees.length})`}
        data={fees}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row=>deleteMut.mutate(row.id)}
        deleteMessage={row=>`حذف رسوم "${row.fee_type}" للطالب "${row.student_name}"؟`}
        searchKeys={['student_name','fee_type','reference_number']}
        addLabel="إضافة رسوم"
        loading={isLoading}
        emptyMessage="لا توجد رسوم مسجلة"
        exportFilename="الرسوم_الدراسية"
        filters={
          <div className="flex gap-2">
            <select className="input-field py-2 text-sm w-40" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              {FEE_STATUS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button onClick={exportFees} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50">
              <Download size={14} className="text-green-600"/> تصدير
            </button>
          </div>
        }
      />

      <Modal open={modal} onClose={closeModal} title={editing?'تعديل الرسوم':'إضافة رسوم جديدة'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="الطالب" required>
            <Select value={form.studentId} onChange={e=>setForm({...form,studentId:e.target.value})} options={studentOptions}/>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="نوع الرسوم" required>
              <Select value={form.feeType} onChange={e=>setForm({...form,feeType:e.target.value})} options={FEE_TYPES}/>
            </FormField>
            <FormField label="العام الدراسي">
              <Input value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})}/>
            </FormField>
            <FormField label="الفصل الدراسي">
              <Select value={form.term} onChange={e=>setForm({...form,term:e.target.value})} options={TERMS}/>
            </FormField>
            <FormField label="المبلغ الكلي (OMR)" required>
              <Input type="number" step="0.001" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.000"/>
            </FormField>
            <FormField label="المبلغ المدفوع (OMR)">
              <Input type="number" step="0.001" value={form.paidAmount} onChange={e=>setForm({...form,paidAmount:e.target.value})} placeholder="0.000"/>
            </FormField>
            <FormField label="الحالة">
              <Select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={FEE_STATUS}/>
            </FormField>
            <FormField label="تاريخ الاستحقاق">
              <Input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            </FormField>
            <FormField label="تاريخ الدفع">
              <Input type="date" value={form.paidDate} onChange={e=>setForm({...form,paidDate:e.target.value})}/>
            </FormField>
            <FormField label="طريقة الدفع">
              <Select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})} options={[{value:'',label:'—'},...PAYMENT_METHODS]}/>
            </FormField>
            <FormField label="رقم المرجع / الوصل">
              <Input value={form.referenceNumber} onChange={e=>setForm({...form,referenceNumber:e.target.value})} placeholder="INV-2024-001"/>
            </FormField>
          </div>
          <FormField label="البيان">
            <Input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="وصف اختياري"/>
          </FormField>
          <FormField label="ملاحظات">
            <Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          </FormField>

          {/* Live summary */}
          {form.amount && (
            <div className={`p-4 rounded-2xl ${form.status==='paid'?'bg-emerald-50':form.status==='partial'?'bg-amber-50':'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">ملخص الدفع</span>
                <span className="font-black text-lg" style={{color:form.status==='paid'?'#10b981':form.status==='partial'?'#f59e0b':'#ef4444'}}>
                  {form.status==='paid'?'مدفوع بالكامل':form.status==='partial'?`متبقي: ${(parseFloat(form.amount||'0')-parseFloat(form.paidAmount||'0')).toFixed(3)} OMR`:`غير مدفوع: ${parseFloat(form.amount||'0').toFixed(3)} OMR`}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={createMut.isPending||updateMut.isPending}>
              {(createMut.isPending||updateMut.isPending)?'جارٍ الحفظ...':editing?'حفظ التعديلات':'إضافة الرسوم'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
