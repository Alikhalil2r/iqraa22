import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function BackToTop({ threshold = 400 }: { threshold?: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  if (!show) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="back-to-top"
      aria-label="العودة لأعلى الصفحة"
      title="العودة لأعلى"
    >
      <ChevronUp size={20} strokeWidth={2.5} />
    </button>
  )
}
