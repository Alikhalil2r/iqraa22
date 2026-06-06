import React from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Eye, Tag, ArrowRight, BookOpen, Share2, Twitter, Linkedin, Copy, Clock } from 'lucide-react'

import { platformApi } from '../../api/platformApi'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
}

function readingTime(content: string) {
  const words = content?.replace(/<[^>]+>/g, '').split(/\s+/).length || 0
  return Math.max(1, Math.ceil(words / 200))
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate  = useNavigate()

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const res = await platformApi.blogPost(slug!)
      return res.data
    }
  })

  const { data: related } = useQuery({
    queryKey: ['blog-related', post?.category],
    enabled: !!post?.category,
    queryFn: async () => {
      const res = await platformApi.blog({ category: post.category, limit: 3 })
      return res.data?.posts?.filter((p: { slug: string }) => p.slug !== slug).slice(0, 3) || []
    }
  })

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('تم نسخ الرابط!')
  }

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto px-6 pt-32 animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-xl w-3/4"/>
          <div className="h-64 bg-white/10 rounded-2xl"/>
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-4 bg-white/10 rounded"/>)}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={64} className="mx-auto mb-4 text-gray-600"/>
          <h1 className="text-2xl font-black mb-2">المقالة غير موجودة</h1>
          <p className="text-gray-400 mb-6">لا يمكن العثور على هذه المقالة</p>
          <Link to="/platform/blog" className="px-6 py-3 rounded-xl bg-violet-600 font-bold">العودة للمدونة</Link>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/platform" className="flex items-center gap-2.5 font-black text-xl">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black">&lt;/&gt;</span>
            <span>اكسبو التقنية</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/platform/blog" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <ArrowRight size={14}/> المدونة
            </Link>
            <Link to="/request" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-bold transition-colors">ابدأ مشروعك</Link>
          </div>
        </div>
      </nav>

      {/* Hero Image */}
      {post.image_url && (
        <div className="relative h-72 md:h-96 overflow-hidden">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"/>
        </div>
      )}

      {/* Content */}
      <div className={`max-w-3xl mx-auto px-6 pb-20 ${post.image_url ? '-mt-20 relative z-10' : 'pt-28'}`}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/platform" className="hover:text-white transition-colors">الرئيسية</Link>
          <span>/</span>
          <Link to="/platform/blog" className="hover:text-white transition-colors">المدونة</Link>
          <span>/</span>
          <span className="text-gray-300 truncate">{post.title}</span>
        </div>

        {/* Category */}
        <div className="mb-4">
          <span className="px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-sm font-bold">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black leading-snug mb-6">{post.title}</h1>

        {/* Meta */}
        <div className="flex items-center flex-wrap gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black">
              {post.author_name?.charAt(0) || 'أ'}
            </div>
            <span className="font-bold text-white">{post.author_name}</span>
          </div>
          <span className="flex items-center gap-1"><Calendar size={13}/> {formatDate(post.published_at)}</span>
          <span className="flex items-center gap-1"><Eye size={13}/> {post.views} قراءة</span>
          <span className="flex items-center gap-1"><Clock size={13}/> {readingTime(post.content)} دقائق للقراءة</span>
        </div>

        {/* Article Content */}
        <div
          className="prose prose-invert prose-lg max-w-none mb-12
            prose-headings:font-black prose-headings:text-white
            prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-li:text-gray-300 prose-ul:space-y-1
            prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }}
        />

        {/* Tags */}
        {post.tags && (
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <Tag size={14} className="text-gray-500"/>
            {(typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags).map((tag: string) => (
              <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400">#{tag}</span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 mb-12">
          <span className="text-sm font-bold text-gray-300 ml-2">شارك المقالة:</span>
          <button
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
            className="p-2.5 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] transition-colors"
          ><Twitter size={16}/></button>
          <button
            onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
            className="p-2.5 rounded-xl bg-[#0077B5]/10 hover:bg-[#0077B5]/20 text-[#0077B5] transition-colors"
          ><Linkedin size={16}/></button>
          <button
            onClick={copyLink}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          ><Copy size={16}/></button>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border border-violet-500/30 text-center mb-12">
          <h3 className="text-2xl font-black mb-3">هل أنت مستعد لبدء مشروعك؟</h3>
          <p className="text-gray-400 mb-6">تواصل معنا اليوم واحصل على استشارة مجانية لمشروعك الرقمي</p>
          <Link to="/request" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold transition-colors">
            ابدأ مشروعك الآن <ArrowRight size={16} className="rotate-180"/>
          </Link>
        </div>

        {/* Related Posts */}
        {related && related.length > 0 && (
          <div>
            <h3 className="text-xl font-black mb-6">مقالات ذات صلة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((p: any) => (
                <Link key={p.id} to={`/platform/blog/${p.slug}`} className="group block rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-violet-500/40 transition-all">
                  {p.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-bold text-sm leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">{p.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Eye size={10}/> {p.views}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
