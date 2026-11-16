import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'

export const app = express()

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health',(req,res) => res.json({ ok: true }))

// routes mounted here as each vertical lands:
// app.use('/auth', authRouter)