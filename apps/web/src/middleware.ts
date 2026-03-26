import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/oauth-callback',
  '/auth/sso-complete',
  '/pricing',
  '/terms',
  '/privacy',
  '/manifest.json',
  '/site.webmanifest',
  '/robots.txt',
]);

const PUBLIC_PREFIXES = [
  '/p/',         // public user profile pages /p/[username]
  '/profiles/',
  '/events/',
  '/t/',         // tenant public landing pages /t/[slug]
  '/_next/',
  '/favicon',
  '/uploads/',
  '/api/',
];

const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|svg|webp|css|js|json|webmanifest|txt|xml|woff2?|ttf|otf|map)$/;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (STATIC_EXTENSIONS.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** The platform's own top-level domain (used for subdomain detection in prod) */
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'cofounderbay.com';

/**
 * Try to detect tenant slug from the request hostname.
 * - Subdomain pattern: athens.cofounderbay.com → slug "athens"
 * - Custom domain: founders.uni.edu → resolved via API
 * In dev (localhost / 127.0.0.1), no domain-based tenant is inferred.
 */
function extractTenantSlugFromHostname(hostname: string): string | null {
  if (!hostname) return null;
  // Strip port
  const host = hostname.split(':')[0];

  // Skip localhost / loopback
  if (host === 'localhost' || host === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null;
  }

  // Platform subdomain: athens.cofounderbay.com
  const subdomainPattern = new RegExp(`^([^.]+)\\.${PLATFORM_DOMAIN.replace('.', '\\.')}$`);
  const match = host.match(subdomainPattern);
  if (match) {
    const sub = match[1].toLowerCase();
    // Skip reserved subs
    if (!['www', 'app', 'api', 'admin', 'mail', 'cdn', 'static'].includes(sub)) {
      return sub;
    }
  }

  return null; // Custom domains resolved client-side via resolveTenantFromDomain()
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  const response = NextResponse.next();

  // ── Domain-aware tenant injection ──────────────────────────────────────────
  const tenantSlug = extractTenantSlugFromHostname(hostname);
  if (tenantSlug) {
    response.headers.set('x-tenant-slug', tenantSlug);
    response.headers.set('x-tenant-hostname', hostname.split(':')[0]);
  }

  // Always allow public paths (after setting tenant headers)
  if (isPublicPath(pathname)) {
    return response;
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────
  const hasSession = request.cookies.has('cfb_session');
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    // Preserve tenant context through login redirect
    if (tenantSlug) loginUrl.searchParams.set('tenant', tenantSlug);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
