import { beforeEach, describe, expect, it, vi } from 'vitest';

const prefs = vi.hoisted(() => ({ current: { responseStyle: 'concise', useEmoji: false } as Record<string, unknown> }));
vi.mock('@/lib/ai-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ai-api')>();
  return {
    ...actual,
    getAIPreferences: vi.fn(async () => ({ preferences: { ...prefs.current } })),
    updateAIPreferences: vi.fn(async (data: Record<string, unknown>) => {
      prefs.current = { ...prefs.current, ...data };
      return { preferences: prefs.current };
    }),
  };
});

import { computeMatchScore, MATCH_SCORE_PARTIAL, MATCH_SCORE_WEIGHTS, type ProfileSnapshot } from '@cofounderbay/shared';
import { executeAction, undoAction } from '@/lib/action-registry';
import { detectReplyStyle, planCopilotTools } from '@/lib/copilot-planner';
import { runCopilotTurn } from '@/lib/copilot-engine';
import { readUsage } from '@/lib/usage-profile';
import { isPinnablePath } from '@/components/layout/PinPageButton';
import { matchScoreParts } from '@/components/matches/MatchScoreExplainer';

beforeEach(() => {
  prefs.current = { responseStyle: 'concise', useEmoji: false };
  window.localStorage.clear();
  window.localStorage.setItem('user', JSON.stringify({ id: 'u-1' }));
});

describe('the assistant changes how it answers (docs §110)', () => {
  it('reads a style only from a sentence about its answers', () => {
    expect(detectReplyStyle('Από εδώ και πέρα απάντα μου πιο σύντομα')).toEqual({ style: 'concise' });
    expect(detectReplyStyle('Be more formal')).toEqual({ style: 'formal' });
    expect(detectReplyStyle('Μίλα μου πιο φιλικά')).toEqual({ style: 'casual' });
    expect(detectReplyStyle('Answer me in more detail')).toEqual({ style: 'detailed' });
    expect(detectReplyStyle('Χωρίς emoji, παρακαλώ')).toEqual({ emoji: 'false' });
    // A draft is not a style: nothing about the assistant’s own answers.
    expect(detectReplyStyle('Σύνταξε μια πιο σύντομη απάντηση στην Έλενα')).toBeUndefined();
    expect(detectReplyStyle('Make my bio more formal')).toBeUndefined();
    expect(planCopilotTools('Από εδώ και πέρα απάντα μου πιο σύντομα').find((t) => t.name === 'set_reply_style')?.args).toEqual({ style: 'concise' });
  });

  it('changes the style, hands the undo what was there, and refuses a no-op', async () => {
    const done = await executeAction('set_reply_style', { style: 'detailed', emoji: 'true' });
    expect(done).toEqual({ ok: true, href: '/settings/ai', undo: { responseStyle: 'concise', useEmoji: false } });
    expect(prefs.current).toMatchObject({ responseStyle: 'detailed', useEmoji: true });
    expect((await executeAction('set_reply_style', { style: 'detailed' })).ok).toBe(false);
    expect((await executeAction('set_reply_style', { style: 'poetic' })).ok).toBe(false);
    expect((await executeAction('set_reply_style', {})).ok).toBe(false);
    expect(await undoAction('set_reply_style', {}, done.undo)).toEqual({ ok: true, href: '/settings/ai' });
    expect(prefs.current).toMatchObject({ responseStyle: 'concise', useEmoji: false });
  });
});

describe('the planner’s pins and styles become cards (docs §110)', () => {
  it('names the page in the reader’s language and pins it on confirm', async () => {
    const turn = await runCopilotTurn('Καρφίτσωσε τα μηνύματα', undefined, { tools: [{ name: 'pin_shortcut', args: { href: '/messages', label: 'Messages' } }] });
    const card = turn.actions.find((a) => a.tool === 'pin_shortcut');
    expect(card?.title).toMatch(/Μηνύματα$/);
    expect(card?.payload).toMatchObject({ href: '/messages' });
    await executeAction('pin_shortcut', card?.payload ?? {});
    expect(readUsage().pins).toEqual(['/messages']);
  });

  it('names the style a card sets', async () => {
    const turn = await runCopilotTurn('Από εδώ και πέρα απάντα μου πιο σύντομα και χωρίς emoji', undefined, { tools: [{ name: 'set_reply_style', args: { style: 'concise', emoji: 'false' } }] });
    const card = turn.actions.find((a) => a.tool === 'set_reply_style');
    expect(card?.title).toMatch(/Σύντομο · χωρίς emoji$/);
  });
});

describe('the star beside a page title (docs §110)', () => {
  it('shows on pages that can be one of the reader’s pages, never on a home', () => {
    expect(isPinnablePath('/matches')).toBe(true);
    expect(isPinnablePath('/messages')).toBe(true);
    expect(isPinnablePath('/dashboard/founder')).toBe(false);
    expect(isPinnablePath('/profiles/user-elena')).toBe(false);
    expect(isPinnablePath('/no-such-page')).toBe(false);
  });
});

describe('"How the score works" says what the engine does (docs §110)', () => {
  const snapshot = (over: Partial<ProfileSnapshot>): ProfileSnapshot => ({
    userId: Math.random().toString(36), profileId: 'p', role: 'founder', displayName: 'x', headline: null, bio: null,
    location: null, timezone: null, skillNames: [], rolePayload: null, updatedAtMs: 0, ...over,
  });

  it('lists six parts that add up to 100, with the engine’s own maxima', () => {
    const parts = matchScoreParts();
    expect(parts.map((p) => p.max)).toEqual(Object.values(MATCH_SCORE_WEIGHTS));
    expect(parts.reduce((n, p) => n + p.max, 0)).toBe(100);
  });

  it('quotes the partial points the engine actually gives', () => {
    const role = matchScoreParts().find((p) => p.key === 'role')!;
    const notSought = Math.floor(MATCH_SCORE_WEIGHTS.roleComplementarity * MATCH_SCORE_PARTIAL.roleNotSought);
    expect(role.howEl).toContain(`${notSought} όταν δεν καλύπτει`);
    // The engine gives exactly that to a founder who is not what the reader looks for.
    const scored = computeMatchScore(snapshot({ rolePayload: { rolesSought: ['Designer'] } }), snapshot({ skillNames: ['Sales'] }));
    expect(scored.breakdown.roleComplementarity).toBe(notSought);
    const stage = matchScoreParts().find((p) => p.key === 'stage')!;
    const adjacent = Math.floor(MATCH_SCORE_WEIGHTS.stageAlignment * MATCH_SCORE_PARTIAL.stageAdjacent);
    expect(stage.howEn).toContain(`: ${adjacent}.`);
    expect(computeMatchScore(snapshot({ rolePayload: { stage: 'idea' } }), snapshot({ rolePayload: { stage: 'mvp' } })).breakdown.stageAlignment).toBe(adjacent);
  });
});
