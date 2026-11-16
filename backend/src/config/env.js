import 'dotenv/config'

function required(name) {
    const value = process.env[name]
    if (!value) throw new Error(`Missing required env var: ${name}`)
    return value
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  DB_HOST: required("DB_HOST"),
  DB_PORT: Number(process.env.DB_PORT ?? 3306),
  DB_USER: required("DB_USER"),
  DB_PASSWORD: required("DB_PASSWORD"),
  DB_NAME: required("DB_NAME"),
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? "15m",
  REFRESH_TOKEN_TTL_DAYS: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};