import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { search, classId, status, busId } = req.query
    let sql = `SELECT s.*, b.bus_number, b.route_name,
               c.name as class_display FROM students s
               LEFT JOIN buses b ON b.id = s.bus_id
               LEFT JOIN classes c ON c.id = s.class_id
               WHERE s.school_id = $1`
    const params: any[] = [schoolId]
    let i = 2
    if (search) { sql += ` AND (s.name ILIKE $${i} OR s.student_number ILIKE $${i})`; params.push(`%${String(search).slice(0, 100)}%`); i++ }
    if (classId) { sql += ` AND s.class_id = $${i}`; params.push(classId); i++ }
    if (status) { sql += ` AND s.status = $${i}`; params.push(String(status).slice(0, 20)); i++ }
    if (busId) { sql += ` AND s.bus_id = $${i}`; params.push(busId); i++ }
    sql += ' ORDER BY s.name'
    const result = await query(sql, params)
    res.json({ students: result.rows, total: result.rowCount })
  } catch (err: any) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT s.*, b.bus_number, b.route_name FROM students s
       LEFT JOIN buses b ON b.id = s.bus_id WHERE s.id=$1 AND s.school_id=$2`,
      [req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ student: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    if (!d.name) return res.status(400).json({ error: 'اسم الطالب مطلوب' })
    const result = await query(`
      INSERT INTO students (school_id,student_number,name,name_en,gender,date_of_birth,nationality,
        class_id,class_name,academic_year,status,parent_name,parent_phone,parent_email,parent_relation,
        address,blood_type,medical_notes,bus_id,photo,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING *`,
      [schoolId, d.studentNumber, d.name, d.nameEn, d.gender, d.dateOfBirth, d.nationality,
       d.classId, d.className, d.academicYear, d.status || 'active', d.parentName, d.parentPhone,
       d.parentEmail, d.parentRelation, d.address, d.bloodType,
       d.medicalNotes?.slice(0, 1000), d.busId, d.photo, d.notes?.slice(0, 1000)]
    )
    res.status(201).json({ student: result.rows[0] })
  } catch (err: any) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const result = await query(`
      UPDATE students SET name=$1,name_en=$2,gender=$3,date_of_birth=$4,nationality=$5,
        class_id=$6,class_name=$7,academic_year=$8,status=$9,parent_name=$10,parent_phone=$11,
        parent_email=$12,parent_relation=$13,address=$14,blood_type=$15,medical_notes=$16,
        bus_id=$17,photo=$18,notes=$19,student_number=$20
      WHERE id=$21 AND school_id=$22 RETURNING *`,
      [d.name, d.nameEn, d.gender, d.dateOfBirth, d.nationality, d.classId, d.className, d.academicYear,
       d.status, d.parentName, d.parentPhone, d.parentEmail, d.parentRelation, d.address, d.bloodType,
       d.medicalNotes?.slice(0, 1000), d.busId, d.photo, d.notes?.slice(0, 1000),
       d.studentNumber, req.params.id, req.user!.schoolId]
    )
    res.json({ student: result.rows[0] })
  } catch (err: any) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM students WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    res.json({ success: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// Grades for student — school isolation enforced
router.get('/:id/grades', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const studentCheck = await query(
      'SELECT id FROM students WHERE id=$1 AND school_id=$2',
      [req.params.id, req.user!.schoolId]
    )
    if (!studentCheck.rows[0]) return res.status(404).json({ error: 'الطالب غير موجود' })
    const result = await query(
      `SELECT * FROM grades WHERE student_id=$1 AND school_id=$2 ORDER BY academic_year DESC, term`,
      [req.params.id, req.user!.schoolId]
    )
    res.json({ grades: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// Attendance for student — school isolation enforced
router.get('/:id/attendance', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const studentCheck = await query(
      'SELECT id FROM students WHERE id=$1 AND school_id=$2',
      [req.params.id, req.user!.schoolId]
    )
    if (!studentCheck.rows[0]) return res.status(404).json({ error: 'الطالب غير موجود' })

    const { month, year } = req.query
    let sql = `SELECT * FROM attendance WHERE person_id=$1 AND person_type='student' AND school_id=$2`
    const params: any[] = [req.params.id, req.user!.schoolId]
    if (month && year) {
      sql += ` AND EXTRACT(MONTH FROM date)=$3 AND EXTRACT(YEAR FROM date)=$4`
      params.push(month, year)
    }
    sql += ' ORDER BY date DESC'
    const result = await query(sql, params)
    res.json({ attendance: result.rows })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
