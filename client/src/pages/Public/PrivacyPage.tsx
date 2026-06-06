import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Shield } from 'lucide-react'
import { usePublicSchool } from '../../context/PublicSchoolContext'

export default function PrivacyPage() {
  const { slug } = usePublicSchool()
  const { data } = useQuery({
    queryKey: ['public-school', slug],
    queryFn: () => publicApi.schoolBySlug(slug).then(r => r.data).catch(() => publicApi.school().then(r => r.data)),
  })
  const name = data?.school?.name || 'مدرسة النور العالمية'

  return (
    <div>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16 text-center">
        <Shield size={36} className="mx-auto mb-3 text-amber-400" />
        <h1 className="text-3xl font-black">سياسة الخصوصية</h1>
        <p className="text-white/60 text-sm mt-2">{name}</p>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm text-gray-600 leading-relaxed space-y-6">
        <section>
          <h2 className="text-lg font-black text-gray-900">1. مقدمة</h2>
          <p>نلتزم في {name} بحماية خصوصية زوار موقعنا وأولياء الأمور والطلاب. توضح هذه السياسة كيفية جمع واستخدام وحماية البيانات الشخصية.</p>
        </section>
        <section>
          <h2 className="text-lg font-black text-gray-900">2. البيانات التي نجمعها</h2>
          <p>قد نجمع: الاسم، البريد الإلكتروني، رقم الهاتف، ومعلومات التواصل عند استخدام نماذج الموقع أو بوابة الأولياء. بيانات الطلاب الأكاديمية تُدار عبر أنظمة داخلية آمنة.</p>
        </section>
        <section>
          <h2 className="text-lg font-black text-gray-900">3. استخدام البيانات</h2>
          <p>نستخدم البيانات للرد على الاستفسارات، إدارة التسجيل والقبول، التواصل مع أولياء الأمور، وتحسين خدماتنا التعليمية. لا نبيع بياناتكم لأطراف ثالثة.</p>
        </section>
        <section>
          <h2 className="text-lg font-black text-gray-900">4. التواصل</h2>
          <p>لأي استفسار حول الخصوصية: <Link to="/school/contact" className="text-emerald-600 font-bold">تواصل معنا</Link></p>
        </section>
        <p className="text-xs text-gray-400 pt-4">آخر تحديث: {new Date().toLocaleDateString('ar-OM')}</p>
      </div>
    </div>
  )
}
