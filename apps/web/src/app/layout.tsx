import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { RoleTheme } from '@/components/layout/RoleTheme';
import { SkipToContent } from '@/components/layout/SkipToContent';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import { NetworkProvider, OfflineBanner } from '@/components/common/OfflineIndicator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { GlobalFloatingUi } from '@/components/layout/GlobalFloatingUi';
import { PopupChatProvider } from '@/contexts/PopupChatContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { TenantProvider } from '@/components/providers/TenantContext';
import { DemoDataProvider } from '@/contexts/DemoDataContext';
import { PostHogProvider } from '@/components/providers/PostHogProvider';

/**
 * Self-hosted via next/font: the files are emitted into the build output and
 * served from our own origin, so there is no render-blocking request to
 * fonts.googleapis.com and no third-party connection at runtime.
 * `display: swap` + the CSS-variable binding means the fallback metrics are
 * adjusted automatically, so swapping in the real face causes no layout shift.
 */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-loaded',
  weight: ['400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk-loaded',
  weight: ['500', '600', '700'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://cofounderbay.com';

const description =
  'CoFounderBay is the startup ecosystem network where founders find co-founders, ' +
  'mentors and investors — with AI matching, readiness scoring, fundraising tools ' +
  'and multi-tenant workspaces for accelerators and universities.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CoFounderBay — Find your co-founder, mentor and investor',
    template: '%s | CoFounderBay',
  },
  description,
  applicationName: 'CoFounderBay',
  keywords: [
    'startup',
    'founder',
    'cofounder',
    'co-founder matching',
    'mentor',
    'investor',
    'accelerator',
    'incubator',
    'venture',
    'networking',
    'entrepreneurship',
  ],
  authors: [{ name: 'CoFounderBay' }],
  creator: 'CoFounderBay',
  publisher: 'CoFounderBay',
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'CoFounderBay',
    title: 'CoFounderBay — Find your co-founder, mentor and investor',
    description,
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'CoFounderBay',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoFounderBay — Find your co-founder, mentor and investor',
    description,
    images: ['/icons/icon-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
};

/**
 * Note: `maximumScale` / `userScalable` are deliberately NOT set.
 * Locking zoom fails WCAG 2.2 SC 1.4.4 (Resize Text) and is the single most
 * common mobile-accessibility defect in production SaaS.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`scroll-smooth ${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="bg-background text-foreground font-sans antialiased"
      >
        {/* Must be the first focusable node in the document. */}
        <SkipToContent />
        <ErrorBoundary>
          <QueryProvider>
            <TenantProvider>
              <SidebarProvider>
                <ServiceWorkerRegistration />
                <NetworkProvider>
                  <ToastProvider>
                    <ConfirmProvider>
                    <PopupChatProvider>
                      <MessagingProvider>
                        <DemoDataProvider>
                          <RoleTheme>
                            <OfflineBanner />
                            {children}
                            <GlobalFloatingUi />
                            <Suspense fallback={null}>
                              <PostHogProvider />
                            </Suspense>
                          </RoleTheme>
                        </DemoDataProvider>
                      </MessagingProvider>
                    </PopupChatProvider>
                    </ConfirmProvider>
                  </ToastProvider>
                </NetworkProvider>
              </SidebarProvider>
            </TenantProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
