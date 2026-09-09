import type { NextConfig } from 'next';

const allowedDevOrigins = ['localhost'];

const isProduction = process.env.NODE_ENV === 'production';

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
    minimumCacheTTL: 3600,
    // SVGs are allowed but are served with `script-src 'none'; sandbox` (below)
    // and as attachments, so they cannot execute in the page's origin.
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

  // Webpack: improve chunk splitting for production
  webpack: (config, { dev, isServer, nextRuntime }) => {
    if (dev) {
      // Use persistent filesystem cache on all platforms (including Windows).
      // Filesystem cache is incremental and safe; Next.js manages cache invalidation.
      // Each compiler (client / nodejs-server / edge-server) needs a UNIQUE cache name.
      const cacheName = !isServer
        ? 'cfb-client'
        : nextRuntime === 'edge'
          ? 'cfb-edge'
          : 'cfb-server';

      config.cache = {
        type: 'filesystem',
        name: cacheName,
        // Bump version to bust stale cache entries (increment when deps change broadly)
        version: '3',
      };
    }

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...(config.optimization?.splitChunks as object),
          cacheGroups: {
            ...((config.optimization?.splitChunks as any)?.cacheGroups ?? {}),
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
  
  // Production optimizations
  poweredByHeader: false,
  
  // Compression
  compress: true,
  
  // Headers for caching and security
  async headers() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL || '';
    const wsOrigin = apiOrigin.replace(/^http/, 'ws');

    // `unsafe-inline` is required for styles because Tailwind's runtime theme
    // switching writes inline custom properties; `unsafe-eval` is only allowed
    // in development, where React Refresh needs it.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"} https://*.posthog.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin} ${wsOrigin} https://*.posthog.com https://*.sentry.io wss:`.trim(),
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://*.daily.co",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      ...(isProduction ? ['upgrade-insecure-requests'] : []),
    ].join('; ');

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
            // X-XSS-Protection is deprecated and its filter has itself been a
            // source of vulnerabilities; 0 disables it. CSP replaces it.
            key: 'X-XSS-Protection',
            value: '0'
          },
          {
            // origin-when-cross-origin leaks the origin to http:// targets.
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: csp
          },
          {
            // Deny by default: nothing in the product needs these, and the
            // video-call surface requests camera/mic at the element level.
            key: 'Permissions-Policy',
            value: 'accelerometer=(), autoplay=(self), camera=(self), display-capture=(self), encrypted-media=(), geolocation=(), gyroscope=(), interest-cohort=(), magnetometer=(), microphone=(self), payment=(), usb=()'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
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
