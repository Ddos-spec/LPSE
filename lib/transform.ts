import { z } from 'zod'

const MAX_TEXT_LENGTH = 160

type NormalizedTender<T> = Omit<T, 'nilai_pagu' | 'nilai_hps'> & {
  nilai_pagu: number | null
  nilai_hps: number | null
}

type NormalizedTenderDetail<T> = Omit<
  T,
  'persyaratan_umum' | 'persyaratan_teknis' | 'persyaratan_kualifikasi' | 'dokumen_pengadaan'
> & {
  persyaratan_umum: unknown
  persyaratan_teknis: unknown
  persyaratan_kualifikasi: unknown
  dokumen_pengadaan: unknown
}

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

export function parseTendersQuery(searchParams: URLSearchParams) {
  const rawParams = Object.fromEntries(searchParams.entries())
  const parsed = tenderQuerySchema.safeParse(rawParams)

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

export function parseTenderIdParam(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
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

function normalizeJson(value: unknown) {
  if (value === undefined) return null
  if (value === null) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'object') return value
  if (typeof value === 'string') return value.trim() || null
  return value
}

export function normalizeTender<T extends Record<string, unknown>>(tender: T): NormalizedTender<T> {
  return {
    ...tender,
    nilai_pagu: toNumber(tender.nilai_pagu),
    nilai_hps: toNumber(tender.nilai_hps),
  } as NormalizedTender<T>
}

export function normalizeTenderList<T extends Record<string, unknown>>(tenders: T[]) {
  return tenders.map(normalizeTender) as Array<NormalizedTender<T>>
}

export function normalizeTenderDetail<T extends Record<string, unknown>>(
  detail: T | null
): NormalizedTenderDetail<T> | null {
  if (!detail) return null

  return {
    ...detail,
    persyaratan_umum: normalizeJson(detail.persyaratan_umum),
    persyaratan_teknis: normalizeJson(detail.persyaratan_teknis),
    persyaratan_kualifikasi: normalizeJson(detail.persyaratan_kualifikasi),
    dokumen_pengadaan: normalizeJson(detail.dokumen_pengadaan),
  } as NormalizedTenderDetail<T>
}

export function normalizeTenderFull<T extends Record<string, unknown>>(tender: T) {
  const normalized = normalizeTender(tender) as NormalizedTender<T>
  return {
    ...normalized,
    tender_details: normalizeTenderDetail(normalized.tender_details as Record<string, unknown> | null),
  }
}
