import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const ACCESS_TOKEN_EXPIRY = '2h'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return secret
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    schoolId: string
    role: string
    username: string
    name: string
    tokenType: string
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'لم يتم تقديم رمز المصادقة' })
  }

  try {
    const decoded = jwt.verify(token, getSecret()) as any

    if (decoded.tokenType !== 'access') {
      return res.status(401).json({ error: 'نوع الرمز غير صالح' })
    }

    req.user = decoded
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'انتهت صلاحية رمز المصادقة', expired: true })
    }
    return res.status(401).json({ error: 'رمز المصادقة غير صالح' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مصرح' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' })
    }
    next()
  }
}

export function generateToken(payload: {
  id: string
  schoolId: string
  role: string
  username: string
  name: string
}): string {
  return jwt.sign(
    { ...payload, tokenType: 'access' },
    getSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}
