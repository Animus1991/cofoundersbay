'use client';

import { useEffect } from 'react';

/**
 * Registers the Service Worker for offline support and caching.
 * Forces immediate update to prevent stale cache issues.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    
    // Only register in production
    if (process.env.NODE_ENV !== 'production') {
      // In development, unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // Force immediate update check
        registration.update();

        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - skip waiting and reload
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          });
        });

        // Check for updates every 5 minutes
        setInterval(() => registration.update(), 5 * 60 * 1000);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, []);

  return null;
}
