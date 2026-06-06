import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentApi } from '../../api/client'
import toast from 'react-hot-toast'
import { Video, PenTool, Users, Award, Heart, Plus, Trash2 } from 'lucide-react'

type Tab = 'videos' | 'articles' | 'teams' | 'hall' | 'learning'

export default function ExtendedContentAdmin() {
  const [tab, setTab] = useState<Tab>('videos')
  const qc = useQueryClient()
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'videos', label: 'المكتبة المرئية', icon: <Video size={16} /> },
    { id: 'articles', label: 'المقالات', icon: <PenTool size={16} /> },
    { id: 'teams', label: 'الفرق المدرسية', icon: <Users size={16} /> },
    { id: 'hall', label: 'جدار الشرف', icon: <Award size={16} /> },
    { id: 'learning', label: 'دعم التعلم', icon: <Heart size={16} /> },
  ]
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">محتوى الصفحات الإضافية</h1>
        <p className="text-sm text-gray-500 mt-1">فيديوهات، مقالات، فرق، جدار الشرف، ودعم التعلم</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${tab === t.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab === 'videos' && <VideosTab qc={qc} />}
      {tab === 'articles' && <ArticlesTab qc={qc} />}
      {tab === 'teams' && <TeamsTab qc={qc} />}
      {tab === 'hall' && <HallTab qc={qc} />}
      {tab === 'learning' && <LearningTab qc={qc} />}
    </div>
  )
}

function VideosTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ title: '', videoUrl: '', category: '', description: '' })
  const { data } = useQuery({ queryKey: ['content-videos'], queryFn: () => contentApi.videos().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createVideo(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-videos', 'public-videos'] }); setForm({ title: '', videoUrl: '', category: '', description: '' }); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteVideo(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-videos', 'public-videos'] }); toast.success('تم الحذف') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 space-y-2">
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان الفيديو" className="w-full p-3 rounded-xl border text-sm" />
        <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="رابط YouTube" className="w-full p-3 rounded-xl border text-sm" dir="ltr" />
        <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="التصنيف (فعاليات، رياضة...)" className="w-full p-3 rounded-xl border text-sm" />
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر" rows={2} className="w-full p-3 rounded-xl border text-sm" />
        <button onClick={() => create.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline ml-1" />إضافة فيديو</button>
      </div>
      {(data?.videos || []).map((v: any) => (
        <div key={v.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3">
          <div><p className="font-bold text-sm">{v.title}</p><p className="text-xs text-gray-500 mt-1">{v.category} — {v.video_url}</p></div>
          <button onClick={() => remove.mutate(v.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function ArticlesTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ articleType: 'student', authorName: '', grade: '', subject: '', title: '', content: '', category: '', publishDate: '' })
  const { data } = useQuery({ queryKey: ['content-articles'], queryFn: () => contentApi.articles().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createArticle(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-articles', 'public-articles'] }); setForm(f => ({ ...f, title: '', content: '', authorName: '' })); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteArticle(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-articles', 'public-articles'] }); toast.success('تم الحذف') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 space-y-2">
        <select value={form.articleType} onChange={e => setForm(f => ({ ...f, articleType: e.target.value }))} className="p-2 rounded-lg border text-sm">
          <option value="student">مقال طالب</option>
          <option value="teacher">مقال معلم</option>
        </select>
        <input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} placeholder="اسم الكاتب" className="w-full p-3 rounded-xl border text-sm" />
        {form.articleType === 'student' ? (
          <input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="الصف" className="w-full p-3 rounded-xl border text-sm" />
        ) : (
          <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="المادة" className="w-full p-3 rounded-xl border text-sm" />
        )}
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="العنوان" className="w-full p-3 rounded-xl border text-sm" />
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="المحتوى" rows={4} className="w-full p-3 rounded-xl border text-sm" />
        <button onClick={() => create.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline ml-1" />إضافة مقال</button>
      </div>
      {(data?.articles || []).map((a: any) => (
        <div key={a.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-600">{a.article_type === 'teacher' ? 'معلم' : 'طالب'}</span>
            <p className="font-bold text-sm mt-1">{a.title}</p>
            <p className="text-xs text-gray-500">{a.author_name}</p>
          </div>
          <button onClick={() => remove.mutate(a.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function TeamsTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ name: '', category: '', membersCount: 0, description: '', achievements: '', imageUrl: '', colorGradient: 'from-teal-500 to-teal-600' })
  const { data } = useQuery({ queryKey: ['content-teams'], queryFn: () => contentApi.teams().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createTeam(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-teams', 'public-teams'] }); setForm({ name: '', category: '', membersCount: 0, description: '', achievements: '', imageUrl: '', colorGradient: 'from-teal-500 to-teal-600' }); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteTeam(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-teams', 'public-teams'] }); toast.success('تم الحذف') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 space-y-2">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم الفريق" className="w-full p-3 rounded-xl border text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="التصنيف" className="p-3 rounded-xl border text-sm" />
          <input type="number" value={form.membersCount} onChange={e => setForm(f => ({ ...f, membersCount: +e.target.value }))} placeholder="عدد الأعضاء" className="p-3 rounded-xl border text-sm" />
        </div>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="الوصف" rows={2} className="w-full p-3 rounded-xl border text-sm" />
        <input value={form.achievements} onChange={e => setForm(f => ({ ...f, achievements: e.target.value }))} placeholder="الإنجازات" className="w-full p-3 rounded-xl border text-sm" />
        <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="رابط الصورة" className="w-full p-3 rounded-xl border text-sm" dir="ltr" />
        <button onClick={() => create.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline ml-1" />إضافة فريق</button>
      </div>
      {(data?.teams || []).map((t: any) => (
        <div key={t.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3">
          <div><p className="font-bold text-sm">{t.name}</p><p className="text-xs text-gray-500">{t.category} — {t.members_count} عضو</p></div>
          <button onClick={() => remove.mutate(t.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function HallTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const [form, setForm] = useState({ name: '', grade: '', year: '2024', achievement: '', category: 'أكاديمي', rank: 1, imageUrl: '', description: '' })
  const { data } = useQuery({ queryKey: ['content-hall'], queryFn: () => contentApi.hallOfFame().then(r => r.data) })
  const create = useMutation({
    mutationFn: () => contentApi.createHallEntry(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-hall', 'public-hall'] }); setForm(f => ({ ...f, name: '', achievement: '', description: '' })); toast.success('تمت الإضافة') },
  })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.deleteHallEntry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-hall', 'public-hall'] }); toast.success('تم الحذف') },
  })
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-4 space-y-2">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسم الطالب" className="w-full p-3 rounded-xl border text-sm" />
        <div className="grid grid-cols-3 gap-2">
          <input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="الصف" className="p-3 rounded-xl border text-sm" />
          <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="السنة" className="p-3 rounded-xl border text-sm" />
          <input type="number" value={form.rank} onChange={e => setForm(f => ({ ...f, rank: +e.target.value }))} placeholder="الترتيب" className="p-3 rounded-xl border text-sm" />
        </div>
        <input value={form.achievement} onChange={e => setForm(f => ({ ...f, achievement: e.target.value }))} placeholder="الإنجاز" className="w-full p-3 rounded-xl border text-sm" />
        <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="التصنيف" className="w-full p-3 rounded-xl border text-sm" />
        <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="رابط الصورة" className="w-full p-3 rounded-xl border text-sm" dir="ltr" />
        <button onClick={() => create.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"><Plus size={14} className="inline ml-1" />إضافة</button>
      </div>
      {(data?.entries || []).map((e: any) => (
        <div key={e.id} className="bg-white rounded-xl border p-4 flex justify-between gap-3">
          <div><p className="font-bold text-sm">{e.name}</p><p className="text-xs text-gray-500">{e.year} — {e.achievement}</p></div>
          <button onClick={() => remove.mutate(e.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function LearningTab({ qc }: { qc: ReturnType<typeof useQueryClient> }) {
  const { data } = useQuery({ queryKey: ['content-ls'], queryFn: () => contentApi.learningSupport().then(r => r.data) })
  const [about, setAbout] = useState('')
  const [svc, setSvc] = useState({ title: '', icon: '📖', description: '' })
  const [spec, setSpec] = useState({ name: '', role: '', imageUrl: '', bio: '' })
  const [art, setArt] = useState({ title: '', content: '' })
  const [gal, setGal] = useState({ title: '', imageUrl: '' })

  React.useEffect(() => { if (data?.settings?.about_text) setAbout(data.settings.about_text) }, [data])

  const saveAbout = useMutation({
    mutationFn: () => contentApi.updateLearningSettings({ aboutText: about }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }); toast.success('تم الحفظ') },
  })
  const addSvc = useMutation({ mutationFn: () => contentApi.createLsService(svc), onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }); setSvc({ title: '', icon: '📖', description: '' }); toast.success('تمت الإضافة') } })
  const addSpec = useMutation({ mutationFn: () => contentApi.createLsSpecialist(spec), onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }); setSpec({ name: '', role: '', imageUrl: '', bio: '' }); toast.success('تمت الإضافة') } })
  const addArt = useMutation({ mutationFn: () => contentApi.createLsArticle(art), onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }); setArt({ title: '', content: '' }); toast.success('تمت الإضافة') } })
  const addGal = useMutation({ mutationFn: () => contentApi.createLsGallery(gal), onSuccess: () => { qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }); setGal({ title: '', imageUrl: '' }); toast.success('تمت الإضافة') } })
  const delSvc = useMutation({ mutationFn: (id: string) => contentApi.deleteLsService(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }) })
  const delSpec = useMutation({ mutationFn: (id: string) => contentApi.deleteLsSpecialist(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }) })
  const delArt = useMutation({ mutationFn: (id: string) => contentApi.deleteLsArticle(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }) })
  const delGal = useMutation({ mutationFn: (id: string) => contentApi.deleteLsGallery(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['content-ls', 'public-ls'] }) })

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border p-4 space-y-2">
        <h3 className="font-bold text-sm">نبذة عن الوحدة</h3>
        <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3} className="w-full p-3 rounded-xl border text-sm" />
        <button onClick={() => saveAbout.mutate()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">حفظ النبذة</button>
      </div>
      <Section title="الخدمات" add={() => addSvc.mutate()} form={
        <div className="space-y-2">
          <input value={svc.title} onChange={e => setSvc(s => ({ ...s, title: e.target.value }))} placeholder="العنوان" className="w-full p-2 rounded-lg border text-sm" />
          <input value={svc.description} onChange={e => setSvc(s => ({ ...s, description: e.target.value }))} placeholder="الوصف" className="w-full p-2 rounded-lg border text-sm" />
        </div>
      } items={(data?.services || []).map((s: any) => ({ id: s.id, label: `${s.icon} ${s.title}` }))} onDelete={id => delSvc.mutate(id)} />
      <Section title="المختصون" add={() => addSpec.mutate()} form={
        <div className="space-y-2">
          <input value={spec.name} onChange={e => setSpec(s => ({ ...s, name: e.target.value }))} placeholder="الاسم" className="w-full p-2 rounded-lg border text-sm" />
          <input value={spec.role} onChange={e => setSpec(s => ({ ...s, role: e.target.value }))} placeholder="الدور" className="w-full p-2 rounded-lg border text-sm" />
        </div>
      } items={(data?.specialists || []).map((s: any) => ({ id: s.id, label: s.name }))} onDelete={id => delSpec.mutate(id)} />
      <Section title="مقالات توعوية" add={() => addArt.mutate()} form={
        <div className="space-y-2">
          <input value={art.title} onChange={e => setArt(a => ({ ...a, title: e.target.value }))} placeholder="العنوان" className="w-full p-2 rounded-lg border text-sm" />
          <textarea value={art.content} onChange={e => setArt(a => ({ ...a, content: e.target.value }))} placeholder="المحتوى" rows={2} className="w-full p-2 rounded-lg border text-sm" />
        </div>
      } items={(data?.articles || []).map((a: any) => ({ id: a.id, label: a.title }))} onDelete={id => delArt.mutate(id)} />
      <Section title="معرض الصور" add={() => addGal.mutate()} form={
        <div className="space-y-2">
          <input value={gal.title} onChange={e => setGal(g => ({ ...g, title: e.target.value }))} placeholder="التسمية" className="w-full p-2 rounded-lg border text-sm" />
          <input value={gal.imageUrl} onChange={e => setGal(g => ({ ...g, imageUrl: e.target.value }))} placeholder="رابط الصورة" className="w-full p-2 rounded-lg border text-sm" dir="ltr" />
        </div>
      } items={(data?.gallery || []).map((g: any) => ({ id: g.id, label: g.title || g.image_url }))} onDelete={id => delGal.mutate(id)} />
    </div>
  )
}

function Section({ title, form, add, items, onDelete }: { title: string; form: React.ReactNode; add: () => void; items: { id: string; label: string }[]; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border p-4 space-y-2">
      <h3 className="font-bold text-sm">{title}</h3>
      {form}
      <button onClick={add} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"><Plus size={12} className="inline ml-1" />إضافة</button>
      {items.map(i => (
        <div key={i.id} className="flex justify-between items-center py-2 border-t text-sm">
          <span>{i.label}</span>
          <button onClick={() => onDelete(i.id)} className="text-red-500"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  )
}
