import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { backupsApi } from '../../api/client'
import { Database, Download, RefreshCw, Shield, Trash2, RotateCcw, Clock, HardDrive } from 'lucide-react'
import toast from 'react-hot-toast'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ar-OM', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function downloadBackupFile(filename: string) {
  const token = localStorage.getItem('token')
  const res = await fetch(`/api/backups/${encodeURIComponent(filename)}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('فشل التحميل')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function BackupPanel() {
  const qc = useQueryClient()
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null)

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['backups-status'],
    queryFn: () => backupsApi.status().then(r => r.data),
  })

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['backups-list'],
    queryFn: () => backupsApi.list().then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => backupsApi.create(),
    onSuccess: () => {
      toast.success('✅ تم إنشاء نسخة احتياطية بنجاح')
      qc.invalidateQueries({ queryKey: ['backups-list'] })
      qc.invalidateQueries({ queryKey: ['backups-status'] })
    },
    onError: () => toast.error('فشل إنشاء النسخة الاحتياطية'),
  })

  const restoreMut = useMutation({
    mutationFn: (filename: string) => backupsApi.restore(filename),
    onSuccess: () => {
      toast.success('✅ تمت استعادة البيانات بنجاح')
      setRestoreTarget(null)
      qc.invalidateQueries({ queryKey: ['backups-list'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'فشلت الاستعادة'),
  })

  const deleteMut = useMutation({
    mutationFn: (filename: string) => backupsApi.remove(filename),
    onSuccess: () => {
      toast.success('تم حذف النسخة')
      qc.invalidateQueries({ queryKey: ['backups-list'] })
      qc.invalidateQueries({ queryKey: ['backups-status'] })
    },
    onError: () => toast.error('فشل الحذف'),
  })

  const status = statusData || {}
  const backups = listData?.backups || []

  return (
    <div className="space-y-5">
      {/* Status cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card !p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">النسخ التلقائي</p>
            <p className="font-black text-gray-800 text-sm">
              {status.enabled !== false ? 'مفعّل يومياً' : 'معطّل'}
            </p>
            {status.enabled !== false && (
              <p className="text-xs text-gray-400 mt-0.5">الساعة {status.scheduleHour ?? 3}:00</p>
            )}
          </div>
        </div>
        <div className="card !p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">آخر نسخة</p>
            <p className="font-black text-gray-800 text-sm">
              {statusLoading ? '...' : status.latest ? formatDate(status.latest.createdAt) : 'لا يوجد'}
            </p>
            {status.latest && (
              <p className="text-xs text-gray-400 mt-0.5">{status.latest.totalRows} سجل</p>
            )}
          </div>
        </div>
        <div className="card !p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
            <HardDrive size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase">الاحتفاظ</p>
            <p className="font-black text-gray-800 text-sm">{status.retentionDays ?? 30} يوماً</p>
            <p className="text-xs text-gray-400 mt-0.5">{status.totalBackups ?? 0} نسخة محفوظة</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-bold text-sky-900 flex items-center gap-2">
          <Database size={16} />
          ما الذي تُغطّيه النسخة الاحتياطية؟
        </p>
        <p className="text-xs text-sky-800/80 mt-2 leading-relaxed">
          الطلاب، أولياء الأمور، المعلمين، الموظفين، الدرجات، الحضور، الواجبات، السلوك، الأخبار،
          الفعاليات، المعرض، الرسائل، الرسوم، الامتحانات، الجدول، المكتبة، الإجازات، وإعدادات المدرسة — كل بيانات مدرستك.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending}
          className="btn-primary px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2"
        >
          {createMut.isPending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          إنشاء نسخة الآن
        </button>
      </div>

      {/* List */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-800">النسخ المحفوظة</h3>
        </div>
        {listLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          </div>
        ) : backups.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">لا توجد نسخ احتياطية بعد — سيتم إنشاء أول نسخة تلقائياً أو اضغط «إنشاء نسخة الآن»</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {backups.map((b: any) => (
              <div key={b.filename} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{formatDate(b.createdAt)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {b.trigger === 'auto' ? '🔄 تلقائي' : '👤 يدوي'} · {b.totalRows} سجل · {formatBytes(b.sizeBytes)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => downloadBackupFile(b.filename).catch(() => toast.error('فشل التحميل'))}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1.5"
                  >
                    <Download size={14} /> تحميل
                  </button>
                  <button
                    onClick={() => setRestoreTarget(b.filename)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> استعادة
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('حذف هذه النسخة؟')) deleteMut.mutate(b.filename)
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore confirm modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-gray-800 text-lg">تأكيد الاستعادة</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              سيتم <strong>استبدال</strong> جميع بيانات المدرسة الحالية بالنسخة الاحتياطية المختارة.
              يُنصح بإنشاء نسخة جديدة قبل الاستعادة.
            </p>
            <p className="text-xs font-mono bg-gray-100 rounded-lg p-2 text-gray-500 break-all" dir="ltr">{restoreTarget}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRestoreTarget(null)} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">
                إلغاء
              </button>
              <button
                onClick={() => restoreMut.mutate(restoreTarget)}
                disabled={restoreMut.isPending}
                className="px-4 py-2 rounded-xl text-sm font-black bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-2"
              >
                {restoreMut.isPending ? 'جارٍ الاستعادة...' : 'نعم، استعد البيانات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
