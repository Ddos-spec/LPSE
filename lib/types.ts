import { Tender, Lpse, TenderDetail, ScrapingLog, Prisma } from '@prisma/client'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  pagination?: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

// API Types (Decimal converted to number)
export type ApiTender = Omit<Tender, 'nilai_pagu' | 'nilai_hps'> & {
  nilai_pagu: number | null
  nilai_hps: number | null
}

export type ApiTenderWithLpse = ApiTender & {
  lpse: Lpse
}

export type ApiTenderFullDetail = ApiTender & {
  lpse: Lpse
  tender_details: TenderDetail | null
}

export type TenderStats = {
  totalTenders: number
  totalLpse: number
  avgNilaiPagu: number
  byKategori: Record<string, number>
  byStatus: Record<string, number>
  byProvinsi: Record<string, number>
  recentTenders: ApiTenderWithLpse[]
}