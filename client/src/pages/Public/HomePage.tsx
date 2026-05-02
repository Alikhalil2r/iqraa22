import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Award, Users, BookOpen, Star, ChevronRight } from 'lucide-react'

export default function HomePage() {
  const { theme } = useTheme()
  const { data: schoolData } = useQuery({ queryKey:['public-school'], queryFn:()=>publicApi.school().then(r=>r.data) })
  const { data: newsData } = useQuery({ queryKey:['public-news'], queryFn:()=>publicApi.news().then(r=>r.data) })
  const { data: staffData } = useQuery({ queryKey:['public-staff'], queryFn:()=>publicApi.staff().then(r=>r.data) })
  const { data: eventsData } = useQuery({ queryKey:['public-events'], queryFn:()=>publicApi.gallery().then(r=>r.data) })

  const school = schoolData?.school
  const featuredNews = (newsData?.news || []).slice(0, 3)
  const featuredStaff = (staffData?.staff || []).filter((s:any) => s.is_featured).slice(0, 4)

  const stats = [
    { label:'عام من التميز', value:'15+', icon: Star },
    { label:'طالب وطالبة', value:'800+', icon: BookOpen },
    { label:'كادر تعليمي متميز', value:'60+', icon: Users },
    { label:'إنجاز وشهادة', value:'200+', icon: Award },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center"
        style={{background:`linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)`}}>
        {school?.heroImage && (
          <div className="absolute inset-0">
            <img src={school.heroImage} className="w-full h-full object-cover opacity-20"/>
            <div className="absolute inset-0" style={{background:'linear-gradient(to left, transparent, var(--color-primary) 60%)'}}/>
          </div>
        )}
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold mb-6">
              <Star size={14} className="fill-current" style={{color:'var(--color-accent)'}}/> مدرسة متميزة — {new Date().getFullYear()}
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              {theme.schoolName}
            </h1>
            {theme.tagline && (
              <p className="text-xl text-white/80 mb-8 leading-relaxed">{theme.tagline}</p>
            )}
            {school?.aboutText && (
              <p className="text-white/70 mb-10 leading-relaxed">{school.aboutText.substring(0, 200)}...</p>
            )}
            <div className="flex flex-wrap gap-4">
              <Link to="/about" className="px-8 py-4 rounded-2xl font-black text-base transition-all hover:scale-105 flex items-center gap-2"
                style={{background:'var(--color-accent)', color:'white'}}>
                اعرف أكثر <ArrowLeft size={18}/>
              </Link>
              <Link to="/parent-login" className="px-8 py-4 rounded-2xl font-black text-base bg-white/20 text-white hover:bg-white/30 transition-all backdrop-blur-sm flex items-center gap-2">
                بوابة الأولياء <ChevronRight size={18}/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110" style={{background:'var(--color-primary)'}}>
                  <s.icon size={28} className="text-white"/>
                </div>
                <p className="text-4xl font-black text-gray-800 mb-2" style={{color:'var(--color-primary)'}}>{s.value}</p>
                <p className="text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News */}
      {featuredNews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-800">آخر الأخبار</h2>
                <p className="text-gray-400 mt-1">كل ما يدور في مدرستنا</p>
              </div>
              <Link to="/news" className="flex items-center gap-2 text-sm font-bold hover:underline" style={{color:'var(--color-primary)'}}>
                عرض الكل <ArrowLeft size={16}/>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredNews.map((item: any) => (
                <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
                  {item.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" onError={e=>(e.currentTarget.style.display='none')}/>
                    </div>
                  )}
                  <div className="p-5">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full text-white mb-3 inline-block" style={{background:'var(--color-primary)'}}>{item.category}</span>
                    <h3 className="font-black text-gray-800 mb-2 leading-snug">{item.title}</h3>
                    {item.summary && <p className="text-gray-500 text-sm leading-relaxed">{item.summary.substring(0,100)}...</p>}
                    <p className="text-xs text-gray-300 mt-3">{new Date(item.publish_date).toLocaleDateString('ar-OM')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Principal message */}
      {school?.principalName && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10">
              {school.principalImage ? (
                <img src={school.principalImage} className="w-40 h-40 rounded-3xl object-cover shadow-xl flex-shrink-0"/>
              ) : (
                <div className="w-40 h-40 rounded-3xl flex items-center justify-center flex-shrink-0" style={{background:'var(--color-primary)'}}>
                  <Users size={60} className="text-white"/>
                </div>
              )}
              <div>
                <span className="text-xs font-black uppercase tracking-widest mb-3 block" style={{color:'var(--color-primary)'}}>كلمة المدير</span>
                <h2 className="text-2xl font-black text-gray-800 mb-4">{school.principalName}</h2>
                {school.principalMessage && <p className="text-gray-600 leading-relaxed text-lg italic">" {school.principalMessage} "</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Staff */}
      {featuredStaff.length > 0 && (
        <section className="py-16" style={{background:'var(--color-primary)'}}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-black text-white text-center mb-3">كادرنا المتميز</h2>
            <p className="text-white/70 text-center mb-10">فريق من أفضل المعلمين والمتخصصين</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredStaff.map((member: any) => (
                <div key={member.id} className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 text-center text-white hover:bg-white/20 transition-all">
                  {member.photo ? (
                    <img src={member.photo} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4"/>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                      <Users size={32} className="text-white"/>
                    </div>
                  )}
                  <h3 className="font-black">{member.name}</h3>
                  <p className="text-white/70 text-sm mt-1">{member.position}</p>
                  <p className="text-white/50 text-xs mt-0.5">{member.department}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gray-50 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-black text-gray-800 mb-4">هل أنت من أولياء الأمور؟</h2>
          <p className="text-gray-500 mb-8 text-lg">تابع أبناءك وتواصل مع الإدارة مباشرة من خلال بوابة أولياء الأمور المتكاملة</p>
          <Link to="/parent-login" className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white text-lg hover:scale-105 transition-all shadow-lg"
            style={{background:'var(--color-accent)'}}>
            <Users size={22}/>دخول بوابة الأولياء
          </Link>
        </div>
      </section>
    </div>
  )
}
