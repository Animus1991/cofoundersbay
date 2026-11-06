'use client';

import { useQuery } from '@tanstack/react-query';
import { useDemoData, readShowSamples } from '@/contexts/DemoDataContext';
import { useHydrated } from '@/components/common/RelativeTime';
import { getFundraising, leadFromApi, updateFundraisingLead } from '@/lib/fundraising-api';
import { listFundraisingLeads, setFundraisingFollowUp, type InvestorLead } from '@/lib/fundraising-demo';
import { qk } from '@/lib/query-keys';
import { calendarDaysUntil } from '@/lib/calendar-days';

/**
 * The next step with each investor (docs §112). One reading of it serves the
 * lead's card, the home, the calendar, the notifications page and the
 * assistant, so a date set in one place shows in all of them, and a due
 * follow-up leaves them all the moment it is moved or cleared: it is worked out
 * from the data, not sent as a notice that stays behind when things change.
 */

export type FollowUpLead = InvestorLead & { nextFollowUp: string };

/** A lead that has said yes or no needs no chasing, whatever date was left on it. */
const isOpen = (lead: InvestorLead) => lead.status !== 'committed' && lead.status !== 'passed';

export function withFollowUps(leads: InvestorLead[]): FollowUpLead[] {
  return leads
    .filter((lead): lead is FollowUpLead => Boolean(lead.nextFollowUp) && isOpen(lead))
    .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp));
}

/** Today counts as due: the day it was set for has arrived. */
export function isFollowUpDue(lead: FollowUpLead): boolean {
  return (calendarDaysUntil(lead.nextFollowUp) ?? 1) <= 0;
}

export function isFollowUpLate(lead: FollowUpLead): boolean {
  return (calendarDaysUntil(lead.nextFollowUp) ?? 1) < 0;
}

/** The reader's investors with a next step, in date order, and those due now. */
export function useInvestorFollowUps() {
  const { showDemoData } = useDemoData();
  const hydrated = useHydrated();
  const { data } = useQuery({
    queryKey: qk('fundraising'),
    queryFn: getFundraising,
    enabled: hydrated && !showDemoData,
    staleTime: 30_000,
    retry: 0,
  });
  const leads = showDemoData ? (hydrated ? listFundraisingLeads() : []) : (data?.leads ?? []).map(leadFromApi);
  const items = withFollowUps(leads);
  return { items, due: items.filter(isFollowUpDue) };
}

async function readLeads(): Promise<InvestorLead[]> {
  if (readShowSamples()) return listFundraisingLeads();
  return ((await getFundraising()).leads ?? []).map(leadFromApi);
}

/** A name as a person would say it: exact first, then contained, either way round. */
export async function findLeadByName(name: string): Promise<InvestorLead | null> {
  const wanted = name.trim().toLowerCase();
  if (!wanted) return null;
  const leads = await readLeads();
  const names = (lead: InvestorLead) => [lead.name, lead.nameEl, lead.firm].filter(Boolean).map((n) => (n as string).toLowerCase());
  return (
    leads.find((lead) => names(lead).includes(wanted))
    ?? leads.find((lead) => names(lead).some((n) => n.includes(wanted) || wanted.includes(n)))
    ?? null
  );
}

export async function saveFollowUp(leadId: string, at: string | null, step: string | null): Promise<void> {
  if (readShowSamples()) {
    setFundraisingFollowUp(leadId, at, step);
    return;
  }
  await updateFundraisingLead(leadId, { nextFollowUpAt: at, nextStep: step });
}
