'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter, X, Grid, List, Loader2, Building2, FileText } from 'lucide-react'

const TENDERS_API = process.env.NEXT_PUBLIC_TENDERS_API || '/api/tenders'
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
import { formatCurrency } from '@/lib/format'
import type { ApiTenderWithLpse } from '@/lib/types'

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

interface SearchSuggestion {
  id: number
  kode_tender: string
  nama_tender: string
  kategori_pekerjaan: string | null
  status_tender: string | null
  lpse_nama: string | null
  nilai_pagu: number | null
}

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

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

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

  // Fetch suggestions when search changes
  useEffect(() => {
    if (search.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${TENDERS_API}?search=${encodeURIComponent(search)}&limit=10`)
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          const nextSuggestions = (data.data as ApiTenderWithLpse[]).map((tender) => ({
            id: tender.id,
            kode_tender: tender.kode_tender,
            nama_tender: tender.nama_tender,
            kategori_pekerjaan: tender.kategori_pekerjaan ?? null,
            status_tender: tender.status_tender ?? null,
            lpse_nama: tender.lpse?.nama_lpse ?? null,
            nilai_pagu: tender.nilai_pagu ?? null,
          }))
          setSuggestions(nextSuggestions)
          setShowSuggestions(true)
          setSelectedIndex(-1)
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Debounced search for URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get('search') || ''
      if (search !== currentSearch) {
        updateUrl({ search })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search, searchParams, updateUrl])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    // Navigate directly to tender detail
    router.push(`/tenders/${suggestion.kode_tender}`)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (e.target.value.length >= 2) {
      setShowSuggestions(true)
    }
  }

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
    setSuggestions([])
    setShowSuggestions(false)
    router.push(pathname)
  }

  const hasFilters = search || kategori || status
  const activeFiltersCount = [search, kategori, status].filter(Boolean).length

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/20 text-primary font-semibold rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input with Autocomplete */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin z-10" />
          )}
          <Input
            ref={inputRef}
            type="search"
            placeholder="Cari nama tender, kode tender, atau LPSE..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (search.length >= 2 && suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            className="pl-10 pr-10"
            autoComplete="off"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto"
            >
              <div className="p-2 text-xs text-muted-foreground border-b">
                {suggestions.length} hasil ditemukan - Pilih untuk langsung ke detail
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  className={cn(
                    'w-full text-left px-3 py-3 hover:bg-accent transition-colors border-b last:border-b-0',
                    selectedIndex === index && 'bg-accent'
                  )}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2 mt-0.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight mb-1">
                        {highlightMatch(suggestion.nama_tender, search)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">#{highlightMatch(suggestion.kode_tender, search)}</span>
                        {suggestion.kategori_pekerjaan && (
                          <>
                            <span>•</span>
                            <span>{suggestion.kategori_pekerjaan}</span>
                          </>
                        )}
                        {suggestion.status_tender && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs py-0 h-5">
                              {suggestion.status_tender}
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {suggestion.lpse_nama && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {highlightMatch(suggestion.lpse_nama, search)}
                          </span>
                        )}
                        {suggestion.nilai_pagu && (
                          <span className="text-primary font-medium">
                            {formatCurrency(suggestion.nilai_pagu)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results message */}
          {showSuggestions && search.length >= 2 && suggestions.length === 0 && !isLoading && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50"
            >
              <div className="p-4 text-center text-sm text-muted-foreground">
                Tidak ada hasil untuk &quot;{search}&quot;
              </div>
            </div>
          )}
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
                  setSuggestions([])
                  setShowSuggestions(false)
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
