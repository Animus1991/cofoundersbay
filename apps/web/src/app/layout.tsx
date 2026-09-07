import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { RoleTheme } from '@/components/layout/RoleTheme';
import { ToastProvider } from '@/components/ui/toast';
import { NetworkProvider, OfflineBanner } from '@/components/common/OfflineIndicator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { RoleProvider } from '@/contexts/RoleContext';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { GlobalFloatingUi } from '@/components/layout/GlobalFloatingUi';
import { PopupChatProvider } from '@/contexts/PopupChatContext';
import { MessagingProvider } from '@/contexts/MessagingContext';
import { TenantProvider } from '@/components/providers/TenantContext';
import { DemoDataProvider } from '@/contexts/DemoDataContext';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { LocaleSync } from '@/components/common/LocaleSync';
import { PreviewSessionGuard } from '@/components/common/PreviewSessionGuard';
import { I18nProvider } from '@/components/common/I18nProvider';

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
      data-scroll-behavior="smooth"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="bg-background text-foreground font-sans antialiased"
      >
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ErrorBoundary>
          <QueryProvider>
            <RoleProvider>
              <TenantProvider>
                <SidebarProvider>
                  <ServiceWorkerRegistration />
                  <NetworkProvider>
                    <ToastProvider>
                      <PopupChatProvider>
                        <MessagingProvider>
                          <DemoDataProvider>
                            <RoleTheme>
                              <PreviewSessionGuard />
                              <LocaleSync />
                              <I18nProvider>
                              <OfflineBanner />
                              {children}
                              <GlobalFloatingUi />
                              <Suspense fallback={null}>
                                <PostHogProvider />
                              </Suspense>
                              </I18nProvider>
                            </RoleTheme>
                          </DemoDataProvider>
                        </MessagingProvider>
                      </PopupChatProvider>
                    </ToastProvider>
                  </NetworkProvider>
                </SidebarProvider>
              </TenantProvider>
            </RoleProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
