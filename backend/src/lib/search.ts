import { Prisma } from '@prisma/client'
import { sanitizeInput, type TenderQueryFilters } from './transform.js'
import { prisma } from './prisma.js'

const SEARCH_MODE = (process.env.SEARCH_MODE || 'contains').toLowerCase()
const MAX_TOKENS = 6

export function shouldUseFtsSearch() {
  return SEARCH_MODE === 'fts'
}

export function looksLikeKodeTender(search?: string): boolean {
  if (!search) return false
  const cleaned = search.trim()
  return /^\d{2,}$/.test(cleaned)
}

export function getSearchTokens(search?: string) {
  if (!search) return []
  const cleaned = sanitizeInput(search, 200)
  if (!cleaned) return []

  return cleaned
    .split(' ')
    .map(token => token.trim())
    .filter(token => token.length > 1)
    .slice(0, MAX_TOKENS)
}

export function buildTenderWhere(filters: TenderQueryFilters): Prisma.TenderWhereInput {
  const andFilters: Prisma.TenderWhereInput[] = []

  if (filters.search && looksLikeKodeTender(filters.search)) {
    const searchTerm = filters.search.trim()
    andFilters.push({
      OR: [
        { kode_tender: { startsWith: searchTerm } },
        { kode_rup: { startsWith: searchTerm } },
      ]
    })
  } else {
    const tokens = getSearchTokens(filters.search)
    if (tokens.length > 0) {
      andFilters.push({
        AND: tokens.map(token => ({
          OR: [
            { kode_tender: { contains: token, mode: 'insensitive' as const } },
            { kode_rup: { contains: token, mode: 'insensitive' as const } },
            { nama_tender: { contains: token, mode: 'insensitive' as const } },
            { lpse: { nama_lpse: { contains: token, mode: 'insensitive' as const } } },
          ],
        })),
      })
    }
  }

  if (filters.kategori) {
    andFilters.push({ kategori_pekerjaan: { contains: filters.kategori, mode: 'insensitive' } })
  }

  if (filters.status) {
    andFilters.push({ status_tender: { equals: filters.status, mode: 'insensitive' } })
  }

  if (filters.lpse_id) {
    andFilters.push({ lpse_id: filters.lpse_id })
  }

  if (filters.tahun) {
    andFilters.push({ tahun_anggaran: filters.tahun })
  }

  if (filters.nilai_min !== undefined) {
    andFilters.push({ nilai_pagu: { gte: filters.nilai_min } })
  }

  if (filters.nilai_max !== undefined) {
    andFilters.push({ nilai_pagu: { lte: filters.nilai_max } })
  }

  return andFilters.length > 0 ? { AND: andFilters } : {}
}

function buildSearchConditions(filters: TenderQueryFilters, searchTerm: string) {
  const conditions: Prisma.Sql[] = []

  const trimmedSearch = searchTerm.trim()
  if (trimmedSearch) {
    if (looksLikeKodeTender(trimmedSearch)) {
      const prefix = `${trimmedSearch}%`
      conditions.push(
        Prisma.sql`(
          COALESCE(t.kode_tender::text, '') LIKE ${prefix}
          OR COALESCE(t.kode_rup::text, '') LIKE ${prefix}
        )`
      )
    } else {
      const tokens = getSearchTokens(trimmedSearch)
      if (tokens.length > 0) {
        if (shouldUseFtsSearch()) {
          conditions.push(
            Prisma.sql`(
              to_tsvector('simple', coalesce(t.nama_tender, '') || ' ' || coalesce(l.nama_lpse, '')) @@ websearch_to_tsquery('simple', ${trimmedSearch})
              OR COALESCE(t.kode_tender::text, '') ILIKE ${`%${trimmedSearch}%`}
              OR COALESCE(t.kode_rup::text, '') ILIKE ${`%${trimmedSearch}%`}
            )`
          )
        } else {
          const tokenConditions = tokens.map(token => Prisma.sql`(
            COALESCE(t.kode_tender::text, '') ILIKE ${`%${token}%`}
            OR COALESCE(t.kode_rup::text, '') ILIKE ${`%${token}%`}
            OR COALESCE(t.nama_tender, '') ILIKE ${`%${token}%`}
            OR COALESCE(l.nama_lpse, '') ILIKE ${`%${token}%`}
          )`)
          conditions.push(Prisma.sql`${Prisma.join(tokenConditions, ' AND ')}`)
        }
      }
    }
  }

  if (filters.kategori) {
    const term = `%${filters.kategori.toLowerCase()}%`
    conditions.push(Prisma.sql`LOWER(COALESCE(t.kategori_pekerjaan, '')) LIKE ${term}`)
  }

  if (filters.status) {
    const term = filters.status.toLowerCase()
    conditions.push(Prisma.sql`LOWER(COALESCE(t.status_tender, '')) = ${term}`)
  }

  if (filters.lpse_id) {
    conditions.push(Prisma.sql`t.lpse_id = ${filters.lpse_id}`)
  }

  if (filters.tahun) {
    conditions.push(Prisma.sql`t.tahun_anggaran = ${filters.tahun}`)
  }

  if (filters.nilai_min !== undefined) {
    conditions.push(Prisma.sql`t.nilai_pagu >= ${filters.nilai_min}`)
  }

  if (filters.nilai_max !== undefined) {
    conditions.push(Prisma.sql`t.nilai_pagu <= ${filters.nilai_max}`)
  }

  return conditions
}

export async function searchTenderIds(
  filters: TenderQueryFilters,
  pagination: { skip: number; limit: number }
) {
  const cleanedSearch = sanitizeInput(filters.search, 200) || ''
  const conditions = buildSearchConditions(filters, cleanedSearch)
  const whereSql = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty

  const rows = await prisma.$queryRaw<
    Array<{ kode_tender: string | number | bigint | null }>
  >(Prisma.sql`
    SELECT t.kode_tender
    FROM tenders t
    LEFT JOIN lpse l ON l.id = t.lpse_id
    ${whereSql}
    ORDER BY t.created_at DESC
    LIMIT ${pagination.limit}
    OFFSET ${pagination.skip}
  `)

  const totalRows = await prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS total
    FROM tenders t
    LEFT JOIN lpse l ON l.id = t.lpse_id
    ${whereSql}
  `)

  const kodeTenders = rows
    .map(row => row.kode_tender)
    .filter((kode): kode is string | number | bigint => kode !== null && kode !== undefined)
    .map(kode => String(kode))

  return {
    kodeTenders,
    total: totalRows[0]?.total ?? 0,
  }
}
