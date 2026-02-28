import type { Metadata, Viewport } from 'next';
import { Inter, Sora, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { RoleTheme } from '@/components/layout/RoleTheme';
import { ToastProvider } from '@/components/ui/toast';
import { NetworkProvider, OfflineBanner } from '@/components/common/OfflineIndicator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { RoutePrefetcher } from '@/components/optimization/RoutePrefetcher';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';

const inter = Inter({
  subsets: ['latin', 'greek'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

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
    <html lang="el" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${sora.variable} ${spaceGrotesk.variable} bg-background text-foreground font-sans antialiased`}
      >
        <ErrorBoundary>
          <QueryProvider>
            <RoutePrefetcher />
            <ServiceWorkerRegistration />
            <NetworkProvider>
              <ToastProvider>
                <RoleTheme>
                  <OfflineBanner />
                  {children}
                </RoleTheme>
              </ToastProvider>
            </NetworkProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
