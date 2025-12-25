import { NextRequest, NextResponse } from 'next/server'
import {
  getCacheTtlSeconds,
  lpseListKey,
  statsKey,
  tenderDetailKey,
  tendersListKey,
} from '@/lib/cache-keys'
import { parseTendersQuery } from '@/lib/transform'

export function middleware(request: NextRequest) {
  if (request.method !== 'GET') {
    return NextResponse.next()
  }

  const { pathname, searchParams } = request.nextUrl
  if (!pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const headers = new Headers(request.headers)
  const refresh = searchParams.get('refresh')
  const cacheControl = request.headers.get('cache-control') || ''

  if (refresh === '1' || cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
    headers.set('x-cache-bypass', '1')
  }

  let cacheKey: string | undefined
  if (pathname === '/api/tenders') {
    const { page, limit, filters } = parseTendersQuery(searchParams)
    cacheKey = tendersListKey({ page, limit, ...filters })
  } else if (pathname.startsWith('/api/tenders/')) {
    const kodeTender = pathname.split('/').pop()
    if (kodeTender) cacheKey = tenderDetailKey(kodeTender)
  } else if (pathname === '/api/stats') {
    cacheKey = statsKey()
  } else if (pathname === '/api/lpse') {
    cacheKey = lpseListKey()
  }

  if (cacheKey) {
    headers.set('x-cache-key', cacheKey)
  }

  const ttlSeconds = getCacheTtlSeconds(pathname)
  if (ttlSeconds) {
    headers.set('x-cache-ttl', String(ttlSeconds))
  }

  const response = NextResponse.next({ request: { headers } })

  if (ttlSeconds) {
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${Math.floor(ttlSeconds / 2)}`
    )
  }

  if (cacheKey) {
    response.headers.set('x-cache-key', cacheKey)
  }

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
