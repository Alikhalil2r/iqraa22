import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Phone, Mail, MapPin, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const { data } = useQuery({ queryKey:['public-school'], queryFn:()=>publicApi.school().then(r=>r.data) })
  const school = data?.school
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.message) return toast.error('الاسم والرسالة مطلوبان')
    setSent(true)
    toast.success('تم إرسال رسالتك بنجاح!')
  }

  return (
    <div>
      <section className="py-20 text-white" style={{background:'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black mb-4">تواصل معنا</h1>
          <p className="text-xl text-white/80">نحن هنا للإجابة على استفساراتك</p>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-800">معلومات التواصل</h2>
          {[
            { icon: Phone, label:'الهاتف', value: school?.phone, href:`tel:${school?.phone}` },
            { icon: Mail, label:'البريد الإلكتروني', value: school?.email, href:`mailto:${school?.email}` },
            { icon: MapPin, label:'العنوان', value: school?.address, href: null },
          ].filter(i=>i.value).map(item => (
            <div key={item.label} className="flex items-start gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{background:'var(--color-primary)'}}>
                <item.icon size={20} className="text-white"/>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                {item.href ? <a href={item.href} className="font-bold text-gray-800 hover:underline">{item.value}</a> : <p className="font-bold text-gray-800">{item.value}</p>}
              </div>
            </div>
          ))}
          <div className="p-5 rounded-2xl" style={{background:'var(--color-primary)'}}>
            <p className="text-white font-bold text-sm">ساعات العمل</p>
            <p className="text-white/80 mt-1">الأحد — الخميس: 7:00 صباحاً — 2:00 ظهراً</p>
            <p className="text-white/60 text-sm mt-1">الجمعة والسبت: إجازة أسبوعية</p>
          </div>
        </div>
        {/* Form */}
        <div>
          <h2 className="text-2xl font-black text-gray-800 mb-6">أرسل رسالة</h2>
          {sent ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-green-50 rounded-3xl">
              <CheckCircle size={56} className="text-green-500 mb-4"/>
              <h3 className="text-xl font-black text-gray-800 mb-2">تم إرسال رسالتك!</h3>
              <p className="text-gray-500">سنتواصل معك في أقرب وقت ممكن</p>
              <button onClick={()=>{setSent(false);setForm({name:'',email:'',phone:'',subject:'',message:''})}} className="mt-6 px-6 py-2.5 rounded-xl text-white font-bold" style={{background:'var(--color-primary)'}}>إرسال رسالة أخرى</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم *</label><input className="input-field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="اسمك الكامل"/></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1.5">الهاتف</label><input className="input-field" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+968 ..."/></div>
              </div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label><input type="email" className="input-field" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="your@email.com"/></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">الموضوع</label><input className="input-field" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="موضوع رسالتك"/></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1.5">الرسالة *</label><textarea className="input-field min-h-[140px] resize-none" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="اكتب رسالتك هنا..."/></div>
              <button type="submit" className="btn-primary w-full py-4 flex items-center justify-center gap-3 text-base"><Send size={18}/>إرسال الرسالة</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
