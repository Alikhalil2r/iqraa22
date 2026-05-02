import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../../api/client'
import { FormField, Input, Textarea } from '../../components/FormField'
import { Settings, Save, School } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SchoolSettings() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(r => r.data)
  })

  const [form, setForm] = useState({
    name:'', nameEn:'', tagline:'', address:'', phone:'', email:'', website:'',
    aboutText:'', vision:'', mission:'', principalName:'', principalMessage:'', principalImage:'', heroImage:''
  })

  useEffect(() => {
    if (data) {
      const s = data.school || {}
      const st = data.settings || {}
      setForm({
        name: s.name||'', nameEn: s.name_en||'', tagline: s.tagline||'',
        address: s.address||'', phone: s.phone||'', email: s.email||'', website: s.website||'',
        aboutText: st.about_text||'', vision: st.vision||'', mission: st.mission||'',
        principalName: st.principal_name||'', principalMessage: st.principal_message||'',
        principalImage: st.principal_image||'', heroImage: st.hero_image||''
      })
    }
  }, [data])

  const saveMut = useMutation({
    mutationFn: () => settingsApi.update(form),
    onSuccess: () => { qc.invalidateQueries({queryKey:['settings']}); toast.success('✅ تم حفظ الإعدادات') },
    onError: () => toast.error('حدث خطأ في الحفظ')
  })

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"/></div>

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Settings size={24}/>إعدادات المدرسة</h1>
        <p className="text-sm text-gray-400 mt-1">معلومات المدرسة الظاهرة في الموقع العام</p>
      </div>

      <div className="card space-y-5">
        <h3 className="font-black text-gray-700 flex items-center gap-2"><School size={16}/>المعلومات الأساسية</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="اسم المدرسة بالعربي" required>
            <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          </FormField>
          <FormField label="اسم المدرسة بالإنجليزي">
            <Input value={form.nameEn} onChange={e=>setForm({...form,nameEn:e.target.value})}/>
          </FormField>
          <FormField label="الشعار / الرسالة المختصرة">
            <Input value={form.tagline} onChange={e=>setForm({...form,tagline:e.target.value})} placeholder="نحو مستقبل أفضل"/>
          </FormField>
          <FormField label="الهاتف">
            <Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
          </FormField>
          <FormField label="البريد الإلكتروني">
            <Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
          </FormField>
          <FormField label="الموقع الإلكتروني">
            <Input value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/>
          </FormField>
        </div>
        <FormField label="العنوان">
          <Textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={{minHeight:'80px'}}/>
        </FormField>
        <FormField label="صورة الغلاف الرئيسية (رابط)">
          <Input value={form.heroImage} onChange={e=>setForm({...form,heroImage:e.target.value})} placeholder="https://..."/>
          {form.heroImage && <img src={form.heroImage} className="mt-2 h-32 w-full object-cover rounded-xl" onError={e=>(e.currentTarget.style.display='none')}/>}
        </FormField>
      </div>

      <div className="card space-y-5">
        <h3 className="font-black text-gray-700">عن المدرسة</h3>
        <FormField label="نص التعريف بالمدرسة">
          <Textarea value={form.aboutText} onChange={e=>setForm({...form,aboutText:e.target.value})} style={{minHeight:'120px'}}/>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="الرؤية">
            <Textarea value={form.vision} onChange={e=>setForm({...form,vision:e.target.value})} style={{minHeight:'100px'}}/>
          </FormField>
          <FormField label="الرسالة">
            <Textarea value={form.mission} onChange={e=>setForm({...form,mission:e.target.value})} style={{minHeight:'100px'}}/>
          </FormField>
        </div>
      </div>

      <div className="card space-y-5">
        <h3 className="font-black text-gray-700">كلمة المدير</h3>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="اسم المدير">
            <Input value={form.principalName} onChange={e=>setForm({...form,principalName:e.target.value})}/>
          </FormField>
          <FormField label="صورة المدير (رابط)">
            <Input value={form.principalImage} onChange={e=>setForm({...form,principalImage:e.target.value})} placeholder="https://..."/>
          </FormField>
        </div>
        <FormField label="كلمة المدير">
          <Textarea value={form.principalMessage} onChange={e=>setForm({...form,principalMessage:e.target.value})} style={{minHeight:'120px'}}/>
        </FormField>
      </div>

      <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3">
        {saveMut.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18}/>}
        {saveMut.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
      </button>
    </div>
  )
}
