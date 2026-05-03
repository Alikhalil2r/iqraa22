import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'

// ── UUID v4 validation ────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isValidUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

/** Express middleware: validates req.params.id is a UUID */
export function validateUUIDParam(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const val = req.params[paramName]
    if (!isValidUUID(val)) return res.status(400).json({ error: `معرف ${paramName} غير صالح` })
    next()
  }
}

export function validate(chains: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map(c => c.run(req)))
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const messages = errors.array().map(e => e.msg)
      return res.status(400).json({ error: messages[0], errors: messages })
    }
    next()
  }
}

export function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

export function sanitizeCSS(css: unknown): string {
  if (typeof css !== 'string') return ''
  // Strip JS inside CSS: expressions, url(javascript:...), @import with external
  return css
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/@import\s+['"]?https?:\/\//gi, '')
    .replace(/behavior\s*:/gi, '')
    .replace(/-moz-binding\s*:/gi, '')
    .slice(0, 10000) // cap at 10kb
}

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 50

export function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `كلمة المرور طويلة جداً`
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'كلمة المرور يجب أن تحتوي على حرف إنجليزي واحد على الأقل'
  }
  if (!/[0-9]/.test(password)) {
    return 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'
  }
  return null
}
