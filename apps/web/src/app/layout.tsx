import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter, Commissioner } from 'next/font/google';
import './globals.css';

/*
 * Brand typography.
 *
 * Both families are self-hosted by next/font (no runtime request to Google,
 * no layout shift, size-adjusted fallback). Both cover Greek — a hard
 * requirement for a bilingual UI: the previous display fonts (Space Grotesk,
 * Sora) have no Greek glyphs, so mixed-language headings would have fallen
 * back mid-string. Until now none of the fonts were actually loaded and the
 * whole product rendered in the OS default.
 *
 *  - Inter        body / UI text: neutral, excellent Greek, tabular figures
 *  - Commissioner display: a humanist grotesque by Kostas Bartsokas with
 *                 Greek designed in, not bolted on. Distinct from Inter at
 *                 heading sizes without being ornamental.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'greek', 'greek-ext'],
  display: 'swap',
  variable: '--font-inter',
});

const commissioner = Commissioner({
  subsets: ['latin', 'latin-ext', 'greek'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display-brand',
});
import { RoleTheme } from '@/components/layout/RoleTheme';
import { ToastProvider } from '@/components/ui/toast';
import { NetworkProvider, OfflineBanner } from '@/components/common/OfflineIndicator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { GlobalFloatingUi } from '@/components/layout/GlobalFloatingUi';
import { PopupChatProvider } from '@/contexts/PopupChatContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { TenantProvider } from '@/components/providers/TenantContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { DemoDataProvider } from '@/contexts/DemoDataContext';
import { ApiHealthProbe } from '@/components/providers/ApiHealthProbe';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { LanguagePreferenceProvider } from '@/lib/i18n/LanguagePreferenceContext';
import { PreviewSessionGuard } from '@/components/common/PreviewSessionGuard';

export const metadata: Metadata = {
  title: {
    default: 'CoFounderBay',
    template: '%s | CoFounderBay',
  },
  description: 'Startup ecosystem networking for founders, mentors, and investors',
  keywords: ['startup', 'founder', 'cofounder', 'mentor', 'investor', 'networking', 'entrepreneurship'],
  authors: [{ name: 'CoFounderBay' }],
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CoFounderBay',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  // Do NOT lock zoom: maximumScale/userScalable:false fails WCAG 2.2 SC 1.4.4 (Resize Text)
  // and SC 1.4.10 (Reflow). Users must be able to pinch-zoom up to at least 5x.
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-bilingual="en-el"
      data-scroll-behavior="smooth"
      className={`scroll-smooth ${inter.variable} ${commissioner.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="bg-background text-foreground font-sans antialiased"
      >
        {/* Single skip link for the whole app (WCAG 2.4.1). AppShell used to render
            a second one, so keyboard users hit the same link twice. */}
        <a href="#main-content" className="skip-to-content">
          <span lang="en">Skip to main content</span>
          <span aria-hidden="true"> · </span>
          <span lang="el">Μετάβαση στο κύριο περιεχόμενο</span>
        </a>
        <ErrorBoundary>
          <QueryProvider>
            <LanguagePreferenceProvider>
            <TenantProvider>
            <RoleProvider>
              <SidebarProvider>
                <ServiceWorkerRegistration />
                <NetworkProvider>
                  <ApiHealthProbe />
                  <ToastProvider>
                    <PopupChatProvider>
                      <MessagingProvider>
                        <DemoDataProvider>
                          <RoleTheme>
                            <PreviewSessionGuard />
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
                  </ToastProvider>
                </NetworkProvider>
              </SidebarProvider>
            </RoleProvider>
            </TenantProvider>
            </LanguagePreferenceProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
