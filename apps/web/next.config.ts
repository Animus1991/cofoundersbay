import type { NextConfig } from 'next';

const allowedDevOrigins = ['localhost', '127.0.0.1', '*.trycloudflare.com'];

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@cofounderbay/shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins,
  devIndicators: false,
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
    minimumCacheTTL: 3600,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      'date-fns',
      'socket.io-client',
      '@tanstack/react-query',
    ],
    scrollRestoration: true,
    // Next.js 15 router cache: cache dynamic segments for 30s to speed up back/forward navigation
    staleTimes: {
      dynamic: 120,
      static: 600,
    },
  },

  // Turbopack is the dev compiler (enabled via `next dev --turbopack` in scripts/dev.js).
  // Declaring the key keeps Turbopack/webpack config resolution explicit. The webpack()
  // hook below still runs for `next build` (production), which uses webpack.
  turbopack: {},

  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    const target = (process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
    return [
      { source: '/api/:path*', destination: `${target}/api/:path*` },
      { source: '/socket.io/:path*', destination: `${target}/socket.io/:path*` },
    ];
  },

  // Production-only webpack tuning (dev uses Turbopack — omit webpack hook to avoid Next warning).
  ...(isProduction
    ? {
        webpack: (config: import('webpack').Configuration, { isServer }: { isServer: boolean }) => {
          if (!isServer) {
            config.optimization = {
              ...config.optimization,
              splitChunks: {
                ...(config.optimization?.splitChunks as object),
                cacheGroups: {
                  ...((config.optimization?.splitChunks as { cacheGroups?: Record<string, unknown> })?.cacheGroups ?? {}),
                  radix: {
                    test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                    name: 'radix-ui',
                    chunks: 'all',
                    priority: 20,
                  },
                  charts: {
                    test: /[\\/]node_modules[\\/]recharts[\\/]/,
                    name: 'recharts',
                    chunks: 'all',
                    priority: 20,
                  },
                  motion: {
                    test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
                    name: 'framer-motion',
                    chunks: 'all',
                    priority: 20,
                  },
                },
              },
            };
          }
          return config;
        },
      }
    : {}),

  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Headers for caching and security
  async headers() {
    const headers = [
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
            // strict-origin-when-cross-origin over origin-when-cross-origin:
            // the latter still sends the origin to http:// targets.
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // Deny by default. camera/microphone stay available to same-origin
            // because the video-call surface requests them at the element level.
            key: 'Permissions-Policy',
            value: 'accelerometer=(), autoplay=(self), camera=(self), display-capture=(self), encrypted-media=(), geolocation=(), gyroscope=(), interest-cohort=(), magnetometer=(), microphone=(self), payment=(), usb=()'
          },
          {
            // allow-popups so OAuth sign-in windows still work.
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          }
        ]
      },
    ];

    if (isProduction) {
      headers.push(
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
        },
      );
    } else {
      headers.push(
        {
          source: '/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, max-age=0, must-revalidate',
            },
          ],
        },
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, max-age=0, must-revalidate',
            },
          ],
        },
      );
    }

    return headers;
  },
};

export default nextConfig;
