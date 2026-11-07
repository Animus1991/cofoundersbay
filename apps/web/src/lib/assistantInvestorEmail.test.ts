import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = vi.hoisted(() => ({ leads: [] as Array<Record<string, unknown>> }));
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getMeProfile: vi.fn(async () => ({ profile: { displayName: 'Alex Demo' }, hasCompletedOnboarding: true })),
}));
vi.mock('@/lib/fundraising-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/fundraising-api')>()),
  getFundraising: vi.fn(async () => ({ round: null, leads: data.leads, documents: [] })),
}));

import { executeAction } from '@/lib/action-registry';
import { planCopilotTools } from '@/lib/copilot-planner';
import { runCopilotTurn } from '@/lib/copilot-engine';
import { takeFormDraft } from '@/lib/form-draft';

const lead = (over: Record<string, unknown> = {}) => ({
  id: 'l1', investorName: 'Irini Kosta', investorFirm: 'Athens Angels', investorEmail: 'irini@angels.example', investorType: 'Angel',
  stageFocus: null, checkSizeText: null, status: 'contacted', committedAmount: null, currency: 'EUR', lastContactAt: null,
  nextFollowUpAt: null, nextStep: 'Send the deck', notes: null, isVerifiedOnPlatform: false, linkedAccount: null, ...over,
});

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.localStorage.setItem('user', JSON.stringify({ id: 'u-1' }));
  data.leads = [lead()];
});

describe('an email to an investor, from the conversation', () => {
  it('is planned only when someone is named', () => {
    const named = (ask: string) => planCopilotTools(ask).find((tool) => tool.name === 'draft_investor_email')?.args;
    expect(named('Write an email to Irini Kosta')).toEqual({ investor: 'Irini Kosta' });
    expect(named('Γράψε email στην Irini Kosta')).toEqual({ investor: 'Irini Kosta' });
    expect(named('στείλε ένα mail στον Athens Angels')).toEqual({ investor: 'Athens Angels' });
    expect(named('how should I write an email?')).toBeUndefined();
    expect(named('what is my email?')).toBeUndefined();
  });

  it('opens Fundraising with the note filled, and sends nothing', async () => {
    const done = await executeAction('draft_investor_email', { investor: 'irini' });
    expect(done).toMatchObject({ ok: true, href: '/fundraising' });
    const draft = takeFormDraft('investor_email');
    expect(draft).toMatchObject({ name: 'Irini Kosta', to: 'irini@angels.example' });
    expect(String(draft?.body)).toContain('Send the deck');
    expect(String(draft?.body)).toContain('Alex Demo');
  });

  it('keeps what the assistant wrote over the starting note', async () => {
    await executeAction('draft_investor_email', { investor: 'Irini Kosta', subject: 'Our update', body: 'Numbers attached.' });
    expect(takeFormDraft('investor_email')).toMatchObject({ subject: 'Our update', body: 'Numbers attached.' });
  });

  it('shows a card named after the investor', async () => {
    const turn = await runCopilotTurn('Γράψε email στην Irini Kosta', { locale: 'el' } as never);
    const card = turn.actions.find((action) => action.tool === 'draft_investor_email');
    expect(card?.title).toMatch(/Irini Kosta/);
    expect(card?.confirmLabel).toBe('Άνοιγμα συμπληρωμένου email');
  });

  it('says so when nobody on the round has that name', async () => {
    expect(await executeAction('draft_investor_email', { investor: 'Nobody Here' })).toEqual({ ok: false, error: 'No investor on your round matches that name' });
    expect(takeFormDraft('investor_email')).toBeNull();
  });
});
