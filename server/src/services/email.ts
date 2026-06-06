import nodemailer from 'nodemailer'
import { query } from '../db'

interface EmailOptions {
  to: string
  subject: string
  html: string
  schoolId: string
}

async function getSchoolSMTPConfig(schoolId: string) {
  const result = await query(
    `SELECT smtp_host, smtp_port, smtp_user, smtp_pass, email_from_name, email_enabled
     FROM school_settings WHERE school_id = $1`,
    [schoolId]
  )
  return result.rows[0] || null
}

export async function sendEmail(opts: EmailOptions): Promise<{ ok: boolean; error?: string }> {
  try {
    const config = await getSchoolSMTPConfig(opts.schoolId)
    if (!config || !config.email_enabled || !config.smtp_host || !config.smtp_user) {
      return { ok: false, error: 'البريد الإلكتروني غير مفعّل أو غير مضبوط' }
    }

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: config.smtp_port === 465,
      auth: { user: config.smtp_user, pass: config.smtp_pass },
      tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    })

    await transporter.sendMail({
      from: `"${config.email_from_name || 'نظام المدرسة'}" <${config.smtp_user}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    return { ok: true }
  } catch (err: any) {
    console.error('[Email Error]', err.message)
    return { ok: false, error: err.message }
  }
}

export async function testEmailConfig(schoolId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const config = await getSchoolSMTPConfig(schoolId)
    if (!config || !config.smtp_host) return { ok: false, error: 'لا يوجد إعداد SMTP' }

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: config.smtp_port === 465,
      auth: { user: config.smtp_user, pass: config.smtp_pass },
      tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    })
    await transporter.verify()
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

function emailTemplate(title: string, body: string, schoolName = 'المدرسة') {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; direction: rtl; }
  .container { max-width: 600px; margin: auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 28px 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
  .header p { margin: 6px 0 0; opacity: 0.85; font-size: 13px; }
  .body { padding: 32px; color: #374151; line-height: 1.7; font-size: 15px; }
  .footer { background: #f9fafb; padding: 20px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; }
  .badge-blue { background: #eff6ff; color: #1e40af; }
  .badge-green { background: #f0fdf4; color: #16a34a; }
  .badge-red { background: #fef2f2; color: #dc2626; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p>${schoolName}</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">هذه الرسالة مُرسَلة تلقائياً من نظام إدارة المدرسة</div>
  </div>
</body>
</html>`
}

export async function sendAbsenceAlert(opts: {
  schoolId: string; schoolName: string
  parentEmail: string; studentName: string; date: string; className: string
}) {
  return sendEmail({
    to: opts.parentEmail,
    subject: `تنبيه غياب — ${opts.studentName}`,
    schoolId: opts.schoolId,
    html: emailTemplate(
      '🔔 تنبيه غياب',
      `<p>عزيزي ولي الأمر،</p>
       <p>نُعلمكم بأن الطالب/ة <strong>${opts.studentName}</strong> كان/ت <span class="badge badge-red">غائباً</span> عن المدرسة بتاريخ <strong>${opts.date}</strong> في الفصل <strong>${opts.className}</strong>.</p>
       <p>يُرجى التواصل مع إدارة المدرسة لمعرفة السبب.</p>`,
      opts.schoolName
    ),
  })
}

export async function sendGradeNotification(opts: {
  schoolId: string; schoolName: string
  parentEmail: string; studentName: string; subject: string; grade: number; maxGrade: number
}) {
  const pct = Math.round((opts.grade / opts.maxGrade) * 100)
  const badgeClass = pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-blue' : 'badge-red'
  return sendEmail({
    to: opts.parentEmail,
    subject: `نتيجة جديدة — ${opts.studentName} — ${opts.subject}`,
    schoolId: opts.schoolId,
    html: emailTemplate(
      '📊 نتيجة دراسية جديدة',
      `<p>تم تسجيل نتيجة جديدة للطالب/ة <strong>${opts.studentName}</strong>:</p>
       <ul>
         <li>المادة: <strong>${opts.subject}</strong></li>
         <li>الدرجة: <span class="badge ${badgeClass}">${opts.grade} / ${opts.maxGrade} (${pct}%)</span></li>
       </ul>`,
      opts.schoolName
    ),
  })
}

export async function sendFeeReminder(opts: {
  schoolId: string; schoolName: string
  parentEmail: string; studentName: string; amount: number; dueDate: string; description: string
}) {
  return sendEmail({
    to: opts.parentEmail,
    subject: `تذكير رسوم — ${opts.studentName}`,
    schoolId: opts.schoolId,
    html: emailTemplate(
      '💳 تذكير بالرسوم المستحقة',
      `<p>نُذكّركم بأن هناك رسوماً مستحقة على الطالب/ة <strong>${opts.studentName}</strong>:</p>
       <ul>
         <li>البيان: <strong>${opts.description}</strong></li>
         <li>المبلغ: <strong>${opts.amount.toLocaleString('ar')} ر.ع</strong></li>
         <li>تاريخ الاستحقاق: <strong>${opts.dueDate}</strong></li>
       </ul>
       <p>يُرجى سداد المبلغ في أقرب وقت ممكن.</p>`,
      opts.schoolName
    ),
  })
}
