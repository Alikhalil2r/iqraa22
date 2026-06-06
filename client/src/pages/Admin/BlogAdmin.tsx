import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, Eye, Globe, FileText,
  X, Save, Search, BookOpen, ArrowUpRight
} from 'lucide-react'

const inp = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft:     'bg-gray-100 text-gray-600',
  archived:  'bg-red-100 text-red-600',
}
const STATUS_LABEL: Record<string, string> = {
  published: 'منشور', draft: 'مسودة', archived: 'مؤرشف'
}

const CATEGORIES = ['تقنية', 'تصميم', 'تسويق', 'نصائح', 'ريادة أعمال', 'ذكاء اصطناعي', 'أخرى']

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[\u0600-\u06FF\s]+/g, '-')
    .replace(/[^\w-]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4)
}

export default function BlogAdmin() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [drawer, setDrawer] = useState<any>(null)

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: () => adminApi.get('/api/platform/admin/blog')
  })

  const filtered = posts.filter((p: any) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  )

  const save = useMutation({
    mutationFn: (d: any) => d.id
      ? adminApi.put(`/api/platform/admin/blog/${d.id}`, d)
      : adminApi.post('/api/platform/admin/blog', d),
    onSuccess: () => { toast.success('تم الحفظ'); qc.invalidateQueries({ queryKey: ['admin-blog'] }); setDrawer(null) }
  })

  const del = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/platform/admin/blog/${id}`),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries({ queryKey: ['admin-blog'] }) }
  })

  const [filterStatus, setFilterStatus] = useState('all')

  const displayPosts = filtered.filter((p: any) =>
    filterStatus === 'all' || p.status === filterStatus
  )

  const openNew = () => setDrawer({
    title: '', slug: '', excerpt: '', content: '', image_url: '',
    category: 'تقنية', tags: '', status: 'draft', author_name: user?.name || 'Admin',
    read_time: 5
  })

  return (
    <div dir="rtl" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><BookOpen size={24} className="text-violet-600"/> إدارة المدونة</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} مقالة إجمالاً</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
          <Plus size={16}/> مقالة جديدة
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المقالات..." className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ v: 'all', l: 'الكل' }, { v: 'published', l: 'منشور' }, { v: 'draft', l: 'مسودة' }, { v: 'archived', l: 'مؤرشف' }].map(({ v, l }) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === v ? 'bg-white shadow text-violet-700' : 'text-gray-500 hover:text-gray-700'}`}>
              {l} {v !== 'all' && `(${posts.filter((p:any)=>p.status===v).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-right p-3.5 text-xs font-black text-gray-500">عنوان المقالة</th>
              <th className="text-right p-3.5 text-xs font-black text-gray-500 hidden md:table-cell">الفئة</th>
              <th className="text-right p-3.5 text-xs font-black text-gray-500 hidden lg:table-cell">الكاتب</th>
              <th className="text-right p-3.5 text-xs font-black text-gray-500 hidden md:table-cell">القراءات</th>
              <th className="text-right p-3.5 text-xs font-black text-gray-500">الحالة</th>
              <th className="p-3.5"/>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td colSpan={6} className="p-3.5"><div className="h-5 bg-gray-100 rounded-lg animate-pulse w-3/4"/></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-30"/>
                <p>لا توجد مقالات</p>
              </td></tr>
            ) : displayPosts.map((post: any) => (
              <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="p-3.5">
                  <p className="font-bold text-gray-800 line-clamp-1">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">/{post.slug}</p>
                </td>
                <td className="p-3.5 hidden md:table-cell">
                  <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold">{post.category}</span>
                </td>
                <td className="p-3.5 hidden lg:table-cell text-gray-500 text-xs">{post.author_name}</td>
                <td className="p-3.5 hidden md:table-cell">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Eye size={11}/> {post.views || 0}</span>
                </td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${STATUS_BADGE[post.status] || 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABEL[post.status] || post.status}
                  </span>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    {post.status === 'published' && (
                      <a href={`/platform/blog/${post.slug}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                        <ArrowUpRight size={14}/>
                      </a>
                    )}
                    <button onClick={() => setDrawer({ ...post, tags: Array.isArray(post.tags) ? post.tags.join('، ') : (JSON.parse(post.tags || '[]')).join('، ') })} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 transition-colors">
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => { if(confirm('حذف هذه المقالة نهائياً؟')) del.mutate(post.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(null)}/>
          <div className="w-full max-w-2xl bg-white flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-black text-gray-800 text-lg">{drawer.id ? 'تعديل المقالة' : 'مقالة جديدة'}</h2>
              <button onClick={() => setDrawer(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X size={18}/></button>
            </div>
            <div className="flex-1 p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">عنوان المقالة *</label>
                <input className={inp} value={drawer.title || ''} onChange={e => setDrawer({ ...drawer, title: e.target.value, slug: drawer.id ? drawer.slug : slugify(e.target.value) })}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">الرابط (Slug)</label>
                <input className={inp} value={drawer.slug || ''} onChange={e => setDrawer({ ...drawer, slug: e.target.value })} dir="ltr"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">الفئة</label>
                  <select className={inp} value={drawer.category || 'تقنية'} onChange={e => setDrawer({ ...drawer, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">الحالة</label>
                  <select className={inp} value={drawer.status || 'draft'} onChange={e => setDrawer({ ...drawer, status: e.target.value })}>
                    <option value="draft">مسودة</option>
                    <option value="published">منشور</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">مقتطف / ملخص</label>
                <textarea className={inp + ' resize-none'} rows={2} value={drawer.excerpt || ''} onChange={e => setDrawer({ ...drawer, excerpt: e.target.value })}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">المحتوى (HTML)</label>
                <textarea className={inp + ' resize-none font-mono text-xs'} rows={10} value={drawer.content || ''} onChange={e => setDrawer({ ...drawer, content: e.target.value })} placeholder="<h2>عنوان</h2><p>محتوى...</p>"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">رابط الصورة الرئيسية</label>
                <input className={inp} value={drawer.image_url || ''} onChange={e => setDrawer({ ...drawer, image_url: e.target.value })} placeholder="https://images.unsplash.com/..." dir="ltr"/>
                {drawer.image_url && <img src={drawer.image_url} alt="" className="mt-2 w-full h-32 object-cover rounded-xl"/>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">الوسوم (مفصولة بفاصلة)</label>
                <input className={inp} value={drawer.tags || ''} onChange={e => setDrawer({ ...drawer, tags: e.target.value })} placeholder="تقنية، مواقع، تصميم"/>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setDrawer(null)} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors">إلغاء</button>
              <button
                onClick={() => save.mutate({ ...drawer, tags: drawer.tags?.split(/[,،]/).map((t: string) => t.trim()).filter(Boolean) || [] })}
                disabled={save.isPending || !drawer.title || !drawer.slug}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm transition-colors"
              >
                {save.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={14}/>}
                {drawer.id ? 'حفظ التعديلات' : 'نشر المقالة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
