import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { Newspaper, Calendar, Tag } from 'lucide-react'

export default function NewsPage() {
  const [category, setCategory] = useState('')
  const { data, isLoading } = useQuery({ queryKey:['public-news'], queryFn:()=>publicApi.news().then(r=>r.data) })

  const news = data?.news || []
  const categories = [...new Set(news.map((n:any)=>n.category).filter(Boolean))]
  const filtered = category ? news.filter((n:any)=>n.category===category) : news

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-gray-800 mb-3">الأخبار والفعاليات</h1>
        <p className="text-gray-400 text-lg">تابع آخر أخبار وفعاليات مدرستنا</p>
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button onClick={()=>setCategory('')} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!category?'text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={!category?{background:'var(--color-primary)'}:{}}>الكل</button>
          {categories.map(c=>(
            <button key={c} onClick={()=>setCategory(c)} className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${category===c?'text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={category===c?{background:'var(--color-primary)'}:{}}>{c}</button>
          ))}
        </div>
      )}
      {isLoading ? <div className="flex justify-center py-20"><div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"/></div> :
        filtered.length === 0 ? <div className="text-center py-20 text-gray-400"><Newspaper size={48} className="mx-auto mb-4 text-gray-200"/><p className="font-bold">لا توجد أخبار</p></div> :
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item:any)=>(
            <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group border border-gray-100">
              {item.image_url && (
                <div className="h-52 overflow-hidden">
                  <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" onError={e=>(e.currentTarget.style.display='none')}/>
                </div>
              )}
              <div className="p-6">
                {item.category && <span className="text-xs font-black px-2.5 py-1 rounded-full text-white mb-3 inline-flex items-center gap-1" style={{background:'var(--color-primary)'}}><Tag size={10}/>{item.category}</span>}
                <h3 className="text-lg font-black text-gray-800 mb-2 leading-snug">{item.title}</h3>
                {item.summary && <p className="text-gray-500 text-sm leading-relaxed">{item.summary}</p>}
                <div className="flex items-center gap-1 text-xs text-gray-300 mt-4">
                  <Calendar size={11}/>{new Date(item.publish_date).toLocaleDateString('ar-OM',{year:'numeric',month:'long',day:'numeric'})}
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
