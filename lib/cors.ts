// CORS helper for API routes
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || '*'

export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': CORS_ORIGIN.split(',')[0]?.trim() || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export function withCors(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...getCorsHeaders(),
    ...headers,
  }
}
