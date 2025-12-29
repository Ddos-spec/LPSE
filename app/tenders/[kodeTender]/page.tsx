import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Tag,
  Clock,
  Users,
  FileDown,
  Scale,
  Briefcase,
  Banknote,
  Info,
  Download,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { StatusBadge, KategoriBadge } from '@/components/StatusBadge'
import { TenderDetailSkeleton } from '@/components/LoadingState'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { ApiResponse, ApiTenderFullDetail } from '@/lib/types'

const TENDER_DETAIL_API = process.env.NEXT_PUBLIC_TENDER_DETAIL_API || '/api/tenders'

interface TenderDetailPageProps {
  params: Promise<{ kodeTender: string }>
}

async function getTender(kodeTender: string): Promise<ApiTenderFullDetail | null> {
  try {
    const response = await fetch(`${TENDER_DETAIL_API}?kodeTender=${kodeTender}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch tender')
    }

    const data: ApiResponse<ApiTenderFullDetail> = await response.json()
    return data.data || null
  } catch (error) {
    console.error('Error fetching tender:', error)
    return null
  }
}

export default async function TenderDetailPage({ params }: TenderDetailPageProps) {
  const { kodeTender } = await params
  const tender = await getTender(kodeTender)

  if (!tender) {
    notFound()
  }

  const details = tender.tender_details

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">
          Beranda
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
          {tender.nama_tender}
        </span>
      </nav>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-sm font-mono text-muted-foreground">
            #{tender.kode_tender}
          </span>
          <StatusBadge status={tender.status_tender} />
          <KategoriBadge kategori={tender.kategori_pekerjaan} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
          {tender.nama_tender}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="text-3xl md:text-4xl font-bold text-primary">
            {formatCurrency(tender.nilai_pagu)}
          </div>
          {tender.nilai_hps && (
            <div className="text-sm text-muted-foreground">
              HPS: {formatCurrency(tender.nilai_hps)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {tender.url_detail && (
            <Button asChild>
              <a href={tender.url_detail} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Lihat Dokumen Asli
              </a>
            </Button>
          )}
          {tender.pdf_uraian_pekerjaan && (
            <Button variant="outline" asChild>
              <a href={tender.pdf_uraian_pekerjaan} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download Ringkasan
              </a>
            </Button>
          )}
          <Button variant="secondary" disabled>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Verifikator
          </Button>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <InfoCard
          icon={Building2}
          label="LPSE"
          value={tender.lpse?.nama_lpse ?? '-'}
        />
        <InfoCard
          icon={MapPin}
          label="Lokasi"
          value={
            tender.lpse?.provinsi
              ? `${tender.lpse?.kota ? tender.lpse.kota + ', ' : ''}${tender.lpse?.provinsi}`
              : '-'
          }
        />
        <InfoCard
          icon={Calendar}
          label="Tahun Anggaran"
          value={tender.tahun_anggaran?.toString() ?? '-'}
        />
        <InfoCard
          icon={Clock}
          label="Tahap Saat Ini"
          value={tender.tahap_saat_ini ?? '-'}
        />
        <InfoCard
          icon={Tag}
          label="Status"
          value={tender.status_tender ?? '-'}
        />
        <InfoCard
          icon={FileText}
          label="Kategori"
          value={tender.kategori_pekerjaan ?? '-'}
        />
        <InfoCard
          icon={Briefcase}
          label="Jenis Kontrak"
          value={tender.jenis_kontrak ?? '-'}
        />
        <InfoCard
          icon={Users}
          label="Peserta Tender"
          value={tender.peserta_tender?.toString() ?? '-'}
        />
        <InfoCard
          icon={MapPin}
          label="Lokasi Pekerjaan"
          value={tender.lokasi_pekerjaan ?? '-'}
        />
        <InfoCard
          icon={FileText}
          label="Kode RUP"
          value={tender.kode_rup ?? '-'}
        />
        <InfoCard
          icon={Banknote}
          label="Sumber Dana"
          value={tender.sumber_dana ?? '-'}
        />
        <InfoCard
          icon={Scale}
          label="Reverse Auction"
          value={tender.reverse_auction === null ? '-' : tender.reverse_auction ? 'Ya' : 'Tidak'}
        />
        <InfoCard
          icon={Scale}
          label="Bobot Teknis"
          value={tender.bobot_teknis !== null ? `${tender.bobot_teknis}%` : '-'}
        />
        <InfoCard
          icon={Scale}
          label="Bobot Biaya"
          value={tender.bobot_biaya !== null ? `${tender.bobot_biaya}%` : '-'}
        />
        <InfoCard
          icon={Calendar}
          label="Dibuat"
          value={formatDateTime(tender.created_at) ?? '-'}
        />
        <InfoCard
          icon={Calendar}
          label="Diperbarui"
          value={formatDateTime(tender.updated_at) ?? '-'}
        />
      </div>

      {/* Requirements Section */}
      {details && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Persyaratan Tender
          </h2>

          <Tabs defaultValue="umum" className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="umum" className="flex-1 min-w-[120px]">
                Umum
              </TabsTrigger>
              <TabsTrigger value="teknis" className="flex-1 min-w-[120px]">
                Teknis
              </TabsTrigger>
              <TabsTrigger value="kualifikasi" className="flex-1 min-w-[120px]">
                Kualifikasi
              </TabsTrigger>
              <TabsTrigger value="dokumen" className="flex-1 min-w-[120px]">
                Dokumen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="umum">
              <RequirementCard
                title="Persyaratan Umum"
                data={details.persyaratan_umum}
              />
            </TabsContent>

            <TabsContent value="teknis">
              <RequirementCard
                title="Persyaratan Teknis"
                data={details.persyaratan_teknis}
              />
            </TabsContent>

            <TabsContent value="kualifikasi">
              <RequirementCard
                title="Persyaratan Kualifikasi"
                data={details.persyaratan_kualifikasi}
              />
            </TabsContent>

            <TabsContent value="dokumen">
              <RequirementCard
                title="Dokumen Pengadaan"
                data={details.dokumen_pengadaan}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!details && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <Info className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Detail persyaratan tender belum tersedia.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="font-medium text-sm leading-tight break-words">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to format SBU requirement object
function formatSbuRequirement(sbu: unknown): string {
  if (!sbu) return '-'
  if (typeof sbu === 'string') return sbu || '-'
  if (typeof sbu === 'object' && sbu !== null) {
    const obj = sbu as Record<string, unknown>
    const parts: string[] = []
    if (obj.jenis_izin) parts.push(String(obj.jenis_izin))
    if (obj.bidang) parts.push(String(obj.bidang))
    if (obj.klasifikasi) parts.push(String(obj.klasifikasi))
    if (obj.sub_klasifikasi) parts.push(String(obj.sub_klasifikasi))
    return parts.length > 0 ? parts.join(' - ') : '-'
  }
  return '-'
}

// Helper to format value, replacing null/undefined with '-'
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value.trim() || '-'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  if (Array.isArray(value)) {
    const formatted = value.map(v => formatValue(v)).filter(v => v !== '-')
    return formatted.length > 0 ? formatted.join(', ') : '-'
  }
  if (typeof value === 'object') {
    // Check if it's an SBU-like object
    const obj = value as Record<string, unknown>
    if ('bidang' in obj || 'jenis_izin' in obj) {
      return formatSbuRequirement(obj)
    }
    return JSON.stringify(value)
  }
  return String(value) || '-'
}

function RequirementCard({
  title,
  data,
}: {
  title: string
  data: unknown
}) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Tidak ada data {title.toLowerCase()}.
        </CardContent>
      </Card>
    )
  }

  // Handle different data formats
  const renderData = () => {
    if (typeof data === 'string') {
      return <p className="whitespace-pre-wrap">{data || '-'}</p>
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <p className="text-muted-foreground">-</p>
      }
      return (
        <ul className="space-y-2">
          {data.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{formatValue(item)}</span>
            </li>
          ))}
        </ul>
      )
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>)
      if (entries.length === 0) {
        return <p className="text-muted-foreground">-</p>
      }
      return (
        <dl className="space-y-3">
          {entries.map(([key, value]) => {
            // Format the key to be more readable
            const formattedKey = key
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())

            return (
              <div key={key}>
                <dt className="font-medium text-sm mb-1">{formattedKey}</dt>
                <dd className="text-muted-foreground text-sm pl-4">
                  {formatValue(value)}
                </dd>
              </div>
            )
          })}
        </dl>
      )
    }

    return <p>{formatValue(data)}</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{renderData()}</CardContent>
    </Card>
  )
}
