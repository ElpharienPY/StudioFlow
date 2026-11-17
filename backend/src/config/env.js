import 'dotenv/config'

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

const NODE_ENV = process.env.NODE_ENV ?? 'development'

export const env = {
  NODE_ENV,
  isProd: NODE_ENV === 'production',
  PORT: Number(process.env.PORT ?? 4000),
  DB_HOST: required('DB_HOST'),
  DB_PORT: Number(process.env.DB_PORT ?? 3306),
  DB_USER: required('DB_USER'),
  DB_PASSWORD: required('DB_PASSWORD'),
  DB_NAME: required('DB_NAME'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? '15m',
  REFRESH_TOKEN_TTL_DAYS: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  // comma-separated list allowed, e.g. "http://localhost:5173,https://studioflow.app"
  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
  // optional: enables POST /auth/google (OAuth client id from Google Cloud console)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  // max login/signup attempts per IP per 15 min (raise it in tests)
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
}
