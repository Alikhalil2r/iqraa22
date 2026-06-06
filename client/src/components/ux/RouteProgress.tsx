import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** شريط تقدم علوي أثناء الانتقال بين الصفحات — متوافق مع BrowserRouter */
export default function RouteProgress() {
  const { pathname } = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    setVisible(true)
    setProgress(12)
    const t1 = setTimeout(() => setProgress(45), 120)
    const t2 = setTimeout(() => setProgress(72), 320)
    const t3 = setTimeout(() => setProgress(100), 500)
    const hide = setTimeout(() => { setVisible(false); setProgress(0) }, 780)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(hide)
    }
  }, [pathname])

  if (!visible && progress === 0) return null

  return (
    <div className="route-progress-track" role="progressbar" aria-hidden="true">
      <div className="route-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  )
}
