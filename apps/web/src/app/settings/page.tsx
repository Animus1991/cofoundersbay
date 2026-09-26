'use client';

import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { BilingualText } from '@/components/common/BilingualText';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { createBillingCheckout, createBillingPortal, getBillingSubscription, changePassword, getTwoFactorStatus, getLinkedAccounts, getNotificationPreferences, updateNotificationPreferences, type BillingSubscription } from '@/lib/api';
import { TwoFactorManagement } from '@/components/auth/TwoFactorManagement';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { LanguageChipGrid } from '@/components/common/LanguageSwitcher';
import { APP_LOCALES, applyLocale, getStoredLocale, LOCALE_CHANGE_EVENT } from '@/lib/locale';
import { useI18n } from '@/components/common/I18nProvider';
import { qk } from '@/lib/query-keys';
import { choiceControl, usePageControls } from '@/lib/page-controls';
import { NOTIFICATION_CATEGORIES, categoryChannelOn, channelsOf, setChannel, useNotificationPrefs, type NotificationCategoryDef } from '@/lib/notification-prefs';
import { bilingualInline } from '@/lib/i18n/format';

/*
 * The quick notification switches here are the in-app channel of each
 * category on /settings/notifications - one store (`notification-prefs`),
 * two views. They used to be six switches of their own under `notifPrefs`,
 * which nothing read, beside a detail page that disagreed with them.
 */
const QUICK_ICONS: Record<NotificationCategoryDef['id'], React.ElementType> = {
  messages: MessageCircle,
  connections: UserPlus,
  matches: Activity,
  projects: Briefcase,
  events: Calendar,
  security: Shield,
};

/**
 * The product's switch, with this page's prop names. This was a hand-rolled
 * copy sized `h-11 w-[2.75rem]` — 44px against 2.75rem, which is the same 44px
 * at a 16px root and 36px at this app's desktop root. Either way the track was
 * square, so `rounded-full` drew a circle and six notification settings looked
 * like radio buttons. `@/components/ui/switch` is the same control the other
 * ten pages use.
 */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  /**
   * What this switch controls. The visible text sits in a sibling `<p>`, which
   * associates nothing: axe reported `button-name (critical) x11` here, and a
   * screen reader announced ten of these as "switch, on" with no subject. The
   * label is next to every call site already — it just never reached the
   * control.
   */
  label: string;
}) {
  return <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />;
}

const PRIVACY_ITEMS = [
  { id: 'publicProfile',  icon: Eye,      label: 'Public profile',      desc: 'Anyone can view your profile page' },
  { id: 'showLocation',   icon: Globe,    label: 'Show location',        desc: 'Display city/region on your profile' },
  { id: 'searchable',     icon: Lock,     label: 'Appear in search',     desc: 'Show up in member search and recommendations' },
  { id: 'showActivity',   icon: Activity, label: 'Show recent activity', desc: 'Visible to connections on your profile' },
] as const;

function LanguageCard() {
  const { success } = useToast();
  const { t } = useI18n();
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    setLocale(getStoredLocale());
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      if (APP_LOCALES.some((l) => l.value === next)) setLocale(next);
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  }, []);

  return (
    <Card id="language" className="scroll-mt-16 shadow-sm border-border/50">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {t('Language')}
        </CardTitle>
        <CardDescription>
          {t('Tap a language. Menus, buttons, page titles, and sample data update immediately. AI replies use the same language.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <LanguageChipGrid
          value={locale}
          onChange={(next) => {
            setLocale(next);
            applyLocale(next);
            success(
              t('Language saved'),
              next === 'el' ? t('AI replies will use Greek.') : t('AI replies will use {code}.', { code: next.toUpperCase() }),
            );
          }}
        />
      </CardContent>
    </Card>
  );
}

/*
 * These four were switches that changed component state and nothing else -
 * no endpoint writes profile visibility (the schema's `profileVisibility`,
 * `showInSearch` and `showInMatching` have no API), so a reader who turned
 * "Appear in search" off stayed in search. They now show what the platform
 * does today, and say why they cannot be changed yet.
 */
const PRIVACY_CURRENT: Record<(typeof PRIVACY_ITEMS)[number]['id'], boolean> = {
  publicProfile: true, showLocation: true, searchable: true, showActivity: false,
};

function PrivacyCard() {
  const { t } = useI18n();
  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="icon-md text-primary-accessible" />
          {t('Privacy & Visibility')}
        </CardTitle>
        <CardDescription>
          <BilingualText
            en="What others can see today. These cannot be changed yet: visibility is not stored per member."
            el="Τι βλέπουν οι άλλοι σήμερα. Δεν αλλάζουν ακόμη: η ορατότητα δεν αποθηκεύεται ανά μέλος."
            compact
            wrap
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {PRIVACY_ITEMS.map(({ id, icon: Icon, label, desc }) => (
          <div key={id} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="icon-sm text-primary-accessible" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t(label)}</p>
                <p className="text-xs text-muted-foreground">{t(desc)}</p>
              </div>
            </div>
            <Switch
              checked={PRIVACY_CURRENT[id]}
              disabled
              aria-label={t(label)}
              title="Visibility is not stored per member yet"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  const { t, locale } = useI18n();

  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    // Use cfb_session cookie for auth detection (cookie-based auth)
    setHasToken(typeof document !== 'undefined' && document.cookie.includes('cfb_session='));
  }, []);

  const queryClient = useQueryClient();
  const [working, setWorking] = useState<'checkout' | 'portal' | null>(null);

  const { data: subData, isLoading: loading } = useQuery({
    queryKey: qk('billing', 'subscription'),
    queryFn: getBillingSubscription,
    staleTime: 60_000,
    enabled: hasToken,
  });
  const subscription = subData?.subscription ?? null;

  const { data: twoFaData } = useQuery({
    queryKey: qk('auth', '2fa', 'status'),
    queryFn: getTwoFactorStatus,
    staleTime: 30_000,
    enabled: hasToken,
  });
  const twoFaEnabled = twoFaData?.enabled ?? false;

  const { data: linkedAccountsData } = useQuery({
    queryKey: qk('auth', 'linked-accounts'),
    queryFn: getLinkedAccounts,
    staleTime: 60_000,
    enabled: hasToken,
  });

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwWorking, setPwWorking] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const notificationPrefs = useNotificationPrefs();
  const quickCategories = NOTIFICATION_CATEGORIES.filter((c) => c.id !== 'security');
  const setInApp = (category: NotificationCategoryDef, value: boolean) =>
    setChannel(category.settings.map((st) => st.id), 'inApp', value);

  // The email digest is the one notification choice the server keeps.
  const { data: digestPrefs } = useQuery({
    queryKey: qk('notifications', 'preferences'),
    queryFn: getNotificationPreferences,
    enabled: hasToken,
  });
  const [preferredDigestCadence, setPreferredDigestCadence] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  useEffect(() => {
    const cadence = digestPrefs?.digestFrequency;
    if (cadence && cadence !== 'never') setPreferredDigestCadence(cadence);
  }, [digestPrefs?.digestFrequency]);
  const digestOn = (digestPrefs?.digestFrequency ?? 'never') !== 'never';
  const saveDigest = useMutation({
    mutationFn: (on: boolean) => updateNotificationPreferences({ digestFrequency: on ? preferredDigestCadence : 'never' }),
    onSuccess: (_d, on) => {
      void queryClient.invalidateQueries({ queryKey: qk('notifications', 'preferences') });
      success('Saved', on ? `${preferredDigestCadence[0].toUpperCase()}${preferredDigestCadence.slice(1)} email digest on.` : 'Email digest off.');
    },
    onError: () => showError('Could not save', 'Please try again.'),
  });

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
    clearPreviewDemoSession();
    window.location.href = '/login';
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

  const startCheckout = async () => {
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
  };
  const openPortal = async () => {
    try {
      setWorking('portal');
      const res = await createBillingPortal();
      window.location.href = res.url;
    } catch (e) {
      showError('Portal failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setWorking(null);
    }
  };

  // Offered to the assistant: the language, the quick notification switches
  // and the digest, and the billing buttons - the same handlers. Checkout and
  // the portal leave the page for the payment provider; nothing is charged
  // until the reader confirms there.
  const categoryOptions = (inApp: boolean) =>
    quickCategories
      .filter((c) => categoryChannelOn(notificationPrefs, c, 'inApp') === inApp)
      .map((c) => ({ value: c.id, labelEn: c.titleEn, labelEl: c.titleEl }));
  usePageControls([
    choiceControl('language', 'Language', 'Γλώσσα', APP_LOCALES.map((l) => ({ value: l.value, en: l.label, el: l.label })), locale, (v) => applyLocale(v)),
    {
      id: 'in_app_on',
      labelEn: 'Turn in-app notifications on for',
      labelEl: 'Ενεργοποίηση ειδοποιήσεων εφαρμογής για',
      writes: true,
      options: categoryOptions(false),
      // Turning a category on sets every type in it. Only a category that was
      // entirely off comes back exactly by turning it off again; one with a
      // mix of choices would lose them, so it has no opposite.
      undo: (v) => {
        const c = quickCategories.find((x) => x.id === v);
        return c && c.settings.every((st) => !channelsOf(notificationPrefs, st).inApp) ? { control: 'in_app_off', value: v } : undefined;
      },
      run: (v) => { const c = quickCategories.find((x) => x.id === v); if (c) setInApp(c, true); },
    },
    {
      id: 'in_app_off',
      labelEn: 'Turn in-app notifications off for',
      labelEl: 'Απενεργοποίηση ειδοποιήσεων εφαρμογής για',
      writes: true,
      options: categoryOptions(true),
      // Offered only for categories entirely on, so turning it on restores it.
      undo: (v) => ({ control: 'in_app_on', value: v }),
      run: (v) => { const c = quickCategories.find((x) => x.id === v); if (c) setInApp(c, false); },
    },
    {
      id: 'email_digest',
      labelEn: 'Email activity digest',
      labelEl: 'Σύνοψη δραστηριότητας μέσω email',
      writes: true,
      options: [
        { value: 'on', labelEn: 'On', labelEl: 'Ενεργή' },
        { value: 'off', labelEn: 'Off', labelEl: 'Ανενεργή' },
      ],
      current: digestOn ? 'on' : 'off',
      // The switch writes `weekly` or `never`. Going back is exact from those
      // two; from daily or monthly it would land on weekly, so no opposite.
      undo: () => {
        const prior = digestPrefs?.digestFrequency ?? 'never';
        return prior === 'weekly' ? { control: 'email_digest', value: 'on' } : prior === 'never' ? { control: 'email_digest', value: 'off' } : undefined;
      },
      run: (v) => saveDigest.mutate(v === 'on'),
    },
    {
      id: 'upgrade',
      labelEn: 'Upgrade to Premium',
      labelEl: 'Αναβάθμιση σε Premium',
      writes: false,
      unavailableEn: isPremium ? 'Premium is already active.' : undefined,
      unavailableEl: isPremium ? 'Το Premium είναι ήδη ενεργό.' : undefined,
      run: () => void startCheckout(),
    },
    {
      id: 'manage_subscription',
      labelEn: 'Manage subscription',
      labelEl: 'Διαχείριση συνδρομής',
      writes: false,
      unavailableEn: isPremium ? undefined : 'There is no subscription to manage.',
      unavailableEl: isPremium ? undefined : 'Δεν υπάρχει συνδρομή για διαχείριση.',
      run: () => void openPortal(),
    },
  ]);

  return (
    <AppShell
      title="Settings"
      description="Manage billing, notifications, and integrations."
      descriptionEl="Διαχειριστείτε χρεώσεις, ειδοποιήσεις και ενσωματώσεις."
      showHelp
    >
      {!hasToken && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg"><BilingualText en="Sign in required" el="Απαιτείται σύνδεση" compact /></CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p><BilingualText en="To manage billing and preferences, please sign in." el="Συνδεθείτε για να διαχειριστείτε χρεώσεις και προτιμήσεις." wrap /></p>
            <Button asChild>
              <Link href="/login"><BilingualText en="Go to login" el="Μετάβαση στη σύνδεση" compact /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasToken && (
        <div className="space-y-6 pb-10">
          <LanguageCard />
          {/* Settings, in two columns.

              In one column at 1191px this ran 2224px: billing carried 223px of
              content and stretched to 518px beside the notification list, the
              password form is `max-w-sm` and left 800px of card empty beside
              it, and a reader scrolled past eight sections to reach the last.
              Two columns put the tall list opposite the short cards, which
              closes the 295px void under billing without inventing anything to
              put in it, and takes the page to roughly 1560px.

              Explicit column elements rather than letting the grid flow: a
              grid fills row by row, so the second card would land beside the
              first and every row would take the height of its taller half —
              the same defect, six times over. Danger Zone stays full width
              below, where a destructive section belongs. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0 space-y-6">
              {/* Billing */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="icon-md text-primary-accessible" />
                    {t('Billing')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isPremium ? 'default' : 'secondary'} className="gap-1.5">
                      {isPremium && <Crown className="icon-sm" />}
                      {statusLabel}
                    </Badge>
                    {subscription?.currentPeriodEnd && (
                      <span className="text-xs text-muted-foreground">
                        Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="icon-sm animate-spin" />
                      {t('Loading billing…')}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm">
                      <p className="font-medium text-foreground">
                        {isPremium ? t('Premium is active.') : t('Upgrade to Premium to unlock advanced features.')}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        <BilingualText en="Mentor booking payments, file attachments, and advanced discovery filters." el="Πληρωμές κρατήσεων μεντόρων, συνημμένα αρχεία και προχωρημένα φίλτρα ανακάλυψης." wrap />
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="gap-2"
                      disabled={working !== null || isPremium}
                      onClick={startCheckout}
                    >
                      {working === 'checkout' ? <Loader2 className="icon-sm animate-spin" /> : <Crown className="icon-sm" />}
                      {isPremium ? 'Premium active' : 'Upgrade'}
                    </Button>
                    {isPremium && (
                      <Button
                        variant="secondary"
                        className="gap-2"
                        disabled={working !== null}
                        onClick={openPortal}
                      >
                        {working === 'portal' ? <Loader2 className="icon-sm animate-spin" /> : <ExternalLink className="icon-sm" />}
                        Manage subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>


              {/* Password Change */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <KeyRound className="icon-md text-primary-accessible" />
                    <BilingualText en="Change password" el="Αλλαγή κωδικού" compact />
                  </CardTitle>
                  <CardDescription><BilingualText en="Leave blank to keep your current password." el="Αφήστε κενό για να κρατήσετε τον τρέχοντα κωδικό." wrap /></CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                    <div className="relative">
                      <label htmlFor="settings-current-password" className="sr-only"><BilingualText en="Current password" el="Τρέχων κωδικός" compact /></label>
                      <Input
                        id="settings-current-password"
                        type={showPw ? 'text' : 'password'}
                        placeholder={bilingualInline("Current password", "Τρέχων κωδικός")}
                        value={pwForm.current}
                        onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      {/* WCAG 2.5.8 wants 24x24 CSS px. The icon stays 16px; the negative margin cancels the extra 8px so nothing moves, only the hit area grows. */}
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        // The icon flips between Eye and EyeOff, and so does the
                        // name: a static "Show password" would announce the
                        // wrong thing half the time. `aria-pressed` carries the
                        // state so the control reads as a toggle, not a command.
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        aria-pressed={showPw}
                        className="absolute right-2 top-1/2 inline-flex tap-target -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPw ? <EyeOff className="icon-sm" aria-hidden="true" /> : <Eye className="icon-sm" aria-hidden="true" />}
                      </button>
                    </div>
                    <label htmlFor="settings-new-password" className="sr-only"><BilingualText en="New password" el="Νέος κωδικός" compact /></label>
                    <Input
                      id="settings-new-password"
                      type={showPw ? 'text' : 'password'}
                      placeholder={bilingualInline("New password (min 8 chars)", "Νέος κωδικός (τουλάχιστον 8 χαρακτήρες)")}
                      value={pwForm.next}
                      onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <label htmlFor="settings-confirm-password" className="sr-only"><BilingualText en="Confirm new password" el="Επιβεβαίωση νέου κωδικού" compact /></label>
                    <Input
                      id="settings-confirm-password"
                      type={showPw ? 'text' : 'password'}
                      placeholder={bilingualInline("Confirm new password", "Επιβεβαίωση νέου κωδικού")}
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                      required
                      autoComplete="new-password"
                    />
                    <Button type="submit" disabled={pwWorking} className="gap-2">
                      {pwWorking ? <Loader2 className="icon-sm animate-spin" /> : <KeyRound className="icon-sm" />}
                      Update password
                    </Button>
                  </form>
                </CardContent>
              </Card>


              {/* Connected accounts */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="icon-md text-primary-accessible" />
                    <BilingualText en="Connected accounts" el="Συνδεδεμένοι λογαριασμοί" compact />
                  </CardTitle>
                  <CardDescription>
                    <BilingualText en="Link Google or LinkedIn to sign in without a password." el="Συνδέστε Google ή LinkedIn για σύνδεση χωρίς κωδικό." wrap />
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
                        <Badge variant="secondary" className="text-xs"><BilingualText en="Connected" el="Συνδεδεμένος" compact /></Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { window.location.href = connectUrl; }}
                        >
                          <BilingualText en="Connect" el="Σύνδεση" compact />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>


              {/* Account section */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="icon-md text-primary-accessible" />
                    <BilingualText en="Account" el="Λογαριασμός" compact />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="secondary" className="gap-2" asChild>
                      <Link href="/profile/edit">
                        <User className="icon-sm" />
                        <BilingualText en="Edit profile" el="Επεξεργασία προφίλ" compact />
                      </Link>
                    </Button>
                    <Button variant="outline" className="gap-2" asChild>
                      <Link href="/profile">
                        <Shield className="icon-sm" />
                        <BilingualText en="View public profile" el="Προβολή δημόσιου προφίλ" compact />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="gap-2 text-destructive-accessible hover:text-destructive-accessible hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="icon-sm" />
                      <BilingualText en="Sign out" el="Αποσύνδεση" compact />
                    </Button>
                  </div>
                  {/* Export is self-service (/settings/data-export); only
                      deletion goes through support. The old line sent both
                      to support while the Danger Zone below offered Export. */}
                  <p className="text-xs text-muted-foreground">
                    <BilingualText
                      en="Data export and account deletion are under Danger Zone, below."
                      el="Η εξαγωγή δεδομένων και η διαγραφή λογαριασμού βρίσκονται παρακάτω, στη Ζώνη κινδύνου."
                      wrap
                    />
                  </p>
                </CardContent>
              </Card>

            </div>

            <div className="min-w-0 space-y-6">
              {/* Notifications: the quick view of /settings/notifications. */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="border-b border-border/50">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="icon-md text-primary-accessible" />
                        <BilingualText en="Notifications" el="Ειδοποιήσεις" compact />
                      </CardTitle>
                      <CardDescription>
                        <BilingualText
                          en="In-app notifications by category, kept on this device. The digest is saved to your account."
                          el="Ειδοποιήσεις στην εφαρμογή ανά κατηγορία, σε αυτή τη συσκευή. Η σύνοψη αποθηκεύεται στον λογαριασμό σας."
                          compact
                          wrap
                        />
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/settings/notifications">
                        <BilingualText en="All channels" el="Όλα τα κανάλια" compact />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {quickCategories.map((category) => {
                    const Icon = QUICK_ICONS[category.id];
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="icon-sm text-primary-accessible" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              <BilingualText en={category.titleEn} el={category.titleEl} compact />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <BilingualText en={category.descriptionEn} el={category.descriptionEl} compact wrap />
                            </p>
                          </div>
                        </div>
                        <Toggle
                          label={`${category.titleEn} in-app notifications`}
                          checked={categoryChannelOn(notificationPrefs, category, 'inApp')}
                          onChange={(v) => setInApp(category, v)}
                        />
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-secondary/40 transition-colors">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Mail className="icon-sm text-primary-accessible" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          <BilingualText en="Weekly email digest" el="Εβδομαδιαία email σύνοψη" compact />
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <BilingualText en="A summary of activity by email" el="Σύνοψη δραστηριότητας μέσω email" compact wrap />
                        </p>
                      </div>
                    </div>
                    <Toggle
                      label="Weekly email digest"
                      checked={digestOn}
                      onChange={(v) => saveDigest.mutate(v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security — 2FA */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="icon-md text-primary-accessible" />
                    <BilingualText en="Security" el="Ασφάλεια" compact />
                  </CardTitle>
                  <CardDescription><BilingualText en="Two-factor authentication and account security." el="Έλεγχος ταυτότητας δύο παραγόντων και ασφάλεια λογαριασμού." wrap /></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TwoFactorManagement
                    isEnabled={twoFaEnabled}
                    onStatusChange={(enabled) =>
                      queryClient.setQueryData(qk('auth', '2fa', 'status'), { enabled })
                    }
                  />
                </CardContent>
              </Card>


              {/* Privacy & Visibility */}
              <PrivacyCard />
            </div>
          </div>
          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive-accessible">
                <AlertTriangle className="icon-md" />
                <BilingualText en="Danger Zone" el="Επικίνδυνη ζώνη" compact />
              </CardTitle>
              <CardDescription><BilingualText en="Irreversible actions that affect your account permanently." el="Μη αναστρέψιμες ενέργειες που επηρεάζουν μόνιμα τον λογαριασμό σας." wrap /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border/60 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground"><BilingualText en="Export your data" el="Εξαγωγή των δεδομένων σας" compact /></p>
                  <p className="text-xs text-muted-foreground"><BilingualText en="Download all your profile, connections, and activity data as a ZIP archive." el="Κατεβάστε όλα τα δεδομένα προφίλ, συνδέσεων και δραστηριότητας σε αρχείο ZIP." wrap /></p>
                </div>
                {/* /settings/data-export has existed all along; this button
                    simply never pointed at it. */}
                <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
                  <Link href="/settings/data-export">
                    <Download className="icon-sm" />
                    <BilingualText en="Export" el="Εξαγωγή" compact />
                  </Link>
                </Button>
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-destructive-accessible"><BilingualText en="Delete account" el="Διαγραφή λογαριασμού" compact /></p>
                  <p className="text-xs text-muted-foreground"><BilingualText en="Permanently remove your account and all associated data. This cannot be undone." el="Οριστική διαγραφή του λογαριασμού σας και όλων των δεδομένων του. Δεν αναιρείται." wrap /></p>
                </div>
                <Button variant="destructive" size="sm" className="shrink-0 gap-2" onClick={() => success('Contact support', 'Email support@cofounderbay.com to request account deletion.')}
                >
                  <Trash2 className="icon-sm" /><BilingualText en="Delete" el="Διαγραφή" compact />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
