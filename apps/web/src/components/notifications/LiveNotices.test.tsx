import { describe, expect, it } from 'vitest';
import type { Milestone } from '@/lib/api';
import type { CommitmentThreadSummary } from '@/lib/commitments-api';
import type { FollowUpLead } from '@/lib/follow-ups';
import { isMilestoneOverdue } from '@/lib/milestone-order';
import { liveNotices } from './LiveNotices';

const milestone = (over: Partial<Milestone>) => ({ id: 'm1', title: 'Ship the beta', status: 'todo', dueDate: '2020-01-01', ...over }) as Milestone;
const thread = (id: string) => ({
  id, cardId: 'card-1', step: 'interest', role: 'owner', counterpart: { displayName: 'Elena' },
}) as unknown as CommitmentThreadSummary;
const lead = { name: 'Atlas Ventures', nameEl: 'Atlas Ventures' } as FollowUpLead;

describe('what is due now, worked out from the data', () => {
  it('says nothing when nothing is due', () => {
    expect(liveNotices({ followUps: [], milestones: [], threads: [] })).toEqual([]);
  });

  it('counts a past date on open work, and not finished, cancelled or undated work', () => {
    expect(isMilestoneOverdue(milestone({}))).toBe(true);
    expect(isMilestoneOverdue(milestone({ status: 'completed' }))).toBe(false);
    expect(isMilestoneOverdue(milestone({ status: 'cancelled' }))).toBe(false);
    expect(isMilestoneOverdue(milestone({ dueDate: null }))).toBe(false);
  });

  it('does not call a milestone late on the day it is due', () => {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(isMilestoneOverdue(milestone({ dueDate: date }))).toBe(false);
  });

  it('leads with a person, then the investor, then the milestone', () => {
    const notices = liveNotices({ followUps: [lead], milestones: [milestone({})], threads: [thread('t1')] });
    expect(notices.map((notice) => notice.key)).toEqual(['commitment', 'follow-up', 'milestone']);
    expect(notices[0].href).toBe('/commitments/card-1?thread=t1');
    expect(notices[2].el).toBe('Εκπρόθεσμο ορόσημο: Ship the beta');
  });

  it('goes to the list when there is more than one', () => {
    const notices = liveNotices({ followUps: [], milestones: [milestone({}), milestone({ id: 'm2' })], threads: [thread('t1'), thread('t2')] });
    expect(notices[0]).toMatchObject({ href: '/commitments', el: 'Δεσμεύσεις που σας περιμένουν: 2' });
    expect(notices[1]).toMatchObject({ href: '/milestones', en: '2 milestones are overdue' });
  });
});
