import { Router } from 'express'
import { query } from '../db'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)

// ─── Books ────────────────────────────────────────────────────────────────────
router.get('/books', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { category, search, available } = req.query
    let q = `SELECT * FROM library_books WHERE school_id=$1 AND is_active=true`
    const params: any[] = [schoolId]
    if (category) { params.push(category); q += ` AND category=$${params.length}` }
    if (search)   { params.push(`%${search}%`); q += ` AND (title ILIKE $${params.length} OR author ILIKE $${params.length})` }
    if (available === 'true') q += ` AND copies_available > 0`
    q += ' ORDER BY created_at DESC'
    const result = await query(q, params)
    const stats = await query(`
      SELECT COUNT(*) as total_books,
             SUM(copies_total) as total_copies,
             SUM(copies_available) as available_copies,
             COUNT(DISTINCT category) as categories
      FROM library_books WHERE school_id=$1 AND is_active=true
    `, [schoolId])
    res.json({ books: result.rows, stats: stats.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/books', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, author, isbn, category, publisher, publishedYear, copiesTotal,
            shelfLocation, description, coverUrl, language } = req.body
    if (!title) return res.status(400).json({ error: 'Title required' })
    const copies = parseInt(copiesTotal) || 1
    const result = await query(`
      INSERT INTO library_books (school_id, title, author, isbn, category, publisher, published_year,
        copies_total, copies_available, shelf_location, description, cover_url, language)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [schoolId, title, author, isbn, category, publisher, publishedYear || null,
        copies, copies, shelfLocation, description, coverUrl, language || 'العربية'])
    res.status(201).json({ book: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/books/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { title, author, isbn, category, publisher, publishedYear, copiesTotal,
            shelfLocation, description, coverUrl, language } = req.body
    const result = await query(`
      UPDATE library_books SET title=$1, author=$2, isbn=$3, category=$4, publisher=$5,
        published_year=$6, copies_total=$7, shelf_location=$8, description=$9, cover_url=$10, language=$11
      WHERE id=$12 AND school_id=$13 RETURNING *
    `, [title, author, isbn, category, publisher, publishedYear || null, parseInt(copiesTotal) || 1,
        shelfLocation, description, coverUrl, language, req.params.id, schoolId])
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json({ book: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.delete('/books/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    await query('UPDATE library_books SET is_active=false WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

// ─── Borrows ──────────────────────────────────────────────────────────────────
router.get('/borrows', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { status, borrowerId } = req.query
    let q = `
      SELECT lb.*, b.title as book_title, b.author, b.isbn, b.category,
             CASE WHEN lb.borrower_type='student' THEN s.name ELSE e.name END as borrower_name,
             CASE WHEN lb.borrower_type='student' THEN s.student_number ELSE e.employee_number END as borrower_number,
             CASE WHEN lb.due_date < CURRENT_DATE AND lb.status='borrowed' THEN true ELSE false END as is_overdue
      FROM library_borrows lb
      LEFT JOIN library_books b ON b.id = lb.book_id
      LEFT JOIN students s ON s.id = lb.borrower_id AND lb.borrower_type='student'
      LEFT JOIN employees e ON e.id = lb.borrower_id AND lb.borrower_type='employee'
      WHERE lb.school_id=$1
    `
    const params: any[] = [schoolId]
    if (status) { params.push(status); q += ` AND lb.status=$${params.length}` }
    if (borrowerId) { params.push(borrowerId); q += ` AND lb.borrower_id=$${params.length}` }
    q += ' ORDER BY lb.created_at DESC'
    const result = await query(q, params)
    const stats = await query(`
      SELECT
        COUNT(CASE WHEN status='borrowed' THEN 1 END) as active_borrows,
        COUNT(CASE WHEN status='borrowed' AND due_date < CURRENT_DATE THEN 1 END) as overdue,
        COUNT(CASE WHEN status='returned' THEN 1 END) as returned,
        COUNT(CASE WHEN fine_amount > 0 AND NOT fine_paid THEN 1 END) as unpaid_fines
      FROM library_borrows WHERE school_id=$1
    `, [schoolId])
    res.json({ borrows: result.rows, stats: stats.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.post('/borrows', async (req: AuthRequest, res) => {
  try {
    const { schoolId, id: userId } = req.user!
    const { bookId, borrowerId, borrowerType, dueDate, notes } = req.body
    if (!bookId || !borrowerId || !dueDate) return res.status(400).json({ error: 'Required fields missing' })
    // Check availability
    const book = await query('SELECT copies_available FROM library_books WHERE id=$1 AND school_id=$2', [bookId, schoolId])
    if (!book.rows[0] || book.rows[0].copies_available < 1)
      return res.status(400).json({ error: 'Book not available' })
    // Create borrow
    const result = await query(`
      INSERT INTO library_borrows (school_id, book_id, borrower_id, borrower_type, due_date, notes, issued_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [schoolId, bookId, borrowerId, borrowerType || 'student', dueDate, notes, userId])
    // Decrement available copies
    await query('UPDATE library_books SET copies_available = copies_available - 1 WHERE id=$1', [bookId])
    res.status(201).json({ borrow: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/borrows/:id/return', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { fineAmount, notes } = req.body
    const borrow = await query('SELECT * FROM library_borrows WHERE id=$1 AND school_id=$2', [req.params.id, schoolId])
    if (!borrow.rows[0]) return res.status(404).json({ error: 'Not found' })
    await query(`
      UPDATE library_borrows SET status='returned', return_date=CURRENT_DATE,
        fine_amount=COALESCE($1,0), notes=$2 WHERE id=$3
    `, [fineAmount || 0, notes, req.params.id])
    // Increment available copies
    await query('UPDATE library_books SET copies_available = copies_available + 1 WHERE id=$1', [borrow.rows[0].book_id])
    res.json({ ok: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

router.put('/borrows/:id', async (req: AuthRequest, res) => {
  try {
    const { schoolId } = req.user!
    const { status, fineAmount, finePaid, notes } = req.body
    const result = await query(`
      UPDATE library_borrows SET status=COALESCE($1,status), fine_amount=COALESCE($2,fine_amount),
        fine_paid=COALESCE($3,fine_paid), notes=COALESCE($4,notes) WHERE id=$5 AND school_id=$6 RETURNING *
    `, [status, fineAmount, finePaid, notes, req.params.id, schoolId])
    res.json({ borrow: result.rows[0] })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

export default router
