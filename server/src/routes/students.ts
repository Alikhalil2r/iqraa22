import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole, STUDENTS_VIEW_ROLES } from '../middleware/auth'
import { getTeacherScope } from '../utils/teacherScope'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('STUDENTS')

const STU_COLS = `s.id, s.student_number, s.name, s.name_en, s.gender, s.date_of_birth,
  s.nationality, s.class_id, s.class_name, s.academic_year, s.status,
  s.parent_id, s.parent_name, s.parent_phone, s.parent_email, s.parent_relation,
  s.address, s.blood_type, s.medical_notes, s.bus_id, s.photo, s.notes,
  s.created_at, b.bus_number, b.route_name`

router.get('/', authenticateToken, requireRole(...STUDENTS_VIEW_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId, role } = req.user!
    const { search, classId, status, busId, page = '1', limit = '200' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let sql = `SELECT ${STU_COLS}
               FROM students s LEFT JOIN buses b ON b.id=s.bus_id
               WHERE s.school_id=$1`
    const params: unknown[] = [schoolId]
    let i = 2

    if (role === 'teacher') {
      const scope = await getTeacherScope(schoolId, userId)
      const parts: string[] = []
      if (scope.classIds.length) {
        parts.push(`s.class_id = ANY($${i}::uuid[])`)
        params.push(scope.classIds)
        i++
      }
      if (scope.classNames.length) {
        parts.push(`s.class_name = ANY($${i}::text[])`)
        params.push(scope.classNames)
        i++
      }
      if (parts.length) sql += ` AND (${parts.join(' OR ')})`
      else sql += ' AND 1=0'
    }

    if (search)  { sql += ` AND (s.name ILIKE $${i} OR s.student_number ILIKE $${i})`; params.push(`%${String(search).slice(0, 100)}%`); i++ }
    if (classId) { sql += ` AND s.class_id=$${i}`;                                      params.push(classId); i++ }
    if (status)  { sql += ` AND s.status=$${i}`;                                         params.push(String(status).slice(0, 20)); i++ }
    if (busId)   { sql += ` AND s.bus_id=$${i}`;                                         params.push(busId); i++ }
    sql += ` ORDER BY s.name LIMIT $${i} OFFSET $${i + 1}`
    params.push(parseInt(String(limit)), offset)

    const result = await query(sql, params)
    res.json({ students: result.rows, total: result.rowCount })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/classes', authenticateToken, requireRole(...STUDENTS_VIEW_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const result = await query(
      `SELECT id, name, level, section, academic_year, capacity FROM classes WHERE school_id=$1 ORDER BY name`,
      [schoolId]
    )
    res.json({ classes: result.rows })
  } catch (err) {
    log.error('GET /classes failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

// Prisma POC — list active students via Prisma Client (#6)
router.get('/prisma-poc', authenticateToken, requireRole(...STUDENTS_VIEW_ROLES), async (req: AuthRequest, res) => {
  try {
    const { prisma } = await import('../db/prisma')
    const students = await prisma.student.findMany({
      where: { schoolId: req.user!.schoolId, status: 'active' },
      select: { id: true, name: true, studentNumber: true, className: true, status: true },
      orderBy: { name: 'asc' },
      take: 50,
    })
    res.json({ source: 'prisma', count: students.length, students })
  } catch (err) {
    log.error('Prisma POC failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Prisma POC failed' })
  }
})

router.get('/:id', authenticateToken, requireRole(...STUDENTS_VIEW_ROLES), async (req: AuthRequest, res) => {
  try {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(req.params.id)) return res.status(400).json({ error: 'معرّف غير صالح' })
    const result = await query(
      `SELECT ${STU_COLS} FROM students s LEFT JOIN buses b ON b.id=s.bus_id
       WHERE s.id=$1 AND s.school_id=$2`,
      [req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ student: result.rows[0] })
  } catch (err) {
    log.error('GET /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    if (!d.name) return res.status(400).json({ error: 'اسم الطالب مطلوب' })
    const result = await query(`
      INSERT INTO students (school_id,student_number,name,name_en,gender,date_of_birth,nationality,
        class_id,class_name,academic_year,status,parent_id,parent_name,parent_phone,parent_email,parent_relation,
        address,blood_type,medical_notes,bus_id,photo,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *`,
      [schoolId, d.studentNumber, d.name, d.nameEn, d.gender, d.dateOfBirth || null,
       d.nationality, d.classId || null, d.className, d.academicYear, d.status || 'active',
       d.parentId || null, d.parentName, d.parentPhone, d.parentEmail, d.parentRelation, d.address,
       d.bloodType, d.medicalNotes?.slice(0, 1000), d.busId || null,
       d.photo, d.notes?.slice(0, 1000)]
    )
    log.info('Student created', { studentId: result.rows[0].id, name: d.name })
    res.status(201).json({ student: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authenticateToken, writeLimiter, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    if (!d.name) return res.status(400).json({ error: 'اسم الطالب مطلوب' })
    const result = await query(`
      UPDATE students SET student_number=$1,name=$2,name_en=$3,gender=$4,date_of_birth=$5,
        nationality=$6,class_id=$7,class_name=$8,academic_year=$9,status=$10,parent_id=$11,
        parent_name=$12,parent_phone=$13,parent_email=$14,parent_relation=$15,address=$16,blood_type=$17,
        medical_notes=$18,bus_id=$19,photo=$20,notes=$21
      WHERE id=$22 AND school_id=$23 RETURNING *`,
      [d.studentNumber, d.name, d.nameEn, d.gender, d.dateOfBirth || null,
       d.nationality, d.classId || null, d.className, d.academicYear, d.status || 'active',
       d.parentId || null, d.parentName, d.parentPhone, d.parentEmail, d.parentRelation, d.address,
       d.bloodType, d.medicalNotes?.slice(0, 1000), d.busId || null,
       d.photo, d.notes?.slice(0, 1000), req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ student: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const check = await query('SELECT id FROM students WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    if (!check.rows[0]) return res.status(404).json({ error: 'Not found' })
    await query('UPDATE students SET status=$1 WHERE id=$2 AND school_id=$3',
      ['inactive', req.params.id, req.user!.schoolId])
    log.info('Student soft-deleted', { studentId: req.params.id })
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:id/attendance', authenticateToken, requireRole(...STUDENTS_VIEW_ROLES), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { startDate, endDate } = req.query
    const result = await query(`
      SELECT date, status, check_in_time, check_out_time, notes FROM attendance
      WHERE person_id=$1 AND school_id=$2 AND person_type='student'
        AND date BETWEEN $3 AND $4
      ORDER BY date DESC LIMIT 60`,
      [req.params.id, schoolId,
       startDate || new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
       endDate   || new Date().toISOString().split('T')[0]]
    )
    res.json({ attendance: result.rows })
  } catch (err) {
    log.error('GET /:id/attendance failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
