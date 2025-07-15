/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // ESLint komplett deaktivieren für Build
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Bundle für standalone build
    serverComponentsExternalPackages: [],
  },
  // 🔧 Service Worker Cache-Headers für Offline-PWA
  async headers() {
    return [
      // Service Worker nie cachen
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      },
      // Manifest cachen für PWA
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // Offline-Fallback nie cachen
      {
        source: '/offline.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0'
          }
        ],
      }
    ]
  },
  // PWA Config für Tablet-Optimierung
  env: {
    NEXT_PUBLIC_PWA_ENABLED: 'true',
    NEXT_PUBLIC_TABLET_OPTIMIZED: 'true',
  },
}

module.exports = nextConfig
// 🔧 InspecDoor Outdoor - Tablet-optimierte PWA-Konfiguration
