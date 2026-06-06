import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { query } from '../db'

const REFRESH_TOKEN_DAYS = 7
const REFRESH_COOKIE = 'iqraa_refresh'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return secret
}

export function refreshCookieName() {
  return REFRESH_COOKIE
}

export function refreshCookieOptions() {
  const secure = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  }
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(48).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
    [userId, tokenHash, expiresAt]
  )
  return jwt.sign({ sub: userId, th: tokenHash, tokenType: 'refresh' }, getSecret(), { expiresIn: `${REFRESH_TOKEN_DAYS}d` })
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const decoded = jwt.verify(token, getSecret()) as { sub: string; th: string; tokenType: string }
    if (decoded.tokenType !== 'refresh') return null
    const row = await query(
      `SELECT id FROM refresh_tokens WHERE user_id=$1 AND token_hash=$2 AND expires_at > NOW() AND revoked_at IS NULL`,
      [decoded.sub, decoded.th]
    )
    if (!row.rows[0]) return null
    return { userId: decoded.sub }
  } catch {
    return null
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  try {
    const decoded = jwt.verify(token, getSecret()) as { th: string }
    await query(`UPDATE refresh_tokens SET revoked_at=NOW() WHERE token_hash=$1`, [decoded.th])
  } catch { /* ignore */ }
}
