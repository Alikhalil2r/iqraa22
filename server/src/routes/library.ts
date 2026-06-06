import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import { writeLimiter } from '../middleware/rateLimiter'
import { createLogger } from '../utils/logger'

const router = Router()
router.use(authenticateToken)
const log = createLogger('LIBRARY')

router.get('/books', requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { search, category, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))
    let q = `SELECT * FROM library_books WHERE school_id=$1 AND is_active=true`
    const params: unknown[] = [schoolId]
    if (category) { params.push(category); q += ` AND category=$${params.length}` }
    if (search) { params.push(`%${search}%`); q += ` AND (title ILIKE $${params.length} OR author ILIKE $${params.length})` }
    q += ` ORDER BY title LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)
    const [books, stats] = await Promise.all([
      query(q, params),
      query(`SELECT COUNT(*) as total, COALESCE(SUM(copies_total),0) as copies, COALESCE(SUM(copies_available),0) as available
             FROM library_books WHERE school_id=$1 AND is_active=true`, [schoolId]),
    ])
    res.json({ books: books.rows, stats: stats.rows[0] })
  } catch (err) {
    log.error('GET /books failed', { error: (err as Error).message })
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/books', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const d = req.body
    const copies = parseInt(String(d.copiesTotal)) || 1
    const result = await query(
      `INSERT INTO library_books (school_id,title,author,isbn,category,publisher,published_year,copies_total,copies_available,shelf_location,description,cover_url,language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,$11,$12) RETURNING *`,
      [schoolId, d.title?.slice(0, 300), d.author?.slice(0, 200), d.isbn?.slice(0, 50), d.category?.slice(0, 100),
       d.publisher?.slice(0, 200), d.publishedYear ? parseInt(String(d.publishedYear)) : null, copies,
       d.shelfLocation?.slice(0, 100), d.description?.slice(0, 2000), d.coverUrl || null, d.language?.slice(0, 50) || 'العربية']
    )
    res.status(201).json({ book: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/books/:id', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const d = req.body
    const result = await query(
      `UPDATE library_books SET title=COALESCE($1,title), author=COALESCE($2,author), category=COALESCE($3,category),
       shelf_location=COALESCE($4,shelf_location), description=COALESCE($5,description), cover_url=COALESCE($6,cover_url)
       WHERE id=$7 AND school_id=$8 RETURNING *`,
      [d.title?.slice(0, 300), d.author?.slice(0, 200), d.category?.slice(0, 100), d.shelfLocation?.slice(0, 100),
       d.description?.slice(0, 2000), d.coverUrl, req.params.id, req.user!.schoolId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ book: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.delete('/books/:id', requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    await query(`UPDATE library_books SET is_active=false WHERE id=$1 AND school_id=$2`, [req.params.id, req.user!.schoolId])
    res.json({ ok: true })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.get('/borrows', requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { status, page = '1', limit = '100' } = req.query
    const offset = (parseInt(String(page)) - 1) * parseInt(String(limit))
    let q = `SELECT lb.*, b.title as book_title, b.author as book_author,
      CASE WHEN lb.borrower_type='student' THEN s.name ELSE e.name END as borrower_name
      FROM library_borrows lb JOIN library_books b ON b.id=lb.book_id
      LEFT JOIN students s ON lb.borrower_type='student' AND s.id=lb.borrower_id
      LEFT JOIN employees e ON lb.borrower_type='employee' AND e.id=lb.borrower_id
      WHERE lb.school_id=$1`
    const params: unknown[] = [schoolId]
    if (status) { params.push(status); q += ` AND lb.status=$${params.length}` }
    q += ` ORDER BY lb.borrow_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(String(limit)), offset)
    const [borrows, stats] = await Promise.all([
      query(q, params),
      query(`SELECT COUNT(*) as total,
        COUNT(CASE WHEN status='borrowed' THEN 1 END) as borrowed,
        COUNT(CASE WHEN status='overdue' THEN 1 END) as overdue
        FROM library_borrows WHERE school_id=$1`, [schoolId]),
    ])
    res.json({ borrows: borrows.rows, stats: stats.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.post('/borrows', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { bookId, borrowerId, borrowerType, dueDate, notes } = req.body
    if (!bookId || !borrowerId || !dueDate) return res.status(400).json({ error: 'بيانات الإعارة ناقصة' })
    const book = await query(`SELECT copies_available FROM library_books WHERE id=$1 AND school_id=$2 AND is_active=true`, [bookId, schoolId])
    if (!book.rows[0] || book.rows[0].copies_available < 1) return res.status(400).json({ error: 'لا توجد نسخ متاحة' })
    const result = await query(
      `INSERT INTO library_borrows (school_id,book_id,borrower_id,borrower_type,due_date,notes,issued_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [schoolId, bookId, borrowerId, borrowerType || 'student', dueDate, notes?.slice(0, 500), userId]
    )
    await query(`UPDATE library_books SET copies_available=copies_available-1 WHERE id=$1`, [bookId])
    res.status(201).json({ borrow: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

router.put('/borrows/:id/return', writeLimiter, requireRole('admin', 'librarian'), async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { fineAmount, notes } = req.body
    const borrow = await query(`SELECT * FROM library_borrows WHERE id=$1 AND school_id=$2`, [req.params.id, schoolId])
    if (!borrow.rows[0]) return res.status(404).json({ error: 'Not found' })
    const result = await query(
      `UPDATE library_borrows SET status='returned', return_date=CURRENT_DATE,
       fine_amount=COALESCE($1,fine_amount), notes=COALESCE($2,notes) WHERE id=$3 RETURNING *`,
      [fineAmount ? parseFloat(String(fineAmount)) : 0, notes?.slice(0, 500), req.params.id]
    )
    await query(`UPDATE library_books SET copies_available=copies_available+1 WHERE id=$1`, [borrow.rows[0].book_id])
    res.json({ borrow: result.rows[0] })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

export default router
