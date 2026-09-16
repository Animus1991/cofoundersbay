import type { ReadActionId } from '@cofounderbay/shared';
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
  type EndorsementItem,
  type EventItem,
  type GroupView,
  type JobPostingView,
  type MentorshipSessionItem,
  type Milestone,
  type OpportunityItem,
  type ResearchBoard,
  type ShortlistItem,
} from '@/lib/api';
import { getWorkspaces, type BuilderWorkspace } from '@/lib/builder-api';
import type { CopilotAction, CopilotCitation } from '@/lib/copilot-types';
import type { TranslateVars } from '@/lib/i18n/translate';

/**
 * What the assistant can read about the product areas it used to be blind to.
 *
 * Before this module it could read four things — the graph summary, people,
 * matches and notifications. Asked "what events are coming up" or "which of my
 * milestones are overdue", the best it could do was offer to open the page.
 * Each reader here calls the same client function the area’s own screen calls,
 * so what the assistant says and what the page shows cannot disagree.
 *
 * The four older reads stay in `copilot-engine.ts`. Their results feed the
 * writes planned beside them in the same turn — a person found by
 * `search_people` is who `send_connection` connects to — and moving them would
 * mean threading that state through a boundary for no gain.
 *
 * Every sentence goes through `t`, and `copilotStrings.test.ts` scans this file
 * as well as the engine, so a reply cannot slide back into English-only.
 */

export type Translator = (source: string, vars?: TranslateVars) => string;

export type ReadContext = {
  t: Translator;
  /** The reader’s locale, for dates. Copy is already bound into `t`. */
  locale?: string;
};

export type ReadResult = {
  /** One block of prose, already in the reader’s language. */
  section: string;
  citations: CopilotCitation[];
  actions: CopilotAction[];
};

type Reader = (args: Record<string, string>, ctx: ReadContext) => Promise<ReadResult>;

/** The reads the engine has always owned; everything else is keyed here. */
type EngineReadId = 'get_graph' | 'search_people' | 'get_recommendations' | 'get_notifications';

export type AreaReadId = Exclude<ReadActionId, EngineReadId>;

/** How many items a reply lists. Past this a bullet list stops being an answer. */
const LIMIT = 5;

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Every list read guards with `Array.isArray`, not `?? []`.
 *
 * `?? []` guards nullishness and nothing else. The preview shim answers an
 * endpoint it does not model with a truthy grab-bag object, and a paginated
 * envelope is an object too — both pass `??` and throw on the first `.map`.
 * That exact failure crashed three admin pages before the guard was changed
 * there; the assistant should not rediscover it one read at a time.
 */
function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const LOCALE_TAG: Record<string, string> = { en: 'en-GB', el: 'el-GR' };

/**
 * A date and, where it matters, a time — in the reader’s own time zone.
 *
 * Elsewhere dates are pinned to UTC so a server render and a hydrating client
 * agree. That concern does not reach here: the engine runs in the browser in
 * response to a message, never during a render, and an event at 18:00 Athens
 * time shown as 15:00 would be a wrong answer rather than a consistent one.
 */
function formatWhen(iso: string | null | undefined, locale: string | undefined, withTime: boolean): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const tag = (locale && LOCALE_TAG[locale]) || locale || 'en-GB';
  try {
    return date.toLocaleString(tag, {
      day: 'numeric',
      month: 'short',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  } catch {
    return date.toISOString().slice(0, withTime ? 16 : 10).replace('T', ' ');
  }
}

/** A card that takes the reader to the area, so an answer always has a next step. */
function openArea(t: Translator, href: string, title: string, description: string): CopilotAction {
  return {
    id: newId('nav'),
    tool: 'navigate',
    title,
    description,
    confirmLabel: t('Open'),
    payload: { href },
    status: 'pending',
    href,
  };
}

const EVENT_MODE: Record<string, string> = {
  online: 'online',
  'in-person': 'in person',
  hybrid: 'hybrid',
};

const SESSION_MODE: Record<string, string> = {
  video: 'video call',
  in_person: 'in person',
  chat: 'chat',
};

const OPPORTUNITY_TYPE: Record<string, string> = {
  job: 'Job',
  cofounder: 'Co-founder',
  investment: 'Investment',
  partnership: 'Partnership',
  mentorship: 'Mentorship',
  other: 'Other',
};

export const AREA_READERS: Record<AreaReadId, Reader> = {
  async get_events(args, { t, locale }) {
    const result = await listEvents({ scope: 'upcoming', limit: LIMIT, ...(args.q ? { q: args.q } : {}) });
    const events = asList<EventItem>(result?.events).slice(0, LIMIT);
    const actions = [openArea(t, '/events', t('Open events'), t('See every event and RSVP.'))];

    if (events.length === 0) {
      return { section: t('No upcoming events right now.'), citations: [], actions };
    }

    const citations: CopilotCitation[] = [];
    const lines = events.map((event) => {
      citations.push({ type: 'event', id: event.id, label: event.title, href: `/events/${event.id}` });
      const details = [
        formatWhen(event.startAt, locale, true),
        EVENT_MODE[event.mode] ? t(EVENT_MODE[event.mode]) : '',
        typeof event.attendeesCount === 'number' ? t('{count} attending', { count: event.attendeesCount }) : '',
        event.viewerRsvp === 'going'
          ? t('you are going')
          : event.viewerRsvp === 'interested'
            ? t('you are interested')
            : '',
      ].filter(Boolean);
      return `• **${event.title}** — ${details.join(' · ')}`;
    });

    return { section: `${t('Upcoming events:')}\n${lines.join('\n')}`, citations, actions };
  },

  async get_milestones(_args, { t, locale }) {
    // Both requests run together; the summary alone cannot say *which*
    // milestone is next, and the list alone cannot say how many are overdue.
    const [summary, list] = await Promise.all([
      getMilestoneSummary(),
      listMilestones({ limit: 50 }),
    ]);
    const actions = [openArea(t, '/milestones', t('Open milestones'), t('Track, reorder and complete them.'))];

    const total = typeof summary?.total === 'number' ? summary.total : 0;
    if (total === 0) {
      return {
        section: t(
          'No milestones yet. Two or three for the next month give the rest of the platform something to plan around.',
        ),
        citations: [],
        actions,
      };
    }

    const done = summary?.counts?.completed ?? 0;
    const rate = Math.round(typeof summary?.completionRate === 'number' ? summary.completionRate : (done / total) * 100);
    const parts = [
      t('{done} of {total} milestones complete ({rate}%).', { done, total, rate }),
      t('{overdue} overdue, {soon} due soon.', { overdue: summary?.overdue ?? 0, soon: summary?.dueSoon ?? 0 }),
    ];

    // Open ones only, soonest first; an undated milestone sorts last rather
    // than first, because "no deadline" is not "most urgent".
    const open = asList<Milestone>(list?.milestones)
      .filter((m) => m.status !== 'completed' && m.status !== 'cancelled')
      .sort((a, b) => (a.dueDate ? Date.parse(a.dueDate) : Infinity) - (b.dueDate ? Date.parse(b.dueDate) : Infinity))
      .slice(0, LIMIT);

    const citations: CopilotCitation[] = [];
    if (open.length) {
      const lines = open.map((m) => {
        citations.push({ type: 'milestone', id: m.id, label: m.title, href: '/milestones' });
        const details = [
          typeof m.progress === 'number' ? `${m.progress}%` : '',
          m.dueDate ? t('due {date}', { date: formatWhen(m.dueDate, locale, false) }) : '',
        ].filter(Boolean);
        return `• **${m.title}**${details.length ? ` — ${details.join(' · ')}` : ''}`;
      });
      parts.push(`${t('Next up:')}\n${lines.join('\n')}`);
    }

    return { section: parts.join(' '), citations, actions };
  },

  async get_jobs(_args, { t }) {
    const result = await listJobs({ limit: LIMIT });
    const jobs = asList<JobPostingView>(result?.jobs).slice(0, LIMIT);
    const actions = [openArea(t, '/jobs', t('Open jobs'), t('Browse and apply.'))];

    if (jobs.length === 0) {
      return { section: t('No open roles right now.'), citations: [], actions };
    }

    const citations: CopilotCitation[] = [];
    const lines = jobs.map((job) => {
      citations.push({ type: 'job', id: job.id, label: job.title, href: job.href ?? `/jobs/${job.id}` });
      const details = [
        job.creator?.displayName ? t('posted by {name}', { name: job.creator.displayName }) : '',
        job.location ?? '',
        job.isRemote ? t('remote') : '',
      ].filter(Boolean);
      return `• **${job.title}**${details.length ? ` — ${details.join(' · ')}` : ''}`;
    });

    return { section: `${t('Open roles:')}\n${lines.join('\n')}`, citations, actions };
  },

  async get_groups(_args, { t }) {
    const result = await getMyGroups();
    const groups = asList<GroupView>(result?.groups).slice(0, LIMIT);
    const actions = [openArea(t, '/groups', t('Open communities'), t('Join one or start your own.'))];

    if (groups.length === 0) {
      return { section: t('You are not in a community yet.'), citations: [], actions };
    }

    const citations: CopilotCitation[] = [];
    const lines = groups.map((group) => {
      citations.push({ type: 'group', id: group.id, label: group.name, href: `/groups/${group.id}` });
      return `• **${group.name}** — ${t('{members} members · {posts} posts', {
        members: group.memberCount ?? 0,
        posts: group.postCount ?? 0,
      })}`;
    });

    return { section: `${t('Your communities:')}\n${lines.join('\n')}`, citations, actions };
  },

  async get_endorsements(_args, { t }) {
    const [statsResult, pendingResult] = await Promise.all([getEndorsementStats(), getPendingEndorsements()]);
    const stats = statsResult?.stats;
    const pending = asList<EndorsementItem>(pendingResult?.endorsements);
    const actions = [openArea(t, '/endorsements', t('Open endorsements'), t('Approve, request or write one.'))];

    const parts = [
      t('Endorsements: {received} received, {given} given.', {
        received: stats?.total ?? 0,
        given: stats?.given ?? 0,
      }),
    ];

    const citations: CopilotCitation[] = [];
    if (pending.length === 0) {
      parts.push(t('Nothing is waiting for your approval.'));
    } else {
      const lines = pending.slice(0, LIMIT).map((item) => {
        citations.push({
          type: 'endorsement',
          id: item.id,
          label: item.fromUser?.displayName ?? item.id,
          href: '/endorsements',
        });
        const from = item.fromUser?.displayName ? t('from {name}', { name: item.fromUser.displayName }) : '';
        return `• ${[item.skill ? `**${item.skill}**` : '', from].filter(Boolean).join(' — ')}`;
      });
      parts.push(
        `${t('{count} waiting for your approval before they appear on your profile:', { count: pending.length })}\n${lines.join('\n')}`,
      );
    }

    return { section: parts.join(' '), citations, actions };
  },

  async get_opportunities(args, { t, locale }) {
    const result = await listOpportunities({ limit: LIMIT, ...(args.q ? { search: args.q } : {}) });
    const items = asList<OpportunityItem>(result?.opportunities)
      .filter((item) => item.isActive !== false)
      .slice(0, LIMIT);
    const actions = [openArea(t, '/opportunities', t('See all opportunities'), t('Filter by type and apply.'))];

    if (items.length === 0) {
      return { section: t('No open opportunities right now.'), citations: [], actions };
    }

    const citations: CopilotCitation[] = [];
    const lines = items.map((item) => {
      citations.push({ type: 'opportunity', id: item.id, label: item.title, href: `/opportunities/${item.id}` });
      const details = [
        OPPORTUNITY_TYPE[item.type] ? t(OPPORTUNITY_TYPE[item.type]) : '',
        item.company ?? '',
        item.isRemote ? t('remote') : item.location ?? '',
        item.deadline ? t('due {date}', { date: formatWhen(item.deadline, locale, false) }) : '',
      ].filter(Boolean);
      return `• **${item.title}**${details.length ? ` — ${details.join(' · ')}` : ''}`;
    });

    return { section: `${t('Open opportunities:')}\n${lines.join('\n')}`, citations, actions };
  },

  async get_mentorship_sessions(_args, { t, locale }) {
    const result = await getUpcomingMentorshipSessions();
    const sessions = asList<MentorshipSessionItem>(result?.sessions)
      .filter((s) => s.status === 'scheduled')
      .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt))
      .slice(0, LIMIT);
    const actions = [openArea(t, '/mentoring', t('Open mentoring'), t('Book a session or message a mentor.'))];

    if (sessions.length === 0) {
      return { section: t('No mentoring sessions scheduled.'), citations: [], actions };
    }

    const citations: CopilotCitation[] = [];
    const lines = sessions.map((session) => {
      const title = session.title?.trim() || t('Mentoring session');
      citations.push({ type: 'session', id: session.id, label: title, href: '/mentoring' });
      const details = [
        formatWhen(session.scheduledAt, locale, true),
        typeof session.duration === 'number' ? t('{minutes} min', { minutes: session.duration }) : '',
        session.meetingType && SESSION_MODE[session.meetingType] ? t(SESSION_MODE[session.meetingType]) : '',
      ].filter(Boolean);
      return `• **${title}** — ${details.join(' · ')}`;
    });

    return { section: `${t('Upcoming mentoring sessions:')}\n${lines.join('\n')}`, citations, actions };
  },

  async get_shortlist(_args, { t }) {
    const result = await listShortlist({ limit: 6 });
    const items = asList<ShortlistItem>(result?.items).slice(0, 6);
    const actions = [openArea(t, '/shortlist', t('Open saved profiles'), t('Compare and reach out.'))];

    if (items.length === 0) {
      return {
        section: t('Your shortlist is empty — ask me to save anyone I find for you.'),
        citations: [],
        actions,
      };
    }

    const citations: CopilotCitation[] = [];
    const lines = items.map((item) => {
      const name = item.profile?.displayName ?? item.userId;
      citations.push({ type: 'person', id: item.userId, label: name, href: `/profiles/${item.userId}` });
      const details = [item.profile?.headline ?? item.profile?.role ?? '', item.note ? t('note: {note}', { note: item.note }) : '']
        .filter(Boolean);
      return `• **${name}**${details.length ? ` — ${details.join(' · ')}` : ''}`;
    });

    return { section: `${t('Saved profiles:')}\n${lines.join('\n')}`, citations, actions };
  },

  async get_research_boards(_args, { t }) {
    const result = await listResearchBoards();
    const boards = asList<ResearchBoard>(result?.boards)
      .filter((board) => !board.isArchived)
      .slice(0, LIMIT);
    const actions = [openArea(t, '/research', t('Open research boards'), t('Open a board or start a new one.'))];

    if (boards.length === 0) {
      return { section: t('No research boards yet.'), citations: [], actions };
    }

    const citations: CopilotCitation[] = [];
    const lines = boards.map((board) => {
      citations.push({ type: 'research', id: board.id, label: board.title, href: `/research/${board.id}` });
      const details = [
        t('{count} nodes', { count: board.nodeCount ?? 0 }),
        board.isPinned ? t('pinned') : '',
      ].filter(Boolean);
      return `• **${board.title}** — ${details.join(' · ')}`;
    });

    return { section: `${t('Your research boards:')}\n${lines.join('\n')}`, citations, actions };
  },

  async get_builder_state(_args, { t }) {
    const result = await getWorkspaces({ limit: LIMIT, status: 'active' });
    const workspaces = asList<BuilderWorkspace>(result?.data).slice(0, LIMIT);
    const actions = [openArea(t, '/builder', t('Open Startup Builder'), t('Create or open a workspace.'))];

    if (workspaces.length === 0) {
      return {
        section: t('No Startup Builder workspace yet. Ask me to create one.'),
        citations: [],
        actions,
      };
    }

    const citations: CopilotCitation[] = [];
    const lines = workspaces.map((workspace) => {
      citations.push({ type: 'workspace', id: workspace.id, label: workspace.name, href: '/builder' });
      const details = [
        workspace.status ?? '',
        typeof workspace.documentCount === 'number' ? t('{count} documents', { count: workspace.documentCount }) : '',
        typeof workspace.overallReadiness === 'number' ? t('readiness {score}%', { score: workspace.overallReadiness }) : '',
      ].filter(Boolean);
      return `• **${workspace.name}**${details.length ? ` — ${details.join(' · ')}` : ''}`;
    });

    return { section: `${t('Your workspaces:')}\n${lines.join('\n')}`, citations, actions };
  },
};

export function isAreaRead(name: string): name is AreaReadId {
  return Object.prototype.hasOwnProperty.call(AREA_READERS, name);
}
