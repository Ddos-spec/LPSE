import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const healthRouter = Router()

healthRouter.get('/', async (req, res) => {
  console.log('=== HEALTH CHECK START ===')

  try {
    const checks: Record<string, unknown> = {
      status: 'checking',
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
        DATABASE_HOST: process.env.DATABASE_URL
          ? new URL(process.env.DATABASE_URL.replace('postgres://', 'http://')).hostname
          : 'N/A',
        REDIS_URL: process.env.REDIS_URL ? 'SET (hidden)' : 'NOT SET',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'NOT SET',
        PORT: process.env.PORT,
      }
    }

    console.log('ENV check passed:', JSON.stringify(checks.env))

    if (process.env.DATABASE_URL) {
      console.log('Testing database connection...')
      try {
        const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`
        console.log('Database query successful:', result)

        checks.database = {
          status: 'connected',
          serverTime: result[0]?.now
        }

        const [tenderCount, lpseCount] = await Promise.all([
          prisma.tender.count(),
          prisma.lpse.count()
        ])
        console.log('Table counts:', { tenderCount, lpseCount })

        checks.tables = {
          status: 'ok',
          tenders: tenderCount,
          lpse: lpseCount
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
        checks.database = {
          status: 'error',
          error: dbError instanceof Error ? dbError.message : String(dbError)
        }
      }
    } else {
      console.log('DATABASE_URL not set, skipping database check')
      checks.database = { status: 'skipped', reason: 'DATABASE_URL not set' }
    }

    const hasErrors = (checks.database as Record<string, unknown>)?.status === 'error'
    checks.status = hasErrors ? 'unhealthy' : 'healthy'

    console.log('=== HEALTH CHECK COMPLETE ===', checks.status)

    res.status(hasErrors ? 500 : 200).json(checks)
  } catch (error) {
    console.error('=== HEALTH CHECK FATAL ERROR ===', error)
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      type: 'UNHANDLED_ERROR'
    })
  }
})
