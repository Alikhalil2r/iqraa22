import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, ShieldCheck, ShieldOff, Smartphone, Copy, CheckCircle, AlertTriangle, KeyRound, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const API = (path: string, opts?: RequestInit) =>
  fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
    ...opts,
  }).then(r => r.json())

export default function TwoFactorSetup() {
  const qc = useQueryClient()
  const [step, setStep]         = useState<'idle' | 'setup' | 'verify'>('idle')
  const [qrData, setQrData]     = useState<{ qrCode: string; secret: string } | null>(null)
  const [token, setToken]       = useState('')
  const [disableToken, setDisToken] = useState('')
  const [copiedSecret, setCopied]   = useState(false)

  const statusQ = useQuery({
    queryKey: ['2fa-status'],
    queryFn: () => API('/2fa/status'),
    staleTime: 30_000,
  })

  const setupMut = useMutation({
    mutationFn: () => API('/2fa/setup', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.qrCode) { setQrData(data); setStep('setup') }
      else toast.error(data.error || 'فشل الإعداد')
    },
    onError: () => toast.error('فشل الاتصال بالخادم'),
  })

  const verifyMut = useMutation({
    mutationFn: (t: string) => API('/2fa/verify', { method: 'POST', body: JSON.stringify({ token: t }) }),
    onSuccess: (data) => {
      if (data.ok) {
        toast.success('تم تفعيل المصادقة الثنائية ✓')
        qc.invalidateQueries({ queryKey: ['2fa-status'] })
        setStep('idle'); setQrData(null); setToken('')
      } else toast.error(data.error || 'الرمز غير صحيح')
    },
  })

  const disableMut = useMutation({
    mutationFn: (t: string) => API('/2fa/disable', { method: 'POST', body: JSON.stringify({ token: t }) }),
    onSuccess: (data) => {
      if (data.ok) {
        toast.success('تم إلغاء تفعيل المصادقة الثنائية')
        qc.invalidateQueries({ queryKey: ['2fa-status'] })
        setDisToken('')
      } else toast.error(data.error || 'الرمز غير صحيح')
    },
  })

  function copySecret() {
    if (!qrData?.secret) return
    navigator.clipboard.writeText(qrData.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('تم نسخ المفتاح')
  }

  const isEnabled = statusQ.data?.enabled

  return (
    <div className="space-y-6 animate-fadeUp max-w-2xl mx-auto">

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 text-white shadow-xl"
        style={{ background: isEnabled
          ? 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)'
          : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            {isEnabled ? <ShieldCheck size={28} /> : <Shield size={28} />}
          </div>
          <div>
            <h1 className="text-2xl font-black">المصادقة الثنائية (2FA)</h1>
            <p className="text-blue-200 text-sm mt-0.5">Two-Factor Authentication — حماية إضافية لحسابك</p>
          </div>
          <div className="mr-auto">
            <span className={`px-4 py-2 rounded-xl text-sm font-black ${isEnabled ? 'bg-green-400/20 text-green-200' : 'bg-white/10 text-white/70'}`}>
              {statusQ.isLoading ? '...' : isEnabled ? '✓ مفعّل' : 'غير مفعّل'}
            </span>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Lock size={18}/>, title: 'حماية مزدوجة', desc: 'كلمة مرور + رمز يتغير كل 30 ثانية', color: '#6366f1' },
          { icon: <Smartphone size={18}/>, title: 'تطبيق المصادق', desc: 'Google Authenticator أو Authy', color: '#10b981' },
          { icon: <KeyRound size={18}/>, title: 'رمز TOTP', desc: 'رمز وقتي لا يمكن إعادة استخدامه', color: '#f59e0b' },
        ].map((c) => (
          <div key={c.title} className="card text-center !py-4">
            <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center mb-3"
              style={{ background: c.color + '15', color: c.color }}>
              {c.icon}
            </div>
            <p className="font-black text-gray-800 text-sm mb-1">{c.title}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      {!isEnabled ? (
        <div className="card space-y-5">
          {step === 'idle' && (
            <>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">لحماية حسابك</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    المصادقة الثنائية تضيف طبقة أمان إضافية — حتى لو سُرقت كلمة مرورك لن يتمكن أحد من الدخول.
                  </p>
                </div>
              </div>
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <Shield size={36} className="text-indigo-500" />
                </div>
                <h3 className="font-black text-gray-800 text-lg mb-2">تفعيل المصادقة الثنائية</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                  ستحتاج إلى تطبيق مصادقة على هاتفك مثل Google Authenticator أو Authy
                </p>
                <button onClick={() => setupMut.mutate()}
                  disabled={setupMut.isPending}
                  className="btn-primary px-8 py-3 rounded-2xl font-black text-sm">
                  {setupMut.isPending ? 'جارٍ الإعداد...' : 'بدء الإعداد ←'}
                </button>
              </div>
            </>
          )}

          {step === 'setup' && qrData && (
            <div className="space-y-5">
              <h3 className="font-black text-gray-800 text-lg text-center">امسح رمز QR</h3>
              <div className="steps text-sm text-gray-600 space-y-2">
                {['افتح تطبيق Google Authenticator أو Authy على هاتفك',
                  'اضغط على + لإضافة حساب جديد واختر "مسح رمز QR"',
                  'امسح الرمز أدناه أو أدخل المفتاح يدوياً'].map((s, i) => (
                  <div key={`step-${i}`} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black flex-shrink-0">{i+1}</div>
                    <p>{s}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                  <img src={qrData.qrCode} alt="QR Code" className="w-44 h-44" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <code className="flex-1 text-xs font-mono text-gray-600 break-all">{qrData.secret}</code>
                <button onClick={copySecret} className="p-2 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0">
                  {copiedSecret ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
                </button>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-gray-700 text-sm">أدخل الرمز المكوّن من 6 أرقام من التطبيق:</p>
                <input
                  value={token} onChange={e => setToken(e.target.value.replace(/\D/g,'').slice(0,6))}
                  placeholder="000000" maxLength={6} dir="ltr"
                  className="input-field text-center text-2xl font-mono tracking-widest w-full py-3"
                  onKeyDown={e => e.key === 'Enter' && token.length === 6 && verifyMut.mutate(token)}
                />
                <div className="flex gap-3">
                  <button onClick={() => setStep('idle')}
                    className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
                    رجوع
                  </button>
                  <button onClick={() => verifyMut.mutate(token)}
                    disabled={token.length !== 6 || verifyMut.isPending}
                    className="flex-1 btn-primary py-3 rounded-2xl font-black text-sm">
                    {verifyMut.isPending ? 'جارٍ التحقق...' : 'تفعيل ✓'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2FA already enabled - show disable form */
        <div className="card space-y-5">
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 text-sm">المصادقة الثنائية مفعّلة</p>
              <p className="text-xs text-green-700 mt-1">حسابك محمي بطبقة أمان إضافية. لإلغاء التفعيل أدخل رمز التحقق.</p>
            </div>
          </div>
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={36} className="text-green-500" />
            </div>
            <h3 className="font-black text-gray-800 mb-2">إلغاء تفعيل 2FA</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">أدخل الرمز من تطبيق المصادقة لإلغاء التفعيل</p>
            <div className="max-w-xs mx-auto space-y-3">
              <input
                value={disableToken} onChange={e => setDisToken(e.target.value.replace(/\D/g,'').slice(0,6))}
                placeholder="000000" maxLength={6} dir="ltr"
                className="input-field text-center text-2xl font-mono tracking-widest w-full py-3"
              />
              <button onClick={() => disableMut.mutate(disableToken)}
                disabled={disableToken.length !== 6 || disableMut.isPending}
                className="w-full py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <ShieldOff size={16} />
                {disableMut.isPending ? 'جارٍ الإلغاء...' : 'إلغاء التفعيل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
