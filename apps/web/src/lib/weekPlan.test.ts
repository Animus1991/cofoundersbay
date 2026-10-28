import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = vi.hoisted(() => ({
  milestones: [] as Array<Record<string, unknown>>,
  events: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  requests: 0,
}));
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    listMilestones: vi.fn(async () => ({ milestones: data.milestones, nextCursor: null, total: data.milestones.length })),
    listEvents: vi.fn(async () => ({ events: data.events })),
    listNotifications: vi.fn(async () => ({ notifications: data.notifications, nextCursor: null })),
    listConnectionRequests: vi.fn(async () => ({ connections: Array.from({ length: data.requests }, (_, i) => ({ id: `c${i}` })) })),
  };
});

import { getActionSpec } from '@/lib/action-registry';
import { runCopilotTurn } from '@/lib/copilot-engine';
import { wantsWeekPlan, weekActions, weekFacts } from '@/lib/week-plan';
import type { EventItem, Milestone } from '@/lib/api';

const NOW = Date.parse('2026-10-28T09:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number) => new Date(NOW + offsetDays * DAY).toISOString();
const milestone = (id: string, status: string, dueInDays: number | null) => ({ id, title: `M ${id}`, status, dueDate: dueInDays === null ? null : iso(dueInDays) });
const ids = (prefix: string) => `${prefix}-x`;

beforeEach(() => {
  data.milestones = [milestone('a', 'todo', 2), milestone('b', 'in_progress', 3), milestone('c', 'todo', -4), milestone('d', 'todo', 20), milestone('e', 'completed', 1)];
  data.events = [{ id: 'ev1', title: 'Demo night', startAt: iso(1) }, { id: 'ev2', title: 'Later', startAt: iso(12) }];
  data.notifications = [{ id: 'n1', type: 'founder_update', readAt: null }, { id: 'n2', type: 'connection_request', readAt: null }];
  data.requests = 1;
  window.localStorage.clear();
  window.localStorage.setItem('user', JSON.stringify({ id: 'u-1' }));
});

describe('«Ετοίμασε την εβδομάδα μου» (docs §107.7-3, §111)', () => {
  it('is asked for by name, in either language, and not by "show my week"', () => {
    expect(wantsWeekPlan('Ετοίμασε την εβδομάδα μου')).toBe(true);
    expect(wantsWeekPlan('Prepare my week')).toBe(true);
    expect(wantsWeekPlan('Τι έχω αυτή την εβδομάδα;')).toBe(false);
  });

  it('counts the next seven days: due, overdue, events, and what waits', () => {
    const facts = weekFacts({
      milestones: data.milestones as unknown as Milestone[],
      events: data.events as unknown as EventItem[],
      notifications: data.notifications as Array<{ type: string; readAt: string | null }>,
      requests: 1,
    }, NOW);
    expect(facts.due.map((m) => m.id)).toEqual(['a', 'b']);
    expect(facts.overdue.map((m) => m.id)).toEqual(['c']);
    expect(facts.events.map((e) => e.id)).toEqual(['ev1']);
    expect(facts.notifications).toEqual({ clear: 1, keep: 1 });
  });

  it('proposes at most four actions, every one of them reversible, under one title', () => {
    const facts = weekFacts({ milestones: Array.from({ length: 8 }, (_, i) => milestone(`m${i}`, 'todo', 1)) as unknown as Milestone[], events: [], notifications: data.notifications as Array<{ type: string; readAt: string | null }>, requests: 0 }, NOW);
    const actions = weekActions(facts, 'el', ids);
    expect(actions.length).toBe(4);
    expect(actions[0].tool).toBe('triage_notifications');
    for (const action of actions) {
      expect(getActionSpec(action.tool)?.reversal?.kind).toBe('full');
      expect(action.group?.id).toBe('week');
      expect(action.status).toBe('pending');
    }
  });

  it('answers with the week in figures and the grouped card', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    try {
      const turn = await runCopilotTurn('Ετοίμασε την εβδομάδα μου');
      expect(turn.message).toMatch(/Οι επόμενες 7 ημέρες/);
      expect(turn.message).toMatch(/Λήγουν 2 ορόσημα: M a/);
      expect(turn.message).toMatch(/1 εκπρόθεσμο: M c/);
      expect(turn.message).toMatch(/1 εκδήλωση: Demo night/);
      expect(turn.message).toMatch(/Σας περιμένουν: 1 ειδοποίηση και 1 αίτημα σύνδεσης/);
      // Triage, then the overdue milestone, then the one due this week; the one already started is left alone.
      expect(turn.actions.map((a) => a.tool)).toEqual(['triage_notifications', 'update_milestone_status', 'update_milestone_status']);
      expect(turn.actions.map((a) => a.payload.milestoneId).filter(Boolean)).toEqual(['c', 'a']);
      expect(new Set(turn.actions.map((a) => a.group?.title)).size).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('says so when the week is quiet, with nothing to confirm', async () => {
    data.milestones = [];
    data.events = [];
    data.notifications = [];
    data.requests = 0;
    const turn = await runCopilotTurn('Prepare my week');
    expect(turn.actions).toEqual([]);
    expect(turn.message).toMatch(/Your week is quiet/);
  });
});
