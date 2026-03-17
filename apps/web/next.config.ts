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
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-accordion',
      'date-fns',
      'socket.io-client',
    ],
    // Faster client-side navigation
    clientRouterFilter: true,
    clientRouterFilterRedirects: false,
    // CSS View Transitions API for smooth page navigation (Chrome 111+)
    viewTransition: true,
  },

  // Webpack optimizations for faster dev + smaller bundles
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Faster source maps in dev (eval is fastest but harder to debug)
      config.devtool = 'cheap-module-source-map';
    }
    if (!dev) {
      // Production: split large vendor chunks for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 20,
            },
            tanstack: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'tanstack-query',
              chunks: 'all',
              priority: 20,
            },
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide',
              chunks: 'all',
              priority: 20,
            },
            framerMotion: {
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
