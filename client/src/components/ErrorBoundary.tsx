import React, { Component, ReactNode } from 'react'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertOctagon size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-3">حدث خطأ غير متوقع</h1>
            <p className="text-gray-500 mb-2 text-sm leading-relaxed">
              واجه النظام خطأً أثناء تحميل هذه الصفحة. يُرجى المحاولة مرة أخرى.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 p-3 bg-red-50 rounded-xl text-xs text-red-600 font-mono text-right mb-6 break-all">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/school'}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
              >
                <Home size={16} /> الرئيسية
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
              >
                <RefreshCw size={16} /> إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
