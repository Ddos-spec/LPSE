/**
 * Indonesian locale formatting utilities
 */

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const INDONESIAN_DAYS = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
]

/**
 * Format number as Indonesian Rupiah currency
 * @param value - Number to format
 * @param compact - If true, use compact notation (e.g., 1,5 M for 1,500,000)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null | undefined, compact = false): string {
  if (value === null || value === undefined) return '-'

  if (compact) {
    if (value >= 1_000_000_000_000) {
      return `Rp ${(value / 1_000_000_000_000).toFixed(1).replace('.', ',')} T`
    }
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`
    }
    if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} Jt`
    }
    if (value >= 1_000) {
      return `Rp ${(value / 1_000).toFixed(1).replace('.', ',')} Rb`
    }
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format number with Indonesian locale (thousand separator)
 * @param value - Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'

  return new Intl.NumberFormat('id-ID').format(value)
}

/**
 * Format date in Indonesian locale
 * @param date - Date string or Date object
 * @param format - Format style: 'short' (1 Jan 2024), 'medium' (1 Januari 2024), 'long' (Senin, 1 Januari 2024)
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const day = d.getDate()
  const month = d.getMonth()
  const year = d.getFullYear()
  const dayName = INDONESIAN_DAYS[d.getDay()]

  switch (format) {
    case 'short':
      return `${day} ${INDONESIAN_MONTHS[month].slice(0, 3)} ${year}`
    case 'medium':
      return `${day} ${INDONESIAN_MONTHS[month]} ${year}`
    case 'long':
      return `${dayName}, ${day} ${INDONESIAN_MONTHS[month]} ${year}`
  }
}

/**
 * Format date and time in Indonesian locale
 * @param date - Date string or Date object
 * @returns Formatted date-time string
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')

  return `${formatDate(d, 'medium')} ${hours}:${minutes} WIB`
}

/**
 * Format relative time (e.g., "2 hari yang lalu")
 * @param date - Date string or Date object
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return '-'

  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffSecs < 60) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit yang lalu`
  if (diffHours < 24) return `${diffHours} jam yang lalu`
  if (diffDays < 7) return `${diffDays} hari yang lalu`
  if (diffWeeks < 4) return `${diffWeeks} minggu yang lalu`
  if (diffMonths < 12) return `${diffMonths} bulan yang lalu`

  return formatDate(d, 'medium')
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Format percentage
 * @param value - Value as decimal (0.5 = 50%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(decimals)}%`
}
