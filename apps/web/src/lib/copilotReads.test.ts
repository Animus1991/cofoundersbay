import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getEndorsementStats,
  getMilestoneSummary,
  getMyGroups,
  getPendingEndorsements,
  getUpcomingMentorshipSessions,
  listEvents,
  listJobs,
  listMilestones,
  listOpportunities,
  listResearchBoards,
  listShortlist,
} from '@/lib/api';
import { getWorkspaces } from '@/lib/builder-api';
import { listActionIds, getActionDeclaration } from '@cofounderbay/shared';
import { AREA_READERS, isAreaRead } from './copilot-reads';
import { replyLocaleFor, runCopilotTurn } from './copilot-engine';
import { translate } from './i18n/translate';

/**
 * The area reads, from both ends.
 *
 * What is asserted: each reader turns the same client call its page makes into
 * an answer with a next step; a list that arrives as something other than a list
 * is an empty answer rather than a thrown `.map`; and a read the *model* asks for
 * runs through the engine exactly as a keyword match does, which is the half of
 * the loop that did not exist.
 */

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  listEvents: vi.fn(),
  getMilestoneSummary: vi.fn(),
  listMilestones: vi.fn(),
  listJobs: vi.fn(),
  getMyGroups: vi.fn(),
  getEndorsementStats: vi.fn(),
  getPendingEndorsements: vi.fn(),
  listOpportunities: vi.fn(),
  getUpcomingMentorshipSessions: vi.fn(),
  listShortlist: vi.fn(),
  listResearchBoards: vi.fn(),
}));
vi.mock('@/lib/builder-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/builder-api')>()),
  getWorkspaces: vi.fn(),
}));

const en = { t: (s: string, v?: Record<string, string | number>) => translate('en', s, v), locale: 'en' };
const el = { t: (s: string, v?: Record<string, string | number>) => translate('el', s, v), locale: 'el' };

beforeEach(() => {
  vi.mocked(listEvents).mockReset();
  vi.mocked(getMilestoneSummary).mockReset();
  vi.mocked(listMilestones).mockReset();
  vi.mocked(listJobs).mockReset();
  vi.mocked(getMyGroups).mockReset();
  vi.mocked(getEndorsementStats).mockReset();
  vi.mocked(getPendingEndorsements).mockReset();
  vi.mocked(listOpportunities).mockReset();
  vi.mocked(getUpcomingMentorshipSessions).mockReset();
  vi.mocked(listShortlist).mockReset();
  vi.mocked(listResearchBoards).mockReset();
  vi.mocked(getWorkspaces).mockReset();
});

describe('the reader map', () => {
  it('has a reader for every declared read the engine does not own itself', () => {
    const engineOwned = new Set(['get_graph', 'search_people', 'get_recommendations', 'get_notifications']);
    const declaredReads = listActionIds().filter(
      (id) => getActionDeclaration(id)?.kind === 'read' && !engineOwned.has(id),
    );
    expect(declaredReads.length).toBeGreaterThan(0);
    expect(declaredReads.filter((id) => !isAreaRead(id))).toEqual([]);
  });
});

describe('reading events', () => {
  it('lists upcoming events with their details and offers the page', async () => {
    vi.mocked(listEvents).mockResolvedValue({
      events: [
        {
          id: 'e1', title: 'Athens Demo Day', description: '', eventType: 'demo_day', mode: 'in-person',
          startAt: '2026-10-02T15:00:00Z', endAt: '2026-10-02T18:00:00Z', timezone: null, location: 'Athens',
          isOnline: false, meetingUrl: null, capacity: null, coverImageUrl: null, attendeesCount: 42,
          host: { id: 'h', displayName: 'Host', avatarUrl: null, role: 'org' }, viewerRsvp: 'going',
        },
      ],
    });

    const read = await AREA_READERS.get_events({}, en);

    expect(vi.mocked(listEvents)).toHaveBeenCalledWith(expect.objectContaining({ scope: 'upcoming' }));
    expect(read.section).toContain('Upcoming events:');
    expect(read.section).toContain('**Athens Demo Day**');
    expect(read.section).toContain('42 attending');
    expect(read.section).toContain('in person');
    expect(read.section).toContain('you are going');
    expect(read.citations).toEqual([expect.objectContaining({ type: 'event', id: 'e1' })]);
    expect(read.actions).toEqual([expect.objectContaining({ tool: 'navigate', href: '/events' })]);
  });

  it('says so, with the page still offered, when there are none', async () => {
    vi.mocked(listEvents).mockResolvedValue({ events: [] });
    const read = await AREA_READERS.get_events({}, en);
    expect(read.section).toBe('No upcoming events right now.');
    expect(read.actions).toHaveLength(1);
  });

  it('treats a response that is not a list as empty instead of throwing', async () => {
    // The preview shim answers an endpoint it does not model with a truthy
    // object; `?? []` lets that through to `.map` and throws.
    vi.mocked(listEvents).mockResolvedValue({ events: { ok: true } } as never);
    await expect(AREA_READERS.get_events({}, en)).resolves.toMatchObject({ section: 'No upcoming events right now.' });
  });

  it('answers in Greek for a Greek reader', async () => {
    vi.mocked(listEvents).mockResolvedValue({ events: [] });
    const read = await AREA_READERS.get_events({}, el);
    expect(read.section).toBe('Δεν υπάρχουν επερχόμενες εκδηλώσεις αυτή τη στιγμή.');
  });
});

describe('reading milestones', () => {
  it('leads with the counts, then lists open milestones soonest first with undated ones last', async () => {
    vi.mocked(getMilestoneSummary).mockResolvedValue({
      counts: { todo: 2, in_progress: 1, blocked: 0, completed: 3, cancelled: 0 },
      total: 6, overdue: 1, dueSoon: 2, completionRate: 50,
    });
    const base = {
      ownerId: 'me', collaboratorId: null, collaborator: null, description: null, priority: 'medium' as const,
      category: null, completedAt: null, progress: 20, notes: null, createdAt: '', updatedAt: '',
    };
    vi.mocked(listMilestones).mockResolvedValue({
      milestones: [
        { ...base, id: 'undated', title: 'Undated', status: 'todo', dueDate: null },
        { ...base, id: 'later', title: 'Later', status: 'todo', dueDate: '2026-12-01T00:00:00Z' },
        { ...base, id: 'done', title: 'Done already', status: 'completed', dueDate: '2026-09-01T00:00:00Z' },
        { ...base, id: 'soon', title: 'Soon', status: 'in_progress', dueDate: '2026-10-01T00:00:00Z' },
      ],
      nextCursor: null,
      total: 4,
    });

    const read = await AREA_READERS.get_milestones({}, en);

    expect(read.section).toContain('3 of 6 milestones complete (50%).');
    expect(read.section).toContain('1 overdue, 2 due soon.');
    expect(read.section).not.toContain('Done already');
    const order = ['Soon', 'Later', 'Undated'].map((title) => read.section.indexOf(`**${title}**`));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('suggests setting some when there are none', async () => {
    vi.mocked(getMilestoneSummary).mockResolvedValue({
      counts: { todo: 0, in_progress: 0, blocked: 0, completed: 0, cancelled: 0 },
      total: 0, overdue: 0, dueSoon: 0, completionRate: 0,
    });
    vi.mocked(listMilestones).mockResolvedValue({ milestones: [], nextCursor: null, total: 0 });
    const read = await AREA_READERS.get_milestones({}, en);
    expect(read.section).toMatch(/^No milestones yet\./);
  });
});

describe('reading endorsements', () => {
  it('states the totals and names what is waiting for approval', async () => {
    vi.mocked(getEndorsementStats).mockResolvedValue({ stats: { total: 5, pending: 1, given: 2 } });
    vi.mocked(getPendingEndorsements).mockResolvedValue({
      endorsements: [
        {
          id: 'n1', fromUserId: 'u2', fromUser: { id: 'u2', displayName: 'Elena', avatarUrl: null, headline: null },
          toUserId: 'me', skill: 'Go-to-market', content: '…', relationship: null, isPublic: true, isApproved: false,
          createdAt: '',
        },
      ],
    });
    const read = await AREA_READERS.get_endorsements({}, en);
    expect(read.section).toContain('Endorsements: 5 received, 2 given.');
    expect(read.section).toContain('1 waiting for your approval');
    expect(read.section).toContain('**Go-to-market** — from Elena');
  });
});

describe('reading research boards', () => {
  it('lists active boards with their node counts and offers the page', async () => {
    vi.mocked(listResearchBoards).mockResolvedValue({
      boards: [
        {
          id: 'b1', ownerId: 'me', title: 'Athens TAM', description: null, visibility: 'private',
          canvasState: null, tags: [], color: null, icon: null, isPinned: true, isArchived: false,
          nodeCount: 12, createdAt: '', updatedAt: '',
        },
        {
          id: 'b2', ownerId: 'me', title: 'Old', description: null, visibility: 'private',
          canvasState: null, tags: [], color: null, icon: null, isPinned: false, isArchived: true,
          nodeCount: 3, createdAt: '', updatedAt: '',
        },
      ],
    });

    const read = await AREA_READERS.get_research_boards({}, en);

    expect(read.section).toContain('Your research boards:');
    expect(read.section).toContain('**Athens TAM**');
    expect(read.section).toContain('12 nodes');
    expect(read.section).toContain('pinned');
    expect(read.section).not.toContain('Old');
    expect(read.citations).toEqual([expect.objectContaining({ type: 'research', id: 'b1', href: '/research/b1' })]);
    expect(read.actions).toEqual([expect.objectContaining({ tool: 'navigate', href: '/research' })]);
  });

  it('says so when there are none, and still offers the page', async () => {
    vi.mocked(listResearchBoards).mockResolvedValue({ boards: [] });
    const read = await AREA_READERS.get_research_boards({}, en);
    expect(read.section).toBe('No research boards yet.');
    expect(read.actions).toHaveLength(1);
  });
});

describe('reading Startup Builder workspaces', () => {
  it('lists active workspaces with readiness and offers Builder', async () => {
    vi.mocked(getWorkspaces).mockResolvedValue({
      data: [
        {
          id: 'w1', name: 'Helios', slug: 'helios', status: 'active', visibility: 'private',
          createdAt: '', updatedAt: '', owner: { id: 'me', displayName: 'Me' },
          documentCount: 4, overallReadiness: 62,
        },
      ],
      meta: { total: 1, page: 1, limit: 5, totalPages: 1, hasMore: false },
    } as Awaited<ReturnType<typeof getWorkspaces>>);

    const read = await AREA_READERS.get_builder_state({}, en);

    expect(read.section).toContain('Your workspaces:');
    expect(read.section).toContain('**Helios**');
    expect(read.section).toContain('4 documents');
    expect(read.section).toContain('readiness 62%');
    expect(read.citations).toEqual([expect.objectContaining({ type: 'workspace', id: 'w1' })]);
    expect(read.actions).toEqual([expect.objectContaining({ tool: 'navigate', href: '/builder' })]);
  });

  it('suggests creating one when there are none', async () => {
    vi.mocked(getWorkspaces).mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 5, totalPages: 0, hasMore: false },
    } as Awaited<ReturnType<typeof getWorkspaces>>);
    const read = await AREA_READERS.get_builder_state({}, en);
    expect(read.section).toMatch(/^No Startup Builder workspace yet\./);
  });
});

describe('a read the model asks for', () => {
  it('runs through the engine when passed as tools, without planning from the message', async () => {
    vi.mocked(listJobs).mockResolvedValue({
      jobs: [{ id: 'j1', title: 'Founding engineer', role: null, location: 'Athens', isRemote: true, creator: { displayName: 'Helios', avatarUrl: null } }],
    });

    // The message would plan nothing about jobs; the tools say what to run.
    const turn = await runCopilotTurn('carry on', { route: '/ai', locale: 'en' }, { tools: [{ name: 'get_jobs', args: {} }] });

    expect(turn.message).toContain('**Founding engineer**');
    expect(turn.message).toContain('remote');
    expect(turn.usedTools).toEqual(['get_jobs']);
  });

  it('names an area as unavailable rather than failing the whole reply', async () => {
    vi.mocked(getMyGroups).mockRejectedValue(new Error('503'));
    const turn = await runCopilotTurn('carry on', { route: '/ai', locale: 'en' }, { tools: [{ name: 'get_groups', args: {} }] });
    expect(turn.message).toBe('That part of the platform did not answer just now. Try again in a moment.');
  });

  it('does not hand the model the capability introduction as if it were data', async () => {
    vi.mocked(listShortlist).mockRejectedValue(new Error('x'));
    vi.mocked(getUpcomingMentorshipSessions).mockResolvedValue({ sessions: [] });
    const turn = await runCopilotTurn('', { route: '/ai', locale: 'en' }, { tools: [] });
    expect(turn.message).toBe('');
  });
});

describe('the language of the reply', () => {
  it('answers a Greek question in Greek when the interface is English', () => {
    expect(replyLocaleFor('ποια ορόσημα έχω;', 'en')).toBe('el');
    expect(replyLocaleFor('ποια ορόσημα έχω;', undefined)).toBe('el');
  });

  it('keeps any locale the reader chose other than English', () => {
    expect(replyLocaleFor('ποια ορόσημα έχω;', 'fr')).toBe('fr');
    expect(replyLocaleFor('which milestones are overdue', 'el')).toBe('el');
    expect(replyLocaleFor('which milestones are overdue', 'en')).toBe('en');
  });

  it('composes the area answer in Greek end to end', async () => {
    vi.mocked(getMilestoneSummary).mockResolvedValue({
      counts: { todo: 1, in_progress: 0, blocked: 0, completed: 1, cancelled: 0 },
      total: 2, overdue: 1, dueSoon: 0, completionRate: 50,
    });
    vi.mocked(listMilestones).mockResolvedValue({ milestones: [], nextCursor: null, total: 0 });
    const turn = await runCopilotTurn('ποια ορόσημα έχω;', { route: '/ai', locale: 'en' });
    expect(turn.message).toContain('1 από 2 ορόσημα ολοκληρωμένα (50%).');
    expect(turn.message).toContain('1 εκπρόθεσμα');
  });
});
