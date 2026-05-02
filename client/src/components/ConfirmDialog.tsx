import React from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
  loading?: boolean
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء',
  onConfirm, onCancel, danger = false, loading = false
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-scale-in">
        <div className="p-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            {danger ? <Trash2 size={26} className="text-red-600" /> : <AlertTriangle size={26} className="text-amber-600" />}
          </div>
          <h3 className="text-lg font-black text-gray-800 text-center mb-2">{title}</h3>
          <p className="text-sm text-gray-500 text-center leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-white font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean
    title: string
    message: string
    resolve?: (v: boolean) => void
    danger?: boolean
  }>({ open: false, title: '', message: '' })

  const confirm = (opts: { title: string; message: string; danger?: boolean }): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, ...opts, resolve })
    })
  }

  const handleConfirm = () => {
    state.resolve?.(true)
    setState(s => ({ ...s, open: false }))
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState(s => ({ ...s, open: false }))
  }

  const Dialog = () => (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      danger={state.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmLabel={state.danger ? 'نعم، احذف' : 'تأكيد'}
    />
  )

  return { confirm, Dialog }
}
