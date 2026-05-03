import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { createLogger } from '../utils/logger'

const log = createLogger('DB')

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false
     : process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  log.error('Unexpected pool error', { error: err.message })
})

export async function query(text: string, params?: unknown[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const dur = Date.now() - start
    if (dur > 1000) log.warn('Slow query detected', { dur, sql: text.slice(0, 80) })
    return res
  } catch (err) {
    log.error('DB Query Error', { error: (err as Error).message, sql: text.slice(0, 80) })
    throw err
  }
}

export async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    await pool.query(schema)
    log.info('Database schema initialized')
  } catch (err) {
    log.error('DB init error', { error: (err as Error).message })
    throw err
  }
}

export default pool
