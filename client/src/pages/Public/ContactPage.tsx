import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { buildSocialLinks } from '../../utils/socialLinks'
import { resolveMapEmbedSrc } from '../../utils/mapEmbed'
import { useLanguage } from '../../context/LanguageContext'
import { useLocalize } from '../../hooks/useLocalize'
import { publicContent, CONTACT_SUBJECTS, OFFICE_HOURS } from '../../i18n/publicContent'
import PublicPageBanner from '../../components/PublicPageBanner'
import { Mail, Phone, MapPin, Send, Clock, ChevronDown, CheckCircle, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import ServiceQualityStrip from '../../components/ServiceQualityStrip'
import { usePublicSchool } from '../../context/PublicSchoolContext'

const SOCIAL_COLORS: Record<string, string> = {
  whatsapp: '#25D366', facebook: '#1877F2', instagram: '#E4405F', youtube: '#FF0000', twitter: '#000000',
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 gap-4 hover:bg-gray-50 text-start">
        <span className="font-bold text-gray-800 text-sm">{q}</span>
        <ChevronDown size={18} className={`text-emerald-600 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3 text-start">{a}</p>}
    </div>
  )
}

export default function ContactPage() {
  const { t, lang } = useLanguage()
  const { pick, dirClass } = useLocalize()
  const { slug, query: schoolQuery } = usePublicSchool()
  const subjects = publicContent(lang, CONTACT_SUBJECTS)
  const { data: schoolData } = useQuery({
    queryKey: ['public-school', slug],
    queryFn: () => publicApi.schoolBySlug(slug).then(r => r.data).catch(() => publicApi.school().then(r => r.data)),
  })
  const { data: faqsData } = useQuery({ queryKey: ['public-faqs', slug], queryFn: () => publicApi.faqs(schoolQuery).then(r => r.data) })
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: subjects[0] || '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sentRef, setSentRef] = useState<string | null>(null)
  const school = schoolData?.school
  const socialLinks = buildSocialLinks(school?.social)
  const mapSrc = resolveMapEmbedSrc(school?.mapEmbed)
  const faqs = (faqsData?.faqs || []).map((f: { question: string; question_en?: string; answer: string; answer_en?: string }) => ({
    q: pick(f.question, f.question_en), a: pick(f.answer, f.answer_en),
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(t('site.contact.requiredFields'))
      return
    }
    setLoading(true)
    setSentRef(null)
    try {
      const res = await publicApi.submitContact({ ...form, schoolSlug: slug })
      setSentRef(res.data?.ref || null)
      toast.success(t('site.contact.sentTitle'))
      setForm(f => ({ ...f, message: '', subject: subjects[0] || '' }))
    } catch {
      toast.error(t('site.contact.requiredFields'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={dirClass}>
      <PublicPageBanner
        title={t('site.page.contact.title')}
        subtitle={t('site.contact.bannerSub')}
        icon={<Mail size={40} />}
      />
      <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 space-y-6">
          <ServiceQualityStrip variant="compact" />
          {sentRef && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex gap-3">
              <CheckCircle className="text-emerald-600 flex-shrink-0" size={24} />
              <div>
                <p className="font-black text-emerald-900">{t('site.contact.sentTitle')}</p>
                <p className="text-sm text-emerald-800 mt-1">{t('site.contact.sentSub')}</p>
                <p className="text-xs font-mono mt-2 text-emerald-700">{t('site.contact.refLabel')}: {sentRef}</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 sm:p-8 space-y-4">
            <div>
              <h2 className="font-black text-gray-900">{t('site.contact.formTitle')}</h2>
              <p className="text-xs text-gray-400 mt-1">{t('site.contact.formSub')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">{t('site.contact.nameLabel')}</label>
                <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('site.contact.namePh')} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">{t('site.contact.phoneLabel')}</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+968 ..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" dir="ltr" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">{t('site.contact.emailLabel')}</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">{t('site.contact.subjectLabel')}</label>
              <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white">
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">{t('site.contact.messageLabel')}</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder={t('site.contact.messagePh')} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-800 transition-colors">
              <Send size={16} /> {loading ? t('site.contact.submitting') : t('site.contact.submit')}
            </button>
          </form>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-6 text-white space-y-4 shadow-xl">
            <h3 className="font-black text-lg">{t('site.contact.locationTitle')}</h3>
            <p className="flex items-start gap-2 text-sm text-emerald-100"><Phone size={16} className="mt-0.5 flex-shrink-0" /><span>{school?.phone || '+968 24 500 000'}</span></p>
            <p className="flex items-start gap-2 text-sm text-emerald-100"><Mail size={16} className="mt-0.5 flex-shrink-0" /><span>{school?.email || 'info@alnoor-school.om'}</span></p>
            <p className="flex items-start gap-2 text-sm text-emerald-100"><MapPin size={16} className="mt-0.5 flex-shrink-0" /><span>{school?.address || t('site.location')}</span></p>
            <p className="flex items-start gap-2 text-sm text-emerald-100"><Clock size={16} className="mt-0.5 flex-shrink-0" /><span>{pick(school?.officeHours, school?.officeHoursEn, publicContent(lang, OFFICE_HOURS))}</span></p>
          </div>
          {socialLinks.length > 0 && (
            <div className="bg-white rounded-2xl border p-5">
              <p className="text-xs font-black text-gray-500 mb-3">{t('site.contact.socialTitle')}</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(s => (
                  <a key={s.platform} href={s.url} target="_blank" rel="noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:scale-105"
                    style={{ background: SOCIAL_COLORS[s.platform] || '#10b981' }}>
                    {s.platform}
                  </a>
                ))}
              </div>
            </div>
          )}
          {mapSrc && (
            <div className="rounded-2xl overflow-hidden border shadow-sm">
              <iframe title={t('site.contact.mapTitle')} src={mapSrc} className="w-full h-52 border-0" loading="lazy" />
              <a href={`https://maps.google.com/?q=${encodeURIComponent(school?.address || '')}`} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
                <ExternalLink size={14} /> {t('site.contact.openMaps')}
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black mb-3">{t('site.contact.faqBadge')}</span>
          <h2 className="text-2xl font-black text-gray-900">
            {t('site.contact.faqTitle')} <span className="text-emerald-600">{t('site.contact.faqTitleHighlight')}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-2">{t('site.contact.faqSub')}</p>
        </div>
        {faqs.length > 0 ? (
          <div className="space-y-3">{faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}</div>
        ) : (
          <p className="text-center text-gray-400 text-sm">{t('site.contact.faqEmpty')}</p>
        )}
      </div>
    </div>
  )
}
