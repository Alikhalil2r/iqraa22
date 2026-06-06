import { query } from '../db'
import type { AppRole } from '../middleware/auth'

export type TeacherScope = {
  classIds: string[]
  classNames: string[]
  subjectNames: string[]
}

/** فصول ومواد المعلم من الجدول والمواد والفصل الرئيسي */
export async function getTeacherScope(schoolId: string, teacherId: string): Promise<TeacherScope> {
  const classIds = new Set<string>()
  const classNames = new Set<string>()
  const subjectNames = new Set<string>()

  const [homeroom, subjects, scheduleRows, classesByName] = await Promise.all([
    query(
      `SELECT id, name FROM classes WHERE school_id=$1 AND teacher_id=$2`,
      [schoolId, teacherId]
    ),
    query(
      `SELECT s.name, s.class_id, c.name as class_name
       FROM subjects s LEFT JOIN classes c ON c.id=s.class_id
       WHERE s.school_id=$1 AND s.teacher_id=$2`,
      [schoolId, teacherId]
    ),
    query(
      `SELECT DISTINCT class_id, subject_name FROM schedule
       WHERE school_id=$1 AND teacher_id=$2`,
      [schoolId, teacherId]
    ),
    query(
      `SELECT DISTINCT c.id, c.name FROM schedule sch
       JOIN classes c ON c.id=sch.class_id
       WHERE sch.school_id=$1 AND sch.teacher_id=$2 AND sch.class_id IS NOT NULL`,
      [schoolId, teacherId]
    ),
  ])

  for (const r of homeroom.rows) {
    if (r.id) classIds.add(r.id)
    if (r.name) classNames.add(r.name)
  }
  for (const r of subjects.rows) {
    if (r.name) subjectNames.add(r.name)
    if (r.class_id) classIds.add(r.class_id)
    if (r.class_name) classNames.add(r.class_name)
  }
  for (const r of scheduleRows.rows) {
    if (r.subject_name) subjectNames.add(r.subject_name)
    if (r.class_id) classIds.add(r.class_id)
  }
  for (const r of classesByName.rows) {
    if (r.id) classIds.add(r.id)
    if (r.name) classNames.add(r.name)
  }

  return {
    classIds: [...classIds],
    classNames: [...classNames],
    subjectNames: [...subjectNames],
  }
}

export function isTeacherRole(role: AppRole): boolean {
  return role === 'teacher'
}

function scopeMatchesClass(scope: TeacherScope, className?: string | null): boolean {
  if (!className) return scope.classNames.length === 0
  return scope.classNames.includes(className)
}

function scopeMatchesSubject(scope: TeacherScope, subjectName?: string | null): boolean {
  if (!subjectName) return scope.subjectNames.length === 0
  return scope.subjectNames.includes(subjectName)
}

/** هل يستطيع المعلم إدارة درجة/طالب ضمن نطاقه؟ */
export function teacherCanManageGradeScope(
  scope: TeacherScope,
  opts: { className?: string | null; subjectName?: string | null; recordedBy?: string | null },
  teacherId: string
): boolean {
  if (opts.recordedBy === teacherId) return true
  const classOk = scopeMatchesClass(scope, opts.className)
  const subjectOk = scopeMatchesSubject(scope, opts.subjectName)
  if (scope.classNames.length && scope.subjectNames.length) return classOk && subjectOk
  if (scope.classNames.length) return classOk
  if (scope.subjectNames.length) return subjectOk
  return false
}

/** هل الطالب ضمن فصول المعلم؟ */
export function teacherCanAccessStudent(
  scope: TeacherScope,
  student: { class_id?: string | null; class_name?: string | null }
): boolean {
  if (student.class_id && scope.classIds.includes(student.class_id)) return true
  if (student.class_name && scope.classNames.includes(student.class_name)) return true
  return scope.classIds.length === 0 && scope.classNames.length === 0
}

/** شرط SQL لتقييد الطلاب على فصول المعلم */
export function studentScopeClause(
  scope: TeacherScope,
  alias = 's',
  startParam: number
): { clause: string; params: string[] } {
  const params: string[] = []
  const parts: string[] = []
  let i = startParam

  if (scope.classIds.length) {
    parts.push(`${alias}.class_id = ANY($${i}::uuid[])`)
    params.push(scope.classIds as unknown as string)
    i++
  }
  if (scope.classNames.length) {
    parts.push(`${alias}.class_name = ANY($${i}::text[])`)
    params.push(scope.classNames as unknown as string)
    i++
  }

  if (!parts.length) {
    return { clause: ' AND 1=0', params: [] }
  }
  return { clause: ` AND (${parts.join(' OR ')})`, params }
}
