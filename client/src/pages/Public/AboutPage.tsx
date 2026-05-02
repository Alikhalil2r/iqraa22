import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Eye, Target, Users, BookOpen } from 'lucide-react'

export default function AboutPage() {
  const { data } = useQuery({ queryKey:['public-school'], queryFn:()=>publicApi.school().then(r=>r.data) })
  const { data: staffData } = useQuery({ queryKey:['public-staff'], queryFn:()=>publicApi.staff().then(r=>r.data) })
  const school = data?.school

  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-white" style={{background:'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'}}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-black mb-4">عن مدرستنا</h1>
          <p className="text-xl text-white/80">{school?.tagline}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        {/* About */}
        {school?.aboutText && (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-gray-800 mb-6">من نحن</h2>
              <p className="text-gray-600 leading-relaxed text-lg">{school.aboutText}</p>
            </div>
            <div className="rounded-3xl overflow-hidden" style={{background:'var(--color-primary)+'+'15'}}>
              {school.heroImage ? <img src={school.heroImage} className="w-full h-64 object-cover rounded-3xl"/> :
                <div className="h-64 flex items-center justify-center"><BookOpen size={80} style={{color:'var(--color-primary)', opacity:0.3}}/></div>}
            </div>
          </div>
        )}

        {/* Vision & Mission */}
        {(school?.vision || school?.mission) && (
          <div className="grid md:grid-cols-2 gap-6">
            {school.vision && (
              <div className="p-8 rounded-3xl text-white" style={{background:'var(--color-primary)'}}>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4"><Eye size={24} className="text-white"/></div>
                <h3 className="text-xl font-black mb-3">الرؤية</h3>
                <p className="text-white/80 leading-relaxed">{school.vision}</p>
              </div>
            )}
            {school.mission && (
              <div className="p-8 rounded-3xl border-2 bg-white" style={{borderColor:'var(--color-primary)'}}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{background:'var(--color-primary)'}}><Target size={24} className="text-white"/></div>
                <h3 className="text-xl font-black mb-3 text-gray-800">الرسالة</h3>
                <p className="text-gray-600 leading-relaxed">{school.mission}</p>
              </div>
            )}
          </div>
        )}

        {/* Staff */}
        {staffData?.staff?.length > 0 && (
          <div>
            <h2 className="text-3xl font-black text-gray-800 mb-10 text-center">الكادر التعليمي</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffData.staff.map((m:any) => (
                <div key={m.id} className="bg-white rounded-3xl p-6 text-center shadow-sm hover:shadow-lg transition-all border border-gray-100">
                  {m.photo ? <img src={m.photo} className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4"/> :
                    <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'var(--color-primary)'}}><Users size={36} className="text-white"/></div>}
                  <h3 className="font-black text-gray-800">{m.name}</h3>
                  <p className="text-sm font-bold mt-1" style={{color:'var(--color-primary)'}}>{m.position}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.department}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
