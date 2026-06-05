// Build: 2 — forces Vercel to rebuild with correct BACKEND_URL
import type { NextConfig } from 'next';

const isVercel = !!process.env.VERCEL;
const isProd = process.env.NODE_ENV === 'production';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  // ── Build Output ──
  // standalone: used for Docker (Northflank) — minimal self-contained server
  // On Vercel: disabled (Vercel uses its own serverless model)
  output: isProd && !isVercel ? 'standalone' : undefined,

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ── Images ──
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // ── API Proxy ──
  // Rewrites /api/* → backend (same-origin so cookies work)
  // Dev:  BACKEND_URL defaults to localhost:4000
  // Prod: set BACKEND_URL in Vercel / Northflank dashboard
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  // ── Build Optimizations ──
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@tanstack/react-query',
      'recharts',
      'date-fns',
    ],
  },
};

export default nextConfig;
