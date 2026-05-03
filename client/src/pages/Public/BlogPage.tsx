import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Eye, Tag, Search, ArrowLeft, BookOpen, Sparkles } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const CATEGORIES = ['الكل', 'تقنية', 'تصميم', 'تسويق', 'نصائح', 'ريادة أعمال', 'ذكاء اصطناعي']

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BlogPage() {
  const [category, setCategory] = useState('الكل')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['blog-public', category, page],
    queryFn: async () => {
      const cat = category === 'الكل' ? '' : category
      const res = await fetch(`${API}/api/platform/blog?page=${page}&limit=6${cat ? `&category=${encodeURIComponent(cat)}` : ''}`)
      return res.json()
    }
  })

  const posts = (data?.posts || []).filter((p: any) =>
    !search || p.title.includes(search) || p.excerpt?.includes(search)
  )

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-black text-xl">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black">&lt;/&gt;</span>
            <span>اكسبو التقنية</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">الرئيسية</Link>
            <Link to="/request" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold transition-colors">ابدأ مشروعك</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none"/>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold mb-6">
            <BookOpen size={14}/> المدونة التقنية
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            مقالات وأفكار من <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">عالم التقنية</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">نشارككم خبراتنا ورؤيتنا في عالم التطوير والتصميم وريادة الأعمال الرقمية</p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في المقالات..."
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="flex gap-2 flex-wrap justify-center">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1) }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                category === cat
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-80"/>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30"/>
            <p className="text-lg">لا توجد مقالات في هذه الفئة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any, i: number) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group block rounded-2xl overflow-hidden bg-white/5 border border-white/8 hover:border-violet-500/40 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/20"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-800">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-900/50 to-indigo-900/50 flex items-center justify-center">
                      <Sparkles size={40} className="text-violet-400/40"/>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-lg bg-violet-600/90 text-xs font-bold">{post.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="font-black text-lg mb-2 leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">{post.title}</h2>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar size={11}/> {formatDate(post.published_at)}</span>
                      <span className="flex items-center gap-1"><Eye size={11}/> {post.views}</span>
                    </div>
                    <span className="flex items-center gap-1 text-violet-400 font-bold group-hover:gap-2 transition-all">
                      اقرأ المزيد <ArrowLeft size={12}/>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                  page === p ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
