import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string | null | undefined
  className?: string
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
  'Tender': { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  'Pengumuman': { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  'Selesai': { variant: 'default', className: 'bg-gray-500 hover:bg-gray-600' },
  'Lelang': { variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
  'Pemberian Penjelasan': { variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600 text-black' },
  'Evaluasi': { variant: 'default', className: 'bg-orange-500 hover:bg-orange-600' },
  'Penawaran': { variant: 'default', className: 'bg-cyan-500 hover:bg-cyan-600' },
  'Negosiasi': { variant: 'default', className: 'bg-indigo-500 hover:bg-indigo-600' },
  'Penetapan Pemenang': { variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-600' },
  'Kontrak': { variant: 'default', className: 'bg-teal-500 hover:bg-teal-600' },
  'Dibatalkan': { variant: 'destructive', className: '' },
  'Gagal': { variant: 'destructive', className: '' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="outline" className={cn('text-muted-foreground', className)}>
        Tidak diketahui
      </Badge>
    )
  }

  const config = statusConfig[status] || { variant: 'secondary' as const, className: '' }

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {status}
    </Badge>
  )
}

interface KategoriBadgeProps {
  kategori: string | null | undefined
  className?: string
}

const kategoriConfig: Record<string, string> = {
  'Konstruksi': 'bg-amber-100 text-amber-800 border-amber-200',
  'Jasa Konsultansi Badan Usaha': 'bg-blue-100 text-blue-800 border-blue-200',
  'Jasa Konsultansi Perorangan': 'bg-sky-100 text-sky-800 border-sky-200',
  'Jasa Lainnya': 'bg-violet-100 text-violet-800 border-violet-200',
  'Pengadaan Barang': 'bg-green-100 text-green-800 border-green-200',
  'Pekerjaan Konstruksi': 'bg-orange-100 text-orange-800 border-orange-200',
}

export function KategoriBadge({ kategori, className }: KategoriBadgeProps) {
  if (!kategori) {
    return (
      <Badge variant="outline" className={cn('text-muted-foreground', className)}>
        -
      </Badge>
    )
  }

  const colorClass = kategoriConfig[kategori] || 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <Badge
      variant="outline"
      className={cn('border', colorClass, className)}
    >
      {kategori}
    </Badge>
  )
}
