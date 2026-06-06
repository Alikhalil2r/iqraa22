/** استخراج رابط iframe من كود تضمين خرائط Google أو رابط مباشر */
export function resolveMapEmbedSrc(raw?: string | null): string | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
  if (srcMatch?.[1]) return srcMatch[1]
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return null
}
