import type { Lang } from './translations'

/** اختيار النص حسب اللغة — لا يخلط بين العربية والإنجليزية */
export function pickLocalized(
  lang: Lang,
  ar?: string | null,
  en?: string | null,
  fallback = ''
): string {
  if (lang === 'en') return en?.trim() || fallback
  return ar?.trim() || en?.trim() || fallback
}

/** قراءة حقل ثنائي من كائن API (camelCase أو snake_case) */
export function fieldLocalized(
  lang: Lang,
  obj: Record<string, unknown> | null | undefined,
  base: string,
  fallback = ''
): string {
  if (!obj) return fallback
  const snake = base.replace(/([A-Z])/g, (_, c) => `_${c.toLowerCase()}`)
  const ar = obj[base] ?? obj[snake]
  const en = obj[`${base}En`] ?? obj[`${snake}_en`]
  return pickLocalized(lang, ar != null ? String(ar) : '', en != null ? String(en) : '', fallback)
}

export interface NewsLike {
  title?: string
  title_en?: string
  summary?: string
  summary_en?: string
  content?: string
  content_en?: string
  category?: string
  category_en?: string
  [key: string]: unknown
}

export function localizeNewsItem<T extends NewsLike>(
  lang: Lang,
  item: T,
  categoryLabel: (ar?: string, en?: string) => string
): T {
  return {
    ...item,
    title: pickLocalized(lang, item.title, item.title_en),
    summary: pickLocalized(lang, item.summary, item.summary_en),
    content: pickLocalized(lang, item.content, item.content_en),
    category: categoryLabel(item.category, item.category_en),
  }
}

export interface FaqLike {
  question?: string
  question_en?: string
  answer?: string
  answer_en?: string
  [key: string]: unknown
}

export function localizeFaqItem<T extends FaqLike>(lang: Lang, item: T): T {
  return {
    ...item,
    question: pickLocalized(lang, item.question, item.question_en),
    answer: pickLocalized(lang, item.answer, item.answer_en),
  }
}

export interface EventLike {
  title?: string
  title_en?: string
  description?: string
  description_en?: string
  location?: string
  location_en?: string
  event_type?: string
  [key: string]: unknown
}

export function localizeEventItem<T extends EventLike>(
  lang: Lang,
  item: T,
  categoryLabel: (ar?: string, en?: string) => string
): T {
  return {
    ...item,
    title: pickLocalized(lang, item.title, item.title_en),
    description: pickLocalized(lang, item.description, item.description_en),
    location: pickLocalized(lang, item.location, item.location_en),
    event_type: categoryLabel(item.event_type, item.event_type_en as string | undefined),
  }
}

export interface GalleryLike {
  title?: string
  title_en?: string
  category?: string
  category_en?: string
  [key: string]: unknown
}

export function localizeGalleryItem<T extends GalleryLike>(
  lang: Lang,
  item: T,
  categoryLabel: (ar?: string, en?: string) => string
): T {
  return {
    ...item,
    title: pickLocalized(lang, item.title, item.title_en),
    category: categoryLabel(item.category, item.category_en),
  }
}

export interface AchievementLike {
  title?: string
  title_en?: string
  description?: string
  description_en?: string
  category?: string
  category_en?: string
  [key: string]: unknown
}

export function localizeAchievementItem<T extends AchievementLike>(
  lang: Lang,
  item: T,
  categoryLabel: (ar?: string, en?: string) => string
): T {
  return {
    ...item,
    title: pickLocalized(lang, item.title, item.title_en),
    description: pickLocalized(lang, item.description, item.description_en),
    category: categoryLabel(item.category, item.category_en),
  }
}
