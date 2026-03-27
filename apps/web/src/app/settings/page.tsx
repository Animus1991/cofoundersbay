'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Link2,
  Globe,
  Lock,
  AlertTriangle,
  Trash2,
  Download,
  Activity,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { createBillingCheckout, createBillingPortal, getBillingSubscription, changePassword, getTwoFactorStatus, getLinkedAccounts, type BillingSubscription } from '@/lib/api';
import { TwoFactorManagement } from '@/components/auth/TwoFactorManagement';

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

const PRIVACY_ITEMS = [
  { id: 'publicProfile',  icon: Eye,      label: 'Public profile',      desc: 'Anyone can view your profile page' },
  { id: 'showLocation',   icon: Globe,    label: 'Show location',        desc: 'Display city/region on your profile' },
  { id: 'searchable',     icon: Lock,     label: 'Appear in search',     desc: 'Show up in member search and recommendations' },
  { id: 'showActivity',   icon: Activity, label: 'Show recent activity', desc: 'Visible to connections on your profile' },
] as const;

function PrivacyCard() {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    publicProfile: true, showLocation: true, searchable: true, showActivity: false,
  });
  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Privacy & Visibility
        </CardTitle>
        <CardDescription>Control who can see your profile and activity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {PRIVACY_ITEMS.map(({ id, icon: Icon, label, desc }) => (
          <div key={id} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <Toggle checked={flags[id] ?? false} onChange={(v) => setFlags((p) => ({ ...p, [id]: v }))} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();

  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    // Use cfb_session cookie for auth detection (cookie-based auth)
    setHasToken(typeof document !== 'undefined' && document.cookie.includes('cfb_session='));
  }, []);

  const queryClient = useQueryClient();
  const [working, setWorking] = useState<'checkout' | 'portal' | null>(null);

  const { data: subData, isLoading: loading } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: getBillingSubscription,
    staleTime: 60_000,
    enabled: hasToken,
  });
  const subscription = subData?.subscription ?? null;

  const { data: twoFaData } = useQuery({
    queryKey: ['2fa', 'status'],
    queryFn: getTwoFactorStatus,
    staleTime: 30_000,
    enabled: hasToken,
  });
  const twoFaEnabled = twoFaData?.enabled ?? false;

  const { data: linkedAccountsData } = useQuery({
    queryKey: ['linked-accounts'],
    queryFn: getLinkedAccounts,
    staleTime: 60_000,
    enabled: hasToken,
  });

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwWorking, setPwWorking] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notifPrefs');
      if (saved) setPrefs((p) => ({ ...p, ...JSON.parse(saved) }));
    } catch { /* silent */ }
  }, []);

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
    const billing = searchParams?.get('billing');
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
        <div className="space-y-6 pb-10">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Billing */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b border-border/50">
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
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b border-border/50">
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
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50">
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

          {/* Security — 2FA */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Two-factor authentication and account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TwoFactorManagement
                isEnabled={twoFaEnabled}
                onStatusChange={(enabled) =>
                  queryClient.setQueryData(['2fa', 'status'], { enabled })
                }
              />
            </CardContent>
          </Card>

          {/* Connected accounts */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Connected accounts
              </CardTitle>
              <CardDescription>
                Link Google or LinkedIn to sign in without a password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: 'google',
                  label: 'Google',
                  icon: (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ),
                  connected: !!(linkedAccountsData as { google?: boolean; linkedin?: boolean } | undefined)?.google,
                  connectUrl: '/api/auth/google',
                },
                {
                  key: 'linkedin',
                  label: 'LinkedIn',
                  icon: (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  ),
                  connected: !!(linkedAccountsData as { google?: boolean; linkedin?: boolean } | undefined)?.linkedin,
                  connectUrl: '/api/auth/linkedin',
                },
              ].map(({ key, label, icon, connected, connectUrl }) => (
                <div key={key} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {connected ? (
                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { window.location.href = connectUrl; }}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy & Visibility */}
          <PrivacyCard />

          {/* Account section */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b border-border/50">
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
                To delete your account or export your data, contact support.
              </p>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions that affect your account permanently.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border/60 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Export your data</p>
                  <p className="text-xs text-muted-foreground">Download all your profile, connections, and activity data as a ZIP archive.</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-2">
                  <Download className="h-3.5 w-3.5" />Export
                </Button>
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all associated data. This cannot be undone.</p>
                </div>
                <Button variant="destructive" size="sm" className="shrink-0 gap-2" onClick={() => success('Contact support', 'Email support@cofounderbay.com to request account deletion.')}
                >
                  <Trash2 className="h-3.5 w-3.5" />Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
