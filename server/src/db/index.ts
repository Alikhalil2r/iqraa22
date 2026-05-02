import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    return res
  } catch (err) {
    console.error('DB Query Error:', err)
    throw err
  }
}

export async function initDB() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    await pool.query(schema)
    console.log('✅ Database schema initialized')
  } catch (err) {
    console.error('❌ DB init error:', err)
    throw err
  }
}

export default pool
