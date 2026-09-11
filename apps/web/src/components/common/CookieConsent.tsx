'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CookiePreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const COOKIE_CONSENT_KEY = 'cfb_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'cfb_cookie_preferences';

const defaultPreferences: CookiePreferences = {
  essential: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (saved) {
        try {
          setPreferences(JSON.parse(saved));
        } catch {
          // Use defaults if parsing fails
        }
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);

    // Dispatch event for analytics/tracking scripts to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: prefs }));
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const acceptEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[100] p-4 transition-transform duration-300',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-border/60 bg-card shadow-lg backdrop-blur-sm">
          {!showSettings ? (
            /* Main Banner */
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Cookie className="icon-md text-primary-emphasis" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-1">We value your privacy</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                    By clicking "Accept All", you consent to our use of cookies. 
                    Read our{' '}
                    <Link href="/privacy" className="text-primary-emphasis underline underline-offset-2">
                      Privacy Policy
                    </Link>{' '}
                    to learn more.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="text-xs gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                    Customize
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={acceptEssential}
                    className="text-xs"
                  >
                    Essential Only
                  </Button>
                  <Button
                    size="sm"
                    onClick={acceptAll}
                    className="text-xs gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Settings Panel */
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Settings className="icon-sm text-primary-emphasis" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Cookie Preferences</h3>
                    <p className="text-xs text-muted-foreground">Manage your cookie settings</p>
                  </div>
                </div>
                <Button aria-label="Close"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="icon-sm" aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-3 mb-4">
                {/* Essential Cookies */}
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground">Essential Cookies</p>
                    <p className="text-xs text-muted-foreground">Required for the website to function properly</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Always on</span>
                    <div className="h-5 w-9 rounded-full bg-primary/20 flex items-center justify-end px-0.5">
                      <div className="h-4 w-4 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground">Analytics Cookies</p>
                    <p className="text-xs text-muted-foreground">Help us understand how visitors use our site</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={cn(
                    'h-5 w-9 rounded-full flex items-center px-0.5 transition-colors',
                    preferences.analytics ? 'bg-primary justify-end' : 'bg-muted justify-start'
                  )}>
                    <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </div>
                </label>

                {/* Marketing Cookies */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground">Marketing Cookies</p>
                    <p className="text-xs text-muted-foreground">Used to deliver personalized advertisements</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={cn(
                    'h-5 w-9 rounded-full flex items-center px-0.5 transition-colors',
                    preferences.marketing ? 'bg-primary justify-end' : 'bg-muted justify-start'
                  )}>
                    <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </div>
                </label>

                {/* Preference Cookies */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-foreground">Preference Cookies</p>
                    <p className="text-xs text-muted-foreground">Remember your settings and preferences</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.preferences}
                    onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={cn(
                    'h-5 w-9 rounded-full flex items-center px-0.5 transition-colors',
                    preferences.preferences ? 'bg-primary justify-end' : 'bg-muted justify-start'
                  )}>
                    <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <Link href="/privacy" className="text-xs text-primary-emphasis underline underline-offset-2">
                  Learn more about cookies
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveCustom}
                    className="text-xs gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
