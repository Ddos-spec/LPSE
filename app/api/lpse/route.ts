import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponse } from '@/lib/types'
import { cacheGet, cacheSet, CACHE_TTLS } from '@/lib/cache'
import { lpseListKey } from '@/lib/cache-keys'
import { monitoring } from '@/lib/monitoring'

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
        headers: {
          'x-cache': 'HIT',
          'x-cache-key': cacheKey,
          'x-response-time': `${duration.toFixed(2)}ms`,
        },
      })
    }
    monitoring.recordCacheMiss(routeName)
  }

  try {
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
      headers: {
        'x-cache': bypassCache ? 'BYPASS' : 'MISS',
        'x-cache-key': cacheKey,
        'x-response-time': `${duration.toFixed(2)}ms`,
      },
    })

  } catch (error) {
    monitoring.recordError(routeName)
    console.error('Error fetching LPSE list:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  } finally {
    monitoring.logIfNeeded(routeName)
  }
}
