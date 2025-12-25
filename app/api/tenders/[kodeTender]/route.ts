import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponse, ApiTenderFullDetail } from '@/lib/types'
import { cacheGet, cacheSet, CACHE_TTLS } from '@/lib/cache'
import { tenderDetailKey } from '@/lib/cache-keys'
import { normalizeTenderFull, parseTenderIdParam } from '@/lib/transform'
import { monitoring } from '@/lib/monitoring'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ kodeTender: string }> }
) {
  const { kodeTender } = await params
  const kodeTenderInt = parseTenderIdParam(kodeTender)
  const routeName = 'api.tenders.detail'

  if (kodeTenderInt === null) {
    return NextResponse.json(
      { success: false, error: 'Invalid kode_tender format' },
      { status: 400 }
    )
  }

  const startTime = performance.now()
  const cacheKey = tenderDetailKey(kodeTenderInt)
  const bypassCache = request.headers.get('x-cache-bypass') === '1'

  if (!bypassCache) {
    const cached = await cacheGet<ApiResponse<ApiTenderFullDetail>>(cacheKey)
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
    const tender = await prisma.tender.findUnique({
      where: { kode_tender: kodeTenderInt },
      include: {
        lpse: true,
        tender_details: true
      }
    })
    monitoring.recordDbQuery(routeName, 1)

    const duration = performance.now() - startTime
    console.log(`GET /api/tenders/${kodeTender} - ${duration.toFixed(2)}ms`)

    if (!tender) {
      return NextResponse.json(
        { success: false, error: 'Tender not found' },
        { status: 404 }
      )
    }

    const safeTender = normalizeTenderFull(tender)

    const response: ApiResponse<ApiTenderFullDetail> = {
      success: true,
      data: safeTender
    }

    void cacheSet(cacheKey, response, CACHE_TTLS.tenderDetail)
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
    console.error(`Error fetching tender ${kodeTender}:`, error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  } finally {
    monitoring.logIfNeeded(routeName)
  }
}
