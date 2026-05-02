import React, { useState } from 'react'
import { PenTool, BookOpen, Users, Tag, Calendar, ChevronLeft } from 'lucide-react'

function PageBanner({ title, subtitle, icon, gradient = 'from-teal-800 to-teal-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

const STUDENT_ARTICLES = [
  { id: 1, student: 'نورة المعمري', grade: 'الصف العاشر', title: 'كيف يمكن للذكاء الاصطناعي أن يحدث ثورة في التعليم؟', content: 'في عالم يتسارع فيه التطور التقني بشكل مذهل، بات الذكاء الاصطناعي حاضراً في كل مناحي حياتنا. من التطبيقات الطبية إلى الصناعية، ووصل الآن إلى قاعات الدراسة. يتساءل كثيرون: كيف سيغير هذا مستقبل التعلم؟...', date: '2025-01-10', category: 'تقنية' },
  { id: 2, student: 'سالم الكندي', grade: 'الصف الحادي عشر', title: 'الحفاظ على اللغة العربية في عصر العولمة', content: 'اللغة هي هوية الإنسان وجسر التواصل بين الثقافات. في زمن العولمة والتواصل الرقمي، تواجه اللغة العربية تحديات جديدة. كيف نحافظ على ثروتنا اللغوية مع الانفتاح على العالم؟...', date: '2025-01-18', category: 'أدب' },
  { id: 3, student: 'مريم الراشدي', grade: 'الصف التاسع', title: 'التوازن بين الدراسة والترفيه في حياة المراهق', content: 'يجد كثير من الطلاب أنفسهم أمام معادلة صعبة: كيف يوازنون بين متطلبات الدراسة والحاجة للترفيه والراحة؟ إن الضغط الأكاديمي المستمر قد يؤثر سلباً على الصحة النفسية...', date: '2025-02-05', category: 'حياة' },
  { id: 4, student: 'خالد الحبسي', grade: 'الصف الثاني عشر', title: 'قراءة في كتاب: طريق الخيار', content: 'كتاب استثنائي يستحق القراءة المتأنية والتأمل العميق. يتناول المؤلف بأسلوب شيق وبسيط أهمية الخيارات التي نتخذها يومياً في تشكيل مصيرنا وهويتنا...', date: '2025-02-12', category: 'مراجعات' },
]

const TEACHERS_ARTICLES = [
  { id: 1, teacher: 'أ. سالم الحبسي', subject: 'رياضيات', title: 'استراتيجيات التفكير الناقد في حل المسائل الرياضية', content: 'التفكير الناقد ليس مجرد مهارة، بل هو أسلوب حياة. في مادة الرياضيات، نستطيع تنمية هذه المهارة من خلال طرق تدريس مبتكرة تعلم الطلاب كيف يسألون، لا فقط كيف يجيبون...', date: '2025-01-15' },
  { id: 2, teacher: 'أ. مريم الراشدي', subject: 'علوم', title: 'التجارب العملية: جسر بين النظرية والتطبيق', content: 'كثيراً ما يتساءل الطلاب: أين نستخدم هذا في الحياة؟ التجارب العملية هي الإجابة المثلى. حين يرى الطالب العلم يحدث أمام عينيه، تتحول المعادلات الجافة إلى حياة نابضة...', date: '2025-02-08' },
]

const SCHOOL_TEAMS = [
  { id: 1, name: 'فريق الروبوت', category: 'تقنية', members: 12, description: 'يمثل المدرسة في مسابقات الروبوت الوطنية والدولية', achievements: 'بطل عُمان 2024 | المركز الثالث خليجياً', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80', color: 'from-sky-500 to-sky-600' },
  { id: 2, name: 'فريق كرة القدم', category: 'رياضة', members: 18, description: 'الفريق الرئيسي للمدرسة في المسابقات الرياضية المحلية', achievements: 'المركز الثاني على مستوى المحافظة 2024', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&q=80', color: 'from-emerald-500 to-emerald-600' },
  { id: 3, name: 'نادي القراءة', category: 'أدبي', members: 25, description: 'يهتم بتعزيز ثقافة القراءة وتبادل المراجعات الأدبية', achievements: 'نشر 50+ مراجعة كتاب هذا الفصل', image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80', color: 'from-amber-500 to-amber-600' },
  { id: 4, name: 'فريق المسرح', category: 'فنون', members: 20, description: 'يقدم عروضاً مسرحية تربوية في المناسبات المدرسية', achievements: 'أفضل فريق مسرحي على مستوى المنطقة', image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80', color: 'from-purple-500 to-purple-600' },
  { id: 5, name: 'مجلس الطلاب', category: 'قيادة', members: 15, description: 'يمثل صوت الطلاب ويدير الفعاليات المدرسية', achievements: 'نظّم 20 فعالية ناجحة هذا العام', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&q=80', color: 'from-rose-500 to-rose-600' },
  { id: 6, name: 'فريق الرياضيات', category: 'أكاديمي', members: 10, description: 'يستعد للمشاركة في أولمبياد الرياضيات الوطني', achievements: 'المركز الأول في الأولمبياد المحلي 2024', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80', color: 'from-teal-500 to-teal-600' },
]

export default function ArticlesPage() {
  const [tab, setTab] = useState<'students' | 'teachers' | 'teams'>('students')
  const [expanded, setExpanded] = useState<number | null>(null)

  const tabs = [
    { k: 'students' as const, l: 'إبداعات الطلاب', icon: <PenTool size={16} /> },
    { k: 'teachers' as const, l: 'مقالات المعلمين', icon: <BookOpen size={16} /> },
    { k: 'teams' as const, l: 'الفرق المدرسية', icon: <Users size={16} /> },
  ]

  return (
    <div>
      <PageBanner title="إبداعات الطلاب والفرق" subtitle="كتاباتنا وأفكارنا وفرقنا المدرسية" icon={<PenTool size={36} />} />
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex flex-wrap justify-center gap-2 mb-12 bg-gray-50 p-2 rounded-2xl w-fit mx-auto">
          {tabs.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${tab === t.k ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}>
              {t.icon}{t.l}
            </button>
          ))}
        </div>

        {tab === 'students' && (
          <div className="space-y-6">
            {STUDENT_ARTICLES.map(article => (
              <div key={article.id} className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all border-r-4 border-teal-500">
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[9px] bg-teal-50 text-teal-600 px-3 py-1 rounded-xl font-black">✍️ {article.student}</span>
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-3 py-1 rounded-xl font-bold">{article.grade}</span>
                    {article.category && <span className="text-[9px] bg-amber-50 text-amber-600 px-3 py-1 rounded-xl font-black"><Tag size={9} className="inline ml-0.5" />{article.category}</span>}
                    <span className="text-[9px] text-gray-400 mr-auto flex items-center gap-1"><Calendar size={9} />{new Date(article.date).toLocaleDateString('ar-OM')}</span>
                  </div>
                  <h3 className="font-black text-gray-800 text-lg mb-3">{article.title}</h3>
                  <p className="text-sm text-gray-600 leading-[1.9] line-clamp-3">{article.content}</p>
                  {article.content.length > 200 && (
                    <button onClick={() => setExpanded(expanded === article.id ? null : article.id)} className="mt-3 text-teal-600 font-bold text-xs flex items-center gap-1 hover:text-teal-700">
                      {expanded === article.id ? 'عرض أقل' : 'قراءة المزيد'} <ChevronLeft size={12} className={`transition-transform ${expanded === article.id ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                  {expanded === article.id && (
                    <p className="text-sm text-gray-600 leading-[1.9] mt-2">{article.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'teachers' && (
          <div className="space-y-5">
            {TEACHERS_ARTICLES.map(article => (
              <div key={article.id} className="bg-white rounded-3xl shadow-lg p-6 border-r-4 border-emerald-500 hover:shadow-xl transition-all">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl font-black">👨‍🏫 {article.teacher}</span>
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-3 py-1 rounded-xl font-bold">{article.subject}</span>
                  <span className="text-[9px] text-gray-400 mr-auto flex items-center gap-1"><Calendar size={9} />{new Date(article.date).toLocaleDateString('ar-OM')}</span>
                </div>
                <h3 className="font-black text-gray-800 text-lg mb-3">{article.title}</h3>
                <p className="text-sm text-gray-600 leading-[1.9]">{article.content}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'teams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCHOOL_TEAMS.map(team => (
              <div key={team.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 group">
                <div className="relative h-44 overflow-hidden">
                  <img src={team.image} alt={team.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x250/0d9488/fff?text=فريق' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 p-4">
                    <span className="text-[9px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-md font-black">{team.category}</span>
                    <h3 className="text-white font-black text-base mt-1">{team.name}</h3>
                  </div>
                  <div className={`absolute top-3 left-3 bg-gradient-to-l ${team.color} text-white text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1`}>
                    <Users size={10} /> {team.members} عضو
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{team.description}</p>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[11px] font-black text-amber-600 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">🏆</span>{team.achievements}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
