import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Image, Plus, Trash2, Pencil, Eye, EyeOff, Filter, Grid, List } from 'lucide-react'
import Modal from '../../components/Modal'
import { FormField, Input, Select, Textarea } from '../../components/FormField'
import toast from 'react-hot-toast'
import ConfirmDialog from '../../components/ConfirmDialog'

const api = (path: string, method = 'GET', data?: any) =>
  axios({ method, url: `/api${path}`, data, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

const CATEGORIES = ['عام','رياضة','فعاليات','فصول','أنشطة','خريجون','مسابقات','آخر'].map(v => ({ value: v, label: v }))

const emptyForm = { title: '', description: '', imageUrl: '', category: 'عام', isPublished: true }

export default function GalleryAdmin() {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [filterCat, setFilterCat] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [preview, setPreview] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['gallery', filterCat],
    queryFn: () => api(`/gallery${filterCat ? `?category=${filterCat}` : ''}`).then(r => r.data)
  })

  const createMut = useMutation({
    mutationFn: (d: any) => api('/gallery', 'POST', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery'] }); closeModal(); toast.success('تمت إضافة الصورة') },
    onError: () => toast.error('حدث خطأ')
  })
  const updateMut = useMutation({
    mutationFn: ({ id, ...d }: any) => api(`/gallery/${id}`, 'PUT', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery'] }); closeModal(); toast.success('تم التعديل') },
    onError: () => toast.error('حدث خطأ')
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/gallery/${id}`, 'DELETE'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery'] }); toast.success('تم الحذف') }
  })

  const gallery = data?.gallery || []
  const categories = data?.categories || []

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (item: any) => {
    setEditing(item)
    setForm({ title: item.title || '', description: item.description || '', imageUrl: item.image_url, category: item.category || 'عام', isPublished: item.is_published })
    setModal(true)
  }
  const closeModal = () => { setModal(false); setEditing(null); setForm(emptyForm) }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.imageUrl.trim()) return toast.error('رابط الصورة مطلوب')
    const payload = { title: form.title, description: form.description, imageUrl: form.imageUrl, category: form.category, isPublished: form.isPublished }
    if (editing) updateMut.mutate({ id: editing.id, ...payload })
    else createMut.mutate(payload)
  }

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }))

  const published = gallery.filter((g: any) => g.is_published).length
  const unpublished = gallery.length - published

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800">معرض الصور</h1>
          <p className="text-gray-500 text-sm mt-0.5">إدارة صور المدرسة على الموقع العام</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> إضافة صورة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'إجمالي الصور', value: gallery.length, icon: <Image size={18} />, color: '#6366f1' },
          { label: 'منشورة', value: published, icon: <Eye size={18} />, color: '#10b981' },
          { label: 'مخفية', value: unpublished, icon: <EyeOff size={18} />, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color + '18', color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold">{s.label}</p>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Filter size={14} className="text-gray-400" />
          <div className="flex gap-2 flex-wrap">
            {['', ...categories].map((cat: string) => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterCat === cat ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                style={filterCat === cat ? { background: 'var(--color-primary)' } : {}}>
                {cat || 'الكل'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-gray-700' : 'text-gray-400'}`}><Grid size={15} /></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-700' : 'text-gray-400'}`}><List size={15} /></button>
        </div>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : gallery.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Image size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold text-lg">لا توجد صور بعد</p>
          <p className="text-sm mt-1">أضف أول صورة للمعرض</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {gallery.map((item: any) => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square shadow-sm hover:shadow-lg transition-all">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=صورة' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                <p className="text-white font-bold text-sm truncate">{item.title || 'بدون عنوان'}</p>
                {item.category && <span className="text-xs text-white/70">{item.category}</span>}
              </div>
              <div className="absolute top-2 left-2 right-2 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${item.is_published ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  {item.is_published ? 'منشور' : 'مخفي'}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPreview(item.image_url)} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white shadow"><Eye size={12} /></button>
                  <button onClick={() => openEdit(item)} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-blue-600 hover:bg-white shadow"><Pencil size={12} /></button>
                  <button onClick={() => setDeleteTarget(item)} className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-red-500 hover:bg-white shadow"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-right px-4 py-3 font-bold text-gray-500">الصورة</th>
              <th className="text-right px-4 py-3 font-bold text-gray-500">العنوان</th>
              <th className="text-right px-4 py-3 font-bold text-gray-500">التصنيف</th>
              <th className="text-right px-4 py-3 font-bold text-gray-500">الحالة</th>
              <th className="text-right px-4 py-3 font-bold text-gray-500">إجراءات</th>
            </tr></thead>
            <tbody>
              {gallery.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img src={item.image_url} alt="" className="w-14 h-10 object-cover rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56x40?text=?' }} />
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-700">{item.title || '—'}</td>
                  <td className="px-4 py-3"><span className="badge-info">{item.category || '—'}</span></td>
                  <td className="px-4 py-3">
                    <span className={item.is_published ? 'badge-success' : 'badge-danger'}>{item.is_published ? 'منشور' : 'مخفي'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? 'تعديل صورة' : 'إضافة صورة جديدة'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="رابط الصورة (URL)" required>
            <Input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://example.com/image.jpg" required />
          </FormField>
          {form.imageUrl && (
            <div className="rounded-xl overflow-hidden h-40 bg-gray-100">
              <img src={form.imageUrl} alt="معاينة" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}
          <FormField label="العنوان">
            <Input value={form.title} onChange={set('title')} placeholder="عنوان الصورة" />
          </FormField>
          <FormField label="الوصف">
            <Textarea value={form.description} onChange={set('description')} placeholder="وصف مختصر..." rows={2} />
          </FormField>
          <FormField label="التصنيف">
            <Select value={form.category} onChange={set('category')} options={CATEGORIES} />
          </FormField>
          <FormField label="الحالة">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isPublished ? 'right-1' : 'left-1'}`} />
              </div>
              <span className="text-sm font-bold text-gray-600">{form.isPublished ? 'منشور على الموقع' : 'مخفي'}</span>
            </label>
          </FormField>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={createMut.isPending || updateMut.isPending}>
              {(createMut.isPending || updateMut.isPending) ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة الصورة'}
            </button>
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="معاينة" className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} title="حذف الصورة" message={`هل أنت متأكد من حذف "${deleteTarget?.title || 'هذه الصورة'}"؟`}
        onConfirm={() => { deleteMut.mutate(deleteTarget.id); setDeleteTarget(null) }}
        onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}
