import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFollowUpDue, isFollowUpLate, withFollowUps, type FollowUpLead } from './follow-ups';
import { listFundraisingLeads, setFundraisingFollowUp, type InvestorLead } from './fundraising-demo';

const lead = (over: Partial<InvestorLead>): InvestorLead => ({
  id: 'l', name: 'Ada', type: 'Angel', stage: 'Seed', checkSize: '', status: 'meeting', isVerified: false, ...over,
});

afterEach(() => {
  vi.useRealTimers();
  window.sessionStorage.clear();
});

describe('the next step with an investor', () => {
  it('orders by date and keeps only those with one', () => {
    const items = withFollowUps([
      lead({ id: 'late', nextFollowUp: '2026-11-20' }),
      lead({ id: 'none' }),
      lead({ id: 'early', nextFollowUp: '2026-11-02' }),
    ]);
    expect(items.map((l) => l.id)).toEqual(['early', 'late']);
  });

  it('stops chasing an investor who has answered', () => {
    expect(withFollowUps([
      lead({ id: 'yes', status: 'committed', nextFollowUp: '2026-11-02' }),
      lead({ id: 'no', status: 'passed', nextFollowUp: '2026-11-02' }),
    ])).toEqual([]);
  });

  it('counts today as due, not as late', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T10:00:00Z'));
    const on = (date: string) => lead({ nextFollowUp: date }) as FollowUpLead;
    expect(isFollowUpDue(on('2026-11-06'))).toBe(true);
    expect(isFollowUpLate(on('2026-11-06'))).toBe(false);
    expect(isFollowUpLate(on('2026-11-05'))).toBe(true);
    expect(isFollowUpDue(on('2026-11-07'))).toBe(false);
  });
});

describe('in the showcase', () => {
  it('sets, changes and clears a step, in this tab', () => {
    const id = listFundraisingLeads()[0].id;
    setFundraisingFollowUp(id, '2026-11-20', 'Send the deck');
    expect(listFundraisingLeads().find((l) => l.id === id)).toMatchObject({ nextFollowUp: '2026-11-20', nextStep: 'Send the deck' });
    setFundraisingFollowUp(id, null, null);
    expect(listFundraisingLeads().find((l) => l.id === id)?.nextFollowUp).toBeUndefined();
  });

  it('opens with an overdue step, so the home has something to show', () => {
    expect(withFollowUps(listFundraisingLeads()).some((l) => (l as FollowUpLead).nextStep)).toBe(true);
  });
});
