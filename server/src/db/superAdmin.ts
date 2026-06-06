import bcrypt from 'bcryptjs'
import { query } from './index'

/** Create platform super_admin on first run when SUPER_ADMIN_PASSWORD is set. */
export async function ensureSuperAdminFromEnv(): Promise<void> {
  const password = process.env.SUPER_ADMIN_PASSWORD?.trim()
  if (!password) return

  const existing = await query(`SELECT id FROM users WHERE role='super_admin' LIMIT 1`)
  if (existing.rows.length > 0) return

  const schoolRow = await query(`SELECT id FROM schools ORDER BY created_at ASC LIMIT 1`)
  const schoolId = schoolRow.rows[0]?.id
  if (!schoolId) {
    console.log('ℹ️  SUPER_ADMIN_PASSWORD set but no school exists yet — super_admin will be created after seed')
    return
  }

  const hash = await bcrypt.hash(password, 12)
  await query(
    `INSERT INTO users (school_id, username, password_hash, name, role, email, is_active)
     VALUES ($1,'superadmin',$2,'مدير النظام العليا','super_admin','superadmin@platform.local',true)`,
    [schoolId, hash]
  )
  console.log('✅ super_admin created (username: superadmin) — change password after first login')
}
