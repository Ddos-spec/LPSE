import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ApiResponse, ApiTenderWithLpse, TenderStats } from '@/lib/types'
import { cacheGet, cacheSet, warmCacheOnce, CACHE_TTLS } from '@/lib/cache'
import { lpseListKey, statsKey, tendersListKey } from '@/lib/cache-keys'
import { normalizeTenderList } from '@/lib/transform'
import { monitoring } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  const routeName = 'api.stats'
  const cacheKey = statsKey()
  const bypassCache = request.headers.get('x-cache-bypass') === '1'

  if (!bypassCache) {
    const cached = await cacheGet<ApiResponse<TenderStats>>(cacheKey)
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
    const [
      totalTenders,
      totalLpse,
      avgResult,
      kategoriGroups,
      statusGroups,
      provinsiGroups,
      recentTenders
    ] = await Promise.all([
      prisma.tender.count(),
      prisma.lpse.count(),
      prisma.tender.aggregate({
        _avg: {
          nilai_pagu: true
        }
      }),
      prisma.tender.groupBy({
        by: ['kategori_pekerjaan'],
        _count: {
          _all: true
        },
        orderBy: {
          _count: {
            kategori_pekerjaan: 'desc' // Try sorting by count
          }
        },
        take: 10
      }),
      prisma.tender.groupBy({
        by: ['status_tender'],
        _count: {
          _all: true
        },
        orderBy: {
          _count: {
            status_tender: 'desc'
          }
        }
      }),
      // For provinsi, we use LPSE table and sum total_tenders
      prisma.lpse.groupBy({
        by: ['provinsi'],
        _sum: {
          total_tenders: true
        },
        orderBy: {
          _sum: {
            total_tenders: 'desc'
          }
        }
      }),
      prisma.tender.findMany({
        take: 5,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          lpse: true
        }
      })
    ])
    monitoring.recordDbQuery(routeName, 7)

    const duration = performance.now() - startTime
    console.log(`GET /api/stats - ${duration.toFixed(2)}ms`)

    // Transform results
    const byKategori: Record<string, number> = {}
    kategoriGroups.forEach(g => {
      if (g.kategori_pekerjaan) byKategori[g.kategori_pekerjaan] = g._count._all
    })

    const byStatus: Record<string, number> = {}
    statusGroups.forEach(g => {
      if (g.status_tender) byStatus[g.status_tender] = g._count._all
    })

    const byProvinsi: Record<string, number> = {}
    provinsiGroups.forEach(g => {
      if (g.provinsi) byProvinsi[g.provinsi] = g._sum.total_tenders || 0
    })

    const stats: TenderStats = {
      totalTenders,
      totalLpse,
      avgNilaiPagu: avgResult._avg.nilai_pagu?.toNumber() || 0,
      byKategori,
      byStatus,
      byProvinsi,
      recentTenders: normalizeTenderList(recentTenders) as ApiTenderWithLpse[]
    }

    const response: ApiResponse<TenderStats> = {
      success: true,
      data: stats
    }

    void cacheSet(cacheKey, response, CACHE_TTLS.stats)

    await warmCacheOnce({
      key: tendersListKey({ page: 1, limit: 10 }),
      ttlSeconds: CACHE_TTLS.tenders,
      fetcher: async () => {
        const [tenders, total] = await Promise.all([
          prisma.tender.findMany({
            take: 10,
            skip: 0,
            orderBy: { created_at: 'desc' },
            include: { lpse: true },
          }),
          prisma.tender.count(),
        ])
        const totalPages = Math.ceil(total / 10)
        const pagination = {
          total,
          page: 1,
          limit: 10,
          totalPages,
          hasMore: 1 < totalPages,
        }
        const listResponse: ApiResponse<ApiTenderWithLpse[]> = {
          success: true,
          data: normalizeTenderList(tenders) as ApiTenderWithLpse[],
          pagination,
        }
        return listResponse
      },
    })

    await warmCacheOnce({
      key: lpseListKey(),
      ttlSeconds: CACHE_TTLS.lpse,
      fetcher: async () => {
        const lpseList = await prisma.lpse.findMany({
          orderBy: { nama_lpse: 'asc' },
        })
        const listResponse: ApiResponse<typeof lpseList> = {
          success: true,
          data: lpseList,
        }
        return listResponse
      },
    })

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
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  } finally {
    monitoring.logIfNeeded(routeName)
  }
}
