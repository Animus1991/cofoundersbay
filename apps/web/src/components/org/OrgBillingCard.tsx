'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ORG_BILLING_PROBLEM_COPY, ORG_BILLING_STATUS_COPY, ORG_PLAN_LIVE_STATUSES, ORG_TEAM_PLAN_DEFAULTS } from '@cofounderbay/shared';
import { BilingualText } from '@/components/common/BilingualText';
import { FactLine } from '@/components/common/FactLine';
import { WithDisabledReason } from '@/components/common/UnavailableButton';
import { FailedLine, RowHead } from '@/components/dashboard/SectionCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { getOrgBilling, openOrgBillingPortal, startOrgCheckout, type OrgBillingPlan } from '@/lib/api';
import { PLAN_HIGHLIGHTS } from '@/lib/billing';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { qk } from '@/lib/query-keys';
import { onRadioGroupKeyDown, radioTabIndex } from '@/lib/radio-keys';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';

// "$899", as the pricing page writes it (en-GB alone writes "US$899").
const money = (minor: number, currency: string) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100);

/**
 * The organisation's own plan (docs §104): what it holds, its seats, and the
 * Team plan the pricing page sells to organisations, bought through Stripe
 * Checkout and managed in the billing portal. It replaced an illustrative
 * "Organization Pro" with a card ending 4242.
 */
export function OrgBillingCard({ organizationId, notice }: { organizationId: string; notice: 'success' | 'cancel' | null }) {
  const fmtDate = useDateFormat();
  const { error: showError } = useToast();
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('annual');
  const query = useQuery({ queryKey: qk('billing', 'organization', organizationId), queryFn: () => getOrgBilling(organizationId), retry: 0, staleTime: 30_000 });
  const data = query.data;

  const fail = (title: string) => (err: unknown) => {
    const e = err as { message?: string };
    showError(title, e?.message || undefined);
  };
  const checkout = useMutation({
    mutationFn: (plan: OrgBillingPlan) => startOrgCheckout(organizationId, plan.id, cycle),
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
    onError: fail('Could not open checkout'),
  });
  const portal = useMutation({
    mutationFn: () => openOrgBillingPortal(organizationId),
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
    onError: fail('Could not open the billing portal'),
  });

  if (query.isLoading) return <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-24" /></div>;
  if (query.isError || !data) {
    return <FailedLine en="Your organisation's plan could not be read just now." el="Το πλάνο του οργανισμού σας δεν διαβάστηκε αυτή τη στιγμή." busy={query.isFetching} onRetry={() => void query.refetch()} />;
  }

  const sub = data.subscription;
  const live = Boolean(sub && (ORG_PLAN_LIVE_STATUSES as readonly string[]).includes(sub.status));
  const status = sub ? ORG_BILLING_STATUS_COPY[sub.status] ?? { en: sub.status, el: sub.status } : null;
  const team = data.plans.find((p) => p.name === 'team');
  const enterprise = data.plans.find((p) => p.name === 'enterprise');
  const notConfigured = ORG_BILLING_PROBLEM_COPY.billing_not_configured;
  const manageReason = !data.canManage
    ? { en: 'Only owners and admins change the plan.', el: 'Μόνο ιδιοκτήτες και διαχειριστές αλλάζουν το πλάνο.' }
    : !data.billingConfigured ? notConfigured : null;
  const teamReason = manageReason ?? (team && !team.purchasable[cycle] ? ORG_BILLING_PROBLEM_COPY.plan_has_no_price : null);

  return (
    <div className="space-y-4">
      {notice === 'success' ? (
        <p role="status" className="text-sm text-foreground">
          <BilingualText en="Payment received. The plan shows here as soon as the payment provider confirms it." el="Η πληρωμή έγινε. Το πλάνο εμφανίζεται εδώ μόλις το επιβεβαιώσει ο πάροχος πληρωμών." wrap />
        </p>
      ) : notice === 'cancel' ? (
        <p role="status" className="text-sm text-muted-foreground">
          <BilingualText en="Checkout was cancelled; nothing was charged." el="Η πληρωμή ακυρώθηκε· δεν χρεώθηκε τίποτα." wrap />
        </p>
      ) : null}

      <div className="card-rows">
        <RowHead
          titleAs="h4"
          title={sub && live ? <span translate="no">{sub.plan.displayName}</span> : <BilingualText en="Free" el="Δωρεάν" compact />}
          subtitle={sub && live ? (
            <FactLine
              items={[
                sub.billingCycle === 'annual'
                  ? <BilingualText key="price" en={`${money(sub.plan.priceAnnual, sub.plan.currency)} a year`} el={`${money(sub.plan.priceAnnual, sub.plan.currency)} τον χρόνο`} compact />
                  : <BilingualText key="price" en={`${money(sub.plan.priceMonthly, sub.plan.currency)} a month`} el={`${money(sub.plan.priceMonthly, sub.plan.currency)} τον μήνα`} compact />,
                status ? <BilingualText key="status" en={status.en} el={status.el} compact /> : null,
                <BilingualText
                  key="period"
                  en={`${sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'} ${fmtDate(sub.currentPeriodEnd, { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  el={`${sub.cancelAtPeriodEnd ? 'Λήγει' : 'Ανανεώνεται'} ${fmtDate(sub.currentPeriodEnd, { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  compact
                />,
              ]}
            />
          ) : (
            <BilingualText en="No paid plan: members have no seat limit." el="Χωρίς πληρωμένο πλάνο: τα μέλη δεν έχουν όριο θέσεων." compact wrap />
          )}
          aside={sub?.hasPaymentAccount && data.canManage ? (
            data.billingConfigured ? (
              <Button size="sm" variant={live ? 'default' : 'outline'} disabled={portal.isPending} onClick={() => portal.mutate()}>
                <BilingualText en="Manage billing" el="Διαχείριση χρεώσεων" compact />
              </Button>
            ) : (
              <WithDisabledReason reasonEn={notConfigured.en} reasonEl={notConfigured.el}>
                <Button size="sm" variant="outline" disabled><BilingualText en="Manage billing" el="Διαχείριση χρεώσεων" compact /></Button>
              </WithDisabledReason>
            )
          ) : undefined}
        />
        <p className="text-sm">
          {data.seats.limit != null ? (
            <span className={cn(data.seats.full && 'text-status-warning')}>
              <BilingualText
                en={`${data.seats.used} of ${data.seats.limit} seats taken${data.seats.full ? ': new members and invitations wait until one frees' : ''}`}
                el={`${data.seats.used} από ${data.seats.limit} θέσεις πιασμένες${data.seats.full ? ': νέα μέλη και προσκλήσεις περιμένουν να ελευθερωθεί μία' : ''}`}
                wrap
              />
            </span>
          ) : (
            <span className="text-muted-foreground">
              <BilingualText en={`${data.seats.used} ${data.seats.used === 1 ? 'member' : 'members'}`} el={`${data.seats.used} ${data.seats.used === 1 ? 'μέλος' : 'μέλη'}`} compact />
            </span>
          )}
        </p>
        {live ? (
          <p className="text-xs text-muted-foreground">
            <BilingualText en="Change the plan, the card or the billing period, see invoices or cancel in the billing portal." el="Αλλαγή πλάνου, κάρτας ή περιόδου χρέωσης, τιμολόγια και ακύρωση γίνονται στην πύλη χρεώσεων." wrap />
          </p>
        ) : null}
      </div>

      {!live && team ? (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="card-title" translate="no">{team.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {team.description ? <BilingualText en={team.description} el={team.description === ORG_TEAM_PLAN_DEFAULTS.description ? 'Για επιταχυντές και οργανισμούς' : team.description} compact wrap /> : null}
              </p>
            </div>
            <div role="radiogroup" aria-label={bilingualAria('Billing period', 'Περίοδος χρέωσης')} onKeyDown={(e) => onRadioGroupKeyDown(e)} className="inline-flex rounded-md border border-border p-0.5">
              {([
                { value: 'monthly', en: 'Monthly', el: 'Μηνιαία' },
                { value: 'annual', en: 'Yearly', el: 'Ετήσια' },
              ] as const).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={cycle === c.value}
                  tabIndex={radioTabIndex(cycle === c.value, 0, true)}
                  onClick={() => setCycle(c.value)}
                  className={cn('rounded-md px-3 py-1 text-sm', cycle === c.value ? 'bg-primary/10 font-medium text-primary-accessible' : 'text-muted-foreground hover:bg-muted/70')}
                >
                  <BilingualText en={c.en} el={c.el} compact />
                </button>
              ))}
            </div>
          </div>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {cycle === 'annual'
              ? <BilingualText en={`${money(team.priceAnnual, team.currency)} a year`} el={`${money(team.priceAnnual, team.currency)} τον χρόνο`} compact />
              : <BilingualText en={`${money(team.priceMonthly, team.currency)} a month`} el={`${money(team.priceMonthly, team.currency)} τον μήνα`} compact />}
          </p>
          <FactLine items={PLAN_HIGHLIGHTS.team.map((h) => <BilingualText key={h.en} en={h.en} el={h.el} compact />)} />
          <div className="flex flex-wrap items-center gap-2">
            {teamReason ? (
              <WithDisabledReason reasonEn={teamReason.en} reasonEl={teamReason.el}>
                <Button disabled><BilingualText en={`Choose ${team.displayName}`} el={`Επιλογή ${team.displayName}`} compact /></Button>
              </WithDisabledReason>
            ) : (
              <Button disabled={checkout.isPending} onClick={() => checkout.mutate(team)}>
                {checkout.isPending
                  ? <BilingualText en="Opening checkout…" el="Άνοιγμα πληρωμής…" compact />
                  : <BilingualText en={`Choose ${team.displayName}`} el={`Επιλογή ${team.displayName}`} compact />}
              </Button>
            )}
            {enterprise ? (
              <Button variant="outline" asChild>
                <a href="mailto:enterprise@cofounderbay.com?subject=Enterprise%20plan"><BilingualText en="Enterprise: contact us" el="Enterprise: επικοινωνία" compact /></a>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
