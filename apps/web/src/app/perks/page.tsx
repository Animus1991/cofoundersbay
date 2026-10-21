'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PERK_CATEGORIES,
  PERK_CATEGORY_COPY,
  PERK_COPY,
  PERK_STAGES,
  perkFit,
  type PerkCategory,
  type PerkStage,
  type PerkView,
} from '@cofounderbay/shared';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { usePageRail } from '@/components/layout/PageRailContext';
import { RailOptions, RailStats } from '@/components/layout/RailParts';
import { BilingualText } from '@/components/common/BilingualText';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import { RelativeTime, useHydrated } from '@/components/common/RelativeTime';
import { StatusText } from '@/components/common/StatusText';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { useStoredUser } from '@/hooks/useStoredUser';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { adminListPerks, claimPerk, listClaimedPerks, listPerks, setPerkActive } from '@/lib/perks-api';
import { ROW_GONE, choiceControl, rowOptions, settle, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import { qk } from '@/lib/query-keys';
import { initialsOf } from '@/lib/utils';
import { AddPerkDialog } from '@/components/perks/AddPerkDialog';
import { ASK } from '@/lib/page-questions';
import { calendarDaysUntil } from '@/lib/calendar-days';

type Tab = 'offers' | 'claimed' | 'manage';
type CategoryFilter = 'all' | PerkCategory;
type StageFilter = 'any' | PerkStage;

/** An offer ending within this many days says so on its card. */
const ENDING_SOON_DAYS = 14;

const STAGE_COPY: Record<PerkStage, { en: string; el: string }> = {
  idea: { en: 'Idea', el: 'Ιδέα' },
  validating: { en: 'Validating', el: 'Επικύρωση' },
  building: { en: 'Building', el: 'Κατασκευή' },
  launched: { en: 'Launched', el: 'Κυκλοφορία' },
  scaling: { en: 'Scaling', el: 'Κλιμάκωση' },
};

function daysLeft(perk: PerkView, now: number | null): number | null {
  if (!perk.expiresAt || now === null) return null;
  return Math.max(0, calendarDaysUntil(perk.expiresAt, now) ?? 0);
}

function PerkCard({
  perk,
  now,
  stage,
  busy,
  onClaim,
  admin,
  onToggle,
}: {
  perk: PerkView;
  now: number | null;
  stage: PerkStage | null;
  busy: boolean;
  onClaim?: () => void;
  /** The manage tab: codes visible, a switch instead of a claim. */
  admin?: boolean;
  onToggle?: () => void;
}) {
  const { success, error: showError } = useToast();
  const left = daysLeft(perk, now);
  const fit = perkFit(perk, stage);
  const facts = [
    <BilingualText key="cat" en={PERK_CATEGORY_COPY[perk.category].en} el={PERK_CATEGORY_COPY[perk.category].el} compact />,
    perk.stages.length ? (
      <span key="stages">
        {perk.stages.map((s, i) => (
          <span key={s}>
            {i ? ', ' : ''}
            <StatusText value={s} />
          </span>
        ))}
      </span>
    ) : (
      <BilingualText key="stages" en="Every stage" el="Κάθε στάδιο" compact />
    ),
  ];
  const copy = async () => {
    if (!perk.code) return;
    try {
      await navigator.clipboard.writeText(perk.code);
      success('Code copied');
    } catch {
      showError('Could not copy the code', 'Select it and copy it by hand.');
    }
  };
  const revealed = perk.claimed || admin;
  return (
    <Card id={`perk-${perk.id}`} className="h-full scroll-mt-20">
      {/* A column, so the foot (who claimed it, Claim) sits at the bottom of
          every card in a row of the offers grid. gap, not space-y: space-y's
          margin outranks the foot's mt-auto and left the buttons unaligned. */}
      <CardContent className="flex h-full flex-col gap-3">
        <CardHead
          mark={(
            <Avatar className="h-10 w-10 rounded-xl" data-keep-icon="">
              <AvatarImage src={(perk as PerkView & { partnerLogo?: string | null }).partnerLogo ?? undefined} alt="" className="rounded-xl" />
              <AvatarFallback className="rounded-xl bg-primary/10 font-semibold text-primary-accessible">{initialsOf(perk.partner)}</AvatarFallback>
            </Avatar>
          )}
          title={<BilingualText en={perk.title} el={perk.titleEl ?? perk.title} compact wrap />}
          subtitle={perk.partner}
          aside={(
            <>
              {perk.claimed && !admin ? (
                <Badge variant="outline" className="border-status-success-border bg-status-success-bg text-status-success">
                  <BilingualText en="Claimed" el="Διεκδικήθηκε" compact />
                </Badge>
              ) : null}
              {admin && !perk.active ? (
                <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
                  <BilingualText en="Switched off" el="Απενεργοποιημένη" compact />
                </Badge>
              ) : null}
              {left !== null && left <= ENDING_SOON_DAYS && perk.active ? (
                <Badge variant="outline" className="border-status-warning-border bg-status-warning-bg text-status-warning">
                  {left === 0
                    ? <BilingualText en="Ends today" el="Λήγει σήμερα" compact />
                    : <BilingualText en={`Ends in ${left} ${left === 1 ? 'day' : 'days'}`} el={`Λήγει σε ${left} ${left === 1 ? 'ημέρα' : 'ημέρες'}`} compact />}
                </Badge>
              ) : null}
            </>
          )}
        />
        <p className="card-body font-medium text-foreground">
          <BilingualText en={perk.value} el={perk.valueEl ?? perk.value} compact wrap />
        </p>
        <p className="card-body text-muted-foreground">
          <BilingualText en={perk.summary} el={perk.summaryEl ?? perk.summary} wrap />
        </p>
        <FactLine items={facts} />
        {stage && fit === 'match' && !admin ? (
          <p className="text-xs text-muted-foreground">
            <BilingualText en="Named for your stage." el="Για το στάδιό σας." compact />
          </p>
        ) : null}
        {revealed ? (
          // A reveal is a preview of what to use: the one tinted block on the card.
          <div className="space-y-2 rounded-lg border border-primary-muted bg-primary-subtle p-3">
            {perk.code ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground"><BilingualText en="Code" el="Κωδικός" compact /></span>
                <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm text-foreground">{perk.code}</code>
                <Button size="sm" variant="ghost" onClick={() => void copy()}>
                  <BilingualText en="Copy" el="Αντιγραφή" compact />
                </Button>
              </div>
            ) : null}
            <p className="card-body text-foreground">
              <BilingualText en={perk.howToRedeem} el={perk.howToRedeemEl ?? perk.howToRedeem} wrap />
            </p>
            {perk.redeemUrl ? (
              <Button size="sm" variant="outline" asChild>
                <a href={perk.redeemUrl} target="_blank" rel="noopener noreferrer">
                  <BilingualText en={`Redeem with ${perk.partner}`} el={`Εξαργύρωση στο ${perk.partner}`} compact />
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
        {perk.terms ? (
          <p className="text-xs text-muted-foreground">
            <BilingualText en={`Terms: ${perk.terms}`} el={`Όροι: ${perk.termsEl ?? perk.terms}`} wrap />
          </p>
        ) : null}
        <div className="mt-auto">
        <CardFoot
          meta={
            perk.claimed && perk.claimedAt && !admin ? (
              <span>
                <BilingualText en="Claimed" el="Διεκδικήθηκε" compact /> <RelativeTime date={perk.claimedAt} />
              </span>
            ) : (
              <BilingualText
                en={`${perk.claimCount} ${perk.claimCount === 1 ? 'member has' : 'members have'} claimed it`}
                el={`${perk.claimCount} ${perk.claimCount === 1 ? 'μέλος την έχει διεκδικήσει' : 'μέλη την έχουν διεκδικήσει'}`}
                compact
              />
            )
          }
        >
          {admin && onToggle ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={onToggle}>
              {perk.active ? <BilingualText en="Switch off" el="Απενεργοποίηση" compact /> : <BilingualText en="Switch on" el="Ενεργοποίηση" compact />}
            </Button>
          ) : !perk.claimed && onClaim ? (
            <Button size="sm" disabled={busy} onClick={onClaim}>
              <BilingualText en="Claim and show the code" el="Διεκδίκηση και εμφάνιση κωδικού" compact />
            </Button>
          ) : null}
        </CardFoot>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PerksPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const { openRailSection } = usePageRail();
  const { primary } = useLanguagePreference();
  const user = useStoredUser();
  const hydrated = useHydrated();
  const isAdmin = user?.role === 'admin' || user?.role === 'platform_admin' || user?.role === 'super_admin';
  const [tab, setTab] = useState<Tab>('offers');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [stage, setStage] = useState<StageFilter>('any');
  const [adding, setAdding] = useState(false);
  // Ages, not dates: stamped after mount so a prerendered page agrees with hydration.
  const now = hydrated ? Date.now() : null;

  const offers = useQuery({
    queryKey: qk('perks', 'open', stage),
    queryFn: () => listPerks(stage === 'any' ? {} : { stage }),
  });
  const claimedQuery = useQuery({ queryKey: qk('perks', 'claimed'), queryFn: listClaimedPerks });
  const managed = useQuery({ queryKey: qk('perks', 'admin'), queryFn: adminListPerks, enabled: isAdmin });

  const all = offers.data ?? [];
  const shown = category === 'all' ? all : all.filter((p) => p.category === category);
  const claimed = claimedQuery.data ?? [];
  const adminRows = managed.data ?? [];
  const claimable = all.filter((p) => !p.claimed);
  const endingSoon = all.filter((p) => {
    const left = daysLeft(p, now);
    return left !== null && left <= ENDING_SOON_DAYS;
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: qk('perks') });
  const claim = useMutation({
    mutationFn: (id: string) => claimPerk(id),
    onSuccess: (perk) => {
      refresh();
      success('Perk claimed', perk?.code ? 'The code is on the card and under Claimed.' : 'The partner link is on the card and under Claimed.');
    },
    onError: (err) => showError('Could not claim the perk', err instanceof Error ? err.message : undefined),
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setPerkActive(id, active),
    onSuccess: (_perk, vars) => {
      refresh();
      success(vars.active ? 'Perk switched on' : 'Perk switched off');
    },
    onError: (err) => showError('Could not change the perk', err instanceof Error ? err.message : undefined),
  });

  const runClaim = (p: PerkView): Promise<PageControlRunResult> => settle(() => claim.mutateAsync(p.id));
  const runToggle = (p: PerkView, active: boolean): Promise<PageControlRunResult> => settle(() => toggle.mutateAsync({ id: p.id, active }));
  const byId = (rows: PerkView[], v?: string) => rows.find((p) => p.id === v);
  const label = (p: PerkView) => `${p.partner}: ${p.title}`;
  const labelEl = (p: PerkView) => `${p.partner}: ${p.titleEl ?? p.title}`;

  const TABS = [
    { value: 'offers', en: 'Offers', el: 'Προσφορές' },
    { value: 'claimed', en: 'Claimed', el: 'Διεκδικημένες' },
    ...(isAdmin ? [{ value: 'manage', en: 'Manage', el: 'Διαχείριση' }] : []),
  ] as const;
  const CATEGORY_OPTIONS = [
    { value: 'all', en: 'All categories', el: 'Όλες οι κατηγορίες' },
    ...PERK_CATEGORIES.map((c) => ({ value: c, en: PERK_CATEGORY_COPY[c].en, el: PERK_CATEGORY_COPY[c].el })),
  ];
  const STAGE_OPTIONS = [
    { value: 'any', en: 'Not set', el: 'Χωρίς στάδιο' },
    ...PERK_STAGES.map((s) => ({ value: s, en: STAGE_COPY[s].en, el: STAGE_COPY[s].el })),
  ];

  const offOnes = adminRows.filter((p) => !p.active);
  const onOnes = adminRows.filter((p) => p.active);
  usePageControls([
    choiceControl('perks_tab', 'Show offers, claimed perks or the manage list', 'Προσφορές, διεκδικημένες ή διαχείριση', TABS, tab, (v) => setTab(v === 'claimed' || v === 'manage' ? v : 'offers')),
    choiceControl('perk_category', 'Show one category of perks', 'Μία κατηγορία προσφορών', CATEGORY_OPTIONS, category, (v) => {
      setCategory((PERK_CATEGORIES as readonly string[]).includes(v) ? (v as PerkCategory) : 'all');
      setTab('offers');
    }),
    choiceControl('perk_stage', 'Put the perks for a startup stage first', 'Πρώτα οι προσφορές για ένα στάδιο', STAGE_OPTIONS, stage, (v) => {
      setStage((PERK_STAGES as readonly string[]).includes(v) ? (v as PerkStage) : 'any');
      setTab('offers');
    }),
    // A claim shows a code that cannot be un-shown: no opposite.
    {
      id: 'claim_perk',
      labelEn: 'Claim a perk and show its code',
      labelEl: 'Διεκδίκηση προσφοράς και εμφάνιση κωδικού',
      writes: true,
      options: rowOptions(claimable, (p) => p.id, label, labelEl),
      ...(claimable.length ? {} : { unavailableEn: 'Every open perk is already claimed.', unavailableEl: 'Κάθε ανοιχτή προσφορά έχει ήδη διεκδικηθεί.' }),
      run: (v?: string) => {
        const p = byId(claimable, v);
        return p ? runClaim(p) : ROW_GONE;
      },
    },
    ...(isAdmin
      ? [
          // Switching sets one field and keeps every claim, so each is the other's exact opposite.
          {
            id: 'switch_off_perk',
            labelEn: 'Switch a perk off (claims are kept)',
            labelEl: 'Απενεργοποίηση προσφοράς (οι διεκδικήσεις μένουν)',
            writes: true,
            options: rowOptions(onOnes, (p) => p.id, label, labelEl),
            ...(onOnes.length ? {} : { unavailableEn: 'No perk is switched on.', unavailableEl: 'Καμία προσφορά δεν είναι ενεργή.' }),
            undo: (v?: string) => (byId(onOnes, v) ? { control: 'switch_on_perk', value: v } : undefined),
            run: (v?: string) => {
              const p = byId(onOnes, v);
              return p ? runToggle(p, false) : ROW_GONE;
            },
          },
          {
            id: 'switch_on_perk',
            labelEn: 'Switch a perk back on',
            labelEl: 'Επανενεργοποίηση προσφοράς',
            writes: true,
            options: rowOptions(offOnes, (p) => p.id, label, labelEl),
            ...(offOnes.length ? {} : { unavailableEn: 'No perk is switched off.', unavailableEl: 'Καμία προσφορά δεν είναι απενεργοποιημένη.' }),
            undo: (v?: string) => (byId(offOnes, v) ? { control: 'switch_off_perk', value: v } : undefined),
            run: (v?: string) => {
              const p = byId(offOnes, v);
              return p ? runToggle(p, true) : ROW_GONE;
            },
          },
        ]
      : []),
  ]);
  const line = (p: PerkView) =>
    `${p.partner}: ${p.title} - ${p.value} (${PERK_CATEGORY_COPY[p.category].en}${p.stages.length ? `; ${p.stages.join(', ')}` : '; every stage'}${p.claimed ? '; claimed' : ''})`;
  usePageList([
    { id: 'perks_offers', labelEn: 'Open perks', labelEl: 'Ανοιχτές προσφορές', rows: tab === 'offers' ? shown.map(line) : undefined },
    { id: 'perks_claimed', labelEn: 'Perks you claimed', labelEl: 'Προσφορές που διεκδικήσατε', rows: tab === 'claimed' ? claimed.map(line) : undefined },
    { id: 'perks_manage', labelEn: 'Every perk', labelEl: 'Όλες οι προσφορές', rows: tab === 'manage' ? adminRows.map((p) => `${line(p)}${p.active ? '' : ' - switched off'}`) : undefined },
  ]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of all) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [all]);
  const rail: PageRailSection[] = useMemo(
    () => [
      {
        id: 'filters',
        glyph: 'sliders',
        labelEn: 'Filters',
        labelEl: 'Φίλτρα',
        content: (
          <div className="space-y-4">
            <RailOptions
              title="Your stage"
              titleEl="Το στάδιό σας"
              value={stage}
              onChange={(v) => { setStage(v); setTab('offers'); }}
              options={STAGE_OPTIONS.map((o) => ({ value: o.value as StageFilter, en: o.en, el: o.el }))}
            />
            <RailOptions
              title="Category"
              titleEl="Κατηγορία"
              value={category}
              onChange={(v) => { setCategory(v); setTab('offers'); }}
              options={CATEGORY_OPTIONS.map((o) => ({
                value: o.value as CategoryFilter,
                en: o.en,
                el: o.el,
                count: o.value === 'all' ? all.length : counts.get(o.value) ?? 0,
              }))}
            />
          </div>
        ),
      },
      {
        id: 'summary',
        glyph: 'chart',
        labelEn: 'At a glance',
        labelEl: 'Με μια ματιά',
        content: (
          <RailStats
            items={[
              { key: 'open', label: 'Open offers', labelEl: 'Ανοιχτές προσφορές', value: all.length },
              { key: 'claimed', label: 'Claimed by you', labelEl: 'Διεκδικημένες από εσάς', value: claimed.length },
              { key: 'ending', label: `Ending within ${ENDING_SOON_DAYS} days`, labelEl: `Λήγουν μέσα σε ${ENDING_SOON_DAYS} ημέρες`, value: endingSoon.length },
            ]}
          />
        ),
      },
      {
        id: 'how',
        glyph: 'book',
        labelEn: 'How perks work',
        labelEl: 'Πώς λειτουργούν οι προσφορές',
        content: (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li><BilingualText en="Choose your stage: the offers named for it come first. Nothing is hidden." el="Επιλέξτε το στάδιό σας: οι προσφορές γι’ αυτό έρχονται πρώτες. Τίποτα δεν κρύβεται." wrap /></li>
            <li><BilingualText en="Claim to see the code or the partner’s link. Each perk is claimed once." el="Διεκδικήστε για να δείτε τον κωδικό ή τον σύνδεσμο του συνεργάτη. Κάθε προσφορά διεκδικείται μία φορά." wrap /></li>
            <li><BilingualText en={PERK_COPY.disclosure.en} el={PERK_COPY.disclosure.el} wrap /></li>
          </ul>
        ),
      },
    ],
    [stage, category, all.length, claimed.length, endingSoon.length, counts, primary],
  );

  const empty = (en: string, el: string, cta?: React.ReactNode) => (
    <Card>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <BilingualText en={en} el={el} wrap />
        {cta}
      </CardContent>
    </Card>
  );
  const stageOrNull = stage === 'any' ? null : stage;
  const busy = claim.isPending || toggle.isPending;

  return (
    <AppShell showHelp rail={rail} askAi={ASK.perks}>
      <div className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v === 'claimed' || v === 'manage' ? v : 'offers')} className="space-y-4">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}><BilingualText en={t.en} el={t.el} compact /></TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="offers" className="space-y-4">
            {offers.isLoading ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : offers.isError ? (
              empty('The perks could not be loaded. Try again in a moment.', 'Οι προσφορές δεν φορτώθηκαν. Δοκιμάστε ξανά σε λίγο.',
                <Button size="sm" variant="outline" onClick={() => void offers.refetch()}><BilingualText en="Try again" el="Δοκιμή ξανά" compact /></Button>)
            ) : all.length === 0 ? (
              empty('No partner offers yet. The platform team adds them here as partners join.', 'Δεν υπάρχουν ακόμη προσφορές συνεργατών. Η ομάδα της πλατφόρμας τις προσθέτει εδώ καθώς μπαίνουν συνεργάτες.')
            ) : shown.length === 0 ? (
              empty(
                `No open perk in ${PERK_CATEGORY_COPY[category as PerkCategory]?.en ?? 'this category'} right now.`,
                `Καμία ανοιχτή προσφορά στην κατηγορία ${PERK_CATEGORY_COPY[category as PerkCategory]?.el ?? 'αυτή'} τώρα.`,
                <Button size="sm" variant="outline" onClick={() => openRailSection('filters')}><BilingualText en="Show filters" el="Εμφάνιση φίλτρων" compact /></Button>,
              )
            ) : (
              // Two to a row from xl, as the prototype grids its perks: a long
              // single column made the offers a scroll rather than a choice.
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {shown.map((p) => <PerkCard key={p.id} perk={p} now={now} stage={stageOrNull} busy={busy} onClaim={() => void runClaim(p)} />)}
              </div>
            )}
          </TabsContent>
          <TabsContent value="claimed" className="space-y-4">
            {claimedQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-2xl" />
            ) : claimed.length === 0 ? (
              empty('You have not claimed a perk yet. Claim one under Offers to see its code here.', 'Δεν έχετε διεκδικήσει ακόμη προσφορά. Διεκδικήστε μία στις Προσφορές για να δείτε εδώ τον κωδικό της.',
                <Button size="sm" variant="outline" onClick={() => setTab('offers')}><BilingualText en="See the offers" el="Δείτε τις προσφορές" compact /></Button>)
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {claimed.map((p) => <PerkCard key={p.id} perk={p} now={now} stage={stageOrNull} busy={busy} />)}
              </div>
            )}
          </TabsContent>
          {isAdmin ? (
            <TabsContent value="manage" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  <BilingualText en="Members see a code only after they claim. Switching a perk off hides it from Offers and keeps every claim." el="Τα μέλη βλέπουν κωδικό μόνο μετά τη διεκδίκηση. Η απενεργοποίηση την κρύβει από τις Προσφορές και κρατά κάθε διεκδίκηση." wrap />
                </p>
                <Button size="sm" onClick={() => setAdding(true)}><BilingualText en="Add a perk" el="Προσθήκη προσφοράς" compact /></Button>
              </div>
              {managed.isLoading ? (
                <Skeleton className="h-40 w-full rounded-2xl" />
              ) : adminRows.length === 0 ? (
                empty('No perks yet. Add the first partner offer.', 'Δεν υπάρχουν ακόμη προσφορές. Προσθέστε την πρώτη.')
              ) : (
                adminRows.map((p) => (
                  <PerkCard key={p.id} perk={p} now={now} stage={null} busy={busy} admin onToggle={() => void runToggle(p, !p.active)} />
                ))
              )}
              <AddPerkDialog open={adding} onClose={() => setAdding(false)} onCreated={refresh} />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </AppShell>
  );
}

