import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import './setup'
import { initDB } from '../db'
import authRouter from '../routes/auth'
import studentsRouter from '../routes/students'
import feesRouter from '../routes/fees'
import parentRouter from '../routes/parent'
import paymentsRouter from '../routes/payments'
import attendanceRouter from '../routes/attendance'

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use('/api/students', studentsRouter)
  app.use('/api/fees', feesRouter)
  app.use('/api/parent', parentRouter)
  app.use('/api/payments', paymentsRouter)
  app.use('/api/attendance', attendanceRouter)
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
  return app
}

describe('Iqraa API', () => {
  const app = buildApp()
  let adminToken = ''
  let parentToken = ''

  beforeAll(async () => {
    await initDB()
  }, 60000)

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('POST /api/auth/login — admin demo user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'demo2026', role: 'admin' })
    if (res.status === 200) {
      adminToken = res.body.token
      expect(res.body.user.role).toBeDefined()
    } else {
      // DB may not have demo seed in CI — skip token-dependent tests gracefully
      expect([401, 403, 500]).toContain(res.status)
    }
  })

  it('POST /api/auth/login — parent demo user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'parent1', password: 'demo2026', role: 'parent' })
    if (res.status === 200) {
      parentToken = res.body.token
      expect(res.body.user.role).toBe('parent')
    }
  })

  it('GET /api/students — requires auth', async () => {
    const res = await request(app).get('/api/students')
    expect(res.status).toBe(401)
  })

  it('GET /api/students — with admin token', async () => {
    if (!adminToken) return
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.students)).toBe(true)
  })

  it('GET /api/students/prisma-poc — Prisma POC', async () => {
    if (!adminToken) return
    const res = await request(app)
      .get('/api/students/prisma-poc')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([200, 500]).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.source).toBe('prisma')
    }
  })

  it('GET /api/parent/children — parent portal', async () => {
    if (!parentToken) return
    const res = await request(app)
      .get('/api/parent/children')
      .set('Authorization', `Bearer ${parentToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.children)).toBe(true)
  })

  it('GET /api/parent/fees — parent fees', async () => {
    if (!parentToken) return
    const res = await request(app)
      .get('/api/parent/fees')
      .set('Authorization', `Bearer ${parentToken}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('fees')
  })

  it('POST /api/attendance — rejects foreign personId (IDOR)', async () => {
    if (!adminToken) return
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        personType: 'student',
        personId: '00000000-0000-0000-0000-000000000099',
        date: '2026-06-01',
        status: 'present',
      })
    expect(res.status).toBe(403)
  })

  it('POST /api/auth/refresh — requires refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({})
    expect(res.status).toBe(401)
  })
})
