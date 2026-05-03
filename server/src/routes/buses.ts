import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('BUSES')

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const result = await query(`
      SELECT b.id, b.bus_number, b.plate_number, b.driver_name, b.driver_phone,
             b.supervisor_name, b.supervisor_phone, b.capacity, b.route_name,
             b.route_description, b.morning_time, b.afternoon_time, b.is_active,
             b.gps_id, b.notes, b.created_at,
             COUNT(DISTINCT s.id) as student_count
      FROM buses b LEFT JOIN students s ON s.bus_id=b.id
      WHERE b.school_id=$1 GROUP BY b.id ORDER BY b.bus_number`, [schoolId])
    res.json({ buses: result.rows })
  } catch (err) {
    log.error('GET / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    if (!d.busNumber) return res.status(400).json({ error: 'رقم الحافلة مطلوب' })
    const result = await query(`
      INSERT INTO buses (school_id,bus_number,plate_number,driver_name,driver_phone,supervisor_name,
        supervisor_phone,capacity,route_name,route_description,morning_time,afternoon_time,is_active,gps_id,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [schoolId, d.busNumber, d.plateNumber, d.driverName, d.driverPhone,
       d.supervisorName, d.supervisorPhone, d.capacity || 40, d.routeName,
       d.routeDescription, d.morningTime, d.afternoonTime, d.isActive !== false,
       d.gpsId, d.notes?.slice(0, 500)]
    )
    log.info('Bus created', { busId: result.rows[0].id, schoolId })
    res.status(201).json({ bus: result.rows[0] })
  } catch (err) {
    log.error('POST / failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const result = await query(`
      UPDATE buses SET bus_number=$1,plate_number=$2,driver_name=$3,driver_phone=$4,supervisor_name=$5,
        supervisor_phone=$6,capacity=$7,route_name=$8,route_description=$9,morning_time=$10,
        afternoon_time=$11,is_active=$12,gps_id=$13,notes=$14
      WHERE id=$15 AND school_id=$16 RETURNING *`,
      [d.busNumber, d.plateNumber, d.driverName, d.driverPhone, d.supervisorName,
       d.supervisorPhone, d.capacity, d.routeName, d.routeDescription, d.morningTime,
       d.afternoonTime, d.isActive, d.gpsId, d.notes?.slice(0, 500),
       req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ bus: result.rows[0] })
  } catch (err) {
    log.error('PUT /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM buses WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    log.info('Bus deleted', { busId: req.params.id })
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:id/students', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const busCheck = await query('SELECT id FROM buses WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    if (!busCheck.rows[0]) return res.status(404).json({ error: 'Not found' })
    const result = await query(
      `SELECT id, name, student_number, class_name, grade_level FROM students WHERE bus_id=$1 ORDER BY name`,
      [req.params.id]
    )
    res.json({ students: result.rows })
  } catch (err) {
    log.error('GET /:id/students failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:id/students', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const busCheck = await query('SELECT id FROM buses WHERE id=$1 AND school_id=$2', [req.params.id, req.user!.schoolId])
    if (!busCheck.rows[0]) return res.status(404).json({ error: 'Not found' })
    await query('UPDATE students SET bus_id=$1 WHERE id=$2 AND school_id=$3', [req.params.id, req.body.studentId, req.user!.schoolId])
    res.json({ success: true })
  } catch (err) {
    log.error('POST /:id/students failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id/students/:studentId', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    await query('UPDATE students SET bus_id=NULL WHERE id=$1 AND school_id=$2', [req.params.studentId, req.user!.schoolId])
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /:id/students/:studentId failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
