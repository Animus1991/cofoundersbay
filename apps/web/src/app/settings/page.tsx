'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditCard, Crown, ExternalLink, Loader2, Mail } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { createBillingCheckout, createBillingPortal, getBillingSubscription, type BillingSubscription } from '@/lib/api';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();

  const hasToken = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  }, []);

  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<'checkout' | 'portal' | null>(null);

  const loadSub = async () => {
    if (!hasToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getBillingSubscription();
      setSubscription(res.subscription);
    } catch (e) {
      setSubscription(null);
      showError('Failed to load settings', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      success('Payment successful', 'Your subscription will activate shortly.');
      void loadSub();
    }
    if (billing === 'cancel') {
      showError('Checkout canceled', 'No charges were made.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const status = subscription?.status ?? 'free';
  const statusLabel = status === 'free' ? 'Free' : status.replaceAll('_', ' ');
  const isPremium = ['trialing', 'active', 'past_due', 'paused'].includes(status);

  return (
    <AppShell
      title="Settings"
      description="Manage billing, notifications, and integrations."
    >
      {!hasToken && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>To manage billing and preferences, please sign in.</p>
            <Link href="/login">
              <Button>Go to login</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {hasToken && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isPremium ? 'default' : 'secondary'} className="gap-1.5">
                  {isPremium && <Crown className="h-3.5 w-3.5" />}
                  {statusLabel}
                </Badge>
                {subscription?.currentPeriodEnd && (
                  <span className="text-xs text-muted-foreground">
                    Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading billing…
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm">
                  <p className="font-medium text-foreground">
                    {isPremium ? 'Premium is enabled.' : 'Upgrade to Premium to unlock advanced features.'}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Coming next: mentor booking payments, file attachments, and advanced discovery filters.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="gap-2"
                  disabled={working !== null}
                  onClick={async () => {
                    try {
                      setWorking('checkout');
                      const res = await createBillingCheckout();
                      if (!res.url) throw new Error('No checkout URL returned');
                      window.location.href = res.url;
                    } catch (e) {
                      showError('Checkout failed', e instanceof Error ? e.message : 'Please try again');
                    } finally {
                      setWorking(null);
                    }
                  }}
                >
                  {working === 'checkout' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  Upgrade
                </Button>
                <Button
                  variant="secondary"
                  className="gap-2"
                  disabled={working !== null}
                  onClick={async () => {
                    try {
                      setWorking('portal');
                      const res = await createBillingPortal();
                      window.location.href = res.url;
                    } catch (e) {
                      showError('Portal failed', e instanceof Error ? e.message : 'Please try again');
                    } finally {
                      setWorking(null);
                    }
                  }}
                >
                  {working === 'portal' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                In-app notifications are now stored in the database and message emails can be queued via Redis when SMTP is configured.
              </p>
              <div className="rounded-xl border border-border/60 bg-card/60 p-4">
                <p className="font-medium text-foreground">Preferences UI</p>
                <p className="mt-1 text-muted-foreground">
                  Next step: add per-user notification settings (email + push) and connect the bell icon in the top navigation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
