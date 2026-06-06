import { query } from '../db'
import { createLogger } from './logger'

const log = createLogger('PARENT_NOTIFY')

export async function notifyParentUser(
  schoolId: string,
  parentUserId: string,
  title: string,
  body: string,
  type: string,
  link?: string
) {
  if (!parentUserId) return
  try {
    await query(
      `INSERT INTO notifications (school_id, user_id, title, body, type, link) VALUES ($1,$2,$3,$4,$5,$6)`,
      [schoolId, parentUserId, title.slice(0, 300), body.slice(0, 1000), type, link || null]
    )
  } catch (err) {
    log.error('Failed to notify parent', { parentUserId, error: (err as Error).message })
  }
}

export async function notifyParentOfStudent(
  schoolId: string,
  studentId: string,
  title: string,
  body: string,
  type: string,
  link?: string
) {
  const r = await query(
    `SELECT parent_id, name FROM students WHERE id=$1 AND school_id=$2 AND parent_id IS NOT NULL`,
    [studentId, schoolId]
  )
  const row = r.rows[0]
  if (!row?.parent_id) return
  const personalized = body.includes(row.name) ? body : `${row.name}: ${body}`
  await notifyParentUser(schoolId, row.parent_id, title, personalized, type, link)
}

export async function notifyParentsInClass(
  schoolId: string,
  className: string,
  title: string,
  body: string,
  type: string,
  link?: string
) {
  const students = await query(
    `SELECT DISTINCT parent_id, name FROM students
     WHERE school_id=$1 AND class_name=$2 AND status='active' AND parent_id IS NOT NULL`,
    [schoolId, className]
  )
  for (const s of students.rows) {
    await notifyParentUser(schoolId, s.parent_id, title, `${s.name}: ${body}`, type, link)
  }
}
