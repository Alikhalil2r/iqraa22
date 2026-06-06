export interface PrintColumn {
  header: string
  key: string
  width?: string
}

export interface PrintOptions {
  schoolName?: string
  primaryColor?: string
  landscape?: boolean
}

export function printTable(title: string, subtitle: string, columns: PrintColumn[], rows: any[], options: PrintOptions = {}) {
  const schoolName = options.schoolName || 'نظام إدارة المدرسة'
  const primary = options.primaryColor || '#6366f1'
  const landscape = options.landscape !== false

  const tableRows = rows.map((row, i) =>
    `<tr>${columns.map(col => `<td>${row[col.key] ?? '—'}</td>`).join('')}</tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; direction: rtl; color: #1e293b; background: #fff; padding: 28px; }
    .brand { text-align: center; margin-bottom: 20px; padding: 20px; border-radius: 16px; background: linear-gradient(135deg, ${primary}, ${primary}cc); color: white; }
    .brand h1 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
    .brand p { font-size: 12px; opacity: 0.9; }
    .title-block { text-align: center; margin-bottom: 20px; }
    .title-block h2 { font-size: 22px; font-weight: 900; color: ${primary}; margin-bottom: 4px; }
    .title-block p { font-size: 13px; color: #64748b; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #64748b; background: #f8fafc; padding: 12px 16px; border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; border-radius: 12px; overflow: hidden; }
    thead tr { background: ${primary}; color: white; }
    thead th { padding: 11px 12px; text-align: right; font-weight: 800; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 2px dashed #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    @media print {
      body { padding: 12px; }
      @page { margin: 1cm; size: A4 ${landscape ? 'landscape' : 'portrait'}; }
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"/>
</head>
<body>
  <div class="brand">
    <h1>${schoolName}</h1>
    <p>تقرير رسمي — نظام إدارة المدرسة</p>
  </div>
  <div class="title-block">
    <h2>${title}</h2>
    <p>${subtitle}</p>
  </div>
  <div class="meta">
    <span>إجمالي السجلات: <strong>${rows.length}</strong></span>
    <span>تاريخ الإصدار: <strong>${new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
  </div>
  <table>
    <thead>
      <tr>${columns.map(col => `<th>${col.header}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="' + columns.length + '" style="text-align:center;padding:24px;color:#94a3b8">لا توجد بيانات</td></tr>'}</tbody>
  </table>
  <div class="footer">
    <span>توقيع المسؤول: ________________</span>
    <span>${new Date().toLocaleString('ar-OM')}</span>
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=1100,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

export function printCustom(title: string, bodyHtml: string) {
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; direction: rtl; color: #1e293b; background: #fff; padding: 32px; }
    @media print { body { padding: 16px; } @page { margin: 1cm; } }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"/>
</head>
<body>
  ${bodyHtml}
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`
  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) { win.document.write(html); win.document.close() }
}
