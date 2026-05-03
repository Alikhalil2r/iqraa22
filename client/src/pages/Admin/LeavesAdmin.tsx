import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leavesApi, employeesApi } from '../../api/client'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import {
  Users, Plus, Calendar, CheckCircle, XCircle, Clock,
  AlertTriangle, ChevronLeft, Filter, Award, TrendingDown
} from 'lucide-react'
import toast from 'react-hot-toast'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string,{label:string;cls:string}> = {
    pending:   {label:'قيد المراجعة', cls:'bg-amber-100 text-amber-700'},
    approved:  {label:'موافق عليها',  cls:'bg-green-100 text-green-700'},
    rejected:  {label:'مرفوضة',       cls:'bg-red-100 text-red-700'},
    cancelled: {label:'ملغاة',         cls:'bg-gray-100 text-gray-500'},
  }
  const m = map[status] || {label:status, cls:'bg-gray-100 text-gray-600'}
  return <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${m.cls}`}>{m.label}</span>
}

const emptyForm = {
  employeeId:'', leaveTypeName:'إجازة سنوية', startDate:'', endDate:'', days:'1', reason:''
}

export default function LeavesAdmin() {
  const [modal, setModal] = useState(false)
  const [rejectModal, setRejectModal] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [rejectReason, setRejectReason] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmp, setFilterEmp] = useState('')
  const [cancelTarget, setCancelTarget] = useState<any>(null)
  const qc = useQueryClient()

  const { data: leavesData, isLoading } = useQuery({
    queryKey: ['leaves', filterStatus, filterEmp],
    queryFn: () => leavesApi.list({ status: filterStatus||undefined, employeeId: filterEmp||undefined }).then(r => r.data),
    staleTime: 30000
  })
  const { data: typesData } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leavesApi.types().then(r => r.data),
    staleTime: 300000
  })
  const { data: empData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => employeesApi.list().then(r => r.data),
    staleTime: 120000
  })

  const leaves   = leavesData?.leaves || []
  const stats    = leavesData?.stats  || {}
  const types    = typesData?.types   || []
  const employees= empData?.employees || []

  const createMut = useMutation({
    mutationFn: (d:any) => leavesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['leaves']}); closeModal(); toast.success('تم تقديم طلب الإجازة') },
    onError: () => toast.error('حدث خطأ')
  })
  const approveMut = useMutation({
    mutationFn: (id:string) => leavesApi.approve(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['leaves']}); toast.success('تمت الموافقة على الإجازة') },
    onError: () => toast.error('حدث خطأ')
  })
  const rejectMut = useMutation({
    mutationFn: ({id,reason}:{id:string;reason:string}) => leavesApi.reject(id, {rejectionReason:reason}),
    onSuccess: () => { qc.invalidateQueries({queryKey:['leaves']}); setRejectModal(null); toast.success('تم رفض الإجازة') },
    onError: () => toast.error('حدث خطأ')
  })
  const cancelMut = useMutation({
    mutationFn: (id:string) => leavesApi.cancel(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['leaves']}); setCancelTarget(null); toast.success('تم إلغاء الطلب') }
  })

  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm) }

  // Auto-calculate days
  const handleDates = (start: string, end: string) => {
    if (start && end) {
      const s = new Date(start), e = new Date(end)
      const diff = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1
      setForm(p => ({ ...p, startDate: start, endDate: end, days: String(Math.max(1, diff)) }))
    } else {
      setForm(p => ({ ...p, startDate: start || p.startDate, endDate: end || p.endDate }))
    }
  }

  const submit = () => {
    if (!form.employeeId || !form.startDate || !form.endDate)
      return toast.error('جميع الحقول المطلوبة يجب إدخالها')
    createMut.mutate({ ...form, days: parseInt(form.days) || 1 })
  }

  const TYPE_OPTS = types.length ? types.map((t:any)=>({value:t.name,label:t.name})) : [
    {value:'إجازة سنوية',label:'إجازة سنوية'},{value:'إجازة مرضية',label:'إجازة مرضية'},
    {value:'إجازة طارئة',label:'إجازة طارئة'}
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Calendar size={24} className="text-violet-600"/> إدارة الإجازات
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">طلبات وموافقات إجازات الموظفين</p>
        </div>
        <button onClick={()=>setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16}/> طلب إجازة جديدة
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'إجمالي الطلبات',   value:stats.total||0,                  color:'#6366f1', icon:Calendar },
          { label:'قيد المراجعة',      value:stats.pending||0,                color:'#f59e0b', icon:Clock },
          { label:'موافق عليها',       value:stats.approved||0,               color:'#10b981', icon:CheckCircle },
          { label:'إجمالي أيام موافق', value:`${stats.total_approved_days||0} يوم`, color:'#0ea5e9', icon:Award },
        ].map(k => (
          <div key={k.label} className="card flex items-start gap-3 !py-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:k.color+'18'}}>
              <k.icon size={20} style={{color:k.color}}/>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">{k.label}</p>
              <p className="text-2xl font-black" style={{color:k.color}}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Alert */}
      {(stats.pending||0) > 0 && (
        <div className="card bg-amber-50 border-r-4 border-amber-400 flex items-center gap-3">
          <Clock size={18} className="text-amber-500"/>
          <p className="font-bold text-amber-800">
            {stats.pending} طلب إجازة بانتظار المراجعة والموافقة
          </p>
          <button onClick={()=>setFilterStatus('pending')} className="mr-auto text-xs font-bold text-amber-600 hover:underline flex items-center gap-1">
            عرض الطلبات <ChevronLeft size={11}/>
          </button>
        </div>
      )}

      {/* Leave Type Cards */}
      {types.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {types.map((t:any) => (
            <div key={t.id} className="card !py-3 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center"
                style={{background: t.color+'18'}}>
                <Calendar size={14} style={{color:t.color}}/>
              </div>
              <p className="text-xs font-black text-gray-700 truncate">{t.name}</p>
              <p className="text-[10px] text-gray-400">{t.max_days_per_year} يوم/سنة</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${t.is_paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.is_paid ? 'مدفوعة' : 'غير مدفوعة'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="input w-44">
          <option value="">كل الطلبات</option>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">موافق عليها</option>
          <option value="rejected">مرفوضة</option>
          <option value="cancelled">ملغاة</option>
        </select>
        <select value={filterEmp} onChange={e=>setFilterEmp(e.target.value)} className="input w-52">
          <option value="">كل الموظفين</option>
          {employees.map((e:any)=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {(filterStatus||filterEmp) && (
          <button onClick={()=>{setFilterStatus('');setFilterEmp('')}} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <XCircle size={14}/> مسح الفلاتر
          </button>
        )}
      </div>

      {/* Leaves Table */}
      {isLoading ? <div className="h-40 flex items-center justify-center text-gray-400">جارٍ التحميل...</div> : (
        leaves.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
            <Calendar size={40} className="text-gray-200"/>
            <p className="font-bold">لا توجد طلبات إجازة</p>
            <button onClick={()=>setModal(true)} className="btn-primary text-sm">تقديم أول طلب</button>
          </div>
        ) : (
          <div className="card overflow-hidden !p-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['الموظف','نوع الإجازة','من','إلى','الأيام','السبب','الحالة','إجراءات'].map(h=>(
                    <th key={h} className="text-right text-[11px] font-black text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leaves.map((l:any) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-gray-800">{l.employee_name}</p>
                      <p className="text-[10px] text-gray-400">{l.position} — {l.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{background:(l.leave_color||'#6366f1')+'18',color:l.leave_color||'#6366f1'}}>
                        {l.leave_type_display || l.leave_type_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {l.start_date ? new Date(l.start_date).toLocaleDateString('ar-OM') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {l.end_date ? new Date(l.end_date).toLocaleDateString('ar-OM') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-black text-gray-800">{l.days}</span>
                      <span className="text-[10px] text-gray-400 mr-1">يوم</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-40">
                      <p className="truncate">{l.reason || '—'}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={l.status}/></td>
                    <td className="px-4 py-3">
                      {l.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button onClick={()=>approveMut.mutate(l.id)} disabled={approveMut.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100">
                            <CheckCircle size={11}/>قبول
                          </button>
                          <button onClick={()=>{setRejectModal(l);setRejectReason('')}}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">
                            <XCircle size={11}/>رفض
                          </button>
                        </div>
                      )}
                      {(l.status==='pending'||l.status==='approved') && (
                        <button onClick={()=>setCancelTarget(l)}
                          className="mt-1 text-[10px] text-gray-400 hover:text-gray-600 font-bold">
                          إلغاء
                        </button>
                      )}
                      {l.status==='rejected' && l.rejection_reason && (
                        <p className="text-[10px] text-red-500">{l.rejection_reason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add Modal */}
      <Modal open={modal} onClose={closeModal} title="طلب إجازة جديدة">
        <div className="space-y-3">
          <FormField label="الموظف *">
            <select value={form.employeeId} onChange={e=>setForm(p=>({...p,employeeId:e.target.value}))} className="input w-full">
              <option value="">اختر موظفاً...</option>
              {employees.map((e:any)=><option key={e.id} value={e.id}>{e.name} — {e.position}</option>)}
            </select>
          </FormField>
          <FormField label="نوع الإجازة *">
            <Select value={form.leaveTypeName} onChange={v=>setForm(p=>({...p,leaveTypeName:v}))} options={TYPE_OPTS}/>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="من تاريخ *">
              <input type="date" value={form.startDate} onChange={e=>handleDates(e.target.value,form.endDate)} className="input w-full"/>
            </FormField>
            <FormField label="إلى تاريخ *">
              <input type="date" value={form.endDate} onChange={e=>handleDates(form.startDate,e.target.value)} className="input w-full" min={form.startDate}/>
            </FormField>
          </div>
          <FormField label="عدد الأيام">
            <Input type="number" value={form.days} onChange={v=>setForm(p=>({...p,days:v}))} min="1"/>
          </FormField>
          <FormField label="السبب"><Textarea value={form.reason} onChange={v=>setForm(p=>({...p,reason:v}))}/></FormField>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeModal} className="btn-secondary">إلغاء</button>
            <button onClick={submit} disabled={createMut.isPending} className="btn-primary">تقديم الطلب</button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      {rejectModal && (
        <Modal open={!!rejectModal} onClose={()=>setRejectModal(null)} title="رفض طلب الإجازة">
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <p className="font-black text-red-800">{rejectModal.employee_name}</p>
              <p className="text-sm text-red-600">{rejectModal.leave_type_name} — {rejectModal.days} يوم</p>
            </div>
            <FormField label="سبب الرفض *">
              <Textarea value={rejectReason} onChange={setRejectReason} placeholder="أدخل سبب الرفض..."/>
            </FormField>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setRejectModal(null)} className="btn-secondary">إلغاء</button>
              <button onClick={()=>rejectMut.mutate({id:rejectModal.id,reason:rejectReason})}
                disabled={rejectMut.isPending||!rejectReason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 disabled:opacity-50">
                تأكيد الرفض
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!cancelTarget} title="إلغاء طلب الإجازة"
        message={`هل تريد إلغاء طلب إجازة ${cancelTarget?.employee_name}؟`}
        onConfirm={()=>cancelMut.mutate(cancelTarget.id)}
        onCancel={()=>setCancelTarget(null)}
        isLoading={cancelMut.isPending}
      />
    </div>
  )
}
