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
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', '@radix-ui/react-avatar', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    turbo: {
      resolveAlias: {
        '@': './src',
      },
    },
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },
};

export default nextConfig;
