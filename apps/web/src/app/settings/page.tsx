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
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { closePageTools } from '@/components/layout/PageRailContext';
import { RailLink } from '@/components/layout/RailParts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { createBillingCheckout, createBillingPortal, getBillingSubscription, changePassword, getTwoFactorStatus, getLinkedAccounts, getNotificationPreferences, updateNotificationPreferences, getMeProfile, updateProfile, type BillingSubscription } from '@/lib/api';
import { TwoFactorManagement } from '@/components/auth/TwoFactorManagement';
import { VerificationCard } from '@/components/settings/VerificationCard';
import { openCookieChoices } from '@/lib/cookie-consent';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { OpenToCard } from '@/components/settings/OpenToCard';
import { CompatibilityCard } from '@/components/settings/CompatibilityCard';
import { getViewerSetting, setViewerSetting } from '@/lib/profile-viewers-api';
import { COMPAT_COPY, PROFILE_VIEWERS_COPY } from '@cofounderbay/shared';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { LanguageChipGrid } from '@/components/common/LanguageSwitcher';
import { THEME_OPTIONS } from '@/components/theme/ThemeSwitcher';
import { APP_LOCALES, applyLocale, getStoredLocale, LOCALE_CHANGE_EVENT } from '@/lib/locale';
import { useI18n } from '@/components/common/I18nProvider';
import { useLanguagePreference, type LanguageDisplayMode, useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { translate } from '@/lib/i18n/translate';
import { qk, queryKeys } from '@/lib/query-keys';
import { choiceControl, usePageControls } from '@/lib/page-controls';
import { applyTheme, getStoredTheme, type ThemeName } from '@/lib/themes';
import { NOTIFICATION_CATEGORIES, categoryChannelOn, channelsOf, setChannel, useNotificationPrefs, type NotificationCategoryDef } from '@/lib/notification-prefs';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import { messagePolicy, type MessagePolicy } from '@cofounderbay/shared';

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

/**
 * How many languages a screen carries.
 *
 * English and Greek pair: every label can show the reader's language and
 * the other one beside it, at the same size. Both stay in the product.
 * The screen starts with one language; this card, and the account menu,
 * turn the second one on.
 *
 * Shown only for English and Greek: every other locale already reads in one
 * language (a Greek line under Spanish would be noise), so there is nothing
 * to choose.
 */
const DISPLAY_CHOICES: { value: LanguageDisplayMode; en: string; el: string; hintEn: string; hintEl: string }[] = [
  {
    value: 'bilingual',
    en: 'Both languages',
    el: 'Και οι δύο γλώσσες',
    hintEn: 'Each label shows its translation beside it.',
    hintEl: 'Κάθε ετικέτα δείχνει και τη μετάφρασή της δίπλα.',
  },
  {
    value: 'primary-only',
    en: 'Only my language',
    el: 'Μόνο η γλώσσα μου',
    hintEn: 'Half the text on every screen. The other language stays in tooltips and for screen readers.',
    hintEl: 'Το μισό κείμενο σε κάθε οθόνη. Η άλλη γλώσσα μένει στις επεξηγήσεις και στους αναγνώστες οθόνης.',
  },
];

function LanguageCard() {
  const { success } = useToast();
  const { t } = useI18n();
  const [locale, setLocale] = useState('en');
  const { displayMode, setDisplayMode, mounted } = useLanguagePreference();
  const pairs = locale === 'en' || locale === 'el';

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
    <Card id="language" className="scroll-mt-16 shadow-sm border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary-accessible" />
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
        {mounted && pairs && (
          <fieldset className="mt-5 space-y-2 border-t border-border pt-4">
            <legend className="text-sm font-medium text-foreground">
              <BilingualText en="How many languages on screen" el="Πόσες γλώσσες στην οθόνη" />
            </legend>
            {/* Both explanations stay visible, side by side, so the card
                uses the column instead of one chip row and a single hint. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DISPLAY_CHOICES.map((choice) => {
                const active = displayMode === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setDisplayMode(choice.value);
                      success(t('Display updated'));
                    }}
                    className={cn(
                      'flex min-h-10 flex-col items-start gap-1 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-primary/50',
                    )}
                  >
                    <BilingualText en={choice.en} el={choice.el} compact />
                    <span className={cn('text-xs font-normal', active ? 'text-primary-foreground' : 'text-muted-foreground')}>
                      <BilingualText en={choice.hintEn} el={choice.hintEl} wrap />
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The seven themes already live in the account menu, inside a dropdown that
 * closes. They belong on this page too, where the rest of the account choices
 * are, and where the list can use the width of the column. Both call
 * `applyTheme`; there is still one stored theme.
 */
function AppearanceCard() {
  const { success } = useToast();
  const { t } = useI18n();
  const [theme, setTheme] = useState<ThemeName>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

  const choose = (name: ThemeName) => {
    setTheme(name);
    applyTheme(name);
    success(t('Display updated'));
  };

  usePageControls([
    choiceControl(
      'theme',
      'Theme',
      'Θέμα',
      THEME_OPTIONS.map((option) => ({ value: option.name, en: option.label, el: translate('el', option.label) })),
      theme,
      (value) => choose(value as ThemeName),
    ),
  ]);

  return (
    <Card id="appearance" className="scroll-mt-16 shadow-sm border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg">
          <BilingualText en="Appearance" el="Εμφάνιση" compact />
        </CardTitle>
        <CardDescription>
          <BilingualText
            en="The colour of every page. The same list is in the account menu."
            el="Το χρώμα κάθε σελίδας. Η ίδια λίστα είναι στο μενού λογαριασμού."
            wrap
          />
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {THEME_OPTIONS.map((option) => {
            const active = mounted && theme === option.name;
            return (
              <button
                key={option.name}
                type="button"
                aria-pressed={active}
                onClick={() => choose(option.name)}
                className={cn(
                  'flex min-h-10 items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-primary bg-primary/[0.03]'
                    : 'border-border bg-card hover:border-primary/50',
                )}
              >
                <span className="flex h-7 w-9 shrink-0 overflow-hidden rounded-md border border-border" aria-hidden="true">
                  <span style={{ background: option.swatch[0], flex: 1 }} />
                  <span style={{ background: option.swatch[1], width: 8 }} />
                  <span style={{ background: option.swatch[2], width: 8 }} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    <BilingualText en={option.label} el={translate('el', option.label)} compact />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    <BilingualText en={option.description} el={translate('el', option.description)} wrap />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Pages that hold a setting this screen only points at. Copy is the nav
 * sentence for each route. They sit in the page rail ("Other settings pages"):
 * the left navigation already lists all four, so a card of them in the column
 * only repeated it.
 */
const MORE_SETTINGS = [
  {
    href: '/settings/ai',
    icon: Sparkles,
    en: 'AI assistant',
    el: 'Βοηθός AI',
    descEn: 'The model and agent that answer you',
    descEl: 'Το μοντέλο και ο βοηθός που σας απαντούν',
  },
  {
    href: '/settings/billing',
    icon: CreditCard,
    en: 'Plan & billing',
    el: 'Πλάνο & χρεώσεις',
    descEn: 'Your plan and where invoices go',
    descEl: 'Το πακέτο σας και πού στέλνονται τα τιμολόγια',
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    en: 'Notification preferences',
    el: 'Προτιμήσεις ειδοποιήσεων',
    descEn: 'Which emails reach you, and how often',
    descEl: 'Ποια email λαμβάνετε και πόσο συχνά',
  },
  {
    href: '/settings/data-export',
    icon: Download,
    en: 'Data export',
    el: 'Εξαγωγή δεδομένων',
    descEn: 'Download your profile, messages and activity',
    descEl: 'Λήψη του προφίλ, των μηνυμάτων και της δραστηριότητάς σας',
  },
] as const;

/**
 * The cards of this page from top to bottom: what the rail's "On this page"
 * jumps to. Each id sits on its card (the page's older deep links -
 * #language, #verification, #open-to, #how-you-work - are among them), so
 * `/settings#billing` is a link too. The words are each card's own heading.
 */
const PAGE_SECTIONS = [
  { id: 'language', en: 'Language', el: 'Γλώσσα' },
  { id: 'appearance', en: 'Appearance', el: 'Εμφάνιση' },
  { id: 'billing', en: 'Billing', el: 'Χρέωση' },
  { id: 'connected-accounts', en: 'Connected accounts', el: 'Συνδεδεμένοι λογαριασμοί' },
  { id: 'account', en: 'Account', el: 'Λογαριασμός' },
  { id: 'change-password', en: 'Change password', el: 'Αλλαγή κωδικού' },
  { id: 'security', en: 'Security', el: 'Ασφάλεια' },
  { id: 'notifications', en: 'Notifications', el: 'Ειδοποιήσεις' },
  { id: 'verification', en: 'Verification', el: 'Επαλήθευση' },
  { id: 'open-to', en: 'Open to', el: 'Ανοιχτός/ή σε' },
  { id: 'how-you-work', en: COMPAT_COPY.title.en, el: COMPAT_COPY.title.el },
  { id: 'privacy', en: 'Privacy & Visibility', el: 'Απόρρητο και ορατότητα' },
  { id: 'danger-zone', en: 'Danger Zone', el: 'Επικίνδυνη ζώνη' },
] as const;

/*
 * Two of these hold everywhere they apply and are real switches now
 * (`profile.visibilityRules`, shared/visibility): "Public profile" (off: the
 * profile cannot be read without signing in, so /p/ and its link preview
 * show nothing) and "Appear in search" (off: out of other people's search,
 * the directory, recommendations, "People you may know" and the scout).
 *
 * The other two stay read-only and say why: hiding a location must hold in
 * every list that prints one (search hits, members, matches, cohorts), not
 * only on the profile page; "recent activity" is founder updates, which have
 * their own audience, and need cards, which are public on the board.
 */
const PRIVACY_READ_ONLY: Partial<Record<(typeof PRIVACY_ITEMS)[number]['id'], { value: boolean; whyEn: string; whyEl: string }>> = {
  showLocation: {
    value: true,
    whyEn: 'Hiding your location has to hold in search, matches and every list, not only on your profile page; it cannot be changed here yet.',
    whyEl: 'Η απόκρυψη της τοποθεσίας πρέπει να ισχύει στην αναζήτηση, στις αντιστοιχίσεις και σε κάθε λίστα, όχι μόνο στη σελίδα του προφίλ σας· δεν αλλάζει ακόμη εδώ.',
  },
  showActivity: {
    value: true,
    whyEn: 'Your updates follow the audience you choose on each one, and need cards are public on the board.',
    whyEl: 'Οι ενημερώσεις σας ακολουθούν το κοινό που διαλέγετε στην καθεμία, και οι κάρτες ανάγκης είναι δημόσιες στον πίνακα.',
  },
};

/** The three answers to "Who can start a conversation with you". */
const MESSAGE_POLICY_OPTIONS: { value: MessagePolicy; en: string; el: string; hintEn: string; hintEl: string }[] = [
  { value: 'anyone', en: 'Every member', el: 'Όλα τα μέλη', hintEn: 'Any signed-in member can write first.', hintEl: 'Κάθε συνδεδεμένο μέλος μπορεί να γράψει πρώτο.' },
  { value: 'connections', en: 'Connections only', el: 'Μόνο οι συνδέσεις σας', hintEn: 'Members you have a connection with.', hintEl: 'Μέλη με τα οποία έχετε σύνδεση.' },
  { value: 'nobody', en: 'No new conversations', el: 'Καμία νέα συνομιλία', hintEn: 'Only the conversations you already have stay open.', hintEl: 'Μένουν ανοιχτές μόνο όσες συνομιλίες έχετε ήδη.' },
];

/** What each live switch does when off, in both languages. */
const PRIVACY_LIVE_COPY = {
  publicProfile: {
    en: 'On: anyone with the link can read your profile. Off: only signed-in members; the public page and its link preview show nothing.',
    el: 'Ναι: όποιος έχει τον σύνδεσμο διαβάζει το προφίλ σας. Όχι: μόνο συνδεδεμένα μέλη· η δημόσια σελίδα και η προεπισκόπηση του συνδέσμου δεν δείχνουν τίποτα.',
  },
  searchable: {
    en: 'Off: you leave other people\'s search, the directory, recommendations, "People you may know" and the scout. People who already know you still reach you.',
    el: 'Όχι: φεύγετε από την αναζήτηση των άλλων, τον κατάλογο, τις προτάσεις, το «Ίσως γνωρίζετε» και τον ανιχνευτή. Όσοι σας γνωρίζουν ήδη σας βρίσκουν κανονικά.',
  },
} as const;


/**
 * "Show my name when I view profiles": off by default and reciprocal - a
 * member who views privately sees counts, never names, on their own
 * "Who viewed your profile" (Analytics). Anchored as `#profile-views`.
 */
function ProfileViewsRow() {
  const queryClient = useQueryClient();
  const { error: showError } = useToast();
  const setting = useQuery({ queryKey: qk('profile-viewers', 'settings'), queryFn: getViewerSetting, staleTime: 60_000 });
  const on = setting.data?.shareName === true;
  const save = useMutation({
    mutationFn: (shareName: boolean) => setViewerSetting(shareName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk('profile-viewers') }),
    onError: (err) => showError('Could not save the change', err instanceof Error ? err.message : undefined),
  });
  usePageControls([
    {
      id: 'set_show_name_when_viewing',
      labelEn: PROFILE_VIEWERS_COPY.setting.en,
      labelEl: PROFILE_VIEWERS_COPY.setting.el,
      writes: true,
      options: [{ value: 'on', labelEn: 'On', labelEl: 'Ναι' }, { value: 'off', labelEn: 'Off', labelEl: 'Όχι' }],
      current: on ? 'on' : 'off',
      unavailableEn: setting.data ? undefined : 'The setting has not loaded.',
      unavailableEl: setting.data ? undefined : 'Η ρύθμιση δεν φορτώθηκε.',
      run: async (v) => { await save.mutateAsync(v === 'on'); },
      undo: () => ({ control: 'set_show_name_when_viewing', value: on ? 'on' : 'off' }),
    },
  ]);
  return (
    <div id="profile-views" className="flex scroll-mt-20 items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          <BilingualText en={PROFILE_VIEWERS_COPY.setting.en} el={PROFILE_VIEWERS_COPY.setting.el} compact wrap />
        </p>
        <p className="text-xs text-muted-foreground">
          <BilingualText en={PROFILE_VIEWERS_COPY.settingHelp.en} el={PROFILE_VIEWERS_COPY.settingHelp.el} wrap />
        </p>
      </div>
      <Switch
        checked={on}
        disabled={!setting.data || save.isPending}
        aria-label={bilingualAria(PROFILE_VIEWERS_COPY.setting.en, PROFILE_VIEWERS_COPY.setting.el)}
        onCheckedChange={(next) => void save.mutateAsync(next).catch(() => undefined)}
      />
    </div>
  );
}

function PrivacyCard() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { error: showError } = useToast();
  const me = useQuery({ queryKey: queryKeys.me.profile(), queryFn: getMeProfile, staleTime: 5 * 60_000, retry: 1 });
  const rules = (me.data?.profile?.visibilityRules ?? {}) as Record<string, string>;
  const values = {
    publicProfile: rules.profile !== 'members',
    searchable: rules.search !== 'hidden',
  };
  const messages = messagePolicy(rules);
  const save = useMutation({
    mutationFn: (patch: Record<string, string>) => updateProfile({ visibilityRules: { ...rules, ...patch } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.me.profile() }),
    onError: (err) => showError('Could not save the change', err instanceof Error ? err.message : undefined),
  });
  const setPublic = (on: boolean) => save.mutateAsync({ profile: on ? 'public' : 'members' });
  const setSearchable = (on: boolean) => save.mutateAsync({ search: on ? 'visible' : 'hidden' });
  const setMessages = (policy: MessagePolicy) => save.mutateAsync({ messages: policy });

  // The same writes, offered to the assistant; each is the other's exact undo.
  usePageControls([
    {
      id: 'set_public_profile',
      labelEn: 'Public profile (readable without signing in)',
      labelEl: 'Δημόσιο προφίλ (ανάγνωση χωρίς σύνδεση)',
      writes: true,
      options: [{ value: 'on', labelEn: 'On', labelEl: 'Ναι' }, { value: 'off', labelEn: 'Off', labelEl: 'Όχι' }],
      current: values.publicProfile ? 'on' : 'off',
      unavailableEn: me.data?.profile ? undefined : 'Your profile has not loaded.',
      unavailableEl: me.data?.profile ? undefined : 'Το προφίλ σας δεν φορτώθηκε.',
      run: async (v) => { await setPublic(v === 'on'); },
      undo: () => ({ control: 'set_public_profile', value: values.publicProfile ? 'on' : 'off' }),
    },
    {
      id: 'set_appear_in_search',
      labelEn: 'Appear in search and recommendations',
      labelEl: 'Εμφάνιση στην αναζήτηση και στις προτάσεις',
      writes: true,
      options: [{ value: 'on', labelEn: 'On', labelEl: 'Ναι' }, { value: 'off', labelEn: 'Off', labelEl: 'Όχι' }],
      current: values.searchable ? 'on' : 'off',
      unavailableEn: me.data?.profile ? undefined : 'Your profile has not loaded.',
      unavailableEl: me.data?.profile ? undefined : 'Το προφίλ σας δεν φορτώθηκε.',
      run: async (v) => { await setSearchable(v === 'on'); },
      undo: () => ({ control: 'set_appear_in_search', value: values.searchable ? 'on' : 'off' }),
    },
    {
      id: 'set_message_policy',
      labelEn: 'Who can start a conversation with me',
      labelEl: 'Ποιος μπορεί να ξεκινήσει συνομιλία μαζί μου',
      writes: true,
      options: MESSAGE_POLICY_OPTIONS.map((o) => ({ value: o.value, labelEn: o.en, labelEl: o.el })),
      current: messages,
      unavailableEn: me.data?.profile ? undefined : 'Your profile has not loaded.',
      unavailableEl: me.data?.profile ? undefined : 'Το προφίλ σας δεν φορτώθηκε.',
      run: async (v) => { if (v === 'anyone' || v === 'connections' || v === 'nobody') await setMessages(v); },
      undo: () => ({ control: 'set_message_policy', value: messages }),
    },
  ]);

  return (
    <Card id="privacy" className="scroll-mt-16 shadow-sm border-border">
      <CardHeader className="border-b border-border">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="icon-md text-muted-foreground" />
          {t('Privacy & Visibility')}
        </CardTitle>
        <CardDescription>
          <BilingualText
            en="Who can find you and read your profile. Changes apply at once."
            el="Ποιος σας βρίσκει και διαβάζει το προφίλ σας. Οι αλλαγές ισχύουν αμέσως."
            compact
            wrap
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {PRIVACY_ITEMS.map(({ id, label, desc }) => {
          const readOnly = PRIVACY_READ_ONLY[id];
          const checked = readOnly ? readOnly.value : values[id as 'publicProfile' | 'searchable'];
          return (
            <div key={id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{t(label)}</p>
                  <p className="text-xs text-muted-foreground">
                    {readOnly ? (
                      <BilingualText en={readOnly.whyEn} el={readOnly.whyEl} wrap />
                    ) : PRIVACY_LIVE_COPY[id as keyof typeof PRIVACY_LIVE_COPY] ? (
                      <BilingualText en={PRIVACY_LIVE_COPY[id as keyof typeof PRIVACY_LIVE_COPY].en} el={PRIVACY_LIVE_COPY[id as keyof typeof PRIVACY_LIVE_COPY].el} wrap />
                    ) : (
                      t(desc)
                    )}
                  </p>
                </div>
              </div>
              <Switch
                checked={checked}
                disabled={Boolean(readOnly) || !me.data?.profile || save.isPending}
                aria-label={t(label)}
                title={readOnly ? bilingualAria(readOnly.whyEn, readOnly.whyEl) : undefined}
                onCheckedChange={(on) => {
                  if (id === 'publicProfile') void setPublic(on);
                  if (id === 'searchable') void setSearchable(on);
                }}
              />
            </div>
          );
        })}
        </div>
        {/* Who may write first (shared/visibility messagePolicy, held by the
            API where a new conversation is made). The AI Studio prototype
            offers the same three under "Who messages you". */}
        <div className="mt-1 space-y-2 border-t border-border py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground" id="message-policy-label">
              <BilingualText en="Who can start a conversation with you" el="Ποιος μπορεί να ξεκινήσει συνομιλία μαζί σας" compact />
            </p>
            <p className="text-xs text-muted-foreground">
              <BilingualText en="Conversations already open carry on whatever you choose." el="Όσες συνομιλίες υπάρχουν ήδη συνεχίζουν, ό,τι κι αν επιλέξετε." wrap />
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="message-policy-label">
            {MESSAGE_POLICY_OPTIONS.map((o) => {
              const on = messages === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!me.data?.profile || save.isPending}
                  onClick={() => { if (!on) void setMessages(o.value); }}
                  className={cn(
                    'min-w-0 rounded-lg border px-3 py-2 text-left transition-colors disabled:opacity-60',
                    on ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40',
                  )}
                >
                  <span className={cn('block text-sm font-medium', on ? 'text-primary-accessible' : 'text-foreground')}>
                    <BilingualText en={o.en} el={o.el} compact wrap />
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    <BilingualText en={o.hintEn} el={o.hintEl} wrap />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <ProfileViewsRow />
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground"><BilingualText en="Cookie choices" el="Επιλογές cookies" compact /></p>
            <p className="text-xs text-muted-foreground">
              <BilingualText en="Essential cookies are always on; product analytics only if you allow them." el="Τα απαραίτητα cookies είναι πάντα ενεργά· τα αναλυτικά στοιχεία μόνο αν τα επιτρέψετε." wrap />
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={openCookieChoices}>
            <BilingualText en="Change" el="Αλλαγή" compact />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const sayOne = useBilingualString();
  const searchParams = useSearchParams();
  // `/settings#verification`, `#open-to`, `#language`, `#profile-views`: the cards mount after load.
  useScrollToHash();
  const { success, error: showError } = useToast();
  const { t, locale } = useI18n();
  const { displayMode, setDisplayMode } = useLanguagePreference();

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
    // The rail's "On this page", for the assistant: "take me to privacy". It is
    // the same fragment jump a reader's link makes, so the address can be shared
    // and the page's scroll margin applies; it changes what is in view, nothing
    // stored.
    {
      id: 'go_to_section',
      labelEn: 'Go to a section of this page',
      labelEl: 'Μετάβαση σε ενότητα αυτής της σελίδας',
      writes: false,
      options: PAGE_SECTIONS.map((section) => ({ value: section.id, labelEn: section.en, labelEl: section.el })),
      run: (value) => {
        if (!value || !document.getElementById(value)) return { error: 'That section is not on the page.' };
        closePageTools();
        window.location.hash = value;
      },
    },
    choiceControl('language', 'Language', 'Γλώσσα', APP_LOCALES.map((l) => ({ value: l.value, en: l.label, el: l.label })), locale, (v) => applyLocale(v)),
    // The same two buttons as the card, so "show me only Greek" works from
    // the assistant too. Reversible in one click, so no confirmation.
    choiceControl(
      'language_display',
      'Languages on screen',
      'Γλώσσες στην οθόνη',
      [
        { value: 'bilingual', en: 'Both languages', el: 'Και οι δύο γλώσσες' },
        { value: 'primary-only', en: 'Only my language', el: 'Μόνο η γλώσσα μου' },
      ],
      displayMode,
      (v) => setDisplayMode(v as LanguageDisplayMode),
    ),
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
      run: async (v) => { await saveDigest.mutateAsync(v === 'on'); },
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

  // What is beside the settings rather than in them: where the cards are, and
  // the pages whose settings live on their own. Neither holds a setting, so
  // nothing here is a second copy of a control in the column.
  const rail: PageRailSection[] = [
    {
      id: 'on-this-page',
      glyph: 'bookmark',
      labelEn: 'On this page',
      labelEl: 'Σε αυτή τη σελίδα',
      content: (
        <nav aria-label={bilingualAria('On this page', 'Σε αυτή τη σελίδα')} className="space-y-0.5">
          {PAGE_SECTIONS.map((section) => (
            <RailLink key={section.id} href={`#${section.id}`} en={section.en} el={section.el} />
          ))}
        </nav>
      ),
    },
    {
      id: 'other-settings',
      glyph: 'sliders',
      labelEn: 'Other settings pages',
      labelEl: 'Άλλες σελίδες ρυθμίσεων',
      content: (
        <div className="space-y-0.5">
          {MORE_SETTINGS.map((item) => (
            <RailLink key={item.href} href={item.href} icon={item.icon} en={item.en} el={item.el} descEn={item.descEn} descEl={item.descEl} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <AppShell
      title="Settings"
      description="Language, appearance, billing, notifications, security and privacy."
      descriptionEl="Γλώσσα, εμφάνιση, χρεώσεις, ειδοποιήσεις, ασφάλεια και ιδιωτικότητα."
      showHelp
      // Signed out there are no cards to jump to, and the links need an account.
      rail={hasToken ? rail : undefined}
    >
      {!hasToken && (
        <Card>
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
          {/* Where the rail is a sheet (below lg), the cards' index stands at
              the top in sight, as the AI Studio prototype's section tabs do on
              a phone; the page is one long column there. Same ids as the
              rail's "On this page", so each chip is a jump, not a second
              control. */}
          <nav
            aria-label={bilingualAria('On this page', 'Σε αυτή τη σελίδα')}
            data-testid="settings-section-index"
            className="-mx-1 overflow-x-auto px-1 scrollbar-hide lg:hidden"
          >
            <ul className="flex w-max gap-1.5 pb-0.5">
              {PAGE_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="tap-target-y inline-flex shrink-0 items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-ring"
                  >
                    <BilingualText en={section.en} el={section.el} compact />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageCard />
          <AppearanceCard />
          {/* Short account cards in two explicit columns. A flowing grid would
              stretch every row to its taller half. The long sections
              (notifications, verification, open to, privacy, danger zone)
              sit full width under them so they use the column the sidebar
              leaves, instead of a max-w-sm form beside an empty card. */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <div className="min-w-0 space-y-6">
              {/* Billing */}
              <Card id="billing" className="scroll-mt-16 shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="icon-md text-muted-foreground" />
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
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {isPremium ? t('Premium is active.') : t('Upgrade to Premium to unlock advanced features.')}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        <BilingualText en="Mentor booking payments, file attachments, and advanced discovery filters." el="Πληρωμές κρατήσεων μεντόρων, συνημμένα αρχεία και προχωρημένα φίλτρα ανακάλυψης." wrap />
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      className="gap-2"
                      disabled={working !== null || isPremium}
                      onClick={startCheckout}
                    >
                      {working === 'checkout' ? <Loader2 className="icon-sm animate-spin" /> : <Crown className="icon-sm" />}
                      {isPremium ? <BilingualText en="Premium active" el="Το Premium είναι ενεργό" compact /> : <BilingualText en="Upgrade" el="Αναβάθμιση" compact />}
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
                    <Button variant="outline" asChild>
                      <Link href="/settings/billing">
                        <BilingualText en="Plan and invoices" el="Πλάνο και τιμολόγια" compact />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>


              {/* Connected accounts */}
              <Card id="connected-accounts" className="scroll-mt-16 shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link2 className="icon-md text-muted-foreground" />
                    <BilingualText en="Connected accounts" el="Συνδεδεμένοι λογαριασμοί" compact />
                  </CardTitle>
                  <CardDescription>
                    <BilingualText en="Link Google or LinkedIn to sign in without a password." el="Συνδέστε Google ή LinkedIn για σύνδεση χωρίς κωδικό." wrap />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
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
                    <div key={key} className="flex items-center justify-between gap-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center" data-keep-icon="">
                          {icon}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {connected
                              ? <BilingualText en="Connected" el="Συνδεδεμένος" compact />
                              : <BilingualText en="Not connected" el="Μη συνδεδεμένος" compact />}
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
                  </div>
                </CardContent>
              </Card>


              {/* Account section */}
              <Card id="account" className="scroll-mt-16 shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="icon-md text-muted-foreground" />
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
              {/* Password Change */}
              <Card id="change-password" className="scroll-mt-16 shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <KeyRound className="icon-md text-muted-foreground" />
                    <BilingualText en="Change password" el="Αλλαγή κωδικού" compact />
                  </CardTitle>
                  <CardDescription><BilingualText en="At least 8 characters. Saving signs you out of every other session." el="Τουλάχιστον 8 χαρακτήρες. Η αποθήκευση σας αποσυνδέει από κάθε άλλη συνεδρία." wrap /></CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="relative sm:col-span-2">
                      <label htmlFor="settings-current-password" className="sr-only"><BilingualText en="Current password" el="Τρέχων κωδικός" compact /></label>
                      <Input
                        id="settings-current-password"
                        type={showPw ? 'text' : 'password'}
                        placeholder={sayOne("Current password", "Τρέχων κωδικός")}
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
                        aria-label={showPw ? bilingualAria('Hide password', 'Απόκρυψη κωδικού') : bilingualAria('Show password', 'Εμφάνιση κωδικού')}
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
                      placeholder={sayOne("New password (min 8 chars)", "Νέος κωδικός (τουλάχιστον 8 χαρακτήρες)")}
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
                      placeholder={sayOne("Confirm new password", "Επιβεβαίωση νέου κωδικού")}
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                      required
                      autoComplete="new-password"
                    />
                    <div className="sm:col-span-2">
                    <Button type="submit" disabled={pwWorking} className="gap-2">
                      {pwWorking ? <Loader2 className="icon-sm animate-spin" /> : <KeyRound className="icon-sm" />}
                      <BilingualText en="Update password" el="Ενημέρωση κωδικού" compact />
                    </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>


              {/* Security — 2FA */}
              <Card id="security" className="scroll-mt-16 shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="icon-md text-muted-foreground" />
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


            </div>
          </div>
              {/* Notifications: the quick view of /settings/notifications. */}
              <Card id="notifications" className="scroll-mt-16 shadow-sm border-border">
                <CardHeader className="border-b border-border">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="icon-md text-muted-foreground" />
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
                <CardContent>
                  <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                  {quickCategories.map((category) => {
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between gap-4 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
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
                          label={bilingualAria(`${category.titleEn} in-app notifications`, `${category.titleEl}: ειδοποιήσεις στην εφαρμογή`)}
                          checked={categoryChannelOn(notificationPrefs, category, 'inApp')}
                          onChange={(v) => setInApp(category, v)}
                        />
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between gap-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
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
                      label={bilingualAria('Weekly email digest', 'Εβδομαδιαία email σύνοψη')}
                      checked={digestOn}
                      onChange={(v) => saveDigest.mutate(v)}
                    />
                  </div>
                  </div>
                </CardContent>
              </Card>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <VerificationCard />
            <OpenToCard />
          </div>
          {/* Ten questions and their reasons: the card's own fieldsets sit in two
              columns, so it takes the full width instead of half of it with the
              other half blank. */}
          <CompatibilityCard />
          <PrivacyCard />
          {/* Danger Zone */}
          <Card id="danger-zone" className="scroll-mt-16 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive-accessible">
                <AlertTriangle className="icon-md" />
                <BilingualText en="Danger Zone" el="Επικίνδυνη ζώνη" compact />
              </CardTitle>
              <CardDescription><BilingualText en="Irreversible actions that affect your account permanently." el="Μη αναστρέψιμες ενέργειες που επηρεάζουν μόνιμα τον λογαριασμό σας." wrap /></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground"><BilingualText en="Export your data" el="Εξαγωγή των δεδομένων σας" compact /></p>
                  <p className="text-xs text-muted-foreground"><BilingualText en="A JSON file of the categories you choose on the export page. Nothing is stored after the download." el="Αρχείο JSON με τις κατηγορίες που διαλέγετε στη σελίδα εξαγωγής. Τίποτα δεν φυλάσσεται μετά τη λήψη." wrap /></p>
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
                  <p className="text-xs text-muted-foreground"><BilingualText en="Permanently remove your account and its data. Send the request from the email you signed up with; it is answered within 30 days and cannot be undone." el="Οριστική διαγραφή του λογαριασμού σας και των δεδομένων του. Στείλτε το αίτημα από το email της εγγραφής σας· απαντάται μέσα σε 30 ημέρες και δεν αναιρείται." wrap /></p>
                </div>
                {/* There is no self-serve deletion endpoint yet, so this was a
                    destructive-looking button that only showed a toast. It now
                    opens the request it always meant: an email to privacy,
                    which section 7 of the privacy policy answers within 30 days. */}
                <Button variant="destructive" size="sm" className="shrink-0 gap-2" asChild>
                  <a href="mailto:privacy@cofounderbay.com?subject=Account%20deletion%20request">
                    <Trash2 className="icon-sm" /><BilingualText en="Request deletion" el="Αίτημα διαγραφής" compact />
                  </a>
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
