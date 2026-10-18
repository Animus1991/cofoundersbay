import { beforeEach, describe, expect, it } from 'vitest';
import { findContactDetails, sameSkill } from '@cofounderbay/shared';
import { resolvePreviewApi } from '../preview-api';
import { previewSkillEvidenceApi, resetDemoSkillEvidence } from './skill-evidence-world';
import { DEMO_ENDORSEMENTS, DEMO_MEMBER_ID } from './endorsements-world';
import { DemoRefusal } from './demo-refusal';
import { previewNotificationPrefsApi, resetDemoDigest } from './notification-prefs-world';

/**
 * Two demo reads that used to fall through to the generic fallback.
 *
 * Endorsements: /endorsements showed two rows waiting for approval while the
 * assistant (which reads `/endorsements/stats` and `/pending`) said nothing was
 * waiting and the own profile counted none. Every surface now reads the same
 * rows, with the real endpoints' visibility rules.
 *
 * Email digest: `GET /notifications/preferences` carried no value, so the
 * Settings switch snapped back after every change.
 */

type Item = {
  id: string;
  fromUserId: string;
  fromUser: { id: string; displayName: string; headline: string | null };
  toUserId: string;
  toUser?: { id: string; displayName: string };
  skill: string | null;
  isApproved: boolean;
  basis: string[];
  createdAt: string;
};
const read = (path: string) => resolvePreviewApi(path) as { endorsements: Item[] };
const ids = (r: { endorsements: Item[] }) => r.endorsements.map((e) => e.id);

describe('the endorsement reads in the demo', () => {
  it('counts what the page shows: two waiting, two shown, two written', () => {
    expect(resolvePreviewApi('/api/endorsements/stats')).toEqual({ stats: { total: 2, pending: 2, given: 2 } });
  });

  it('lists what waits for the member, newest first, with who wrote it', () => {
    const pending = read('/api/endorsements/pending');
    expect(ids(pending)).toEqual(['sample-end-1', 'sample-end-2']);
    expect(pending.endorsements.map((e) => e.fromUser.displayName)).toEqual(['Elena Papadopoulos', 'Marcus Chen']);
    expect(pending.endorsements.every((e) => e.toUserId === DEMO_MEMBER_ID && !e.isApproved)).toBe(true);
    // The recipient's own list carries the writer, not a second `toUser`.
    expect(pending.endorsements[0]).not.toHaveProperty('toUser');
  });

  it('lists what the member wrote, approved or not, with who it was for', () => {
    const given = read('/api/endorsements/given');
    expect(ids(given)).toEqual(['sample-end-5', 'sample-end-6']);
    expect(given.endorsements.map((e) => e.toUser?.displayName)).toEqual(['Marcus Chen', 'Elena Papadopoulos']);
    expect(given.endorsements.map((e) => e.isApproved)).toEqual([false, true]);
  });

  it('shows the member their own waiting ones only when they ask about themselves', () => {
    expect(ids(read(`/api/endorsements/user/${DEMO_MEMBER_ID}`))).toEqual(['sample-end-3', 'sample-end-4']);
    expect(ids(read(`/api/endorsements/user/${DEMO_MEMBER_ID}?includeUnapproved=true`))).toEqual(['sample-end-1', 'sample-end-2', 'sample-end-3', 'sample-end-4']);
    // `me` is the member too, as the page's own samples spell it.
    expect(ids(read('/api/endorsements/user/me?includeUnapproved=true'))).toHaveLength(4);
  });

  it('never shows anyone else an endorsement that has not been approved', () => {
    // Alex's note for Marcus is still waiting for him: Elena's is the only one his profile shows.
    expect(ids(read('/api/endorsements/user/user-marcus?includeUnapproved=true'))).toEqual(['sample-end-9']);
    expect(ids(read('/api/endorsements/user/user-marcus'))).toEqual(['sample-end-9']);
    // Elena's three are all approved, including the one Alex wrote.
    expect(ids(read('/api/endorsements/user/user-elena'))).toEqual(['sample-end-6', 'sample-end-7', 'sample-end-8']);
    // A person nobody has written for has an empty list, not the fallback.
    expect(read('/api/endorsements/user/user-nobody')).toEqual({ endorsements: [] });
  });

  it('keeps the numbers of one list and the other in step', () => {
    const stats = (resolvePreviewApi('/api/endorsements/stats') as { stats: { total: number; pending: number; given: number } }).stats;
    const mine = read(`/api/endorsements/user/${DEMO_MEMBER_ID}?includeUnapproved=true`);
    expect(mine.endorsements.length).toBe(stats.total + stats.pending);
    expect(read('/api/endorsements/given').endorsements.length).toBe(stats.given);
    expect(read('/api/endorsements/pending').endorsements.length).toBe(stats.pending);
  });

  it('answers only the four reads; a write is left to its own handler', () => {
    expect(resolvePreviewApi('/api/endorsements', { method: 'POST', body: JSON.stringify({ toUserId: 'user-elena', content: 'Worked with her for a season.' }) })).toMatchObject({
      endorsement: { fromUserId: DEMO_MEMBER_ID, toUserId: 'user-elena', isApproved: false },
    });
    expect(resolvePreviewApi('/api/endorsements/sample-end-1', { method: 'DELETE' })).toEqual({ ok: true });
  });
});

describe('the rows themselves', () => {
  it('have unique ids, real approval states and a basis only where the platform saw one', () => {
    expect(new Set(DEMO_ENDORSEMENTS.map((e) => e.id)).size).toBe(DEMO_ENDORSEMENTS.length);
    for (const e of DEMO_ENDORSEMENTS) {
      expect(e.from.id).not.toBe(e.to.id);
      expect(e.content.trim().length).toBeGreaterThanOrEqual(10);
      expect(e.content.length).toBeLessThanOrEqual(1000);
    }
    // The real API refuses a second endorsement from the same person to the same person.
    const pairs = DEMO_ENDORSEMENTS.map((e) => `${e.from.id}>${e.to.id}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it('carry no contact details: an endorsement is public text', () => {
    for (const e of DEMO_ENDORSEMENTS) expect(findContactDetails(e.content), e.id).toEqual([]);
  });
});

describe('the skill panel and the recommendations say the same thing', () => {
  beforeEach(() => resetDemoSkillEvidence());

  const NOW = Date.parse('2026-10-07T09:00:00Z');
  const skillsOf = (userId: string) =>
    (previewSkillEvidenceApi(`/api/skill-evidence/user/${userId}`, 'GET', {}, NOW) as { skills: Array<{ name: string; endorsements: number; verifiedEndorsements: number }> }).skills;
  const approvedFor = (userId: string) => read(`/api/endorsements/user/${userId}`).endorsements.filter((e) => e.skill);

  it.each(['user-elena', 'user-marcus'])('counts %s the way the approved endorsements add up', (userId) => {
    for (const skill of skillsOf(userId)) {
      const rows = approvedFor(userId).filter((e) => sameSkill(e.skill ?? '', skill.name));
      expect(skill.endorsements, `${userId} · ${skill.name}`).toBe(rows.length);
      expect(skill.verifiedEndorsements, `${userId} · ${skill.name} (verified)`).toBe(rows.filter((e) => e.basis.length > 0).length);
    }
  });

  it('lists every skill the member was endorsed for, once approved', () => {
    const names = skillsOf(DEMO_MEMBER_ID).map((s) => s.name);
    for (const e of approvedFor(DEMO_MEMBER_ID)) {
      const hit = names.find((n) => sameSkill(n, e.skill ?? ''));
      expect(hit, `${e.skill} is endorsed and approved`).toBeTruthy();
    }
  });
});

describe('the email digest in the demo', () => {
  beforeEach(() => resetDemoDigest());
  const prefs = (method = 'GET', body: Record<string, unknown> = {}) =>
    previewNotificationPrefsApi('/api/notifications/preferences', method, body) as Record<string, unknown>;

  it('starts at never, because no stored choice means no email', () => {
    expect(prefs()).toEqual({ digestFrequency: 'never' });
    expect(resolvePreviewApi('/api/notifications/preferences')).toEqual({ digestFrequency: 'never' });
  });

  it('keeps the member’s choice, so the switch stays where they put it', () => {
    expect(prefs('PATCH', { digestFrequency: 'weekly' })).toEqual({ ok: true });
    expect(prefs()).toEqual({ digestFrequency: 'weekly' });
    expect(resolvePreviewApi('/api/notifications/preferences', { method: 'PATCH', body: JSON.stringify({ digestFrequency: 'daily' }) })).toEqual({ ok: true });
    expect(resolvePreviewApi('/api/notifications/preferences')).toEqual({ digestFrequency: 'daily' });
    expect(prefs('PATCH', { digestFrequency: 'never' })).toEqual({ ok: true });
    expect(prefs()).toEqual({ digestFrequency: 'never' });
  });

  it('refuses a value the API would refuse, and a body with none changes nothing', () => {
    prefs('PATCH', { digestFrequency: 'monthly' });
    expect(() => prefs('PATCH', { digestFrequency: 'hourly' })).toThrow(DemoRefusal);
    expect(prefs()).toEqual({ digestFrequency: 'monthly' });
    expect(prefs('PATCH', {})).toEqual({ ok: true });
    expect(prefs()).toEqual({ digestFrequency: 'monthly' });
  });

  it('answers nothing for another path or method', () => {
    expect(previewNotificationPrefsApi('/api/notifications', 'GET', {})).toBeUndefined();
    expect(previewNotificationPrefsApi('/api/notifications/preferences', 'DELETE', {})).toBeUndefined();
  });
});
