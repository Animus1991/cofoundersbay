import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RoleTheme } from '@/components/layout/RoleTheme';
import { ToastProvider } from '@/components/ui/toast';
import { NetworkProvider, OfflineBanner } from '@/components/common/OfflineIndicator';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ServiceWorkerRegistration } from '@/components/common/ServiceWorkerRegistration';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ChatBubble } from '@/components/common/ChatBubble';

export const metadata: Metadata = {
  title: {
    default: 'CoFounderBay',
    template: '%s | CoFounderBay',
  },
  description: 'Startup ecosystem networking for founders, mentors, and investors',
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
      lang="en"
      data-scroll-behavior="smooth"
      className="scroll-smooth"
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="bg-background text-foreground font-sans antialiased"
      >
        <ErrorBoundary>
          <QueryProvider>
            <SidebarProvider>
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
