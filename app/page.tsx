import { Suspense } from 'react'
import { TenderList } from './TenderList'
import { TenderTableSkeleton } from '@/components/LoadingState'

interface HomePageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    kategori?: string
    status?: string
    nilai_min?: string
    nilai_max?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Tender LPSE Indonesia
        </h1>
        <p className="text-muted-foreground text-lg">
          Cari dan temukan tender dari berbagai LPSE di seluruh Indonesia
        </p>
      </div>

      {/* Tender List with Filters */}
      <Suspense fallback={<TenderTableSkeleton />}>
        <TenderList searchParams={params} />
      </Suspense>
    </div>
  )
}
