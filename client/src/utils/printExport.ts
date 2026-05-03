export interface PrintColumn {
  header: string
  key: string
  width?: string
}

export function printTable(title: string, subtitle: string, columns: PrintColumn[], rows: any[]) {
  const tableRows = rows.map(row =>
    `<tr>${columns.map(col => `<td>${row[col.key] ?? '—'}</td>`).join('')}</tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; direction: rtl; color: #1e293b; background: #fff; padding: 32px; }
    .header { text-align: center; margin-bottom: 28px; border-bottom: 3px solid #6366f1; padding-bottom: 16px; }
    .header h1 { font-size: 22px; font-weight: 900; color: #6366f1; margin-bottom: 4px; }
    .header p { font-size: 13px; color: #64748b; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: #6366f1; color: white; }
    thead th { padding: 10px 12px; text-align: right; font-weight: 700; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #ede9fe; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    @media print {
      body { padding: 16px; }
      @page { margin: 1cm; size: A4 landscape; }
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"/>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>
  <div class="meta">
    <span>إجمالي السجلات: <strong>${rows.length}</strong></span>
    <span>تاريخ الطباعة: <strong>${new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
  </div>
  <table>
    <thead>
      <tr>${columns.map(col => `<th>${col.header}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">تم إنشاؤه بواسطة نظام إدارة المدارس — ${new Date().toLocaleString('ar-OM')}</div>
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
