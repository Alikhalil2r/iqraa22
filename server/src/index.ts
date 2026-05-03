import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import path from 'path'
import dotenv from 'dotenv'
import { initDB } from './db'
import { globalLimiter } from './middleware/rateLimiter'
import authRouter from './routes/auth'
import dashboardRouter from './routes/dashboard'
import studentsRouter from './routes/students'
import employeesRouter from './routes/employees'
import attendanceRouter from './routes/attendance'
import gradesRouter from './routes/grades'
import busesRouter from './routes/buses'
import messagesRouter from './routes/messages'
import newsRouter from './routes/news'
import settingsRouter from './routes/settings'
import parentRouter from './routes/parent'
import publicRouter from './routes/public'
import eventsRouter from './routes/events'
import reportsRouter from './routes/reports'
import feesRouter from './routes/fees'
import scheduleRouter from './routes/schedule'
import usersRouter from './routes/users'
import galleryRouter from './routes/gallery'
import examsRouter from './routes/exams'
import superadminRouter from './routes/superadmin'
import teacherRouter from './routes/teacher'
import libraryRouter from './routes/library'
import leavesRouter  from './routes/leaves'
import homeworkRouter from './routes/homework'
import conductRouter  from './routes/conduct'
import auditRouter    from './routes/audit'
import twofaRouter    from './routes/twofa'
import aiInsightsRouter from './routes/ai-insights'
import billingRouter  from './routes/billing'
import platformRouter from './routes/platform'

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 3001

// Trust Replit's reverse proxy for correct IP detection (needed for rate limiting)
app.set('trust proxy', 1)

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression())

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc:      ["'self'"],
      styleSrc:        ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:         ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:          ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc:       ["'self'", "'unsafe-inline'"],
      connectSrc:      ["'self'", 'https:', 'wss:'],
      mediaSrc:        ["'self'", 'https:'],
      frameSrc:        ['https://www.youtube.com', 'https://youtube.com'],
      frameAncestors:  ["'none'"],
      objectSrc:       ["'none'"],
      baseUri:         ["'self'"],
      formAction:      ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}))

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /\.replit\.dev$/,
  /\.repl\.co$/,
  /\.pike\.replit\.dev$/,
  /\.worf\.replit\.dev$/,
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const allowed = allowedOriginPatterns.some(pattern => pattern.test(origin))
    if (allowed) return callback(null, true)
    callback(new Error('CORS policy violation'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api/', globalLimiter)

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '500kb' }))
app.use(express.urlencoded({ extended: true, limit: '500kb' }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/students', studentsRouter)
app.use('/api/employees', employeesRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/grades', gradesRouter)
app.use('/api/buses', busesRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/news', newsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/parent', parentRouter)
app.use('/api/public', publicRouter)
app.use('/api/events', eventsRouter)
app.use('/api/reports', reportsRouter)
app.use('/api/fees', feesRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/users', usersRouter)
app.use('/api/gallery', galleryRouter)
app.use('/api/exams', examsRouter)
app.use('/api/super-admin', superadminRouter)
app.use('/api/teacher',  teacherRouter)
app.use('/api/library',  libraryRouter)
app.use('/api/leaves',   leavesRouter)
app.use('/api/homework', homeworkRouter)
app.use('/api/conduct',  conductRouter)
app.use('/api/audit',        auditRouter)
app.use('/api/2fa',          twofaRouter)
app.use('/api/ai-insights',  aiInsightsRouter)
app.use('/api/billing',      billingRouter)
app.use('/api/platform',    platformRouter)

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }))

// ─── API 404 ──────────────────────────────────────────────────────────────────
app.use('/api/*path', (_req, res) => res.status(404).json({ error: 'Not found' }))

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message === 'CORS policy violation') {
    return res.status(403).json({ error: 'Not allowed by CORS' })
  }
  console.error('[SERVER ERROR]', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Static in Production ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (_, res) =>
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
  )
}

// Prevent crashes from unhandled async errors
process.on('unhandledRejection', (reason: any) => {
  console.error('[UNHANDLED REJECTION]', reason?.message || reason)
})
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message)
})

async function start() {
  try {
    await initDB()
    const { seedDatabase } = await import('./db/seed')
    await seedDatabase()
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🔒 Helmet ✓ | Rate Limiting ✓ | CORS ✓ | JWT ✓`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
