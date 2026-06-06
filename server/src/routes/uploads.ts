import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { query } from '../db'
import { createLogger } from '../utils/logger'

const router = Router()
const log = createLogger('UPLOADS')

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
const USE_S3 = process.env.S3_BUCKET && process.env.S3_ENDPOINT

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10)
    cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|png|jpg|jpeg|zip)$/i
    if (allowed.test(file.originalname)) cb(null, true)
    else cb(new Error('نوع الملف غير مسموح'))
  },
})

function publicUrl(filename: string): string {
  if (USE_S3) return `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${filename}`
  return `/api/uploads/files/${filename}`
}

const HOMEWORK_STAFF_ROLES = new Set(['super_admin', 'admin', 'teacher'])

async function canAccessHomeworkFile(user: AuthRequest['user'], filename: string): Promise<boolean> {
  if (!user) return false
  const r = await query(
    `SELECT hs.student_id, s.parent_id, h.school_id
     FROM homework_submissions hs
     JOIN students s ON s.id = hs.student_id
     JOIN homework h ON h.id = hs.homework_id
     WHERE hs.attachment_url LIKE $1
     LIMIT 1`,
    [`%/${filename}`]
  )
  const row = r.rows[0]
  if (!row) return true
  if (user.role === 'parent') return row.parent_id === user.id
  if (HOMEWORK_STAFF_ROLES.has(user.role)) return row.school_id === user.schoolId
  return false
}

router.post('/homework', authenticateToken, requireRole('parent'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { homeworkId, studentId } = req.body
    if (!req.file || !homeworkId || !studentId) {
      return res.status(400).json({ error: 'الملف ومعرف الواجب ومعرف الطالب مطلوبة' })
    }

    const child = await query(
      `SELECT id FROM students WHERE id=$1 AND parent_id=$2 AND school_id=$3`,
      [studentId, req.user!.id, req.user!.schoolId]
    )
    if (!child.rows[0]) return res.status(403).json({ error: 'غير مصرح' })

    const fileUrl = publicUrl(req.file.filename)
    await query(
      `INSERT INTO homework_submissions (homework_id, student_id, attachment_url, status, submission_date)
       VALUES ($1,$2,$3,'submitted',CURRENT_DATE)
       ON CONFLICT (homework_id, student_id) DO UPDATE SET attachment_url=$3, status='submitted', submission_date=CURRENT_DATE`,
      [homeworkId, studentId, fileUrl]
    )

    res.json({ success: true, fileUrl, storage: USE_S3 ? 's3' : 'local' })
  } catch (err) {
    log.error('Homework upload failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/files/:filename', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const safe = path.basename(req.params.filename)
    const full = path.join(UPLOAD_DIR, safe)
    if (!fs.existsSync(full)) return res.status(404).json({ error: 'Not found' })

    const allowed = await canAccessHomeworkFile(req.user, safe)
    if (!allowed) return res.status(403).json({ error: 'غير مصرح' })

    res.sendFile(full)
  } catch (err) {
    log.error('File download failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
