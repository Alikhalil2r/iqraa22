import React, { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { publicApi } from '../../api/client'
import { useLocalize } from '../../hooks/useLocalize'
import { useLanguage } from '../../context/LanguageContext'
import { Calendar, ChevronRight, ChevronLeft, Newspaper, Eye, Tag } from 'lucide-react'
import { usePublicSchool } from '../../context/PublicSchoolContext'

const CAT_COLORS: Record<string, string> = {
  أكاديمي: '#6366f1', إنجازات: '#10b981', أنشطة: '#8b5cf6', فعاليات: '#f97316',
  تخرج: '#ec4899', مرافق: '#0ea5e9', إداري: '#6366f1', أخرى: '#6b7280',
  Academic: '#6366f1', Achievements: '#10b981', Activities: '#8b5cf6', Events: '#f97316',
  Graduation: '#ec4899', Facilities: '#0ea5e9', Administrative: '#6366f1', Other: '#6b7280',
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, isRTL } = useLanguage()
  const { localizeNews, dateLocale, lang } = useLocalize()
  const { slug, query: schoolQuery } = usePublicSchool()
  const BackIcon = isRTL ? ChevronRight : ChevronLeft

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-news', id, slug],
    queryFn: () => publicApi.newsItem(id!, schoolQuery).then(r => r.data),
    enabled: !!id,
  })

  const article = useMemo(
    () => (data?.news ? localizeNews(data.news) : null),
    [data, localizeNews, lang]
  )

  useEffect(() => {
    if (article?.title) document.title = `${article.title} — ${t('site.nav.news')}`
  }, [article?.title, t])

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 mx-auto rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    )
  }

  if (isError || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-black text-gray-700 mb-2">{t('site.news.notFound')}</h1>
        <Link to="/school/news" className="text-emerald-600 font-bold text-sm hover:underline inline-flex items-center gap-1">
          <BackIcon size={14} /> {t('site.news.backToList')}
        </Link>
      </div>
    )
  }

  const color = CAT_COLORS[article.category || ''] || '#10b981'

  return (
    <article className="text-start">
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white py-10">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/school/news" className="inline-flex items-center gap-1 text-white/70 text-sm font-bold hover:text-white mb-4">
            <BackIcon size={14} /> {t('site.news.allNews')}
          </Link>
          {article.category && (
            <span className="inline-block text-[11px] font-black px-2.5 py-1 rounded-lg text-white mb-3" style={{ background: color }}>
              <Tag size={10} className="inline me-1" />{article.category}
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-black leading-snug">{article.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-white/60 text-xs">
            <span className="flex items-center gap-1"><Calendar size={12} />{new Date(article.publish_date).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {article.views != null && <span className="flex items-center gap-1"><Eye size={12} />{article.views}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="w-full rounded-3xl shadow-lg mb-8 object-cover max-h-[420px]" />
        )}
        {article.summary && <p className="text-lg text-gray-600 leading-relaxed mb-6 font-bold">{article.summary}</p>}
        {article.content && (
          <div className="prose prose-emerald max-w-none text-gray-700 leading-[2] whitespace-pre-wrap">{article.content}</div>
        )}
        {!article.content && article.summary && (
          <p className="text-gray-500 text-sm">{t('site.news.noFullContent')}</p>
        )}
      </div>
    </article>
  )
}
