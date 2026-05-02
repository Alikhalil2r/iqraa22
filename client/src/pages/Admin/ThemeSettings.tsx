import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { settingsApi } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'
import { Palette, RefreshCw, Check, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESETS = [
  { name:'أخضر الحكمة', primary:'#065f46', dark:'#064e3b', light:'#10b981', accent:'#fbbf24', accentDark:'#f59e0b' },
  { name:'أزرق المعرفة', primary:'#1e40af', dark:'#1e3a8a', light:'#3b82f6', accent:'#f59e0b', accentDark:'#d97706' },
  { name:'بنفسجي الإبداع', primary:'#6d28d9', dark:'#5b21b6', light:'#8b5cf6', accent:'#f59e0b', accentDark:'#d97706' },
  { name:'أحمر القوة', primary:'#991b1b', dark:'#7f1d1d', light:'#dc2626', accent:'#fbbf24', accentDark:'#f59e0b' },
  { name:'فيروزي الهدوء', primary:'#0e7490', dark:'#0c6378', light:'#0ea5e9', accent:'#f97316', accentDark:'#ea580c' },
  { name:'وردي الأمل', primary:'#9d174d', dark:'#831843', light:'#ec4899', accent:'#fbbf24', accentDark:'#f59e0b' },
  { name:'داكن الأناقة', primary:'#1f2937', dark:'#111827', light:'#374151', accent:'#f59e0b', accentDark:'#d97706' },
  { name:'برتقالي الطاقة', primary:'#c2410c', dark:'#9a3412', light:'#ea580c', accent:'#3b82f6', accentDark:'#2563eb' },
]

export default function ThemeSettings() {
  const { theme, applyTheme } = useTheme()
  const [form, setForm] = useState({
    primaryColor: theme.primaryColor || '#1e40af',
    primaryDark: theme.primaryDark || '#1e3a8a',
    primaryLight: theme.primaryLight || '#3b82f6',
    accentColor: theme.accentColor || '#f59e0b',
    accentDark: theme.accentDark || '#d97706',
    customCss: ''
  })
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    setForm({
      primaryColor: theme.primaryColor || '#1e40af',
      primaryDark: theme.primaryDark || '#1e3a8a',
      primaryLight: theme.primaryLight || '#3b82f6',
      accentColor: theme.accentColor || '#f59e0b',
      accentDark: theme.accentDark || '#d97706',
      customCss: ''
    })
  }, [theme])

  const saveMut = useMutation({
    mutationFn: (data: any) => settingsApi.updateTheme(data),
    onSuccess: () => {
      applyTheme({ primaryColor: form.primaryColor, primaryDark: form.primaryDark, primaryLight: form.primaryLight, accentColor: form.accentColor, accentDark: form.accentDark })
      toast.success('✅ تم حفظ التصميم وتطبيقه فوراً!')
    },
    onError: () => toast.error('حدث خطأ في الحفظ')
  })

  const applyPreset = (p: typeof PRESETS[0]) => {
    setForm({ ...form, primaryColor: p.primary, primaryDark: p.dark, primaryLight: p.light, accentColor: p.accent, accentDark: p.accentDark })
    applyTheme({ primaryColor: p.primary, primaryDark: p.dark, primaryLight: p.light, accentColor: p.accent, accentDark: p.accentDark })
    toast.success(`تم تطبيق ثيم "${p.name}" مؤقتاً - احفظ للتأكيد`)
  }

  const handleSave = () => {
    applyTheme({ primaryColor: form.primaryColor, primaryDark: form.primaryDark, primaryLight: form.primaryLight, accentColor: form.accentColor, accentDark: form.accentDark })
    saveMut.mutate(form)
  }

  const ColorPicker = ({ label, colorKey, hint }: {label:string, colorKey:keyof typeof form, hint?:string}) => (
    <div className="bg-gray-50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-sm text-gray-700">{label}</p>
          {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm" style={{background: form[colorKey]}}/>
          <input type="color" value={form[colorKey]} onChange={e => setForm({...form,[colorKey]:e.target.value})}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"/>
        </div>
      </div>
      <input type="text" value={form[colorKey]} onChange={e => setForm({...form,[colorKey]:e.target.value})}
        className="w-full text-sm text-center font-mono bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2"
        style={{'--tw-ring-color': form[colorKey]} as any}
        placeholder="#000000"/>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2"><Palette size={24}/>تخصيص التصميم</h1>
        <p className="text-sm text-gray-400 mt-1">غيّر ألوان وهوية المدرسة بالكامل من هنا</p>
      </div>

      {/* Live Preview Bar */}
      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 text-white flex items-center justify-between" style={{background: form.primaryColor}}>
          <span className="font-black">معاينة فورية - شريط التصفح</span>
          <div className="flex gap-2">
            {['الرئيسية','عن المدرسة','الأخبار'].map(l => (
              <span key={l} className="text-xs px-3 py-1.5 rounded-lg" style={{background:'rgba(255,255,255,0.2)'}}>{l}</span>
            ))}
          </div>
        </div>
        <div className="p-3 flex gap-2" style={{background: form.accentColor}}>
          <span className="text-white text-xs font-bold">شريط الإعلانات العاجلة</span>
        </div>
      </div>

      {/* Presets */}
      <div className="card">
        <h3 className="font-black text-gray-700 mb-4">ثيمات جاهزة</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)}
              className="group relative rounded-2xl overflow-hidden border-2 border-gray-100 hover:border-gray-300 transition-all hover:scale-105">
              <div className="h-12" style={{background: p.primary}}/>
              <div className="h-4" style={{background: p.accent}}/>
              <div className="p-2">
                <p className="text-[10px] font-bold text-gray-600 text-center">{p.name}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                <span className="text-white text-xs font-black bg-black/50 px-2 py-1 rounded-lg">تطبيق</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="card">
        <h3 className="font-black text-gray-700 mb-4">ألوان مخصصة</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorPicker label="اللون الرئيسي" colorKey="primaryColor" hint="لون الشريط والأزرار الرئيسية"/>
          <ColorPicker label="اللون الرئيسي الداكن" colorKey="primaryDark" hint="عند الضغط والتمرير"/>
          <ColorPicker label="اللون الرئيسي الفاتح" colorKey="primaryLight" hint="للعناصر الثانوية"/>
          <ColorPicker label="اللون المميز" colorKey="accentColor" hint="للإعلانات والأزرار الثانوية"/>
        </div>
      </div>

      {/* Preview samples */}
      <div className="card">
        <h3 className="font-black text-gray-700 mb-4">معاينة المكونات</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{background:form.primaryColor}}>زر رئيسي</button>
          <button className="px-4 py-2 rounded-xl text-white text-sm font-bold" style={{background:form.accentColor}}>زر مميز</button>
          <button className="px-4 py-2 rounded-xl text-sm font-bold border-2" style={{color:form.primaryColor, borderColor:form.primaryColor}}>زر مخطط</button>
          <span className="px-3 py-1.5 rounded-full text-white text-xs font-bold" style={{background:form.primaryColor}}>وسم</span>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{background:form.primaryColor+'20', color:form.primaryColor}}>وسم فاتح</span>
          <div className="w-8 h-8 rounded-xl" style={{background:form.primaryColor}}/>
          <div className="w-8 h-8 rounded-xl" style={{background:form.accentColor}}/>
        </div>
      </div>

      <button onClick={handleSave} disabled={saveMut.isPending}
        className="btn-primary w-full py-4 text-base flex items-center justify-center gap-3">
        {saveMut.isPending ? <RefreshCw size={18} className="animate-spin"/> : <Check size={18}/>}
        {saveMut.isPending ? 'جارٍ الحفظ...' : 'حفظ التصميم وتطبيقه على الموقع'}
      </button>
    </div>
  )
}
