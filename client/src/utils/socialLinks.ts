export interface SocialLink {
  id: string
  platform: string
  url: string
  label: string
}

/** روابط تجريبية — تُستخدم فقط عند غياب إعدادات المدرسة */
export const DEFAULT_DEMO_SOCIAL: Record<string, string> = {
  whatsapp: '96899000111',
  instagram: 'https://instagram.com/alnoor.demo',
  twitter: 'https://twitter.com/alnoor.demo',
  facebook: 'https://facebook.com/alnoor.demo',
  youtube: 'https://youtube.com/@alnoor.demo',
}

function mergeSocial(
  social?: Record<string, string | null | undefined>
): Record<string, string> {
  const hasAny = social && Object.values(social).some(v => v?.trim())
  if (!hasAny) return { ...DEFAULT_DEMO_SOCIAL }
  const out = { ...DEFAULT_DEMO_SOCIAL }
  for (const [k, v] of Object.entries(social!)) {
    if (v?.trim()) out[k] = v.trim()
  }
  return out
}

export function buildSocialLinks(social?: Record<string, string | null | undefined>): SocialLink[] {
  const source = mergeSocial(social)
  const items: SocialLink[] = []
  const add = (platform: string, url: string | null | undefined, label: string) => {
    if (!url?.trim()) return
    let href = url.trim()
    if (platform === 'whatsapp' && !href.startsWith('http')) {
      href = `https://wa.me/${href.replace(/\D/g, '')}`
    }
    items.push({ id: platform, platform, url: href, label })
  }
  add('whatsapp', source.whatsapp, 'واتساب')
  add('instagram', source.instagram, 'إنستغرام')
  add('twitter', source.twitter, 'تويتر / X')
  add('facebook', source.facebook, 'فيسبوك')
  add('youtube', source.youtube, 'يوتيوب')
  add('tiktok', source.tiktok, 'تيك توك')
  add('snapchat', source.snapchat, 'سناب شات')
  return items
}
