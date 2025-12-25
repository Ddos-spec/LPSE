import { Suspense } from 'react'
import { StatsContent } from './StatsContent'
import { StatsSkeleton } from '@/components/LoadingState'

export const metadata = {
  title: 'Statistik - LPSE Tender Aggregator',
  description: 'Statistik dan analitik tender LPSE Indonesia',
}

export default function StatsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Statistik Tender
        </h1>
        <p className="text-muted-foreground text-lg">
          Ringkasan dan analitik data tender dari seluruh LPSE
        </p>
      </div>

      {/* Stats Content */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsContent />
      </Suspense>
    </div>
  )
}
