'use client'

import Link from 'next/link'
import { ArrowUpDown, ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge, KategoriBadge } from '@/components/StatusBadge'
import { formatCurrency, formatDate, truncateText } from '@/lib/format'
import type { ApiTenderWithLpse } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TenderTableProps {
  tenders: ApiTenderWithLpse[]
  className?: string
}

export function TenderTable({ tenders, className }: TenderTableProps) {
  return (
    <div className={cn('rounded-lg border overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Kode</TableHead>
              <TableHead className="min-w-[300px]">Nama Tender</TableHead>
              <TableHead className="w-[180px] hidden md:table-cell">LPSE</TableHead>
              <TableHead className="w-[150px] text-right">Nilai Pagu</TableHead>
              <TableHead className="w-[150px] hidden lg:table-cell">Kategori</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px] hidden lg:table-cell">Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenders.map((tender) => (
              <TableRow key={tender.id} className="group">
                <TableCell className="font-mono text-xs">
                  <Link
                    href={`/tenders/${tender.kode_tender}`}
                    className="text-primary hover:underline"
                  >
                    {tender.kode_tender}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/tenders/${tender.kode_tender}`}
                    className="hover:text-primary transition-colors block"
                  >
                    <span className="line-clamp-2 font-medium">
                      {truncateText(tender.nama_tender, 100)}
                    </span>
                  </Link>
                  {/* Mobile: Show LPSE name below tender name */}
                  <span className="text-xs text-muted-foreground md:hidden block mt-1">
                    {truncateText(tender.lpse?.nama_lpse ?? '-', 40)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground line-clamp-1">
                    {truncateText(tender.lpse?.nama_lpse ?? '-', 30)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(tender.nilai_pagu, true)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <KategoriBadge kategori={tender.kategori_pekerjaan} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={tender.status_tender} />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(tender.created_at, 'short')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface TenderListItemProps {
  tender: ApiTenderWithLpse
}

export function TenderListItem({ tender }: TenderListItemProps) {
  return (
    <Link href={`/tenders/${tender.kode_tender}`}>
      <div className="p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              #{tender.kode_tender}
            </span>
            <StatusBadge status={tender.status_tender} />
          </div>
          <h3 className="font-medium leading-tight line-clamp-2">
            {tender.nama_tender}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {tender.lpse?.nama_lpse ?? '-'}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <p className="font-bold text-primary">
              {formatCurrency(tender.nilai_pagu, true)}
            </p>
            <KategoriBadge kategori={tender.kategori_pekerjaan} />
          </div>
        </div>
      </div>
    </Link>
  )
}

export function TenderMobileList({ tenders }: { tenders: ApiTenderWithLpse[] }) {
  return (
    <div className="rounded-lg border divide-y">
      {tenders.map((tender) => (
        <TenderListItem key={tender.id} tender={tender} />
      ))}
    </div>
  )
}
