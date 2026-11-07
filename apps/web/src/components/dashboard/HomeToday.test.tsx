import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Milestone } from '@/lib/api';
import type { CommitmentThreadSummary } from '@/lib/commitments-api';
import type { FollowUpLead } from '@/lib/follow-ups';
import { nowStartingPoints } from '@/lib/home-ask';
import { liveNotices, type LiveNotice } from '@/components/notifications/LiveNotices';
import { HomeToday, todayRows } from './HomeToday';

const ask = vi.fn();
const counts = vi.hoisted(() => ({ messages: 0, intros: 0, notifications: 0 }));
const live = vi.hoisted(() => ({ notices: [] as LiveNotice[], followUps: [] as FollowUpLead[] }));
vi.mock('@/components/notifications/LiveNotices', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/notifications/LiveNotices')>()),
  useLiveNotices: () => live,
}));
vi.mock('@/components/common/BilingualText', () => ({ BilingualText: ({ en }: { en: string }) => <span>{en}</span> }));
vi.mock('@/components/icons/CfbGlyph', () => ({ CfbGlyph: () => <svg /> }));
vi.mock('@/hooks/useAskAssistant', () => ({ useAskAssistant: () => ({ ask }) }));
vi.mock('@/hooks/useUnreadCounts', () => ({ useUnreadCounts: () => counts }));
vi.mock('next/link', () => ({ default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => <a href={href} className={className}>{children}</a> }));

afterEach(() => { cleanup(); vi.clearAllMocks(); Object.assign(counts, { messages: 0, intros: 0, notifications: 0 }); Object.assign(live, { notices: [], followUps: [] }); });

const late = { id: 'm1', title: 'Ship the beta', status: 'todo', dueDate: '2020-01-01' } as Milestone;
const thread = { id: 't1', cardId: 'c1', step: 'interest', role: 'owner', counterpart: { displayName: 'Elena' } } as unknown as CommitmentThreadSummary;
const lead = { name: 'Atlas Ventures' } as FollowUpLead;
const full = () => todayRows(
  liveNotices({ followUps: [lead], milestones: [late], threads: [thread] }),
  nowStartingPoints({ messages: 2, intros: 1, notifications: 3, followUps: 1 }),
);

describe('today, in one order', () => {
  it('puts a person first, then what has a date, and leaves nothing out', () => {
    expect(full().map((row) => row.key)).toEqual(['commitment', 'now-intros', 'follow-up', 'now-messages', 'milestone', 'now-notifications']);
  });

  it('says the follow-up once, with the name, not twice', () => {
    const rows = full();
    expect(rows.filter((row) => /follow-up/i.test(row.en))).toHaveLength(1);
    expect(rows.find((row) => row.key === 'follow-up')?.en).toContain('Atlas Ventures');
  });

  it('keeps the question the chip used to ask', () => {
    expect(full().find((row) => row.key === 'now-messages')?.ask.en).toContain('unread messages');
    expect(full().find((row) => row.key === 'follow-up')?.ask.en).toContain('follow-ups');
  });

  it('shows nothing on a day with nothing waiting', () => {
    const { container } = render(<HomeToday />);
    expect(container.firstChild).toBeNull();
  });

  it('opens the page from the row and asks from the button', () => {
    Object.assign(counts, { messages: 2 });
    live.notices = liveNotices({ followUps: [], milestones: [late], threads: [] });
    render(<HomeToday />);
    expect(screen.getByText('Unread messages').closest('a')?.getAttribute('href')).toBe('/messages');
    expect(screen.getByText('2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ask about: Overdue milestone/ }));
    expect(ask).toHaveBeenCalledWith(expect.objectContaining({ en: expect.stringContaining('Ship the beta') }));
  });
});
