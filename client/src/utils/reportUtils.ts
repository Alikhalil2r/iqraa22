export const REPORT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6']

export const TOOLTIP_STYLE = {
  fontFamily: 'Cairo, sans-serif',
  fontSize: 12,
  borderRadius: 12,
  border: 'none',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
}

export function gradeLabel(avg: number) {
  if (avg >= 90) return { ar: 'ممتاز', color: '#16a34a' }
  if (avg >= 80) return { ar: 'جيد جداً', color: '#2563eb' }
  if (avg >= 70) return { ar: 'جيد', color: '#d97706' }
  if (avg >= 60) return { ar: 'مقبول', color: '#9333ea' }
  if (avg >= 50) return { ar: 'ضعيف', color: '#ea580c' }
  return { ar: 'راسب', color: '#dc2626' }
}

export function attendanceColor(rate: number) {
  if (rate >= 90) return '#10b981'
  if (rate >= 75) return '#6366f1'
  if (rate >= 60) return '#f59e0b'
  return '#ef4444'
}

export function feeStatusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    paid: { label: 'مدفوع', color: '#10b981' },
    unpaid: { label: 'غير مدفوع', color: '#ef4444' },
    partial: { label: 'جزئي', color: '#f59e0b' },
    waived: { label: 'معفى', color: '#6b7280' },
  }
  return map[status] || { label: status, color: '#6b7280' }
}

export function formatOMR(value: number | string | null | undefined) {
  const n = parseFloat(String(value ?? 0))
  return `${n.toLocaleString('ar-OM', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} ر.ع.`
}

export function formatPct(value: number | string | null | undefined, digits = 1) {
  const n = parseFloat(String(value ?? 0))
  return `${n.toFixed(digits)}%`
}
