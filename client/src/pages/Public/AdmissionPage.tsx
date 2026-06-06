import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { GraduationCap, FileText, Phone, Mail, MapPin, ChevronLeft, Send, User, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import ServiceQualityStrip from '../../components/ServiceQualityStrip'

const STEPS = [
  { n: '1', title: 'تعبئة نموذج التسجيل', desc: 'قدّم طلب التسجيل عبر النموذج أدناه أو زيارة الإدارة' },
  { n: '2', title: 'تقديم الوثائق', desc: 'شهادة الميلاد، صور شخصية، السجل الأكاديمي السابق' },
  { n: '3', title: 'المقابلة والتقييم', desc: 'مقابلة الطالب وولي الأمر مع لجنة القبول' },
  { n: '4', title: 'إعلان النتائج', desc: 'يتم إبلاغكم بالقبول عبر الهاتف أو البريد الإلكتروني' },
]

const GRADES = ['الروضة', 'الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس', 'الصف السابع', 'الصف الثامن', 'الصف التاسع', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر']

export default function AdmissionPage() {
  const { data } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const school = data?.school
  const [form, setForm] = useState({ parentName: '', studentName: '', grade: '', phone: '', email: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [refCode, setRefCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.parentName || !form.studentName || !form.grade || !form.email || !form.phone) {
      return toast.error('يرجى ملء الحقول المطلوبة')
    }
    setLoading(true)
    try {
      const res = await publicApi.submitAdmission({
        parentName: form.parentName,
        studentName: form.studentName,
        grade: form.grade,
        phone: form.phone,
        email: form.email,
        notes: form.notes || undefined,
      })
      const ref = res.data.ref || ''
      setRefCode(ref)
      toast.success(res.data.sla ? `تم الإرسال — ${res.data.sla}` : 'تم إرسال طلب التسجيل بنجاح!')
      setSent(true)
      setForm({ parentName: '', studentName: '', grade: '', phone: '', email: '', notes: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'فشل إرسال الطلب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white py-16 text-center">
        <GraduationCap size={40} className="mx-auto mb-3 text-amber-400" />
        <h1 className="text-3xl md:text-4xl font-black">التسجيل والقبول</h1>
        <p className="text-white/60 text-sm mt-2">انضم إلى عائلة {school?.name || 'مدرستنا'}</p>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-14 space-y-12">
        <ServiceQualityStrip variant="school" />

        <p className="text-gray-600 leading-relaxed text-center max-w-2xl mx-auto">
          نرحب بتسجيل أبنائكم في {school?.name || 'مدرسة النور العالمية'} — مسقط. نوفر تعليماً متميزاً من المرحلة الابتدائية حتى الثانوية.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {STEPS.map(s => (
            <div key={s.n} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center flex-shrink-0">{s.n}</div>
              <div>
                <h3 className="font-black text-gray-900 text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-black text-amber-900 mb-3 flex items-center gap-2"><FileText size={18} /> الوثائق المطلوبة</h3>
          <ul className="text-sm text-amber-900/80 space-y-1.5 list-disc list-inside">
            <li>شهادة الميلاد (أصل + صورة)</li>
            <li>صور شخصية حديثة (4 قطع)</li>
            <li>السجل الأكاديمي أو شهادة آخر صف</li>
            <li>صورة من بطاقة ولي الأمر</li>
            <li>شهادة التطعيمات (للمرحلة الابتدائية)</li>
          </ul>
        </div>

        {/* نموذج التسجيل */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 md:p-8">
          <h3 className="font-black text-gray-900 text-lg mb-1 flex items-center gap-2"><Send size={20} className="text-emerald-600" /> نموذج طلب التسجيل</h3>
          <p className="text-sm text-gray-500 mb-6">يُرسل الطلب مباشرة لإدارة المدرسة ويظهر في لوحة التحكم</p>

          {sent ? (
            <div className="text-center py-8 space-y-4">
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
                <p className="font-black text-emerald-800 mb-2">✓ تم إرسال طلبكم بنجاح</p>
                <p className="text-sm text-emerald-700">سنتواصل معكم خلال 3–5 أيام عمل</p>
              </div>
              {refCode && (
                <div className="submission-ref-box">
                  <p className="text-xs text-emerald-600 font-bold mb-1">رقم مرجعي للمتابعة</p>
                  <p className="ref-code">{refCode}</p>
                  <p className="text-[10px] text-gray-500 mt-2">احتفظ بهذا الرقم عند التواصل مع الإدارة</p>
                </div>
              )}
              <button onClick={() => { setSent(false); setRefCode('') }} className="text-sm font-bold text-emerald-600 hover:underline">إرسال طلب آخر</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">اسم ولي الأمر *</label>
                  <div className="relative">
                    <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })}
                      className="w-full pr-9 p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 outline-none" placeholder="الاسم الكامل" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">اسم الطالب *</label>
                  <input required value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 outline-none" placeholder="اسم الطالب" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">الصف المطلوب *</label>
                  <div className="relative">
                    <BookOpen size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select required value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                      className="w-full pr-9 p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 outline-none bg-white">
                      <option value="">اختر الصف</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-gray-600">رقم الهاتف *</label>
                  <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 outline-none" placeholder="+968 XXXX XXXX" dir="ltr" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-gray-600">البريد الإلكتروني *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 outline-none" placeholder="email@example.com" dir="ltr" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1 text-gray-600">ملاحظات إضافية</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 outline-none resize-none" placeholder="أي معلومات إضافية..." />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white py-3.5 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2">
                <Send size={16} /> {loading ? 'جاري الإرسال...' : 'إرسال طلب التسجيل'}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-6 text-center space-y-4">
          <h3 className="font-black text-gray-900">للاستفسار المباشر</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {school?.phone && <a href={`tel:${school.phone}`} className="flex items-center gap-2 text-emerald-700 font-bold"><Phone size={16} />{school.phone}</a>}
            {school?.email && <a href={`mailto:${school.email}`} className="flex items-center gap-2 text-emerald-700 font-bold"><Mail size={16} />{school.email}</a>}
            {school?.address && <span className="flex items-center gap-2 text-gray-600"><MapPin size={16} />{school.address}</span>}
          </div>
          <Link to="/school/contact" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-emerald-200 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-50 transition">
            صفحة التواصل <ChevronLeft size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
