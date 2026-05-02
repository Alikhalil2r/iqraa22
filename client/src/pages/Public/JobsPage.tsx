import React, { useState, useCallback, useEffect } from 'react'
import { Briefcase, FileUp, User, Phone, GraduationCap, Send, ChevronRight, CheckCircle2, Shield, Handshake, BadgeCheck, Calendar, X } from 'lucide-react'
import toast from 'react-hot-toast'

function PageBanner({ title, subtitle, icon, gradient = 'from-sky-800 to-sky-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const JOBS = [
  { id: 1, title: 'معلم رياضيات - مرحلة ثانوية', department: 'أكاديمي', type: 'دوام كامل', deadline: '2025-03-31', requirements: 'بكالوريوس رياضيات + دبلوم تربوي، خبرة 3 سنوات على الأقل', description: 'تدريس مادة الرياضيات للصفوف 10-12، المشاركة في الأنشطة والتصحيح', active: true },
  { id: 2, title: 'معلمة علوم - مرحلة إعدادية', department: 'أكاديمي', type: 'دوام كامل', deadline: '2025-04-15', requirements: 'بكالوريوس علوم، خبرة 2 سنة فأكثر، إجادة العربية والإنجليزية', description: 'تدريس العلوم للصفوف 7-9 وإدارة مختبر العلوم', active: true },
  { id: 3, title: 'مرشد طلابي اجتماعي', department: 'اجتماعي', type: 'دوام كامل', deadline: '2025-03-25', requirements: 'بكالوريوس علم النفس أو الخدمة الاجتماعية', description: 'متابعة شؤون الطلاب الاجتماعية والنفسية والتنسيق مع الأسر', active: true },
  { id: 4, title: 'منسق أنشطة لاصفية', department: 'النشاط', type: 'دوام جزئي', deadline: '2025-04-01', requirements: 'خبرة في تنظيم الفعاليات، القدرة على إدارة المشاريع الطلابية', description: 'تخطيط وتنفيذ الأنشطة والفعاليات المدرسية اللاصفية', active: true },
]

const emptyForm = {
  name: '', nationality: '', idNumber: '', dob: '', gender: '', maritalStatus: '',
  city: '', address: '', email: '', phone: '', whatsapp: '',
  education: '', university: '', graduationYear: '', gpa: '', specialization: '',
  teachingCert: '', otherCerts: '', experience: '', experienceYears: '',
  lastSchool: '', lastPosition: '', gradesTaught: '', subjectsTaught: '',
  skills: '', computerSkills: '', languages: '', currentJob: '',
  expectedSalary: '', availability: '', coverLetter: '', referral: ''
}

function Section({ title, icon, children }: any) {
  return (
    <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
      <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-emerald-700 border-b border-gray-200 pb-2">{icon}{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, req, children }: any) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1 text-gray-600">{label}{req && <span className="text-red-500"> *</span>}</label>
      {children}
    </div>
  )
}

const inp = "w-full p-3 rounded-xl border text-sm border-gray-200 focus:border-sky-400 outline-none"
const sel = "w-full p-3 rounded-xl border text-sm border-gray-200 focus:border-sky-400 outline-none bg-white"

export default function JobsPage() {
  const [selected, setSelected] = useState<typeof JOBS[0] | null>(null)
  const [applying, setApplying] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitted, setSubmitted] = useState(false)
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, op: '+', answer: '', correct: 0 })
  const [captchaVerified, setCaptchaVerified] = useState(false)

  const F = (k: string) => (e: React.ChangeEvent<any>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const genCaptcha = useCallback(() => {
    const ops = ['+', '-', '×']
    const op = ops[Math.floor(Math.random() * 3)]
    let a = 0, b = 0, correct = 0
    if (op === '+') { a = Math.floor(Math.random() * 20) + 1; b = Math.floor(Math.random() * 20) + 1; correct = a + b }
    else if (op === '-') { a = Math.floor(Math.random() * 20) + 10; b = Math.floor(Math.random() * a); correct = a - b }
    else { a = Math.floor(Math.random() * 9) + 2; b = Math.floor(Math.random() * 9) + 2; correct = a * b }
    setCaptcha({ a, b, op, answer: '', correct })
    setCaptchaVerified(false)
  }, [])

  useEffect(() => { genCaptcha() }, [genCaptcha])

  const verifyCaptcha = () => {
    if (parseInt(captcha.answer) === captcha.correct) {
      setCaptchaVerified(true)
      toast.success('تم التحقق بنجاح ✓')
    } else {
      toast.error('الإجابة خاطئة، حاول مرة أخرى')
      genCaptcha()
    }
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.education || !form.nationality || !form.specialization || !form.city) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة (*)')
      return
    }
    if (!captchaVerified) { toast.error('يرجى إكمال التحقق أولاً'); return }
    setSubmitted(true)
    toast.success('تم إرسال طلبك بنجاح!')
  }

  if (submitted) return (
    <div>
      <PageBanner title="التوظيف" subtitle="الوظائف الشاغرة" icon={<Briefcase size={36} />} />
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={40} className="text-emerald-600" /></div>
        <h2 className="text-2xl font-black mb-3 text-gray-900">تم إرسال طلبك بنجاح!</h2>
        <p className="mb-6 text-gray-600">سيقوم فريق الموارد البشرية بمراجعة طلبك والتواصل معك قريباً.</p>
        <button onClick={() => { setSubmitted(false); setApplying(false); setSelected(null); setForm(emptyForm) }} className="bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-800 transition">العودة للوظائف</button>
      </div>
    </div>
  )

  if (applying && selected) return (
    <div>
      <PageBanner title={`التقديم: ${selected.title}`} subtitle={`${selected.department} — ${selected.type}`} icon={<FileUp size={36} />} />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <button onClick={() => setApplying(false)} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 transition">
          <ChevronRight size={16} /> العودة إلى قائمة الوظائف
        </button>
        <div className="p-8 rounded-3xl shadow-xl bg-white border-t-4 border-sky-600">
          <h3 className="text-xl font-black mb-1 text-gray-900">نموذج التقديم</h3>
          <p className="text-sm mb-6 text-gray-500">الحقول (<span className="text-red-500">*</span>) مطلوبة</p>
          <form onSubmit={handleApply} className="space-y-6">
            <Section title="المعلومات الشخصية" icon={<User size={16} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="الاسم الرباعي" req><input value={form.name} onChange={F('name')} required placeholder="الاسم الأول والأب والجد والعائلة" className={inp} /></Field>
                <Field label="الجنسية" req>
                  <select value={form.nationality} onChange={F('nationality')} required className={sel}>
                    <option value="">اختر</option>
                    {['عُمانية','أردنية','مصرية','سودانية','تونسية','سورية','فلسطينية','عراقية','يمنية','هندية','أخرى'].map(n => <option key={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="رقم الهوية / جواز السفر"><input value={form.idNumber} onChange={F('idNumber')} className={inp} dir="ltr" /></Field>
                <Field label="تاريخ الميلاد"><input type="date" value={form.dob} onChange={F('dob')} className={inp} /></Field>
                <Field label="الجنس">
                  <select value={form.gender} onChange={F('gender')} className={sel}><option value="">اختر</option><option>ذكر</option><option>أنثى</option></select>
                </Field>
                <Field label="الحالة الاجتماعية">
                  <select value={form.maritalStatus} onChange={F('maritalStatus')} className={sel}><option value="">اختر</option><option>أعزب/عزباء</option><option>متزوج/ة</option></select>
                </Field>
                <Field label="المدينة / الولاية" req><input value={form.city} onChange={F('city')} required placeholder="مثال: صور، مسقط..." className={inp} /></Field>
                <div className="md:col-span-2"><Field label="العنوان التفصيلي"><input value={form.address} onChange={F('address')} placeholder="المنطقة، الشارع..." className={inp} /></Field></div>
              </div>
            </Section>

            <Section title="معلومات التواصل" icon={<Phone size={16} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="البريد الإلكتروني" req><input type="email" value={form.email} onChange={F('email')} required className={inp} dir="ltr" /></Field>
                <Field label="رقم الهاتف" req><input value={form.phone} onChange={F('phone')} required placeholder="+968 XXXX XXXX" className={inp} dir="ltr" /></Field>
                <Field label="رقم الواتساب"><input value={form.whatsapp} onChange={F('whatsapp')} placeholder="إن وجد" className={inp} dir="ltr" /></Field>
              </div>
            </Section>

            <Section title="المؤهلات العلمية" icon={<GraduationCap size={16} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="المؤهل العلمي" req>
                  <select value={form.education} onChange={F('education')} required className={sel}>
                    <option value="">اختر</option>
                    {['دبلوم عالي','بكالوريوس','بكالوريوس + دبلوم تربوي','ماجستير','دكتوراه'].map(e => <option key={e}>{e}</option>)}
                  </select>
                </Field>
                <Field label="التخصص الدقيق" req><input value={form.specialization} onChange={F('specialization')} required placeholder="مثال: رياضيات، فيزياء..." className={inp} /></Field>
                <Field label="الجامعة / الكلية"><input value={form.university} onChange={F('university')} className={inp} /></Field>
                <Field label="سنة التخرج"><input type="number" value={form.graduationYear} onChange={F('graduationYear')} placeholder="2020" min="1980" max="2026" className={inp} /></Field>
                <Field label="المعدل التراكمي"><input value={form.gpa} onChange={F('gpa')} placeholder="مثال: 3.8/4" className={inp} /></Field>
                <Field label="الشهادات التربوية"><input value={form.teachingCert} onChange={F('teachingCert')} placeholder="دبلوم تربوي، CELTA..." className={inp} /></Field>
              </div>
            </Section>

            <Section title="الخبرات المهنية" icon={<Briefcase size={16} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="لديك خبرة تدريسية؟">
                  <select value={form.experience} onChange={F('experience')} className={sel}><option value="">اختر</option><option>نعم</option><option>لا (خريج جديد)</option></select>
                </Field>
                <Field label="سنوات الخبرة"><input type="number" value={form.experienceYears} onChange={F('experienceYears')} placeholder="مثال: 3" min="0" max="40" className={inp} /></Field>
                <Field label="آخر مدرسة عملت بها"><input value={form.lastSchool} onChange={F('lastSchool')} className={inp} /></Field>
                <Field label="المادة التي درّستها"><input value={form.subjectsTaught} onChange={F('subjectsTaught')} placeholder="الرياضيات، الفيزياء..." className={inp} /></Field>
                <Field label="الصفوف الدراسية"><input value={form.gradesTaught} onChange={F('gradesTaught')} placeholder="مثال: 7-12" className={inp} /></Field>
                <Field label="الراتب المتوقع"><input value={form.expectedSalary} onChange={F('expectedSalary')} placeholder="بالريال العُماني" className={inp} /></Field>
              </div>
            </Section>

            <Section title="مهاراتك وإمكاناتك" icon={<BadgeCheck size={16} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="مهاراتك العامة"><input value={form.skills} onChange={F('skills')} placeholder="مثال: تحليل البيانات، إدارة الوقت..." className={inp} /></Field>
                <Field label="مهارات الحاسب"><input value={form.computerSkills} onChange={F('computerSkills')} placeholder="MS Office, Smartboard..." className={inp} /></Field>
                <Field label="اللغات"><input value={form.languages} onChange={F('languages')} placeholder="العربية، الإنجليزية..." className={inp} /></Field>
                <Field label="موعد الإتاحة للعمل"><input type="date" value={form.availability} onChange={F('availability')} className={inp} /></Field>
              </div>
              <div className="mt-3">
                <Field label="رسالة تعريفية (لماذا تريد الانضمام إلينا؟)">
                  <textarea value={form.coverLetter} onChange={F('coverLetter')} rows={4} placeholder="اكتب هنا ما يميزك ولماذا ترغب في العمل معنا..." className={`${inp} resize-none`} />
                </Field>
              </div>
            </Section>

            {/* CAPTCHA */}
            <div className="border border-amber-200 rounded-2xl p-5 bg-amber-50">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-amber-700"><Shield size={14} /> التحقق من الهوية</h4>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-white border-2 border-amber-200 px-6 py-3 rounded-xl font-black text-lg text-gray-800 shadow-inner">
                  {captcha.a} {captcha.op} {captcha.b} = ?
                </div>
                <input
                  type="number"
                  value={captcha.answer}
                  onChange={e => setCaptcha(c => ({ ...c, answer: e.target.value }))}
                  placeholder="الإجابة"
                  className="w-24 p-3 rounded-xl border border-gray-200 text-center text-lg font-black focus:border-amber-400 outline-none"
                  disabled={captchaVerified}
                />
                {!captchaVerified ? (
                  <button type="button" onClick={verifyCaptcha} className="bg-amber-600 text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-amber-700 transition flex items-center gap-2 shadow-lg">
                    <Shield size={14} /> تحقق
                  </button>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2.5 rounded-xl">
                    <CheckCircle2 size={16} /> تم التحقق ✓
                  </span>
                )}
                <button type="button" onClick={genCaptcha} className="text-gray-400 hover:text-amber-600 text-xs font-bold flex items-center gap-1" title="سؤال جديد">
                  🔄 سؤال جديد
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={!captchaVerified}
                className={`flex-1 py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg ${captchaVerified ? 'bg-sky-700 text-white hover:bg-sky-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                <Send size={16} /> إرسال الطلب
              </button>
              <button type="button" onClick={() => setApplying(false)} className="px-6 py-3.5 rounded-2xl font-bold text-sm border-2 border-gray-200 text-gray-500 hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <PageBanner title="التوظيف" subtitle="انضم إلى فريقنا التعليمي المتميز" icon={<Briefcase size={36} />} />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="p-6 rounded-3xl mb-10 flex items-start gap-4 bg-sky-50 border border-sky-100">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0"><Handshake size={24} /></div>
          <div>
            <h3 className="font-bold mb-1 text-gray-800">نرحب بالكوادر المتميزة</h3>
            <p className="text-sm text-gray-600">استعرض الوظائف الشاغرة وقدّم طلبك إلكترونياً. سيتم التواصل معك من قِبل إدارة الموارد البشرية.</p>
          </div>
        </div>

        {JOBS.filter(j => j.active).length === 0 ? (
          <div className="text-center py-16">
            <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold mb-2 text-gray-500">لا توجد وظائف شاغرة حالياً</h3>
            <p className="text-sm text-gray-400">تابعونا لمعرفة أحدث الفرص الوظيفية</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {JOBS.filter(j => j.active).map(job => (
              <div key={job.id} className="rounded-3xl shadow-lg overflow-hidden border-t-4 border-sky-600 hover:shadow-2xl transition-all hover:-translate-y-1 bg-white flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-lg font-black bg-sky-50 text-sky-700">{job.type}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-lg font-bold bg-gray-100 text-gray-500">{job.department}</span>
                  </div>
                  <h3 className="text-lg font-black mb-2 text-gray-900">{job.title}</h3>
                  <p className="text-sm leading-relaxed mb-4 text-gray-600">{job.description}</p>
                  <div className="text-xs space-y-1.5 text-gray-500">
                    <p className="flex items-start gap-2">
                      <BadgeCheck size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span><span className="font-bold">المتطلبات: </span>{job.requirements}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar size={13} className="text-amber-500 flex-shrink-0" />
                      <span><span className="font-bold">آخر موعد: </span>{new Date(job.deadline).toLocaleDateString('ar-OM')}</span>
                    </p>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <button onClick={() => { setSelected(job); setApplying(true) }} className="w-full bg-sky-700 text-white py-3 rounded-2xl font-bold hover:bg-sky-800 transition flex items-center justify-center gap-2 shadow-lg">
                    <FileUp size={15} /> تقديم الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
