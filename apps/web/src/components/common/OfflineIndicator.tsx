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

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 text-amber-950">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You&apos;re offline. Some features may be unavailable.</span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-amber-950 hover:bg-amber-600" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!isApiOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 px-4 py-2 text-white">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ServerCrash className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">
              API server is unavailable — pages will reload automatically when it recovers.
              {process.env.NODE_ENV === 'development' && (
                <> Run: pnpm dev:stack (starts API on :3001 + web on :3000)</>
              )}
            </span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-white hover:bg-orange-700" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Reload now
          </Button>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 px-4 py-2 text-emerald-950">
        <div className="container mx-auto flex items-center justify-center gap-2">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online!</span>
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
