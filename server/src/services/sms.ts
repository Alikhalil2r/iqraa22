import { createLogger } from '../utils/logger'
import { query } from '../db'

const log = createLogger('SMS')

export async function sendSms(
  userId: string,
  phone: string,
  message: string
): Promise<{ sent: boolean; mock: boolean; provider: string }> {
  const prefs = await query(
    `SELECT sms_enabled, whatsapp_enabled FROM notification_preferences WHERE user_id=$1`,
    [userId]
  )
  const p = prefs.rows[0]
  if (p && !p.sms_enabled && !p.whatsapp_enabled) {
    return { sent: false, mock: true, provider: 'opt-out' }
  }

  const provider = process.env.SMS_PROVIDER || 'stub'
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  if (provider === 'twilio' && sid && token && from) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const body = new URLSearchParams({ To: phone, From: from, Body: message })
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })
    if (!res.ok) {
      log.error('Twilio send failed', { status: res.status })
      return { sent: false, mock: false, provider: 'twilio' }
    }
    log.info('SMS sent via Twilio', { phone: phone.slice(0, 6) + '***' })
    return { sent: true, mock: false, provider: 'twilio' }
  }

  log.info('SMS stub', { phone: phone.slice(0, 6) + '***', message: message.slice(0, 40) })
  return { sent: true, mock: true, provider: 'stub' }
}
