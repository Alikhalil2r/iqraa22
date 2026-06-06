import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../api/client'
import { BookOpen, Eye, ArrowLeft, PenLine, Globe, FileText } from 'lucide-react'

export default function BlogWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog-widget'],
    queryFn: () => adminApi.get('/api/platform/admin/blog'),
    staleTime: 120_000,
    refetchInterval: 120_000,
  })

  const posts: any[] = data || []
  const published = posts.filter((p: any) => p.status === 'published')
  const drafts    = posts.filter((p: any) => p.status === 'draft')
  const totalViews = posts.reduce((s: number, p: any) => s + (p.views || 0), 0)
  const recent    = published.slice(0, 3)

  if (isLoading) return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-4"/>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl"/>)}
      </div>
      <div className="space-y-2">
        {[1,2,3].map(i => <div key={i} className="h-9 bg-gray-100 rounded-xl"/>)}
      </div>
    </div>
  )

  if (posts.length === 0) return null

  return (
    <div className="card" style={{ borderTop: '3px solid #06b6d4' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-700 flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-lg bg-cyan-100 flex items-center justify-center">
            <BookOpen size={13} className="text-cyan-600"/>
          </div>
          المدونة
        </h3>
        <Link to="/admin/blog" className="text-[11px] font-black text-cyan-600 hover:text-cyan-800 transition-colors flex items-center gap-1">
          إدارة المدونة <ArrowLeft size={11}/>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Globe size={11} className="text-emerald-500"/>
            <span className="text-[10px] font-bold text-emerald-400">منشور</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">{published.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FileText size={11} className="text-gray-400"/>
            <span className="text-[10px] font-bold text-gray-400">مسودة</span>
          </div>
          <p className="text-2xl font-black text-gray-600">{drafts.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye size={11} className="text-blue-500"/>
            <span className="text-[10px] font-bold text-blue-400">مشاهدة</span>
          </div>
          <p className="text-2xl font-black text-blue-700">{totalViews.toLocaleString()}</p>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="space-y-1.5">
          {recent.map((post: any) => (
            <div key={post.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <BookOpen size={12} className="text-cyan-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{post.title}</p>
                <p className="text-[10px] text-gray-400">{post.category}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                <Eye size={9}/> {post.views || 0}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
        <Link to="/admin/blog" className="flex-1 py-2 text-center text-[11px] font-black rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-colors flex items-center justify-center gap-1">
          <PenLine size={11}/> مقالة جديدة
        </Link>
        <a href="/platform/blog" target="_blank" className="flex-1 py-2 text-center text-[11px] font-black rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
          <Globe size={11}/> عرض المدونة
        </a>
      </div>
    </div>
  )
}
