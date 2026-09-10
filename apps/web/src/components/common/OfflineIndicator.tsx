'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

// Offline banner shown when user's browser is offline OR when the API server is down.
export function OfflineBanner() {
  const { isOnline, isApiOnline, wasOffline } = useNetwork();
  const [showReconnected, setShowReconnected] = useState(false);

  const fullyOnline = isOnline && isApiOnline;
  const wasEverOffline = wasOffline;

  useEffect(() => {
    if (fullyOnline && wasEverOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3_000);
      return () => clearTimeout(timer);
    }
  }, [fullyOnline, wasEverOffline]);

  // One wrapper for all three states: it carries the fixed positioning and
  // publishes its measured height, so the demo bar below it and the shell's
  // content column can offset by however tall this actually renders.
  const variant = !isOnline
    ? ({
        tone: 'bg-amber-500 text-amber-950',
        icon: <WifiOff className="icon-sm shrink-0" aria-hidden="true" />,
        text: "You're offline. Some features may be unavailable.",
        action: { label: 'Retry', hover: 'hover:bg-amber-600', text: 'text-amber-950' },
      } as const)
    : !isApiOnline
      ? ({
          // orange-700, not -600: white on -600 is 3.56:1, below AA for body text.
          tone: 'bg-orange-700 text-white',
          icon: <ServerCrash className="icon-sm shrink-0" aria-hidden="true" />,
          text: 'API server is unavailable — pages will reload automatically when it recovers.',
          action: { label: 'Reload now', hover: 'hover:bg-orange-800', text: 'text-white' },
        } as const)
      : showReconnected
        ? ({
            tone: 'bg-emerald-500 text-emerald-950',
            icon: <Wifi className="icon-sm shrink-0" aria-hidden="true" />,
            text: 'Back online!',
            action: null,
          } as const)
        : null;

  const bannerRef = useTopBannerHeight<HTMLDivElement>('--banner-network', variant !== null);

  if (variant) {
    return (
      <div
        ref={bannerRef}
        role="status"
        className={cn('fixed top-0 left-0 right-0 z-50 px-4 py-2', variant.tone)}
      >
        <div className="container mx-auto flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {variant.icon}
            <span className="text-sm font-medium">{variant.text}</span>
          </div>
          {variant.action && (
            <Button
              size="sm"
              variant="ghost"
              className={cn('h-7 shrink-0', variant.action.text, variant.action.hover)}
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="icon-2xs mr-1" aria-hidden="true" />
              {variant.action.label}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Small offline indicator for status bar
export function OfflineStatusIndicator({ className }: { className?: string }) {
  const { isOnline } = useNetwork();

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
        className
      )}
    >
      {isOnline ? (
        <>
          <Cloud className="icon-2xs" aria-hidden="true" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <CloudOff className="icon-2xs" aria-hidden="true" />
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
            <WifiOff className="mx-auto icon-xl text-muted-foreground mb-3" aria-hidden="true" />
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
