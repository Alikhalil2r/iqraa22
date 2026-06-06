import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { query } from '../db'
dotenv.config()

const ACCESS_TOKEN_EXPIRY = '2h'

export type AppRole = 'super_admin' | 'admin' | 'teacher' | 'parent' | 'accountant' | 'librarian' | 'hr_manager' | 'guard'

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin:  ['*'],
  admin:        ['dashboard','students','employees','attendance','grades','buses','messages','news','events','fees','schedule','reports','library','homework','conduct','leaves','settings','users','id_cards','teacher_dashboard','exams','gallery','announcements','pdf_reports','billing'],
  teacher:      ['dashboard','students.view','attendance','grades','homework','conduct','messages','schedule','teacher_dashboard','exams.view'],
  accountant:   ['dashboard','fees','reports.financial','students.view','employees.view','pdf_reports'],
  librarian:    ['dashboard','library','students.view'],
  hr_manager:   ['dashboard','employees','leaves','reports.hr','attendance.view','pdf_reports'],
  guard:        ['dashboard','attendance','buses','students.view'],
  parent:       ['parent.*'],
}

export const ADMIN_ROLES: AppRole[] = ['super_admin','admin','teacher','accountant','librarian','hr_manager','guard']
export const STAFF_ROLES: AppRole[] = ADMIN_ROLES
export const STUDENTS_VIEW_ROLES: AppRole[] = STAFF_ROLES
export const FINANCE_ROLES: AppRole[] = ['super_admin','admin','accountant']
export const HR_ROLES: AppRole[] = ['super_admin','admin','hr_manager']
export const TEACHING_ROLES: AppRole[] = ['super_admin','admin','teacher']
export const SETTINGS_ROLES: AppRole[] = ['super_admin','admin']
export const MANAGED_USER_ROLES = ['admin','teacher','parent','accountant','librarian','hr_manager','guard'] as const

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return secret
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    schoolId: string
    role: AppRole
    username: string
    name: string
    tokenType: string
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'لم يتم تقديم رمز المصادقة' })
  try {
    const decoded = jwt.verify(token, getSecret()) as {
      id: string; schoolId: string; role: AppRole; username: string; name: string; tokenType: string
    }
    if (decoded.tokenType !== 'access') return res.status(401).json({ error: 'نوع الرمز غير صالح' })

    const result = await query(
      `SELECT u.id, u.school_id, u.role, u.username, u.name, u.is_active, s.status AS school_status
       FROM users u JOIN schools s ON s.id = u.school_id
       WHERE u.id = $1`,
      [decoded.id]
    )
    const user = result.rows[0]
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'الحساب غير نشط أو غير موجود' })
    }
    if (user.role !== decoded.role) {
      return res.status(401).json({ error: 'انتهت صلاحية الجلسة — سجّل الدخول مجدداً', expired: true })
    }
    if (user.school_status === 'suspended' && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'المدرسة موقوفة مؤقتاً' })
    }

    req.user = {
      id: user.id,
      schoolId: user.school_id,
      role: user.role as AppRole,
      username: user.username,
      name: user.name,
      tokenType: 'access',
    }
    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'انتهت صلاحية رمز المصادقة', expired: true })
    return res.status(401).json({ error: 'رمز المصادقة غير صالح' })
  }
}

export function requireRole(...roles: AppRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'غير مصرح' })
    if (req.user.role === 'super_admin') return next()
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذا المورد' })
    next()
  }
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'غير مصرح' })
    const role = req.user.role as AppRole
    const perms = ROLE_PERMISSIONS[role] || []
    if (perms.includes('*') || perms.includes(permission) || perms.some(p => permission.startsWith(p.replace('.*','')))) {
      return next()
    }
    return res.status(403).json({ error: 'ليس لديك صلاحية لهذه العملية' })
  }
}

export function generateToken(payload: {
  id: string; schoolId: string; role: string; username: string; name: string
}): string {
  return jwt.sign({ ...payload, tokenType: 'access' }, getSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY })
}
