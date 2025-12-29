import { NextResponse } from 'next/server'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET() {
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
        CACHE_ENABLED: process.env.CACHE_ENABLED,
        SEARCH_MODE: process.env.SEARCH_MODE,
        BACKEND_ONLY: process.env.BACKEND_ONLY,
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'NOT SET',
        PORT: process.env.PORT,
      }
    }

    console.log('ENV check passed:', JSON.stringify(checks.env))

    // Only test database if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      console.log('Testing database connection...')
      try {
        // Dynamic import to avoid build-time issues
        const { default: prisma } = await import('@/lib/prisma')
        console.log('Prisma imported successfully')

        const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`
        console.log('Database query successful:', result)

        checks.database = {
          status: 'connected',
          serverTime: result[0]?.now
        }

        // Test if tables exist
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
          error: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack : undefined
        }
      }
    } else {
      console.log('DATABASE_URL not set, skipping database check')
      checks.database = { status: 'skipped', reason: 'DATABASE_URL not set' }
    }

    const hasErrors =
      (checks.database as Record<string, unknown>)?.status === 'error'

    checks.status = hasErrors ? 'unhealthy' : 'healthy'

    console.log('=== HEALTH CHECK COMPLETE ===', checks.status)

    return NextResponse.json(checks, {
      status: hasErrors ? 500 : 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    // Catch any unexpected errors
    console.error('=== HEALTH CHECK FATAL ERROR ===', error)

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'UNHANDLED_ERROR'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    })
  }
}
