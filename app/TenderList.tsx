'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterBar } from '@/components/FilterBar'
import { TenderTable } from '@/components/TenderTable'
import { TenderCardGrid } from '@/components/TenderCard'
import { Pagination, PaginationInfo } from '@/components/Pagination'
import { TenderTableSkeleton, TenderCardGridSkeleton } from '@/components/LoadingState'
import { NoResultsState, ErrorState } from '@/components/EmptyState'
import type { ApiResponse, ApiTenderWithLpse, PaginationMeta } from '@/lib/types'

const TENDERS_API = process.env.NEXT_PUBLIC_TENDERS_API || '/api/tenders'

interface TenderListProps {
  searchParams: {
    page?: string
    search?: string
    kategori?: string
    status?: string
    nilai_min?: string
    nilai_max?: string
  }
}

export function TenderList({ searchParams }: TenderListProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()

  const [tenders, setTenders] = useState<ApiTenderWithLpse[]>([])
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

  const currentPage = parseInt(searchParams.page || '1')

  useEffect(() => {
    async function fetchTenders() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('page', searchParams.page || '1')
        params.set('limit', '10')

        if (searchParams.search) params.set('search', searchParams.search)
        if (searchParams.kategori) params.set('kategori', searchParams.kategori)
        if (searchParams.status) params.set('status', searchParams.status)
        if (searchParams.nilai_min) params.set('nilai_min', searchParams.nilai_min)
        if (searchParams.nilai_max) params.set('nilai_max', searchParams.nilai_max)

        const response = await fetch(`${TENDERS_API}?${params.toString()}`)
        const data: ApiResponse<ApiTenderWithLpse[]> = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch tenders')
        }

        setTenders(data.data || [])
        setPagination(data.pagination || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTenders()
  }, [searchParams])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    params.set('page', page.toString())
    router.push(`/?${params.toString()}`)
  }

  const handleClearFilters = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <FilterBar viewMode={viewMode} onViewModeChange={setViewMode} />
        {viewMode === 'table' ? <TenderTableSkeleton /> : <TenderCardGridSkeleton />}
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <FilterBar viewMode={viewMode} onViewModeChange={setViewMode} />
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    )
  }

  const hasFilters = searchParams.search || searchParams.kategori || searchParams.status

  return (
    <div className="space-y-6">
      <FilterBar viewMode={viewMode} onViewModeChange={setViewMode} />

      {tenders.length === 0 ? (
        <NoResultsState
          searchTerm={searchParams.search}
          onClear={hasFilters ? handleClearFilters : undefined}
        />
      ) : (
        <>
          {/* Pagination Info */}
          {pagination && (
            <PaginationInfo
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
            />
          )}

          {/* Tender Display */}
          {viewMode === 'table' ? (
            <TenderTable tenders={tenders} />
          ) : (
            <TenderCardGrid tenders={tenders} />
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
