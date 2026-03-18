import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RoleTheme } from '@/components/layout/RoleTheme';
import { ToastProvider } from '@/components/ui/toast';
import { NetworkProvider, OfflineBanner } from '@/components/common/OfflineIndicator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { RoutePrefetcher } from '@/components/optimization/RoutePrefetcher';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ChatBubble } from '@/components/common/ChatBubble';

export const metadata: Metadata = {
  title: {
    default: 'CoFounderBay',
    template: '%s | CoFounderBay',
  },
  description: 'Startup ecosystem networking — founders, mentors, investors',
  keywords: ['startup', 'founder', 'cofounder', 'mentor', 'investor', 'networking', 'entrepreneurship'],
  authors: [{ name: 'CoFounderBay' }],
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="el"
      data-scroll-behavior="smooth"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground font-sans antialiased"
      >
        <ErrorBoundary>
          <QueryProvider>
            <SidebarProvider>
              <RoutePrefetcher />
              <ServiceWorkerRegistration />
              <NetworkProvider>
                <ToastProvider>
                  <RoleTheme>
                    <OfflineBanner />
                    {children}
                    <ChatBubble />
                  </RoleTheme>
                </ToastProvider>
              </NetworkProvider>
            </SidebarProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
