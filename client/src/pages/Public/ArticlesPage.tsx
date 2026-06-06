import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { PenTool, BookOpen, Users, Tag, Calendar, ChevronLeft } from 'lucide-react'
import { DEMO_STUDENT_ARTICLES, DEMO_TEACHER_ARTICLES, DEMO_TEAMS, withDemoFallback } from '../../data/demoPublicFallback'

function PageBanner({ title, subtitle, icon, gradient = 'from-teal-800 to-teal-900' }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white py-16 text-center`}>
      {icon && <div className="mb-3 flex justify-center text-amber-400/80">{icon}</div>}
      <h1 className="text-3xl md:text-4xl font-black">{title}</h1>
      <p className="text-white/60 mt-2 text-sm">{subtitle}</p>
    </div>
  )
}

export default function ArticlesPage() {
  const [tab, setTab] = useState<'students' | 'teachers' | 'teams'>('students')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: studentData, isLoading: loadingStudents } = useQuery({
    queryKey: ['public-articles', 'student'],
    queryFn: () => publicApi.articles({ type: 'student' }).then(r => r.data),
  })
  const { data: teacherData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['public-articles', 'teacher'],
    queryFn: () => publicApi.articles({ type: 'teacher' }).then(r => r.data),
  })
  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['public-teams'],
    queryFn: () => publicApi.teams().then(r => r.data),
  })

  const studentArticles = withDemoFallback(studentData?.articles, DEMO_STUDENT_ARTICLES)
  const teacherArticles = withDemoFallback(teacherData?.articles, DEMO_TEACHER_ARTICLES)
  const teams = withDemoFallback(teamsData?.teams, DEMO_TEAMS)

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
          loadingStudents ? <p className="text-center text-gray-500">جاري التحميل...</p>
          : studentArticles.length === 0 ? <p className="text-center text-gray-500 py-12">لا توجد مقالات طلابية حالياً</p>
          : <div className="space-y-6">
            {studentArticles.map((article: any) => (
              <div key={article.id} className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-all border-r-4 border-teal-500">
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[9px] bg-teal-50 text-teal-600 px-3 py-1 rounded-xl font-black">✍️ {article.author_name}</span>
                    {article.grade && <span className="text-[9px] bg-gray-100 text-gray-500 px-3 py-1 rounded-xl font-bold">{article.grade}</span>}
                    {article.category && <span className="text-[9px] bg-amber-50 text-amber-600 px-3 py-1 rounded-xl font-black"><Tag size={9} className="inline ml-0.5" />{article.category}</span>}
                    {article.publish_date && <span className="text-[9px] text-gray-400 mr-auto flex items-center gap-1"><Calendar size={9} />{new Date(article.publish_date).toLocaleDateString('ar-OM')}</span>}
                  </div>
                  <h3 className="font-black text-gray-800 text-lg mb-3">{article.title}</h3>
                  <p className="text-sm text-gray-600 leading-[1.9] line-clamp-3">{article.content}</p>
                  {article.content?.length > 200 && (
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
          loadingTeachers ? <p className="text-center text-gray-500">جاري التحميل...</p>
          : teacherArticles.length === 0 ? <p className="text-center text-gray-500 py-12">لا توجد مقالات معلمين حالياً</p>
          : <div className="space-y-5">
            {teacherArticles.map((article: any) => (
              <div key={article.id} className="bg-white rounded-3xl shadow-lg p-6 border-r-4 border-emerald-500 hover:shadow-xl transition-all">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl font-black">👨‍🏫 {article.author_name}</span>
                  {article.subject && <span className="text-[9px] bg-gray-100 text-gray-500 px-3 py-1 rounded-xl font-bold">{article.subject}</span>}
                  {article.publish_date && <span className="text-[9px] text-gray-400 mr-auto flex items-center gap-1"><Calendar size={9} />{new Date(article.publish_date).toLocaleDateString('ar-OM')}</span>}
                </div>
                <h3 className="font-black text-gray-800 text-lg mb-3">{article.title}</h3>
                <p className="text-sm text-gray-600 leading-[1.9]">{article.content}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'teams' && (
          loadingTeams ? <p className="text-center text-gray-500">جاري التحميل...</p>
          : teams.length === 0 ? <p className="text-center text-gray-500 py-12">لا توجد فرق مدرسية حالياً</p>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team: any) => (
              <div key={team.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 group">
                <div className="relative h-44 overflow-hidden">
                  <img src={team.image_url} alt={team.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/400x250/0d9488/fff?text=فريق' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 p-4">
                    {team.category && <span className="text-[9px] bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-md font-black">{team.category}</span>}
                    <h3 className="text-white font-black text-base mt-1">{team.name}</h3>
                  </div>
                  <div className={`absolute top-3 left-3 bg-gradient-to-l ${team.color_gradient || 'from-teal-500 to-teal-600'} text-white text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1`}>
                    <Users size={10} /> {team.members_count} عضو
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{team.description}</p>
                  {team.achievements && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-[11px] font-black text-amber-600 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5">🏆</span>{team.achievements}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
