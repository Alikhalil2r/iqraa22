import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../../api/client'
import { FormField, Input, Textarea } from '../../components/FormField'
import {
  Settings, Save, School, Phone, Globe, BookOpen,
  User, Image, Link, Award, FileText, CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'basic' | 'contact' | 'about' | 'principal' | 'social' | 'links'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'basic',     label: 'المعلومات الأساسية', icon: <School size={15} /> },
  { id: 'contact',   label: 'التواصل والعنوان',   icon: <Phone size={15} /> },
  { id: 'about',     label: 'عن المدرسة',          icon: <BookOpen size={15} /> },
  { id: 'principal', label: 'كلمة المدير',          icon: <User size={15} /> },
  { id: 'social',    label: 'وسائل التواصل',        icon: <Globe size={15} /> },
  { id: 'links',     label: 'الروابط والصور',       icon: <Image size={15} /> },
]

const emptyForm = {
  name: '', nameEn: '', tagline: '', foundedYear: '', licenseNumber: '',
  address: '', city: '', region: '', country: 'سلطنة عُمان',
  phone: '', phone2: '', email: '', email2: '', website: '', fax: '',
  aboutText: '', vision: '', mission: '', values: '', objectives: '',
  principalName: '', principalTitle: '', principalEmail: '', principalPhone: '', principalMessage: '', principalImage: '',
  instagram: '', twitter: '', facebook: '', youtube: '', snapchat: '', tiktok: '',
  heroImage: '', logoUrl: '', bannerColor: '', mapEmbed: '',
  studentsCount: '', teachersCount: '', classroomsCount: '', yearsExperience: '',
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5 pb-3 border-b border-gray-100">
      <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h3 className="font-black text-gray-800 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function SocialInput({ icon, value, onChange, placeholder, label }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 focus-within:border-emerald-400 focus-within:bg-white transition-all">
      <div className="flex-shrink-0 text-gray-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <input type="url" value={value} onChange={onChange} placeholder={placeholder}
          className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none font-medium" />
      </div>
    </div>
  )
}

export default function SchoolSettings() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('basic')
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then(r => r.data)
  })

  useEffect(() => {
    if (data) {
      const s = data.school || {}
      const st = data.settings || {}
      setForm({
        name: s.name || '', nameEn: s.name_en || '', tagline: s.tagline || '',
        foundedYear: st.founded_year || '', licenseNumber: st.license_number || '',
        address: s.address || '', city: st.city || '', region: st.region || '', country: st.country || 'سلطنة عُمان',
        phone: s.phone || '', phone2: st.phone2 || '', email: s.email || '', email2: st.email2 || '',
        website: s.website || '', fax: st.fax || '',
        aboutText: st.about_text || '', vision: st.vision || '', mission: st.mission || '',
        values: st.values || '', objectives: st.objectives || '',
        principalName: st.principal_name || '', principalTitle: st.principal_title || '',
        principalEmail: st.principal_email || '', principalPhone: st.principal_phone || '',
        principalMessage: st.principal_message || '', principalImage: st.principal_image || '',
        instagram: st.instagram || '', twitter: st.twitter || '', facebook: st.facebook || '',
        youtube: st.youtube || '', snapchat: st.snapchat || '', tiktok: st.tiktok || '',
        heroImage: st.hero_image || '', logoUrl: st.logo_url || '', bannerColor: st.banner_color || '',
        mapEmbed: st.map_embed || '',
        studentsCount: st.students_count || '', teachersCount: st.teachers_count || '',
        classroomsCount: st.classrooms_count || '', yearsExperience: st.years_experience || '',
      })
    }
  }, [data])

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  const saveMut = useMutation({
    mutationFn: () => settingsApi.update(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('✅ تم حفظ الإعدادات بنجاح')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: () => toast.error('حدث خطأ في الحفظ')
  })

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <Settings size={22} className="text-emerald-600" />
            إعدادات المدرسة
          </h1>
          <p className="text-sm text-gray-400 mt-1">إدارة شاملة لكل بيانات ومعلومات المدرسة</p>
        </div>
        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
          className={`px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg ${saved ? 'bg-green-500 text-white' : 'btn-primary'}`}>
          {saveMut.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
           saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saveMut.isPending ? 'جارٍ الحفظ...' : saved ? 'تم الحفظ!' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="card !p-2 space-y-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-right transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span className={tab === t.id ? 'text-white' : 'text-gray-400'}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'basic' && (
            <div className="card space-y-5">
              <SectionTitle icon={<School size={16} />} title="المعلومات الأساسية" subtitle="البيانات الرئيسية للمدرسة" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="اسم المدرسة بالعربي" required>
                  <Input value={form.name} onChange={f('name')} placeholder="مدرسة النجاح الخاصة" />
                </FormField>
                <FormField label="اسم المدرسة بالإنجليزي">
                  <Input value={form.nameEn} onChange={f('nameEn')} placeholder="Al Najah Private School" />
                </FormField>
                <FormField label="الشعار / الرسالة المختصرة">
                  <Input value={form.tagline} onChange={f('tagline')} placeholder="نحو مستقبل مشرق" />
                </FormField>
                <FormField label="سنة التأسيس">
                  <Input type="number" value={form.foundedYear} onChange={f('foundedYear')} placeholder="2005" />
                </FormField>
                <FormField label="رقم الترخيص / الاعتماد">
                  <Input value={form.licenseNumber} onChange={f('licenseNumber')} placeholder="وزارة التربية والتعليم" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-2xl">
                <p className="col-span-full text-xs font-black text-gray-500 mb-1 flex items-center gap-2"><Award size={13} />الأرقام الظاهرة في الموقع العام</p>
                <FormField label="عدد الطلاب">
                  <Input type="number" value={form.studentsCount} onChange={f('studentsCount')} placeholder="500" />
                </FormField>
                <FormField label="عدد المعلمين">
                  <Input type="number" value={form.teachersCount} onChange={f('teachersCount')} placeholder="40" />
                </FormField>
                <FormField label="عدد الفصول">
                  <Input type="number" value={form.classroomsCount} onChange={f('classroomsCount')} placeholder="20" />
                </FormField>
                <FormField label="سنوات الخبرة">
                  <Input type="number" value={form.yearsExperience} onChange={f('yearsExperience')} placeholder="15" />
                </FormField>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div className="card space-y-5">
              <SectionTitle icon={<Phone size={16} />} title="بيانات التواصل والموقع" subtitle="معلومات الاتصال والعنوان الجغرافي" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="رقم الهاتف الرئيسي">
                  <Input type="tel" value={form.phone} onChange={f('phone')} placeholder="+968 XXXX XXXX" />
                </FormField>
                <FormField label="رقم الهاتف الثاني">
                  <Input type="tel" value={form.phone2} onChange={f('phone2')} placeholder="+968 XXXX XXXX" />
                </FormField>
                <FormField label="البريد الإلكتروني الرئيسي">
                  <Input type="email" value={form.email} onChange={f('email')} placeholder="info@school.edu.om" />
                </FormField>
                <FormField label="البريد الإلكتروني الثاني">
                  <Input type="email" value={form.email2} onChange={f('email2')} placeholder="admin@school.edu.om" />
                </FormField>
                <FormField label="رقم الفاكس">
                  <Input value={form.fax} onChange={f('fax')} placeholder="+968 XXXX XXXX" />
                </FormField>
                <FormField label="الموقع الإلكتروني">
                  <Input type="url" value={form.website} onChange={f('website')} placeholder="https://school.edu.om" />
                </FormField>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="المدينة">
                  <Input value={form.city} onChange={f('city')} placeholder="مسقط" />
                </FormField>
                <FormField label="المحافظة / المنطقة">
                  <Input value={form.region} onChange={f('region')} placeholder="محافظة مسقط" />
                </FormField>
                <FormField label="الدولة">
                  <Input value={form.country} onChange={f('country')} />
                </FormField>
              </div>
              <FormField label="العنوان التفصيلي">
                <Textarea value={form.address} onChange={f('address')} placeholder="شارع، حي، منطقة..." style={{ minHeight: '80px' }} />
              </FormField>
              <FormField label="كود تضمين الخريطة (Google Maps Embed)">
                <Textarea value={form.mapEmbed} onChange={f('mapEmbed')} placeholder='<iframe src="https://maps.google.com/..." />' style={{ minHeight: '70px', fontFamily: 'monospace', fontSize: '12px' }} />
              </FormField>
            </div>
          )}

          {tab === 'about' && (
            <div className="card space-y-5">
              <SectionTitle icon={<BookOpen size={16} />} title="التعريف والهوية المدرسية" subtitle="النصوص الظاهرة في صفحة عن المدرسة" />
              <FormField label="التعريف العام بالمدرسة">
                <Textarea value={form.aboutText} onChange={f('aboutText')} placeholder="نص تعريفي شامل عن المدرسة..." style={{ minHeight: '120px' }} />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="الرؤية">
                  <Textarea value={form.vision} onChange={f('vision')} placeholder="رؤيتنا لمستقبل التعليم..." style={{ minHeight: '100px' }} />
                </FormField>
                <FormField label="الرسالة">
                  <Textarea value={form.mission} onChange={f('mission')} placeholder="رسالتنا التعليمية والتربوية..." style={{ minHeight: '100px' }} />
                </FormField>
              </div>
              <FormField label="القيم المؤسسية">
                <Textarea value={form.values} onChange={f('values')} placeholder="الجودة، الابتكار، الإبداع، النزاهة..." style={{ minHeight: '80px' }} />
              </FormField>
              <FormField label="الأهداف الاستراتيجية">
                <Textarea value={form.objectives} onChange={f('objectives')} placeholder="الأهداف الرئيسية للعام الدراسي..." style={{ minHeight: '100px' }} />
              </FormField>
            </div>
          )}

          {tab === 'principal' && (
            <div className="card space-y-5">
              <SectionTitle icon={<User size={16} />} title="بيانات المدير ورسالته" subtitle="تظهر في صفحة عن المدرسة والموقع العام" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="اسم المدير">
                  <Input value={form.principalName} onChange={f('principalName')} placeholder="د. أحمد محمد العبدلي" />
                </FormField>
                <FormField label="المسمى الوظيفي">
                  <Input value={form.principalTitle} onChange={f('principalTitle')} placeholder="مدير المدرسة" />
                </FormField>
                <FormField label="هاتف المدير">
                  <Input type="tel" value={form.principalPhone} onChange={f('principalPhone')} placeholder="+968 XXXX XXXX" />
                </FormField>
                <FormField label="بريد المدير الإلكتروني">
                  <Input type="email" value={form.principalEmail} onChange={f('principalEmail')} placeholder="principal@school.edu.om" />
                </FormField>
              </div>
              <FormField label="رابط صورة المدير">
                <Input type="url" value={form.principalImage} onChange={f('principalImage')} placeholder="https://..." />
                {form.principalImage && (
                  <div className="mt-3 flex items-center gap-4">
                    <img src={form.principalImage} alt="المدير"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-200 shadow"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    <div className="text-xs text-gray-400">
                      <p className="font-bold text-gray-600">{form.principalName || 'اسم المدير'}</p>
                      <p>{form.principalTitle || 'المسمى الوظيفي'}</p>
                    </div>
                  </div>
                )}
              </FormField>
              <FormField label="كلمة المدير">
                <Textarea value={form.principalMessage} onChange={f('principalMessage')} placeholder="كلمة المدير التي تظهر في الموقع العام..." style={{ minHeight: '150px' }} />
              </FormField>
            </div>
          )}

          {tab === 'social' && (
            <div className="card space-y-5">
              <SectionTitle icon={<Globe size={16} />} title="حسابات التواصل الاجتماعي" subtitle="روابط الحسابات الظاهرة في ذيل الموقع العام" />
              <div className="space-y-3">
                <SocialInput icon={<Globe size={18} className="text-pink-500" />} label="انستقرام" value={form.instagram} onChange={f('instagram')} placeholder="https://instagram.com/school" />
                <SocialInput icon={<Globe size={18} className="text-sky-500" />} label="تويتر / X" value={form.twitter} onChange={f('twitter')} placeholder="https://twitter.com/school" />
                <SocialInput icon={<Globe size={18} className="text-blue-600" />} label="فيسبوك" value={form.facebook} onChange={f('facebook')} placeholder="https://facebook.com/school" />
                <SocialInput icon={<Globe size={18} className="text-red-600" />} label="يوتيوب" value={form.youtube} onChange={f('youtube')} placeholder="https://youtube.com/@school" />
                <SocialInput icon={<Globe size={18} className="text-yellow-500" />} label="سناب شات" value={form.snapchat} onChange={f('snapchat')} placeholder="https://snapchat.com/add/school" />
                <SocialInput icon={<Globe size={18} className="text-gray-700" />} label="تيك توك" value={form.tiktok} onChange={f('tiktok')} placeholder="https://tiktok.com/@school" />
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-2"><Link size={12} />الروابط تظهر في قسم التواصل الاجتماعي بذيل الموقع العام للمدرسة</p>
              </div>
            </div>
          )}

          {tab === 'links' && (
            <div className="card space-y-5">
              <SectionTitle icon={<Image size={16} />} title="الصور والروابط المرئية" subtitle="الصور التي تظهر في الصفحة الرئيسية وصفحة عن المدرسة" />
              <FormField label="صورة الغلاف الرئيسية (Hero)">
                <Input type="url" value={form.heroImage} onChange={f('heroImage')} placeholder="https://images.unsplash.com/..." />
                {form.heroImage && (
                  <img src={form.heroImage} alt="الغلاف" className="mt-2 h-36 w-full object-cover rounded-xl border border-gray-200"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                )}
              </FormField>
              <FormField label="رابط الشعار (Logo URL)">
                <Input type="url" value={form.logoUrl} onChange={f('logoUrl')} placeholder="https://..." />
                {form.logoUrl && (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <img src={form.logoUrl} alt="الشعار" className="h-16 w-16 object-contain rounded-xl"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                    <p className="text-xs text-gray-400">معاينة الشعار</p>
                  </div>
                )}
              </FormField>
              <FormField label="لون القسم الرئيسي (Hex)">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.bannerColor || '#064e3b'}
                    onChange={e => setForm(p => ({ ...p, bannerColor: e.target.value }))}
                    className="w-12 h-10 rounded-xl cursor-pointer border-0" />
                  <Input value={form.bannerColor} onChange={f('bannerColor')} placeholder="#064e3b" />
                </div>
              </FormField>
            </div>
          )}

          {/* Bottom save */}
          <div className="mt-4 flex justify-end">
            <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
              className={`px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg ${saved ? 'bg-green-500 text-white' : 'btn-primary'}`}>
              {saveMut.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
               saved ? <CheckCircle size={16} /> : <Save size={16} />}
              {saveMut.isPending ? 'جارٍ الحفظ...' : saved ? 'تم الحفظ!' : 'حفظ الإعدادات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
