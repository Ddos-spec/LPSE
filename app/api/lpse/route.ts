import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const getPrisma = () => import('@/lib/prisma').then(m => m.default)
import { ApiResponse } from '@/lib/types'
import { cacheGet, cacheSet, CACHE_TTLS } from '@/lib/cache'
import { lpseListKey } from '@/lib/cache-keys'
import { monitoring } from '@/lib/monitoring'
import { withCors } from '@/lib/cors'

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  const routeName = 'api.lpse'
  const cacheKey = lpseListKey()
  const bypassCache = request.headers.get('x-cache-bypass') === '1'

  if (!bypassCache) {
    const cached = await cacheGet<ApiResponse<unknown>>(cacheKey)
    if (cached) {
      monitoring.recordCacheHit(routeName)
      const duration = performance.now() - startTime
      monitoring.recordTiming(routeName, duration)
      monitoring.logIfNeeded(routeName)
      return NextResponse.json(cached, {
        headers: withCors({
          'x-cache': 'HIT',
          'x-cache-key': cacheKey,
          'x-response-time': `${duration.toFixed(2)}ms`,
        }),
      })
    }
    monitoring.recordCacheMiss(routeName)
  }

  try {
    const prisma = await getPrisma()
    const lpseList = await prisma.lpse.findMany({
      orderBy: {
        nama_lpse: 'asc'
      }
    })
    monitoring.recordDbQuery(routeName, 1)

    const duration = performance.now() - startTime
    console.log(`GET /api/lpse - ${duration.toFixed(2)}ms`)

    const response: ApiResponse<typeof lpseList> = {
      success: true,
      data: lpseList
    }

    void cacheSet(cacheKey, response, CACHE_TTLS.lpse)
    monitoring.recordTiming(routeName, duration)

    return NextResponse.json(response, {
      headers: withCors({
        'x-cache': bypassCache ? 'BYPASS' : 'MISS',
        'x-cache-key': cacheKey,
        'x-response-time': `${duration.toFixed(2)}ms`,
      }),
    })

  } catch (error) {
    monitoring.recordError(routeName)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error fetching LPSE list:', {
      message: errorMessage,
      stack: errorStack
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
      },
      { status: 500, headers: withCors() }
    )
  } finally {
    monitoring.logIfNeeded(routeName)
  }
}
