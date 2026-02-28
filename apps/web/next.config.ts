import type { NextConfig } from 'next';
import { networkInterfaces } from 'os';

function getLanIps(): string[] {
  const nets = networkInterfaces();
  return Object.values(nets)
    .flatMap((x) => x ?? [])
    .filter((n) => n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
}

const allowedDevOrigins = Array.from(
  new Set([
    'localhost',
    '127.0.0.1',
    ...getLanIps(),
  ]),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cofounderbay/shared'],
  allowedDevOrigins,
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
  },
  
  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
  
  // Compression
  compress: true,
};

export default nextConfig;
