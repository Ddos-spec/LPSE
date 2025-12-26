import Link from 'next/link'
import { Building2, Calendar, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, KategoriBadge } from '@/components/StatusBadge'
import { formatCurrency, formatDate, truncateText } from '@/lib/format'
import type { ApiTenderWithLpse } from '@/lib/types'

interface TenderCardProps {
  tender: ApiTenderWithLpse
}

export function TenderCard({ tender }: TenderCardProps) {
  return (
    <Link href={`/tenders/${tender.kode_tender}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-mono">
              #{tender.kode_tender}
            </span>
            <StatusBadge status={tender.status_tender} />
          </div>
          <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {truncateText(tender.nama_tender, 100)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* LPSE Info */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{tender.lpse?.nama_lpse ?? '-'}</span>
          </div>

          {/* Location */}
          {tender.lpse?.provinsi && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>
                {tender.lpse?.kota ? `${tender.lpse.kota}, ` : ''}
                {tender.lpse?.provinsi}
              </span>
            </div>
          )}

          {/* Value */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Nilai Pagu</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(tender.nilai_pagu, true)}
            </p>
          </div>

          {/* Category & Date */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <KategoriBadge kategori={tender.kategori_pekerjaan} />
            {tender.created_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(tender.created_at, 'short')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function TenderCardGrid({ tenders }: { tenders: ApiTenderWithLpse[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tenders.map((tender) => (
        <TenderCard key={tender.id} tender={tender} />
      ))}
    </div>
  )
}
