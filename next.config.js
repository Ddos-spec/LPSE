/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  compiler: isProd
    ? {
        removeConsole: {
          exclude: ['error'],
        },
      }
    : undefined,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Vary',
          value: 'Accept-Encoding',
        },
      ],
    },
  ],
}

module.exports = nextConfig
