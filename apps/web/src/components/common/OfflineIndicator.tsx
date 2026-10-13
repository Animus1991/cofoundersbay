'use client';

import { useState, useEffect, useId, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BilingualText } from '@/components/common/BilingualText';
import { cn } from '@/lib/utils';
import { isPreviewDemo } from '@/lib/preview-demo';
import { commonEl, commonEn } from '@/lib/i18n/strings-common';
import { useTopBannerHeight } from '@/components/layout/useTopBannerHeight';

// Network status context
type NetworkContextType = {
  isOnline: boolean;
  isApiOnline: boolean;
  wasOffline: boolean;
  connectionType?: string;
};

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isApiOnline: true,
  wasOffline: false,
});

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isApiOnline, setIsApiOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionType, setConnectionType] = useState<string | undefined>();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => { setIsOnline(true); };
    const handleOffline = () => { setIsOnline(false); setWasOffline(true); };

    // Track API-level availability separately from browser network status.
    // The API can be down (dev server crash, restart) while the browser is still online.
    const handleApiOffline = () => { setIsApiOnline(false); setWasOffline(true); };
    const handleApiOnline = () => { setIsApiOnline(true); };

    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    if (connection) setConnectionType(connection.effectiveType);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('cfb:api-offline', handleApiOffline);
    window.addEventListener('cfb:api-online', handleApiOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('cfb:api-offline', handleApiOffline);
      window.removeEventListener('cfb:api-online', handleApiOnline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, isApiOnline, wasOffline, connectionType }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function OfflineBanner() {
  const { isOnline, isApiOnline, wasOffline } = useNetwork();
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [previewDemo, setPreviewDemo] = useState(() => isPreviewDemo());

  useEffect(() => {
    const sync = () => setPreviewDemo(isPreviewDemo());
    sync();
    window.addEventListener('cfb:login', sync);
    window.addEventListener('cfb:user', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cfb:login', sync);
      window.removeEventListener('cfb:user', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const fullyOnline = isOnline && isApiOnline;
  const wasEverOffline = wasOffline;

  useEffect(() => {
    if (fullyOnline && wasEverOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3_000);
      return () => clearTimeout(timer);
    }
  }, [fullyOnline, wasEverOffline]);

  // Preview demo is designed to run without a live API, so the API-down state
  // must not cover the sticky header there. Real offline still shows.
  const variant = !isOnline
    ? ({
        tone: 'bg-status-warning-mark text-status-warning',
        icon: <WifiOff className="icon-sm shrink-0" aria-hidden="true" />,
        text: "You're offline. Some features may be unavailable.",
        action: { label: 'Retry', hover: 'hover:bg-status-warning-mark', text: 'text-status-warning' },
        dismiss: false,
      } as const)
    : !isApiOnline && !previewDemo && !dismissed
      ? ({
          // orange-700, not -600: white on -600 is 3.56:1, below AA for body text.
          tone: 'bg-status-warning-mark text-ink',
          icon: <ServerCrash className="icon-sm shrink-0" aria-hidden="true" />,
          text:
            process.env.NODE_ENV === 'development'
              ? 'API server is unavailable — pages will reload automatically when it recovers. Run: pnpm dev:stack (starts API on :3001 + web on :3000)'
              : 'API server is unavailable — pages will reload automatically when it recovers.',
          action: { label: 'Reload', hover: 'hover:bg-status-warning-mark', text: 'text-ink' },
          dismiss: true,
        } as const)
      : showReconnected
        ? ({
            tone: 'bg-status-success-mark text-status-success',
            icon: <Wifi className="icon-sm shrink-0" aria-hidden="true" />,
            text: 'Back online!',
            action: null,
            dismiss: false,
          } as const)
        : null;

  const bannerRef = useTopBannerHeight<HTMLDivElement>('--banner-network', variant !== null);

  if (!variant) return null;

  return (
    <div
      ref={bannerRef}
      role="status"
      className={cn('fixed left-0 right-0 top-0 z-50 px-3 py-1.5 sm:px-4', variant.tone)}
    >
      <div className={cn(
        'mx-auto flex max-w-screen-2xl items-center gap-2',
        variant.action || variant.dismiss ? 'justify-between' : 'justify-center',
      )}>
        <div className="flex min-w-0 items-center gap-2">
          {variant.icon}
          <span className="text-xs font-medium sm:text-sm">{variant.text}</span>
        </div>
        {(variant.action || variant.dismiss) && (
          <div className="flex shrink-0 items-center gap-1">
            {variant.action && (
              <Button
                size="sm"
                variant="ghost"
                className={cn('h-7 shrink-0', variant.action.text, variant.action.hover)}
                onClick={() => window.location.reload()}
                // The label hides below `sm`; the name must not hide with it.
                aria-label={variant.action.label}
              >
                <RefreshCw className="icon-sm sm:mr-1" aria-hidden="true" />
                <span className="hidden sm:inline">{variant.action.label}</span>
              </Button>
            )}
            {variant.dismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-ink hover:bg-status-warning-mark"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
              >
                ×
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * A demo session saves nothing. The notice used to be a strip across the top.
 * It is now one Exit control in a corner, so the top of the page stays clear.
 * The explanation and the way out (the existing register page) show when the
 * pointer rests on that control. It does not publish `--banner-demo`.
 */
function DemoNotice() {
  return (
    <>
      <p>
        <BilingualText en={commonEn('demo_mode_banner')} el={commonEl('demo_mode_banner')} wrap />
      </p>
      <p className="mt-1 font-medium">
        <BilingualText en={commonEn('create_free_account')} el={commonEl('create_free_account')} wrap />
      </p>
    </>
  );
}

export function DemoSessionBanner() {
  const noticeId = useId();
  const [previewDemo, setPreviewDemo] = useState(false);

  useEffect(() => {
    const sync = () => setPreviewDemo(isPreviewDemo());
    sync();
    window.addEventListener('cfb:login', sync);
    window.addEventListener('cfb:user', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cfb:login', sync);
      window.removeEventListener('cfb:user', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (!previewDemo) return null;

  return (
    <>
      <p id={noticeId} className="sr-only">
        <DemoNotice />
      </p>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="fixed z-40 left-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-4 sm:left-[calc(4.25rem+0.75rem)] lg:left-[calc(15rem+0.75rem)]"
            >
              <Link href="/register" aria-describedby={noticeId}>
                <BilingualText en={commonEn('demo_exit')} el={commonEl('demo_exit')} compact />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="max-w-sm text-xs">
            <DemoNotice />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}

// Small offline indicator for status bar
export function OfflineStatusIndicator({ className }: { className?: string }) {
  const { isOnline } = useNetwork();

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        isOnline ? 'text-status-success ' : 'text-status-warning ',
        className
      )}
    >
      {isOnline ? (
        <>
          <Cloud className="icon-sm" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <CloudOff className="icon-sm" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

// HOC to disable components when offline
type WithOnlineProps = {
  children: ReactNode;
  fallback?: ReactNode;
  requireOnline?: boolean;
};

export function OnlineOnly({ children, fallback, requireOnline = true }: WithOnlineProps) {
  const { isOnline } = useNetwork();

  if (requireOnline && !isOnline) {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8 text-center">
          <div>
            <WifiOff className="mx-auto icon-xl text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              This feature requires an internet connection
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
