import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { submissionsApi } from '../../api/client'
import toast from 'react-hot-toast'
import { Mail, Briefcase, GraduationCap, Clock, ChevronDown, ClipboardList } from 'lucide-react'

type Tab = 'contact' | 'admissions' | 'jobs' | 'alumni'

const isAdmission = (s: { subject?: string }) => (s.subject || '').includes('تسجيل')

const CONTACT_STATUS: Record<string, string> = { new: 'جديد', read: 'مقروء', replied: 'تم الرد', archived: 'مؤرشف' }
const JOB_STATUS: Record<string, string> = { new: 'جديد', reviewing: 'قيد المراجعة', shortlisted: 'مرشح', rejected: 'مرفوض', hired: 'مقبول', archived: 'مؤرشف' }
const ALUMNI_STATUS: Record<string, string> = { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-OM', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusSelect({ value, options, onChange }: { value: string; options: Record<string, string>; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none text-xs font-bold px-3 py-1.5 pr-7 rounded-lg border border-gray-200 bg-white focus:border-emerald-400 outline-none">
        {Object.entries(options).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
      </select>
      <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

export default function SubmissionsAdmin() {
  const [tab, setTab] = useState<Tab>('contact')
  const qc = useQueryClient()

  const { data: counts } = useQuery({ queryKey: ['submission-counts'], queryFn: () => submissionsApi.counts().then(r => r.data) })

  const { data: contactData, isLoading: loadingContact } = useQuery({
    queryKey: ['submissions-contact'],
    queryFn: () => submissionsApi.contact().then(r => r.data),
    enabled: tab === 'contact' || tab === 'admissions',
  })
  const { data: jobsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['submissions-jobs'],
    queryFn: () => submissionsApi.jobs().then(r => r.data),
    enabled: tab === 'jobs',
  })
  const { data: alumniData, isLoading: loadingAlumni } = useQuery({
    queryKey: ['submissions-alumni'],
    queryFn: () => submissionsApi.alumni().then(r => r.data),
    enabled: tab === 'alumni',
  })

  const updateContact = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => submissionsApi.updateContact(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['submissions-contact'] }); qc.invalidateQueries({ queryKey: ['submission-counts'] }); toast.success('تم التحديث') },
  })
  const updateJob = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => submissionsApi.updateJob(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['submissions-jobs'] }); qc.invalidateQueries({ queryKey: ['submission-counts'] }); toast.success('تم التحديث') },
  })
  const updateAlumni = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => submissionsApi.updateAlumni(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['submissions-alumni'] }); qc.invalidateQueries({ queryKey: ['submission-counts'] }); qc.invalidateQueries({ queryKey: ['public-alumni'] }); toast.success('تم التحديث') },
  })

  const allContact = contactData?.submissions || []
  const contactOnly = allContact.filter((s: { subject?: string }) => !isAdmission(s))
  const admissionList = allContact.filter((s: { subject?: string }) => isAdmission(s))

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'contact', label: 'رسائل التواصل', icon: <Mail size={16} />, count: counts?.contact },
    { id: 'admissions', label: 'طلبات التسجيل', icon: <ClipboardList size={16} />, count: counts?.admissions },
    { id: 'jobs', label: 'طلبات التوظيف', icon: <Briefcase size={16} />, count: counts?.jobs },
    { id: 'alumni', label: 'تسجيل الخريجين', icon: <GraduationCap size={16} />, count: counts?.alumni },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">طلبات الموقع العام</h1>
        <p className="text-sm text-gray-500 mt-1">رسائل التواصل، طلبات التوظيف، وتسجيل الخريجين</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.icon}{t.label}
            {t.count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.id ? 'bg-white/20' : 'bg-red-500 text-white'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'contact' && (
        <div className="space-y-3">
          {loadingContact ? <p className="text-gray-400 text-sm">جاري التحميل...</p> : null}
          {contactOnly.map((s: any) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-black text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500" dir="ltr">{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} />{formatDate(s.created_at)}</span>
                  <StatusSelect value={s.status} options={CONTACT_STATUS} onChange={status => updateContact.mutate({ id: s.id, status })} />
                </div>
              </div>
              {s.subject && <p className="text-xs font-bold text-emerald-700 mb-2">{s.subject}</p>}
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{s.message}</p>
            </div>
          ))}
          {!loadingContact && !contactOnly.length && <p className="text-center text-gray-400 py-12">لا توجد رسائل</p>}
        </div>
      )}

      {tab === 'admissions' && (
        <div className="space-y-3">
          {loadingContact ? <p className="text-gray-400 text-sm">جاري التحميل...</p> : null}
          {admissionList.map((s: any) => (
            <div key={s.id} className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-black text-gray-900">{s.name} <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mr-1">تسجيل</span></p>
                  <p className="text-xs text-gray-500" dir="ltr">{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} />{formatDate(s.created_at)}</span>
                  <StatusSelect value={s.status} options={CONTACT_STATUS} onChange={status => updateContact.mutate({ id: s.id, status })} />
                </div>
              </div>
              {s.subject && <p className="text-xs font-bold text-amber-700 mb-2">{s.subject}</p>}
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{s.message}</p>
            </div>
          ))}
          {!loadingContact && !admissionList.length && <p className="text-center text-gray-400 py-12">لا توجد طلبات تسجيل</p>}
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-3">
          {loadingJobs ? <p className="text-gray-400 text-sm">جاري التحميل...</p> : null}
          {(jobsData?.applications || []).map((a: any) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-black text-gray-900">{a.applicant_name}</p>
                  <p className="text-sm text-sky-700 font-bold">{a.job_title}</p>
                  <p className="text-xs text-gray-500" dir="ltr">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} />{formatDate(a.created_at)}</span>
                  <StatusSelect value={a.status} options={JOB_STATUS} onChange={status => updateJob.mutate({ id: a.id, status })} />
                </div>
              </div>
              {a.form_data && (
                <details className="mt-3">
                  <summary className="text-xs font-bold text-gray-500 cursor-pointer hover:text-emerald-600">عرض تفاصيل الطلب</summary>
                  <pre className="mt-2 text-[11px] bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-600">{JSON.stringify(a.form_data, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
          {!loadingJobs && !(jobsData?.applications?.length) && <p className="text-center text-gray-400 py-12">لا توجد طلبات توظيف</p>}
        </div>
      )}

      {tab === 'alumni' && (
        <div className="space-y-3">
          {loadingAlumni ? <p className="text-gray-400 text-sm">جاري التحميل...</p> : null}
          {(alumniData?.registrations || []).map((r: any) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-black text-gray-900">{r.name} <span className="text-xs text-amber-600 font-bold">دفعة {r.graduation_year}</span></p>
                  <p className="text-sm text-indigo-700 font-bold">{r.job_title}</p>
                  <p className="text-xs text-gray-500">{r.city}{r.city && r.email ? ' · ' : ''}<span dir="ltr">{r.email}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} />{formatDate(r.created_at)}</span>
                  <StatusSelect value={r.status} options={ALUMNI_STATUS} onChange={status => updateAlumni.mutate({ id: r.id, status })} />
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">{r.story}</p>
              {r.achievement && <p className="text-xs font-bold text-amber-700 mt-2">🏆 {r.achievement}</p>}
            </div>
          ))}
          {!loadingAlumni && !(alumniData?.registrations?.length) && <p className="text-center text-gray-400 py-12">لا توجد تسجيلات خريجين</p>}
        </div>
      )}
    </div>
  )
}
