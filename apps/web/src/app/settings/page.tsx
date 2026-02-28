'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  Mail,
  Bell,
  MessageCircle,
  UserPlus,
  Calendar,
  Briefcase,
  Shield,
  User,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { createBillingCheckout, createBillingPortal, getBillingSubscription, changePassword, type BillingSubscription } from '@/lib/api';

type NotifPrefs = {
  messages: boolean;
  connections: boolean;
  events: boolean;
  jobs: boolean;
  mentoring: boolean;
  emailDigest: boolean;
};

const DEFAULT_PREFS: NotifPrefs = {
  messages: true,
  connections: true,
  events: true,
  jobs: false,
  mentoring: true,
  emailDigest: false,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? 'bg-primary' : 'bg-secondary'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();

  const hasToken = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('accessToken');
  }, []);

  const [working, setWorking] = useState<'checkout' | 'portal' | null>(null);

  const { data: subData, isLoading: loading } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: getBillingSubscription,
    staleTime: 60_000,
    enabled: hasToken,
  });
  const subscription = subData?.subscription ?? null;

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwWorking, setPwWorking] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('notifPrefs') : null;
      return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      if (typeof window !== 'undefined') {
        localStorage.setItem('notifPrefs', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      showError('Passwords do not match', 'New password and confirmation must match.');
      return;
    }
    if (pwForm.next.length < 8) {
      showError('Too short', 'New password must be at least 8 characters.');
      return;
    }
    setPwWorking(true);
    try {
      await changePassword(pwForm.current, pwForm.next);
      success('Password changed', 'You have been signed out of all other sessions.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      showError('Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setPwWorking(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      success('Payment successful', 'Your subscription will activate shortly.');
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
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Billing */}
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
                      {isPremium ? 'Premium is active.' : 'Upgrade to Premium to unlock advanced features.'}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Mentor booking payments, file attachments, and advanced discovery filters.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="gap-2"
                    disabled={working !== null || isPremium}
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
                    {isPremium ? 'Premium active' : 'Upgrade'}
                  </Button>
                  {isPremium && (
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
                      Manage subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification preferences
                </CardTitle>
                <CardDescription>
                  Choose which in-app notifications you receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {([
                  { key: 'messages', icon: MessageCircle, label: 'New messages', desc: 'When someone sends you a message' },
                  { key: 'connections', icon: UserPlus, label: 'Connection requests', desc: 'When someone wants to connect' },
                  { key: 'mentoring', icon: Shield, label: 'Mentoring sessions', desc: 'Booking requests and updates' },
                  { key: 'events', icon: Calendar, label: 'Events', desc: 'New events and RSVPs' },
                  { key: 'jobs', icon: Briefcase, label: 'Job postings', desc: 'New relevant job opportunities' },
                  { key: 'emailDigest', icon: Mail, label: 'Weekly email digest', desc: 'Summary of activity via email' },
                ] as const).map(({ key, icon: Icon, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                    <Toggle
                      checked={prefs[key]}
                      onChange={(v) => {
                        updatePref(key, v);
                        success('Saved', `${label} notifications ${v ? 'enabled' : 'disabled'}.`);
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Change password
              </CardTitle>
              <CardDescription>Leave blank to keep your current password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Current password"
                    value={pwForm.current}
                    onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="New password (min 8 chars)"
                  value={pwForm.next}
                  onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
                <Button type="submit" disabled={pwWorking} className="gap-2">
                  {pwWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/profile/edit">
                  <Button variant="secondary" className="gap-2">
                    <User className="h-4 w-4" />
                    Edit profile
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="gap-2">
                    <Shield className="h-4 w-4" />
                    View public profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                To delete your account, contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
