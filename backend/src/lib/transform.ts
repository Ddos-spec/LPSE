import { z } from 'zod'

const MAX_TEXT_LENGTH = 160

export function sanitizeInput(value: string | null | undefined, maxLength = MAX_TEXT_LENGTH) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined

  return trimmed
    .slice(0, maxLength)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
}

export type TenderQueryFilters = {
  search?: string
  kategori?: string
  status?: string
  nilai_min?: number
  nilai_max?: number
  lpse_id?: number
  tahun?: number
}

const tenderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  kategori: z.string().optional(),
  status: z.string().optional(),
  nilai_min: z.coerce.number().nonnegative().optional(),
  nilai_max: z.coerce.number().nonnegative().optional(),
  lpse_id: z.coerce.number().int().positive().optional(),
  tahun: z.coerce.number().int().min(2000).max(2100).optional(),
})

export function parseTendersQuery(query: Record<string, string | undefined>) {
  const parsed = tenderQuerySchema.safeParse(query)

  if (!parsed.success) {
    return {
      page: 1,
      limit: 10,
      skip: 0,
      filters: {} as TenderQueryFilters,
    }
  }

  const page = parsed.data.page
  const limit = parsed.data.limit
  let nilaiMin = parsed.data.nilai_min
  let nilaiMax = parsed.data.nilai_max

  if (nilaiMin !== undefined && nilaiMax !== undefined && nilaiMin > nilaiMax) {
    ;[nilaiMin, nilaiMax] = [nilaiMax, nilaiMin]
  }

  const filters: TenderQueryFilters = {
    search: sanitizeInput(parsed.data.search),
    kategori: sanitizeInput(parsed.data.kategori),
    status: sanitizeInput(parsed.data.status),
    nilai_min: nilaiMin,
    nilai_max: nilaiMax,
    lpse_id: parsed.data.lpse_id,
    tahun: parsed.data.tahun,
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    filters,
  }
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const decimal = value as { toNumber: () => number }
    return decimal.toNumber()
  }
  return null
}

export function normalizeTender<T extends Record<string, unknown>>(tender: T) {
  return {
    ...tender,
    nilai_pagu: toNumber(tender.nilai_pagu),
    nilai_hps: toNumber(tender.nilai_hps),
    bobot_teknis: toNumber(tender.bobot_teknis),
    bobot_biaya: toNumber(tender.bobot_biaya),
  }
}

export function normalizeTenderList<T extends Record<string, unknown>>(tenders: T[]) {
  return tenders.map(normalizeTender)
}

// Recursively convert BigInt to Number for JSON serialization
export function serializeBigInt(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  if (typeof obj === 'number') return obj
  if (typeof obj === 'string') return obj
  if (typeof obj === 'boolean') return obj
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(serializeBigInt)
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value)
    }
    return result
  }
  return obj
}
