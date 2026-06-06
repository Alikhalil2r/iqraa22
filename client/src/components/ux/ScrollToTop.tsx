import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** يعيد التمرير لأعلى عند تغيير المسار */
export default function ScrollToTop({ targetId }: { targetId?: string }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const el = targetId ? document.getElementById(targetId) : null
    if (el) el.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }, [pathname, targetId])

  return null
}
