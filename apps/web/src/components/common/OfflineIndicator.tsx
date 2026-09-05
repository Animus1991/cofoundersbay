'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
function isPreviewDemo() {
  if (typeof document === 'undefined') return false;
  try {
    return (
      document.cookie.includes('cfb_preview_demo=1') ||
      window.localStorage.getItem('cfb_demo_data') === '1'
    );
  } catch {
    return false;
  }
}

export function OfflineBanner() {
  const { isOnline, isApiOnline, wasOffline } = useNetwork();
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [previewDemo, setPreviewDemo] = useState(false);

  useEffect(() => {
    setPreviewDemo(isPreviewDemo());
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

  if (!isOnline) {
    return (
      <div className="bg-amber-500 px-3 py-1.5 text-amber-950 sm:px-4">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-medium sm:text-sm">You&apos;re offline. Some features may be unavailable.</span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 shrink-0 text-amber-950 hover:bg-amber-600" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  if (!isApiOnline && !previewDemo && !dismissed) {
    return (
      <div className="bg-orange-600 px-3 py-1.5 text-white sm:px-4">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ServerCrash className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-medium sm:text-sm">
              API unavailable — sample data still works.
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-orange-700" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Reload</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-orange-700" onClick={() => setDismissed(true)} aria-label="Dismiss">
              ×
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="bg-emerald-500 px-3 py-1.5 text-emerald-950 sm:px-4">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-center gap-2">
          <Wifi className="h-4 w-4" />
          <span className="text-xs font-medium sm:text-sm">Back online!</span>
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
          <Cloud className="h-3 w-3" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <CloudOff className="h-3 w-3" />
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
            <WifiOff className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
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
