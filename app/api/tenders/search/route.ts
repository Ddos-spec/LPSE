import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const getPrisma = () => import('@/lib/prisma').then(m => m.default)
import { cacheGet, cacheSet } from '@/lib/cache'
import { withCors } from '@/lib/cors'
import { looksLikeKodeTender, getSearchTokens } from '@/lib/search'

interface SearchSuggestion {
  id: number
  kode_tender: string
  nama_tender: string
  kategori_pekerjaan: string | null
  status_tender: string | null
  lpse_nama: string | null
  nilai_pagu: number | null
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.trim() || ''
  const skipCache = searchParams.get('nocache') === '1'

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: true,
      data: [],
      debug: { reason: 'query too short', query }
    }, { headers: withCors() })
  }

  const cacheKey = `search:suggestions:v2:${query}`
  const isNumericSearch = looksLikeKodeTender(query)

  // Check cache first (unless bypassed)
  if (!skipCache) {
    const cached = await cacheGet<SearchSuggestion[]>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        debug: { cache: 'HIT', query, isNumericSearch }
      }, {
        headers: withCors({
          'x-cache': 'HIT'
        })
      })
    }
  }

  try {
    const prisma = await getPrisma()

    // Build where clause based on search type
    let whereClause: object

    if (isNumericSearch) {
      // For numeric codes, search kode_tender and kode_rup with startsWith/contains
      whereClause = {
        OR: [
          { kode_tender: { startsWith: query } },
          { kode_tender: { contains: query } },
          { kode_rup: { startsWith: query } },
          { kode_rup: { contains: query } },
        ]
      }
    } else {
      // For text search, use tokens and search across multiple fields
      const tokens = getSearchTokens(query)
      if (tokens.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          debug: { reason: 'no valid tokens', query }
        }, { headers: withCors() })
      }

      whereClause = {
        AND: tokens.map(token => ({
          OR: [
            { kode_tender: { contains: token, mode: 'insensitive' } },
            { kode_rup: { contains: token, mode: 'insensitive' } },
            { nama_tender: { contains: token, mode: 'insensitive' } },
            { lpse: { nama_lpse: { contains: token, mode: 'insensitive' } } },
          ],
        })),
      }
    }

    // Search for tenders matching the query
    const tenders = await prisma.tender.findMany({
      where: whereClause,
      take: 10,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        kode_tender: true,
        nama_tender: true,
        kategori_pekerjaan: true,
        status_tender: true,
        nilai_pagu: true,
        lpse: {
          select: {
            nama_lpse: true
          }
        }
      }
    })

    const suggestions: SearchSuggestion[] = tenders.map(t => ({
      id: t.id,
      kode_tender: t.kode_tender,
      nama_tender: t.nama_tender,
      kategori_pekerjaan: t.kategori_pekerjaan,
      status_tender: t.status_tender,
      lpse_nama: t.lpse?.nama_lpse || null,
      nilai_pagu: t.nilai_pagu ? Number(t.nilai_pagu) : null
    }))

    // Cache for 5 minutes
    void cacheSet(cacheKey, suggestions, 300)

    return NextResponse.json({
      success: true,
      data: suggestions,
      debug: {
        cache: 'MISS',
        query,
        isNumericSearch,
        resultCount: suggestions.length,
        whereClause: JSON.stringify(whereClause)
      }
    }, {
      headers: withCors({
        'x-cache': 'MISS'
      })
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Search suggestions error:', errorMessage)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch suggestions',
      debug: { errorMessage, query, isNumericSearch }
    }, {
      status: 500,
      headers: withCors()
    })
  }
}
