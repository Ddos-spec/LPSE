'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Building2,
  TrendingUp,
  Banknote,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, KategoriBadge } from '@/components/StatusBadge'
import { StatsSkeleton } from '@/components/LoadingState'
import { ErrorState } from '@/components/EmptyState'
import { formatCurrency, formatDate, truncateText } from '@/lib/format'
import type { ApiResponse, TenderStats, ApiTenderWithLpse } from '@/lib/types'
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
]

export function StatsContent() {
  const [stats, setStats] = useState<TenderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/api/stats`)
        const data: ApiResponse<TenderStats> = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch stats')
        }

        setStats(data.data || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <StatsSkeleton />
  }

  if (error || !stats) {
    return <ErrorState onRetry={() => window.location.reload()} />
  }

  // Prepare chart data
  const kategoriData = Object.entries(stats.byKategori).map(([name, value]) => ({
    name: truncateText(name, 20),
    value,
    fullName: name,
  }))

  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({
    name,
    value,
  }))

  const provinsiData = Object.entries(stats.byProvinsi)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name: truncateText(name, 15),
      value,
      fullName: name,
    }))

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={FileText}
          label="Total Tender"
          value={stats.totalTenders.toLocaleString('id-ID')}
          color="blue"
        />
        <MetricCard
          icon={Building2}
          label="Total LPSE"
          value={stats.totalLpse.toLocaleString('id-ID')}
          color="green"
        />
        <MetricCard
          icon={TrendingUp}
          label="Rata-rata Nilai Pagu"
          value={formatCurrency(stats.avgNilaiPagu, true)}
          color="amber"
        />
        <MetricCard
          icon={Banknote}
          label="Total Nilai"
          value={formatCurrency(stats.totalTenders * stats.avgNilaiPagu, true)}
          color="purple"
          subtext="Estimasi"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kategoriData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {kategoriData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      [`${Number(value).toLocaleString('id-ID')} tender`]
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribusi Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    label={({ name, percent }) =>
                      (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ''
                    }
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString('id-ID')} tender`,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provinsi Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Provinsi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provinsiData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString('id-ID')} tender`,
                  ]}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tenders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tender Terbaru</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              Lihat Semua
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentTenders.map((tender) => (
              <RecentTenderItem key={tender.id} tender={tender} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  subtext,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  color: 'blue' | 'green' | 'amber' | 'purple'
  subtext?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecentTenderItem({ tender }: { tender: ApiTenderWithLpse }) {
  return (
    <Link href={`/tenders/${tender.kode_tender}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">
              #{tender.kode_tender}
            </span>
            <StatusBadge status={tender.status_tender} />
          </div>
          <p className="font-medium line-clamp-1">{tender.nama_tender}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {tender.lpse.nama_lpse}
          </p>
        </div>
        <div className="text-right sm:text-left">
          <p className="font-bold text-primary">
            {formatCurrency(tender.nilai_pagu, true)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(tender.created_at, 'short')}
          </p>
        </div>
      </div>
    </Link>
  )
}
