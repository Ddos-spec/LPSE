'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Filter, X, Grid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const KATEGORI_OPTIONS = [
  'Konstruksi',
  'Jasa Konsultansi Badan Usaha',
  'Jasa Konsultansi Perorangan',
  'Jasa Lainnya',
  'Pengadaan Barang',
  'Pekerjaan Konstruksi',
]

const STATUS_OPTIONS = [
  'Tender',
  'Pengumuman',
  'Selesai',
  'Lelang',
  'Pemberian Penjelasan',
  'Evaluasi',
  'Penawaran',
  'Negosiasi',
  'Penetapan Pemenang',
]

interface FilterBarProps {
  viewMode?: 'table' | 'card'
  onViewModeChange?: (mode: 'table' | 'card') => void
  className?: string
}

export function FilterBar({ viewMode = 'table', onViewModeChange, className }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [kategori, setKategori] = useState(searchParams.get('kategori') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  const updateUrl = useCallback((params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })

    // Reset to page 1 when filters change
    newParams.set('page', '1')

    router.push(`${pathname}?${newParams.toString()}`)
  }, [router, pathname, searchParams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get('search') || ''
      if (search !== currentSearch) {
        updateUrl({ search })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search, searchParams, updateUrl])

  const handleKategoriChange = (value: string) => {
    const newValue = value === 'all' ? '' : value
    setKategori(newValue)
    updateUrl({ kategori: newValue })
  }

  const handleStatusChange = (value: string) => {
    const newValue = value === 'all' ? '' : value
    setStatus(newValue)
    updateUrl({ status: newValue })
  }

  const clearFilters = () => {
    setSearch('')
    setKategori('')
    setStatus('')
    router.push(pathname)
  }

  const hasFilters = search || kategori || status
  const activeFiltersCount = [search, kategori, status].filter(Boolean).length

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari nama tender atau LPSE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={kategori || 'all'} onValueChange={handleKategoriChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {KATEGORI_OPTIONS.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => onViewModeChange('table')}
                aria-label="Tampilan tabel"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => onViewModeChange('card')}
                aria-label="Tampilan kartu"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Clear Filters */}
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Hapus
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Pencarian: {search}
              <button
                onClick={() => {
                  setSearch('')
                  updateUrl({ search: '' })
                }}
                className="ml-1 hover:text-destructive"
                aria-label="Hapus filter pencarian"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {kategori && (
            <Badge variant="secondary" className="gap-1">
              Kategori: {kategori}
              <button
                onClick={() => {
                  setKategori('')
                  updateUrl({ kategori: '' })
                }}
                className="ml-1 hover:text-destructive"
                aria-label="Hapus filter kategori"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {status && (
            <Badge variant="secondary" className="gap-1">
              Status: {status}
              <button
                onClick={() => {
                  setStatus('')
                  updateUrl({ status: '' })
                }}
                className="ml-1 hover:text-destructive"
                aria-label="Hapus filter status"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
