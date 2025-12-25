import { FileQuestion, Search, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: 'search' | 'file' | 'error'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const icons = {
  search: Search,
  file: FileQuestion,
  error: AlertCircle,
}

export function EmptyState({ icon = 'file', title, description, action, className }: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Terjadi Kesalahan',
  description = 'Gagal memuat data. Silakan coba lagi.',
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Coba Lagi
        </Button>
      )}
    </div>
  )
}

export function NoResultsState({
  searchTerm,
  onClear
}: {
  searchTerm?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon="search"
      title="Tidak Ada Hasil"
      description={
        searchTerm
          ? `Tidak ditemukan tender dengan pencarian "${searchTerm}". Coba kata kunci lain.`
          : 'Tidak ada tender yang sesuai dengan filter yang dipilih.'
      }
      action={onClear ? { label: 'Hapus Filter', onClick: onClear } : undefined}
    />
  )
}

export function NoTendersState() {
  return (
    <EmptyState
      icon="file"
      title="Belum Ada Tender"
      description="Belum ada data tender yang tersedia saat ini."
    />
  )
}
