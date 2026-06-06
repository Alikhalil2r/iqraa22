import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useLocalize } from '../../hooks/useLocalize'
import { useLanguage } from '../../context/LanguageContext'
import PublicPageBanner from '../../components/PublicPageBanner'
import { School, Eye, Heart, Calendar, Layers, MapPin, Award, Users, Camera, X, BookOpen, Lightbulb, Shield, Globe, Star } from 'lucide-react'
import { DEMO_STAFF, DEMO_GALLERY, withDemoFallback } from '../../data/demoPublicFallback'

const DEFAULT_STAFF = DEMO_STAFF.map(s => ({
  id: s.id, name: s.name, role: s.position, category: s.department, image: s.photo, quote: s.bio || '',
}))

const VALUES = [
  { icon: BookOpen, title: 'التميز الأكاديمي', desc: 'مناهج متطورة وكوادر متخصصة.', color: '#6366f1' },
  { icon: Shield, title: 'القيم الإسلامية', desc: 'هوية وطنية عُمانية أصيلة.', color: '#10b981' },
  { icon: Lightbulb, title: 'الابتكار', desc: 'تفكير نقدي وروح مبادرة.', color: '#f59e0b' },
  { icon: Globe, title: 'الانفتاح العالمي', desc: 'معايير دولية ولغات.', color: '#0ea5e9' },
  { icon: Users, title: 'الشراكة المجتمعية', desc: 'تواصل مع الأسرة والمجتمع.', color: '#8b5cf6' },
  { icon: Star, title: 'التطوير المستمر', desc: 'تحسين مستدام للتعليم.', color: '#f97316' },
]

const TIMELINE = [
  { year: '2015', title: 'التأسيس', desc: 'افتتاح المدرسة' },
  { year: '2019', title: 'شهادة الجودة', desc: 'اعتماد وزارة التربية' },
  { year: '2025', title: 'عقد من التميز', desc: 'عشر سنوات من العطاء' },
]

function StaffSection({ staff }: { staff: typeof DEFAULT_STAFF }) {
  const { t } = useLanguage()
  return (
    <div className="mb-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-gray-900">{t('site.page.about.staffTitle')}</h2>
        <p className="text-gray-500 text-sm mt-2">{t('site.page.about.staffSub')}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {staff.map(member => (
          <div key={member.id} className="bg-white rounded-2xl overflow-hidden shadow-lg">
            <img src={member.image} alt={member.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-black text-sm">{member.name}</h3>
              <p className="text-emerald-600 text-xs font-bold">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AboutPage() {
  const { t } = useLanguage()
  const { pick, dirClass, category } = useLocalize()
  const { data: schoolData } = useQuery({ queryKey: ['public-school'], queryFn: () => publicApi.school().then(r => r.data) })
  const { data: staffApiData } = useQuery({ queryKey: ['public-staff'], queryFn: () => publicApi.staff().then(r => r.data) })
  const { data: galleryData } = useQuery({ queryKey: ['public-gallery'], queryFn: () => publicApi.gallery().then(r => r.data) })
  const school = schoolData?.school
  const staff = (staffApiData?.staff?.length ? staffApiData.staff : DEMO_STAFF).map((s: any) => ({ id: s.id, name: s.name, role: s.position || '', category: 'أكاديمي', image: s.photo || '', quote: s.bio || '' }))
  const photos = useMemo(() => withDemoFallback(galleryData?.gallery, DEMO_GALLERY).map((g: any) => ({
    id: g.id, src: g.image_url, caption: pick(g.title, g.title_en), category: category(g.category, g.category_en) || 'عام',
  })), [galleryData, pick, category])

  return (
    <div className={dirClass}>
      <PublicPageBanner title={t('site.page.about.title')} subtitle={t('site.page.about.subtitle')} icon={<School size={40} />} />
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="p-8 rounded-3xl border-2 border-emerald-200 bg-emerald-50">
            <h3 className="text-xl font-black text-emerald-800 mb-3">{t('site.page.about.vision')}</h3>
            <p className="text-gray-700 text-start">{pick(school?.vision, school?.visionEn) || pick(school?.aboutText, school?.aboutTextEn, t('site.home.welcomeFallback'))}</p>
          </div>
          <div className="p-8 rounded-3xl border-2 border-amber-200 bg-amber-50">
            <h3 className="text-xl font-black text-amber-800 mb-3">{t('site.page.about.mission')}</h3>
            <p className="text-gray-700 text-start">{pick(school?.mission, school?.missionEn)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-16">
          {VALUES.map(v => (
            <div key={v.title} className="bg-white rounded-2xl p-5 border border-gray-100">
              <v.icon size={22} style={{ color: v.color }} />
              <h4 className="font-black text-sm mt-3 mb-1">{v.title}</h4>
              <p className="text-xs text-gray-500">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4 mb-16">
          {TIMELINE.map(item => (
            <div key={item.year} className="bg-white rounded-2xl p-5 border border-gray-100">
              <span className="text-xs font-black text-emerald-600">{item.year}</span>
              <h4 className="font-black mt-1">{item.title}</h4>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
        <StaffSection staff={staff.length ? staff : DEFAULT_STAFF} />
        {photos.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-center mb-6">{t('site.page.about.photosTitle')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map(p => (
                <div key={p.id} className="rounded-2xl overflow-hidden aspect-[4/3]">
                  <img src={p.src} alt={p.caption} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
