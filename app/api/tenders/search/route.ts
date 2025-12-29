import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const getPrisma = () => import('@/lib/prisma').then(m => m.default)
import { cacheGet, cacheSet, CACHE_TTLS } from '@/lib/cache'
import { withCors } from '@/lib/cors'
import { sanitizeInput } from '@/lib/transform'

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
  const query = searchParams.get('q') || ''

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: true,
      data: []
    }, { headers: withCors() })
  }

  const sanitized = sanitizeInput(query)
  const cacheKey = `search:suggestions:${sanitized}`

  // Check cache first
  const cached = await cacheGet<SearchSuggestion[]>(cacheKey)
  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached
    }, {
      headers: withCors({
        'x-cache': 'HIT'
      })
    })
  }

  try {
    const prisma = await getPrisma()

    // Search for tenders matching the query
    const tenders = await prisma.tender.findMany({
      where: {
        OR: [
          { nama_tender: { contains: sanitized, mode: 'insensitive' } },
          { kode_tender: { contains: sanitized, mode: 'insensitive' } },
          { kode_rup: { contains: sanitized, mode: 'insensitive' } },
          { lpse: { nama_lpse: { contains: sanitized, mode: 'insensitive' } } }
        ]
      },
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
      data: suggestions
    }, {
      headers: withCors({
        'x-cache': 'MISS'
      })
    })

  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch suggestions'
    }, {
      status: 500,
      headers: withCors()
    })
  }
}
