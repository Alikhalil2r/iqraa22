import { pool } from './index'
import { PoolClient } from 'pg'
import { createLogger } from '../utils/logger'

const log = createLogger('DB:TXN')

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    log.error('Transaction rolled back', { error: (err as Error).message })
    throw err
  } finally {
    client.release()
  }
}
