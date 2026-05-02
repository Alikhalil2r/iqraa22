import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { initDB } from './db'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
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

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }))

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')))
}

async function start() {
  try {
    await initDB()
    const { seedDatabase } = await import('./db/seed')
    await seedDatabase()
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 School Management Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
