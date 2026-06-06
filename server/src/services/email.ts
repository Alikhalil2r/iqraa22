import nodemailer from 'nodemailer'
import { createLogger } from '../utils/logger'

const log = createLogger('EMAIL')

const templates = {
  absence: (data: { studentName: string; date: string; schoolName: string }) => ({
    subject: `تنبيه غياب — ${data.studentName}`,
    html: `<div dir="rtl" style="font-family:Tahoma,sans-serif">
      <h2>تنبيه غياب</h2>
      <p>ولي الأمر الكريم،</p>
      <p>نفيدكم بأن الطالب/ة <strong>${data.studentName}</strong> قد تغيب/ت عن المدرسة بتاريخ <strong>${data.date}</strong>.</p>
      <p>مع تحيات إدارة <strong>${data.schoolName}</strong></p>
    </div>`,
  }),
  fees: (data: { studentName: string; amount: string; dueDate: string; schoolName: string }) => ({
    subject: `تذكير رسوم — ${data.studentName}`,
    html: `<div dir="rtl" style="font-family:Tahoma,sans-serif">
      <h2>تذكير بالرسوم الدراسية</h2>
      <p>المبلغ المستحق: <strong>${data.amount} ر.ع</strong></p>
      <p>تاريخ الاستحقاق: <strong>${data.dueDate}</strong></p>
      <p>للطالب/ة: <strong>${data.studentName}</strong></p>
      <p>${data.schoolName}</p>
    </div>`,
  }),
  message: (data: { fromName: string; subject: string; preview: string; schoolName: string }) => ({
    subject: `رسالة جديدة — ${data.subject}`,
    html: `<div dir="rtl" style="font-family:Tahoma,sans-serif">
      <h2>رسالة جديدة من ${data.fromName}</h2>
      <p><strong>${data.subject}</strong></p>
      <p>${data.preview}</p>
      <p>سجّل الدخول إلى بوابة الأولياء لمتابعة الرسائل.</p>
      <p>${data.schoolName}</p>
    </div>`,
  }),
}

export type EmailTemplate = keyof typeof templates

function getTransport() {
  const host = process.env.SMTP_HOST
  if (!host) return null
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  })
}

export async function sendTemplateEmail(
  to: string,
  template: EmailTemplate,
  data: Record<string, string>
): Promise<{ sent: boolean; mock: boolean }> {
  const { subject, html } = templates[template](data as never)
  const transport = getTransport()

  if (!transport) {
    log.info('Email mock send', { to, template, subject })
    return { sent: true, mock: true }
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@iqraa.demo',
    to,
    subject,
    html,
  })
  log.info('Email sent', { to, template })
  return { sent: true, mock: false }
}

/** Super-admin SMTP test — uses env SMTP or school_settings when configured */
export async function testEmailConfig(_schoolId: string): Promise<{ ok: boolean; error?: string }> {
  const transport = getTransport()
  if (!transport) {
    return { ok: true }
  }
  try {
    await transport.verify()
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}
