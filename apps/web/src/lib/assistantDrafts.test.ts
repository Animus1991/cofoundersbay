import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = vi.hoisted(() => ({
  programs: [] as Array<Record<string, unknown>>,
  mine: [] as Array<Record<string, unknown>>,
  profile: null as Record<string, unknown> | null,
  reviews: [] as Array<Record<string, unknown>>,
}));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    listPrograms: vi.fn(async () => ({ programs: data.programs, total: data.programs.length })),
    getMyPrograms: vi.fn(async () => ({ programs: data.mine })),
    getMeProfile: vi.fn(async () => ({ profile: data.profile, hasCompletedOnboarding: true })),
    listExpertReviews: vi.fn(async () => ({ reviews: data.reviews, total: data.reviews.length })),
  };
});

import { executeAction } from '@/lib/action-registry';
import { planCopilotTools } from '@/lib/copilot-planner';
import { runCopilotTurn } from '@/lib/copilot-engine';
import { takeFormDraft } from '@/lib/form-draft';
import { nameKey, namesPerson, parseReviewNotes, readScore, startingApplicationNote } from '@/lib/assistant-drafts';

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.localStorage.setItem('user', JSON.stringify({ id: 'u-1' }));
  data.programs = [
    { id: 'p-boot', title: 'Pre-seed Bootcamp', status: 'active', applicationDeadline: '2099-01-01T00:00:00Z' },
    { id: 'p-closed', title: 'Closed Lab', status: 'completed', applicationDeadline: null },
    { id: 'p-seed', title: 'Seed Accelerator · Autumn 2026', status: 'active', applicationDeadline: '2099-01-01T00:00:00Z' },
  ];
  data.mine = [];
  data.profile = { displayName: 'Alex Demo', headline: 'Founder at Harbor', skills: [{ skillName: 'Product' }, { skillName: 'Logistics' }] };
  data.reviews = [
    { id: 'r-sofia', status: 'requested', requester: { id: 'user-sofia', displayName: 'Sofia Alexiou' } },
    { id: 'r-old', status: 'submitted', requester: { id: 'user-nikos', displayName: 'Nikos Andreou' } },
  ];
});

describe('the application note the assistant starts (docs §107.7-4, §111)', () => {
  it('uses only what the profile says and leaves the rest in brackets', () => {
    const el = startingApplicationNote(data.profile as never, 'Pre-seed Bootcamp', 'el');
    expect(el).toContain('Είμαι Alex Demo, Founder at Harbor.');
    expect(el).toContain('Φέρνω: Product, Logistics.');
    expect(el).toContain('«Pre-seed Bootcamp»');
    expect(el).toMatch(/\[γιατί ταιριάζει η startup σας/);
    const en = startingApplicationNote(null, null, 'en');
    expect(en).not.toMatch(/I am/);
    expect(en).toMatch(/^We are applying because \[/);
  });

  it('drafts the note for the named programme and opens its page; a closed one is refused', async () => {
    const done = await executeAction('draft_program_application', { programTitle: 'pre-seed bootcamp' });
    expect(done).toEqual({ ok: true, href: '/programs/p-boot' });
    const fields = takeFormDraft('program_application');
    expect(fields?.programId).toBe('p-boot');
    expect(String(fields?.coverNote)).toContain('Alex Demo');
    expect((await executeAction('draft_program_application', { programTitle: 'Closed Lab' })).ok).toBe(false);
    expect((await executeAction('draft_program_application', {})).ok).toBe(false);
    // A model's own words are kept as written.
    await executeAction('draft_program_application', { programId: 'p-boot', coverNote: 'Our pilot runs in Piraeus.' });
    expect(takeFormDraft('program_application')?.coverNote).toBe('Our pilot runs in Piraeus.');
  });

  it('is asked for as a draft, not as applying now', () => {
    const planned = planCopilotTools('Ετοίμασε την αίτησή μου στο «Pre-seed Bootcamp»');
    expect(planned.find((t) => t.name === 'draft_program_application')?.args).toEqual({ programTitle: 'Pre-seed Bootcamp' });
    expect(planned.map((t) => t.name)).not.toContain('apply_to_program');
  });

  it('reads the programme without quotes, as people type it', () => {
    const title = (ask: string) => planCopilotTools(ask).find((t) => t.name === 'draft_program_application')?.args;
    expect(title('Draft my application for Seed Accelerator')).toEqual({ programTitle: 'Seed Accelerator' });
    expect(title('Prepare my application to the Pre-seed Bootcamp programme.')).toEqual({ programTitle: 'Pre-seed Bootcamp' });
    expect(title('Ετοίμασε την αίτησή μου για το Seed Accelerator')).toEqual({ programTitle: 'Seed Accelerator' });
    expect(title('Συμπλήρωσε την αιτηση μου στο πρόγραμμα Pre-seed Bootcamp')).toEqual({ programTitle: 'Pre-seed Bootcamp' });
  });

  it('refuses a programme the member has already applied to', async () => {
    data.mine = [{ id: 'p-seed', title: 'Seed Accelerator · Autumn 2026' }];
    expect(await executeAction('draft_program_application', { programTitle: 'Seed Accelerator' })).toEqual({ ok: false, error: 'You have already applied to this programme' });
    expect(takeFormDraft('program_application')).toBeFalsy();
    // A partial title finds the one programme it names.
    expect(await executeAction('draft_program_application', { programTitle: 'pre-seed' })).toEqual({ ok: true, href: '/programs/p-boot' });
  });
});

describe('a review asked of the reader, drafted (docs §107.7-4, §111)', () => {
  it('matches a name across scripts', () => {
    expect(nameKey('Σοφία')).toBe(nameKey('Sofia'));
    expect(namesPerson('Σοφία', 'Sofia Alexiou')).toBe(true);
    expect(namesPerson('Νίκος', 'Nikos Andreou')).toBe(true);
    expect(namesPerson('Έλενα', 'Sofia Alexiou')).toBe(false);
  });

  it('reads "area: note" lines and a 1–10 score', () => {
    expect(parseReviewNotes('Problem: one sentence; Team: complementary')).toEqual([
      { area: 'Problem', text: 'one sentence' },
      { area: 'Team', text: 'complementary' },
    ]);
    expect(readScore('7')).toBe(7);
    expect(readScore(11)).toBeNull();
  });

  it('fills the open review whose requester is named, and nothing else', async () => {
    const done = await executeAction('draft_expert_review', { requesterName: 'Σοφία', summaryFeedback: 'Strong problem slide.', strengths: 'Problem: named early', scoreOverall: 7 });
    expect(done).toEqual({ ok: true, href: '/expert-reviews?tab=asked&review=r-sofia' });
    expect(takeFormDraft('expert_review')).toEqual({ reviewId: 'r-sofia', summaryFeedback: 'Strong problem slide.', strengths: 'Problem: named early', scoreOverall: '7' });
    // A submitted review is not open to a draft.
    expect((await executeAction('draft_expert_review', { requesterName: 'Nikos' })).ok).toBe(false);
  });

  it('is told apart from asking for a review', () => {
    expect(planCopilotTools('Ετοίμασε την αξιολόγηση που μου ζήτησε η Σοφία').map((t) => t.name)).toContain('draft_expert_review');
    expect(planCopilotTools('Θέλω αίτημα αξιολόγησης για το pitch deck').map((t) => t.name)).not.toContain('draft_expert_review');
  });

  it('shows a card named after the programme', async () => {
    const turn = await runCopilotTurn('Ετοίμασε την αίτησή μου στο «Pre-seed Bootcamp»', undefined, { tools: [{ name: 'draft_program_application', args: { programTitle: 'Pre-seed Bootcamp' } }] });
    const card = turn.actions.find((a) => a.tool === 'draft_program_application');
    expect(card?.title).toMatch(/Pre-seed Bootcamp/);
  });
});
