import { NextResponse } from 'next/server'

// Force dynamic to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, unknown> = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET',
      REDIS_URL: process.env.REDIS_URL ? 'SET (hidden)' : 'NOT SET',
      CACHE_ENABLED: process.env.CACHE_ENABLED,
      SEARCH_MODE: process.env.SEARCH_MODE,
      BACKEND_ONLY: process.env.BACKEND_ONLY,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'NOT SET (default: allow all)',
    }
  }

  // Only test database if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      // Dynamic import to avoid build-time issues
      const { default: prisma } = await import('@/lib/prisma')

      const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`
      checks.database = {
        status: 'connected',
        serverTime: result[0]?.now
      }

      // Test if tables exist
      const [tenderCount, lpseCount] = await Promise.all([
        prisma.tender.count(),
        prisma.lpse.count()
      ])
      checks.tables = {
        status: 'ok',
        tenders: tenderCount,
        lpse: lpseCount
      }
    } catch (error) {
      checks.database = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  } else {
    checks.database = { status: 'skipped', reason: 'DATABASE_URL not set' }
  }

  const hasErrors =
    (checks.database as Record<string, unknown>)?.status === 'error'

  checks.status = hasErrors ? 'unhealthy' : 'healthy'

  return NextResponse.json(checks, {
    status: hasErrors ? 500 : 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    }
  })
}
