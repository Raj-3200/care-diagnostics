import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
