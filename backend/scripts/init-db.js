// Creates the database and all tables from ../db/schema.sql  (npm run db:init)
// WARNING: schema.sql DROPs and recreates every table, so all existing data is lost.
import fs from 'node:fs/promises'
import mysql from 'mysql2/promise'
import { env } from '../src/config/env.js'

if (env.isProd) {
  console.error('Refusing to run db:init with NODE_ENV=production (it drops every table).')
  process.exit(1)
}

let sql = await fs.readFile(new URL('../../db/schema.sql', import.meta.url), 'utf8')
// schema.sql hardcodes `studioflow`; honour DB_NAME if it is different
sql = sql.replaceAll('`studioflow`', `\`${env.DB_NAME}\``)

let conn
try {
  conn = await mysql.createConnection({
    host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER, password: env.DB_PASSWORD, multipleStatements: true,
  })
  await conn.query(sql)
  console.log(`Database "${env.DB_NAME}" is ready (all tables recreated).`)
} catch (err) {
  console.error(`db:init failed: ${err.code ?? ''} ${err.message}`)
  if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('Check DB_USER / DB_PASSWORD in backend/.env, and that the MySQL user exists (see backend/README.md).')
  if (err.code === 'ECONNREFUSED') console.error('MySQL is not running (or DB_HOST / DB_PORT are wrong).')
  process.exitCode = 1
} finally {
  await conn?.end()
}
