import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TenderNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Tender Tidak Ditemukan</h1>

        <p className="text-muted-foreground max-w-md mb-8">
          Maaf, tender yang Anda cari tidak ditemukan.
          Mungkin kode tender tidak valid atau tender telah dihapus.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Ke Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
