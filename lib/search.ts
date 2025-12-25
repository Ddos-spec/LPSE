import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { sanitizeInput, type TenderQueryFilters } from '@/lib/transform'

export type TenderSearchFilters = TenderQueryFilters

type PaginationOptions = {
  skip: number
  limit: number
}

const SEARCH_MODE = (process.env.SEARCH_MODE || 'contains').toLowerCase()
const MAX_TOKENS = 6

export function shouldUseFtsSearch() {
  return SEARCH_MODE === 'fts'
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

export function buildTenderWhere(filters: TenderSearchFilters): Prisma.TenderWhereInput {
  const andFilters: Prisma.TenderWhereInput[] = []

  const tokens = getSearchTokens(filters.search)
  if (tokens.length > 0) {
    andFilters.push({
      AND: tokens.map(token => ({
        OR: [
          { nama_tender: { contains: token, mode: 'insensitive' } },
          { lpse: { nama_lpse: { contains: token, mode: 'insensitive' } } },
        ],
      })),
    })
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

function buildFtsConditions(filters: TenderSearchFilters, searchTerm: string) {
  const conditions: Prisma.Sql[] = []

  if (searchTerm) {
    conditions.push(
      Prisma.sql`to_tsvector('simple', coalesce(t.nama_tender, '') || ' ' || coalesce(l.nama_lpse, '')) @@ websearch_to_tsquery('simple', ${searchTerm})`
    )
  }

  if (filters.kategori) {
    const term = `%${filters.kategori.toLowerCase()}%`
    conditions.push(
      Prisma.sql`LOWER(COALESCE(t.kategori_pekerjaan, '')) LIKE ${term}`
    )
  }

  if (filters.status) {
    const term = filters.status.toLowerCase()
    conditions.push(
      Prisma.sql`LOWER(COALESCE(t.status_tender, '')) = ${term}`
    )
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
  filters: TenderSearchFilters,
  pagination: PaginationOptions
) {
  const cleanedSearch = sanitizeInput(filters.search, 200) || ''
  const conditions = buildFtsConditions(filters, cleanedSearch)
  const whereSql = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty

  const rows = await prisma.$queryRaw<{ kode_tender: number }[]>(Prisma.sql`
    SELECT t.kode_tender
    FROM tenders t
    JOIN lpse l ON l.id = t.lpse_id
    ${whereSql}
    ORDER BY t.created_at DESC
    LIMIT ${pagination.limit}
    OFFSET ${pagination.skip}
  `)

  const totalRows = await prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
    SELECT COUNT(*)::int AS total
    FROM tenders t
    JOIN lpse l ON l.id = t.lpse_id
    ${whereSql}
  `)

  return {
    kodeTenders: rows.map(row => row.kode_tender),
    total: totalRows[0]?.total ?? 0,
  }
}
