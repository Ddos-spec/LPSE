export const CACHE_VERSION = 'v2'

export const CACHE_TTL_SECONDS = {
  tenders: 60 * 60 * 6,
  tenderDetail: 60 * 60 * 24,
  stats: 60 * 60,
  lpse: 60 * 60 * 24,
}

const MAX_SEGMENT_LENGTH = 120

function normalizeSegment(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 'all'
  const text = String(value).trim()
  if (!text) return 'all'

  return text
    .toLowerCase()
    .replace(/[\s]+/g, '_')
    .replace(/[:/\\?&#]+/g, '')
    .slice(0, MAX_SEGMENT_LENGTH)
}

function buildKey(parts: string[]) {
  return [CACHE_VERSION, ...parts].join(':')
}

export function tendersListKey(params: {
  page: number
  limit: number
  search?: string | null
  kategori?: string | null
  status?: string | null
  nilai_min?: number | null
  nilai_max?: number | null
  lpse_id?: number | null
  tahun?: number | null
}) {
  return buildKey([
    'tenders',
    `page${params.page}`,
    `limit${params.limit}`,
    `search:${normalizeSegment(params.search)}`,
    `kategori:${normalizeSegment(params.kategori)}`,
    `status:${normalizeSegment(params.status)}`,
    `nilai_min:${normalizeSegment(params.nilai_min)}`,
    `nilai_max:${normalizeSegment(params.nilai_max)}`,
    `lpse_id:${normalizeSegment(params.lpse_id)}`,
    `tahun:${normalizeSegment(params.tahun)}`,
  ])
}

export function tenderDetailKey(kodeTender: number | string) {
  return buildKey(['tender', normalizeSegment(kodeTender)])
}

export function statsKey() {
  return buildKey(['stats'])
}

export function lpseListKey() {
  return buildKey(['lpse'])
}

export function cachePrefix(prefix: string) {
  return `${CACHE_VERSION}:${prefix}`
}

export function getCacheTtlSeconds(pathname: string) {
  if (pathname === '/api/tenders') return CACHE_TTL_SECONDS.tenders
  if (pathname.startsWith('/api/tenders/')) return CACHE_TTL_SECONDS.tenderDetail
  if (pathname === '/api/stats') return CACHE_TTL_SECONDS.stats
  if (pathname === '/api/lpse') return CACHE_TTL_SECONDS.lpse
  return undefined
}
