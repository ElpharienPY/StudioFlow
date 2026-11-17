import { app } from './app.js'
import { env } from './config/env.js'
import { pool } from './db/pool.js'

// fail early with a readable message if MySQL isn't reachable / the schema isn't loaded
try {
  await pool.query('SELECT 1 FROM users LIMIT 1')
} catch (err) {
  console.error(`\nCannot use the database "${env.DB_NAME}" on ${env.DB_HOST}:${env.DB_PORT} (${err.code ?? err.message}).`)
  if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_DB_ERROR') console.error('The schema is not loaded yet. Run:  npm run db:init')
  else if (err.code === 'ER_ACCESS_DENIED_ERROR') console.error('Wrong DB_USER / DB_PASSWORD in backend/.env, or that MySQL user does not exist yet (see backend/README.md).')
  else if (err.code === 'ECONNREFUSED') console.error('MySQL is not running (or DB_HOST / DB_PORT in backend/.env are wrong).')
  process.exit(1)
}

// Express 5 passes listen errors (port already in use...) to this callback instead of throwing,
// so they must be checked here or the server would claim to be running while it already exited.
const server = app.listen(env.PORT, (err) => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${env.PORT} is already in use — another API instance is probably still running.`)
      console.error(`Find it with:  netstat -ano | findstr :${env.PORT}   then stop it with:  taskkill /PID <pid> /F`)
      console.error('(or change PORT in backend/.env)')
    } else {
      console.error(err)
    }
    process.exit(1)
  }
  console.log(`StudioFlow API listening on http://localhost:${env.PORT}`)
})

// graceful shutdown (Ctrl+C, nodemon restart, deploys)
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  })
}
