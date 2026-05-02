import React, { useState, useEffect } from 'react'
import { Clock, X, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function getMinutesRemaining(token: string | null): number {
  if (!token) return Infinity
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return Infinity
    return (payload.exp * 1000 - Date.now()) / 60000
  } catch { return Infinity }
}

export default function SessionWarning() {
  const { token, logout } = useAuth()
  const [minutesLeft, setMinutesLeft] = useState<number>(Infinity)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => { setDismissed(false) }, [token])

  useEffect(() => {
    const update = () => {
      const m = getMinutesRemaining(token)
      setMinutesLeft(m)
      if (m <= 0) logout()
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [token, logout])

  if (minutesLeft > 10 || minutesLeft <= 0 || dismissed) return null

  const urgent  = minutesLeft <= 3
  const mins    = Math.ceil(minutesLeft)
  const minsStr = mins === 1 ? 'دقيقة واحدة' : `${mins} دقائق`

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold flex-shrink-0 transition-colors ${
        urgent ? 'bg-red-500 text-white' : 'bg-amber-400 text-amber-900'
      }`}
    >
      <Clock size={15} className="flex-shrink-0 animate-pulse" />
      <span className="flex-1 text-right">
        {urgent
          ? `⚠️ ستنتهي جلستك خلال ${minsStr} — احفظ عملك الآن`
          : `ستنتهي جلستك خلال ${minsStr} — سيُطلب منك تسجيل الدخول مجدداً`}
      </span>
      <button
        onClick={logout}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black border transition-colors ${
          urgent
            ? 'border-white/40 text-white hover:bg-white/20'
            : 'border-amber-700/30 text-amber-900 hover:bg-amber-500/30'
        }`}
      >
        <LogOut size={12} /> تسجيل خروج
      </button>
      {!urgent && (
        <button onClick={() => setDismissed(true)} className="opacity-50 hover:opacity-100 transition-opacity">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
