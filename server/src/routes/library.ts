import { Router } from 'express'
import { query } from '../db'
import { withTransaction } from '../db/transaction'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
router.use(authenticateToken)
const log = createLogger('LIBRARY')

router.get('/books', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { category, search, available, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))

    let q = `SELECT id, title, author, isbn, category, publisher, published_year,
               copies_total, copies_available, shelf_location, description, cover_url,
               language, is_active, created_at
             FROM library_books WHERE school_id=$1 AND is_active=true`
    const params: unknown[] = [schoolId]
    if (category) { params.push(category); q += ` AND category=$${params.length}` }
    if (search)   { params.push(`%${search}%`); q += ` AND (title ILIKE $${params.length} OR author ILIKE $${params.length})` }
    if (available === 'true') q += ` AND copies_available > 0`
    q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)

    const [result, stats] = await Promise.all([
      query(q, params),
      query(`SELECT COUNT(*) as total_books, COALESCE(SUM(copies_total),0) as total_copies,
               COALESCE(SUM(copies_available),0) as available_copies, COUNT(DISTINCT category) as categories
             FROM library_books WHERE school_id=$1 AND is_active=true`, [schoolId])
    ])
    res.json({ books: result.rows, stats: stats.rows[0] })
  } catch (err) {
    log.error('GET /books failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/books', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, author, isbn, category, publisher, publishedYear, copiesTotal,
            shelfLocation, description, coverUrl, language } = req.body
    if (!title) return res.status(400).json({ error: 'عنوان الكتاب مطلوب' })
    const copies = Math.max(1, parseInt(copiesTotal) || 1)
    const result = await query(`
      INSERT INTO library_books (school_id, title, author, isbn, category, publisher, published_year,
        copies_total, copies_available, shelf_location, description, cover_url, language)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [schoolId, title, author, isbn, category, publisher, publishedYear || null,
       copies, copies, shelfLocation, description, coverUrl, language || 'العربية']
    )
    log.info('Book added', { bookId: result.rows[0].id, title })
    res.status(201).json({ book: result.rows[0] })
  } catch (err) {
    log.error('POST /books failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/books/:id', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, author, isbn, category, publisher, publishedYear, copiesTotal,
            shelfLocation, description, coverUrl, language } = req.body
    const result = await query(`
      UPDATE library_books SET title=$1, author=$2, isbn=$3, category=$4, publisher=$5,
        published_year=$6, copies_total=$7, shelf_location=$8, description=$9,
        cover_url=$10, language=$11
      WHERE id=$12 AND school_id=$13 RETURNING *`,
      [title, author, isbn, category, publisher, publishedYear || null,
       Math.max(1, parseInt(copiesTotal) || 1),
       shelfLocation, description, coverUrl, language, req.params.id, schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ book: result.rows[0] })
  } catch (err) {
    log.error('PUT /books/:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/books/:id', requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    await query('UPDATE library_books SET is_active=false WHERE id=$1 AND school_id=$2',
      [req.params.id, req.user!.schoolId])
    log.info('Book soft-deleted', { bookId: req.params.id })
    res.json({ success: true })
  } catch (err) {
    log.error('DELETE /books/:id failed', { id: req.params.id, error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/borrows', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const result = await query(`
      SELECT lb.id, lb.borrow_date, lb.due_date, lb.return_date, lb.status,
             lb.fine_amount, lb.notes,
             s.name as student_name, s.student_number,
             b.title as book_title, b.author
      FROM library_borrows lb
      JOIN students s ON s.id=lb.student_id
      JOIN library_books b ON b.id=lb.book_id
      WHERE lb.school_id=$1 ORDER BY lb.borrow_date DESC LIMIT 200`, [schoolId])
    res.json({ borrows: result.rows })
  } catch (err) {
    log.error('GET /borrows failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/borrows', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { studentId, bookId, dueDate, notes } = req.body
    if (!studentId || !bookId || !dueDate) {
      return res.status(400).json({ error: 'studentId، bookId، dueDate مطلوبة' })
    }

    const result = await withTransaction(async (client) => {
      const bookRes = await client.query(
        'SELECT id, copies_available, title FROM library_books WHERE id=$1 AND school_id=$2 AND is_active=true FOR UPDATE',
        [bookId, schoolId]
      )
      if (!bookRes.rows[0]) throw Object.assign(new Error('Book not found'), { status: 404 })
      if (bookRes.rows[0].copies_available < 1) {
        throw Object.assign(new Error('لا توجد نسخ متاحة من هذا الكتاب'), { status: 400 })
      }

      const activeCheck = await client.query(
        `SELECT id FROM library_borrows WHERE student_id=$1 AND book_id=$2 AND status='borrowed'`,
        [studentId, bookId]
      )
      if (activeCheck.rows[0]) {
        throw Object.assign(new Error('الطالب يمتلك هذا الكتاب بالفعل'), { status: 400 })
      }

      await client.query(
        'UPDATE library_books SET copies_available=copies_available-1 WHERE id=$1', [bookId]
      )
      return client.query(`
        INSERT INTO library_borrows (school_id, student_id, book_id, due_date, notes)
        VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [schoolId, studentId, bookId, dueDate, notes]
      )
    })

    log.info('Book borrowed', { borrowId: result.rows[0].id, bookId, studentId })
    res.status(201).json({ borrow: result.rows[0] })
  } catch (err: any) {
    log.error('POST /borrows failed', { error: err.message })
    if (err.status === 404) return res.status(404).json({ error: err.message })
    if (err.status === 400) return res.status(400).json({ error: err.message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/borrows/:id/return', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { fineAmount, notes } = req.body

    const result = await withTransaction(async (client) => {
      const borrowRes = await client.query(
        `SELECT lb.id, lb.book_id, lb.status FROM library_borrows lb
         WHERE lb.id=$1 AND lb.school_id=$2 FOR UPDATE`, [req.params.id, schoolId]
      )
      if (!borrowRes.rows[0]) throw Object.assign(new Error('Borrow not found'), { status: 404 })
      if (borrowRes.rows[0].status === 'returned') {
        throw Object.assign(new Error('الكتاب مُعاد بالفعل'), { status: 400 })
      }

      await client.query(
        'UPDATE library_books SET copies_available=copies_available+1 WHERE id=$1',
        [borrowRes.rows[0].book_id]
      )
      return client.query(`
        UPDATE library_borrows SET status='returned', return_date=NOW(),
          fine_amount=$1, notes=$2 WHERE id=$3 RETURNING *`,
        [parseFloat(fineAmount) || 0, notes, req.params.id]
      )
    })

    log.info('Book returned', { borrowId: req.params.id })
    res.json({ borrow: result.rows[0] })
  } catch (err: any) {
    log.error('PUT /borrows/:id/return failed', { id: req.params.id, error: err.message })
    if (err.status === 404) return res.status(404).json({ error: err.message })
    if (err.status === 400) return res.status(400).json({ error: err.message })
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
