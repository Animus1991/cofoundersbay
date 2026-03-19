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
  '/manifest.json',
  '/site.webmanifest',
  '/robots.txt',
]);

const PUBLIC_PREFIXES = [
  '/profiles/',  // public profile pages
  '/events/',    // public event pages
  '/_next/',
  '/favicon',
  '/uploads/',
  '/api/',       // API calls handled by backend
];

const STATIC_EXTENSIONS = /\.(ico|png|jpg|jpeg|svg|webp|css|js|json|webmanifest|txt|xml|woff2?|ttf|otf|map)$/;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (STATIC_EXTENSIONS.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for cfb_session — non-httpOnly presence cookie set by backend on login
  // cfb_access is httpOnly (not readable by middleware), cfb_session is the JS-readable indicator
  const hasSession = request.cookies.has('cfb_session');

  if (!hasSession) {
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (Next.js assets)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
