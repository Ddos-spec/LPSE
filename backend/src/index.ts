import express from 'express'
import cors from 'cors'
import { healthRouter } from './routes/health.js'
import { tendersRouter } from './routes/tenders.js'
import { statsRouter } from './routes/stats.js'
import { lpseRouter } from './routes/lpse.js'

const app = express()
const PORT = process.env.PORT || 3003

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(o => o.trim()),
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// Request logging
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
  })
  next()
})

// Routes
app.use('/api/health', healthRouter)
app.use('/api/tenders', tendersRouter)
app.use('/api/stats', statsRouter)
app.use('/api/lpse', lpseRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`CORS Origin: ${corsOrigin}`)
  console.log(`Database: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`)
})
