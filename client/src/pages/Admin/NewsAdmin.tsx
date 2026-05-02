import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { newsApi } from '../../api/client'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import { Newspaper, Eye, EyeOff, Star, Plus, Image, Calendar, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const CATEGORIES = ['أكاديمي','إنجازات','فعاليات','رياضة','ثقافي','علوم','مناسبات','رحلات','أخرى'].map(v=>({value:v,label:v}))
const CAT_COLORS: Record<string,string> = {
  'أكاديمي':'#3b82f6','إنجازات':'#10b981','فعاليات':'#8b5cf6','رياضة':'#f59e0b',
  'ثقافي':'#0ea5e9','علوم':'#14b8a6','مناسبات':'#ec4899','رحلات':'#f97316','أخرى':'#6b7280'
}
const emptyNews = {
  title: '', summary: '', content: '', imageUrl: '',
  category: 'أكاديمي', isPublished: true, isFeatured: false, publishDate: ''
}

export default function NewsAdmin() {
  const [modal,        setModal]        = useState(false)
  const [editing,      setEditing]      = useState<any>(null)
  const [form,         setForm]         = useState(emptyNews)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['news-admin'],
    queryFn: () => newsApi.list().then(r => r.data)
  })
  const createMut = useMutation({
    mutationFn: (d: any) => newsApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['news-admin'] }); closeModal(); toast.success('✅ تم نشر الخبر') }
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => newsApi.update(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['news-admin'] }); closeModal(); toast.success('✅ تم تعديل الخبر') }
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['news-admin'] }); toast.success('تم الحذف') }
  })

  const openAdd  = () => { setEditing(null); setForm(emptyNews); setModal(true) }
  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ title: row.title, summary: row.summary || '', content: row.content || '',
      imageUrl: row.image_url || '', category: row.category || 'أكاديمي',
      isPublished: row.is_published, isFeatured: row.is_featured,
      publishDate: row.publish_date?.split('T')[0] || '' })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null) }

  const news = data?.news || []
  const publishedCount = news.filter((n: any) => n.is_published).length
  const featuredCount  = news.filter((n: any) => n.is_featured).length
  const draftCount     = news.filter((n: any) => !n.is_published).length

  const columns = [
    {
      key: 'image_url', label: '', width: '64px',
      render: (v: string) => v
        ? <img src={v} className="w-14 h-10 object-cover rounded-xl border border-gray-100" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        : <div className="w-14 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center"><Newspaper size={16} className="text-gray-400" /></div>
    },
    {
      key: 'title', label: 'العنوان', sortable: true,
      render: (v: string, row: any) => (
        <div className="max-w-xs">
          <p className="font-bold text-gray-800 truncate">{v}</p>
          {row.summary && <p className="text-[10px] text-gray-400 truncate">{row.summary}</p>}
        </div>
      )
    },
    {
      key: 'category', label: 'الفئة',
      render: (v: string) => (
        <span className="text-[10px] font-black px-2 py-1 rounded-lg text-white" style={{ background: CAT_COLORS[v] || '#6b7280' }}>{v}</span>
      )
    },
    {
      key: 'is_published', label: 'الحالة',
      render: (v: boolean) => v
        ? <span className="badge-success flex items-center gap-1 w-fit text-[11px]"><Eye size={10} /> منشور</span>
        : <span className="badge-gray flex items-center gap-1 w-fit text-[11px]"><EyeOff size={10} /> مسودة</span>
    },
    {
      key: 'is_featured', label: 'مميز',
      render: (v: boolean) => v ? <Star size={14} className="text-amber-400 fill-amber-400" /> : <span className="text-gray-200">—</span>
    },
    {
      key: 'publish_date', label: 'تاريخ النشر', sortable: true,
      render: (v: string) => v ? <span className="text-xs text-gray-400">{new Date(v).toLocaleDateString('ar-OM')}</span> : <span className="text-gray-300">—</span>
    },
  ]

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-black text-gray-800">الأخبار والمنشورات</h1>
        <p className="text-sm text-gray-400 mt-1">إدارة محتوى الأخبار الظاهر في الموقع العام</p>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { l: 'إجمالي الأخبار',  v: news.length,      c: '#6366f1', icon: <Newspaper size={15} /> },
            { l: 'منشورة',           v: publishedCount,   c: '#10b981', icon: <Eye size={15} /> },
            { l: 'مسودة',            v: draftCount,       c: '#f59e0b', icon: <EyeOff size={15} /> },
            { l: 'مميزة',            v: featuredCount,    c: '#f59e0b', icon: <Star size={15} /> },
          ].map(s => (
            <div key={s.l} className="card !py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.c + '18', color: s.c }}>{s.icon}</div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold">{s.l}</p>
                <p className="text-lg font-black" style={{ color: s.c }}>{s.v}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        title={`الأخبار (${news.length})`}
        data={news}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={row => setDeleteTarget(row)}
        searchKeys={['title', 'summary', 'category']}
        addLabel="إضافة خبر"
        loading={isLoading}
        emptyMessage="لا توجد أخبار منشورة"
        exportFilename="الأخبار"
      />

      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل الخبر' : 'إضافة خبر جديد'} size="xl">
        <form onSubmit={e => {
          e.preventDefault()
          if (!form.title) return toast.error('العنوان مطلوب')
          if (editing) updateMut.mutate({ id: editing.id, ...form })
          else createMut.mutate(form)
        }} className="space-y-4">

          {/* Image preview */}
          {form.imageUrl && (
            <div className="relative h-40 rounded-2xl overflow-hidden">
              <img src={form.imageUrl} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 right-3 text-white font-bold text-sm">{form.title || 'معاينة الصورة'}</p>
            </div>
          )}

          <FormField label="عنوان الخبر" required>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="عنوان الخبر..." />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="الفئة">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} options={CATEGORIES} />
            </FormField>
            <FormField label="تاريخ النشر">
              <Input type="date" value={form.publishDate} onChange={e => setForm({ ...form, publishDate: e.target.value })} />
            </FormField>
          </div>

          <FormField label="رابط الصورة">
            <div className="relative">
              <Input type="url" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://images.unsplash.com/..." />
              <Image size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </FormField>

          <FormField label="ملخص الخبر">
            <Textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="ملخص مختصر يظهر في قائمة الأخبار..." style={{ minHeight: '70px' }} />
          </FormField>

          <FormField label="محتوى الخبر الكامل">
            <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="النص الكامل للخبر..." style={{ minHeight: '120px' }} />
          </FormField>

          <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><Eye size={13} /> نشر فوري</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><Star size={13} className="text-amber-400" /> خبر مميز</span>
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1 py-3 font-black"
              disabled={createMut.isPending || updateMut.isPending}>
              {editing ? 'حفظ التعديلات' : 'نشر الخبر'}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">إلغاء</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف الخبر"
        message={deleteTarget ? `هل تريد حذف خبر "${deleteTarget.title}" نهائياً؟ لا يمكن التراجع.` : ''}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
