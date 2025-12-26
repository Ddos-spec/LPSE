import { NextRequest, NextResponse } from 'next/server'
import {
  getCacheTtlSeconds,
  lpseListKey,
  statsKey,
  tenderDetailKey,
  tendersListKey,
} from '@/lib/cache-keys'
import { parseTendersQuery } from '@/lib/transform'

const ALLOWED_ORIGINS_RAW = process.env.ALLOWED_ORIGINS || ''
const ALLOWED_ORIGINS = ALLOWED_ORIGINS_RAW
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Default to allowing all origins if ALLOWED_ORIGINS is not configured
// This ensures the API works out of the box while still allowing explicit configuration
const ALLOW_ANY_ORIGIN = ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes('*')

function getCorsOrigin(origin: string | null) {
  if (!origin) return null
  if (ALLOW_ANY_ORIGIN) return '*'
  return ALLOWED_ORIGINS.includes(origin) ? origin : null
}

function appendVaryHeader(response: NextResponse, value: string) {
  const existing = response.headers.get('Vary')
  if (!existing) {
    response.headers.set('Vary', value)
    return
  }

  const values = existing.split(',').map((entry) => entry.trim().toLowerCase())
  if (!values.includes(value.toLowerCase())) {
    response.headers.set('Vary', `${existing}, ${value}`)
  }
}

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (!origin) return
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (origin !== '*') {
    appendVaryHeader(response, 'Origin')
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const isApi = pathname.startsWith('/api')
  const backendOnly = process.env.BACKEND_ONLY === 'true'
  const corsOrigin = getCorsOrigin(request.headers.get('origin'))

  if (backendOnly && !isApi) {
    return new NextResponse('Not Found', { status: 404 })
  }

  if (isApi && request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    applyCorsHeaders(response, corsOrigin)
    return response
  }

  if (!isApi) {
    return NextResponse.next()
  }

  if (request.method !== 'GET') {
    const response = NextResponse.next()
    applyCorsHeaders(response, corsOrigin)
    return response
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

  applyCorsHeaders(response, corsOrigin)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
