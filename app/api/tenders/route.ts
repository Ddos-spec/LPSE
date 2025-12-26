import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const getPrisma = () => import('@/lib/prisma').then(m => m.default)
import type { Prisma } from '@prisma/client'
import { ApiResponse, PaginationMeta, ApiTenderWithLpse } from '@/lib/types'
import { cacheGet, cacheSet, CACHE_TTLS } from '@/lib/cache'
import { tendersListKey } from '@/lib/cache-keys'
import { parseTendersQuery, normalizeTenderList } from '@/lib/transform'
import { buildTenderWhere, searchTenderIds, shouldUseFtsSearch } from '@/lib/search'
import { monitoring } from '@/lib/monitoring'
import { withCors } from '@/lib/cors'

type TenderWithLpse = Prisma.TenderGetPayload<{ include: { lpse: true } }>

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  const { page, limit, skip, filters } = parseTendersQuery(request.nextUrl.searchParams)
  const cacheKey = tendersListKey({ page, limit, ...filters })
  const bypassCache = request.headers.get('x-cache-bypass') === '1'
  const routeName = 'api.tenders'

  if (!bypassCache) {
    const cached = await cacheGet<ApiResponse<ApiTenderWithLpse[]>>(cacheKey)
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

  let tenders: TenderWithLpse[] = []
  let total = 0

  try {
    const prisma = await getPrisma()

    if (filters.search && shouldUseFtsSearch()) {
      const result = await searchTenderIds(filters, { skip, limit })
      monitoring.recordDbQuery(routeName, 2)
      total = result.total

      if (result.kodeTenders.length > 0) {
        const tenderRows = await prisma.tender.findMany({
          where: { kode_tender: { in: result.kodeTenders } },
          include: { lpse: true },
        })
        monitoring.recordDbQuery(routeName, 1)
        const tenderMap = new Map(tenderRows.map(t => [t.kode_tender, t]))
        tenders = result.kodeTenders
          .map(id => tenderMap.get(id))
          .filter((t): t is TenderWithLpse => Boolean(t)) as TenderWithLpse[]
      }
    } else {
      const where = buildTenderWhere(filters)
      const [rows, count] = await Promise.all([
        prisma.tender.findMany({
          where,
          take: limit,
          skip,
          orderBy: { created_at: 'desc' },
          include: { lpse: true },
        }),
        prisma.tender.count({ where }),
      ])
      monitoring.recordDbQuery(routeName, 2)
      tenders = rows
      total = count
    }

    const totalPages = Math.ceil(total / limit)
    const hasMore = page < totalPages

    const pagination: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasMore
    }

    const safeTenders = normalizeTenderList(tenders)
    const response: ApiResponse<ApiTenderWithLpse[]> = {
      success: true,
      data: safeTenders,
      pagination
    }

    void cacheSet(cacheKey, response, CACHE_TTLS.tenders)

    const duration = performance.now() - startTime
    monitoring.recordTiming(routeName, duration)
    console.log(`GET /api/tenders - ${duration.toFixed(2)}ms - ${total} items found`)

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
    console.error('Error fetching tenders:', {
      message: errorMessage,
      stack: errorStack,
      filters,
      page,
      limit
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
