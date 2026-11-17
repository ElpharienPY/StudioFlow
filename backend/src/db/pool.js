import mysql from 'mysql2/promise'
import { env } from '../config/env.js'

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  // DATE columns come back as 'YYYY-MM-DD' strings (what the front expects),
  // DATETIME columns as JS Dates, serialised to ISO-8601 UTC by JSON.stringify.
  dateStrings: ['DATE'],
  timezone: 'Z',
})

// keep every session in UTC so CURRENT_TIMESTAMP / NOW() match the 'Z' timezone above
pool.pool.on('connection', (connection) => {
  connection.query("SET time_zone = '+00:00'")
})

// Runs fn(conn) inside a transaction: commit on success, rollback on any error.
export async function withTransaction(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
