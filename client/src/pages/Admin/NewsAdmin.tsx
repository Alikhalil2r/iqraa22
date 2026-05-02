import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { newsApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { Newspaper, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['أكاديمي','إنجازات','فعاليات','رياضة','ثقافي','علوم','أخرى'].map(v=>({value:v,label:v}))
const emptyNews = { title:'', summary:'', content:'', imageUrl:'', category:'أكاديمي', isPublished:true, isFeatured:false, publishDate:'' }

export default function NewsAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyNews)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey:['news-admin'], queryFn:()=>newsApi.list().then(r=>r.data) })
  const createMut = useMutation({ mutationFn:(d:any)=>newsApi.create(d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['news-admin']}); closeModal(); toast.success('تم إضافة الخبر') } })
  const updateMut = useMutation({ mutationFn:({id,...d}:any)=>newsApi.update(id,d),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['news-admin']}); closeModal(); toast.success('تم التعديل') } })
  const deleteMut = useMutation({ mutationFn:(id:string)=>newsApi.delete(id),
    onSuccess:()=>{ qc.invalidateQueries({queryKey:['news-admin']}); toast.success('تم الحذف') } })

  const openAdd = () => { setEditing(null); setForm(emptyNews); setModal(true) }
  const openEdit = (row:any) => {
    setEditing(row)
    setForm({ title:row.title, summary:row.summary||'', content:row.content||'', imageUrl:row.image_url||'',
      category:row.category||'أكاديمي', isPublished:row.is_published, isFeatured:row.is_featured,
      publishDate:row.publish_date?.split('T')[0]||'' })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }
  const handleSubmit = (e:React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return toast.error('العنوان مطلوب')
    if (editing) updateMut.mutate({id:editing.id,...form})
    else createMut.mutate(form)
  }

  const columns = [
    { key:'image_url', label:'', width:'60px', render:(v:string)=> v ? <img src={v} className="w-12 h-10 object-cover rounded-xl"/> : <div className="w-12 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><Newspaper size={16} className="text-gray-400"/></div> },
    { key:'title', label:'العنوان', sortable:true, render:(v:string,row:any)=>(
      <div><p className="font-bold text-gray-800">{v}</p><p className="text-xs text-gray-400">{row.category}</p></div>
    )},
    { key:'is_published', label:'الحالة', render:(v:boolean)=>v?<span className="badge-success flex items-center gap-1 w-fit"><Eye size={11}/>منشور</span>:<span className="badge-gray flex items-center gap-1 w-fit"><EyeOff size={11}/>مسودة</span> },
    { key:'is_featured', label:'مميز', render:(v:boolean)=>v?<span className="badge-warning">⭐ مميز</span>:<span className="text-gray-300 text-xs">—</span> },
    { key:'publish_date', label:'التاريخ', render:(v:string)=>new Date(v).toLocaleDateString('ar-OM') },
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">الأخبار والفعاليات</h1>
        <p className="text-sm text-gray-400 mt-1">إدارة محتوى الأخبار الظاهر في الموقع العام</p>
      </div>
      <DataTable title={`الأخبار (${data?.news?.length||0})`} data={data?.news||[]} columns={columns}
        onAdd={openAdd} onEdit={openEdit} onDelete={row=>{if(confirm('حذف هذا الخبر؟'))deleteMut.mutate(row.id)}}
        searchKeys={['title','category']} addLabel="إضافة خبر" loading={isLoading}/>

      <Modal open={modal} onClose={closeModal} title={editing?'تعديل الخبر':'إضافة خبر جديد'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="عنوان الخبر" required><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="التصنيف"><Select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} options={CATEGORIES}/></FormField>
            <FormField label="تاريخ النشر"><Input type="date" value={form.publishDate} onChange={e=>setForm({...form,publishDate:e.target.value})}/></FormField>
          </div>
          <FormField label="رابط الصورة"><Input value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} placeholder="https://..."/>
            {form.imageUrl && <img src={form.imageUrl} className="mt-2 h-28 w-full object-cover rounded-xl" onError={e=>(e.currentTarget.style.display='none')}/>}
          </FormField>
          <FormField label="الملخص"><Textarea value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} style={{minHeight:'80px'}}/></FormField>
          <FormField label="المحتوى الكامل"><Textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} style={{minHeight:'140px'}}/></FormField>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e=>setForm({...form,isPublished:e.target.checked})} className="w-4 h-4 rounded"/>
              <span className="text-sm font-bold text-gray-700">منشور</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})} className="w-4 h-4 rounded"/>
              <span className="text-sm font-bold text-gray-700">⭐ مميز في الصفحة الرئيسية</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3">{editing?'حفظ التعديلات':'نشر الخبر'}</button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
