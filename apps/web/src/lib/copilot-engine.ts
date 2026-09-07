import {
  getMeProfile,
  getNotificationUnreadCount,
  listConnectionRequests,
  listMessageConversations,
  listNotifications,
  searchProfiles,
  getRecommendations,
  sendConnectionRequest,
  getOrCreateDirectConversation,
  saveToShortlist,
  type SearchHit,
} from '@/lib/api';
import { apiRequest } from '@/lib/api';
import { isPreviewDemo } from '@/lib/preview-demo';
import { planCopilotTools, detectPersonName } from '@/lib/copilot-planner';
import type {
  CopilotAction,
  CopilotCitation,
  CopilotGraph,
  CopilotTurnResult,
} from '@/lib/copilot-types';

export type PageContextPacket = {
  route: string;
  entity?: { type: string; id: string };
  role?: string | null;
  locale?: string;
};

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function personHref(hit: SearchHit) {
  return `/profiles/${hit.userId}`;
}

async function fetchGraph(): Promise<CopilotGraph> {
  try {
    const graph = await apiRequest<CopilotGraph>('/api/graph/me');
    if (graph?.me) return graph;
  } catch {
    /* compose from existing endpoints */
  }

  const [profileRes, convRes, introRes, notifRes, readinessRes] = await Promise.allSettled([
    getMeProfile(),
    listMessageConversations(),
    listConnectionRequests({ type: 'received', limit: 50 }),
    getNotificationUnreadCount(),
    apiRequest<{ overall: number; lowestDimension?: { label: string; href: string } }>('/api/dashboard/venture-readiness'),
  ]);

  const profile =
    profileRes.status === 'fulfilled'
      ? (profileRes.value as {
          profile?: {
            userId?: string;
            displayName?: string;
            headline?: string | null;
            location?: string | null;
            avatarUrl?: string | null;
            role?: string;
          };
          user?: { id?: string; role?: string };
        })
      : null;
  const conversations = convRes.status === 'fulfilled' ? convRes.value.conversations : [];
  const intros = introRes.status === 'fulfilled' ? introRes.value.connections.filter((c) => c.status === 'pending') : [];
  const unreadNotifications = notifRes.status === 'fulfilled' ? notifRes.value.count : 0;
  const readiness = readinessRes.status === 'fulfilled' ? readinessRes.value : null;

  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const pendingIntros = intros.length;

  const nextAction =
    pendingIntros > 0
      ? { id: 'review-intros', label: 'Review pending intros', href: '/connections' }
      : unreadMessages > 0
        ? { id: 'read-messages', label: 'Catch up on unread messages', href: '/messages' }
        : unreadNotifications > 0
          ? { id: 'read-notifications', label: 'Open notifications', href: '/notifications' }
          : { id: 'review-matches', label: 'Review your matches', href: '/matches' };

  return {
    me: {
      id: profile?.user?.id ?? profile?.profile?.userId ?? 'me',
      displayName: profile?.profile?.displayName ?? 'You',
      headline: profile?.profile?.headline ?? null,
      role: profile?.user?.role ?? profile?.profile?.role ?? 'founder',
      location: profile?.profile?.location ?? null,
      avatarUrl: profile?.profile?.avatarUrl ?? null,
    },
    unreadMessages,
    pendingIntros,
    unreadNotifications,
    readiness: readiness
      ? {
          overall: readiness.overall,
          lowestLabel: readiness.lowestDimension?.label,
          lowestHref: readiness.lowestDimension?.href,
        }
      : null,
    nextAction,
  };
}

function findPerson(hits: SearchHit[], name?: string): SearchHit | undefined {
  if (!name) return hits[0];
  const needle = name.toLowerCase();
  return hits.find((h) => h.displayName.toLowerCase().includes(needle)) ?? hits[0];
}

function describeGraph(graph: CopilotGraph): string {
  const parts = [
    `You are **${graph.me.displayName}** (${graph.me.role}${graph.me.location ? `, ${graph.me.location}` : ''}).`,
    graph.unreadMessages ? `You have **${graph.unreadMessages}** unread message${graph.unreadMessages === 1 ? '' : 's'}.` : 'Inbox is caught up.',
    graph.pendingIntros ? `**${graph.pendingIntros}** pending intro${graph.pendingIntros === 1 ? '' : 's'} wait on Connections.` : 'No pending intros.',
    graph.unreadNotifications ? `**${graph.unreadNotifications}** unread notification${graph.unreadNotifications === 1 ? '' : 's'}.` : null,
    graph.readiness ? `Venture readiness is **${graph.readiness.overall}%**${graph.readiness.lowestLabel ? ` (weakest: ${graph.readiness.lowestLabel})` : ''}.` : null,
    graph.nextAction ? `Suggested next step: **${graph.nextAction.label}**.` : null,
  ];
  return parts.filter(Boolean).join(' ');
}

export async function runCopilotTurn(
  userMessage: string,
  pageContext?: PageContextPacket,
): Promise<CopilotTurnResult> {
  const planned = planCopilotTools(userMessage);
  const usedTools = planned.map((t) => t.name);
  const citations: CopilotCitation[] = [];
  const actions: CopilotAction[] = [];
  const sections: string[] = [];

  let graph: CopilotGraph | null = null;
  let people: SearchHit[] = [];
  let matches: SearchHit[] = [];

  for (const tool of planned) {
    if (tool.name === 'get_graph') {
      graph = await fetchGraph();
      sections.push(describeGraph(graph));
      citations.push({
        type: 'graph',
        id: 'graph-me',
        label: `${graph.me.displayName} · live graph`,
        href: '/dashboard',
      });
      if (graph.nextAction) {
        actions.push({
          id: newId('nav'),
          tool: 'navigate',
          title: graph.nextAction.label,
          description: 'Open the surface that currently needs you.',
          confirmLabel: 'Open',
          payload: { href: graph.nextAction.href },
          status: 'pending',
          href: graph.nextAction.href,
        });
      }
    }

    if (tool.name === 'search_people') {
      const result = await searchProfiles({
        q: tool.args.q,
        location: tool.args.location,
        limit: 6,
      });
      people = result.hits ?? [];
      if (people.length === 0) {
        sections.push(
          tool.args.location
            ? `I could not find people matching “${tool.args.q ?? 'your query'}” in ${tool.args.location}. Try Discover or broaden the location.`
            : `No people matched “${tool.args.q ?? 'your query'}”. Try Matches or Search.`,
        );
      } else {
        const lines = people.slice(0, 4).map((p) => {
          citations.push({
            type: 'person',
            id: p.userId,
            label: p.displayName,
            href: personHref(p),
          });
          const score = typeof p.matchScore === 'number' ? ` · ${p.matchScore}%` : '';
          return `• **${p.displayName}** — ${p.headline ?? p.role}${p.location ? ` (${p.location})` : ''}${score}`;
        });
        sections.push(`Here is who I found:\n${lines.join('\n')}`);
      }
    }

    if (tool.name === 'get_recommendations') {
      const result = await getRecommendations({ limit: 5 });
      matches = result.suggestions ?? [];
      if (matches.length === 0) {
        sections.push('No live recommendations yet. Complete your profile to improve matching.');
      } else {
        const lines = matches.slice(0, 4).map((p) => {
          citations.push({
            type: 'match',
            id: p.userId,
            label: p.displayName,
            href: `/matches/${p.userId}`,
          });
          return `• **${p.displayName}** — ${p.matchScore ?? '—'}% · ${p.headline ?? p.role}`;
        });
        sections.push(`Personalized matches:\n${lines.join('\n')}`);
      }
    }

    if (tool.name === 'get_notifications') {
      const result = await listNotifications({ limit: 8 });
      const items = result.notifications ?? [];
      if (items.length === 0) {
        sections.push('You are caught up — no notifications in the queue.');
      } else {
        const lines = items.slice(0, 6).map((n) => {
          citations.push({
            type: 'notification',
            id: n.id,
            label: n.title || n.type || 'Notification',
            href: '/notifications',
          });
          const unread = n.readAt ? '' : ' · unread';
          return `• **${n.title || n.type}**${unread}`;
        });
        sections.push(`Latest notifications:\n${lines.join('\n')}`);
      }
      actions.push({
        id: newId('nav'),
        tool: 'navigate',
        title: 'Open notifications',
        description: 'The same inbox as the bell in the top bar.',
        confirmLabel: 'Open',
        payload: { href: '/notifications' },
        status: 'pending',
        href: '/notifications',
      });
    }

    if (tool.name === 'shortlist_add') {
      const pool = people.length ? people : matches;
      const target = findPerson(pool, tool.args.name || detectPersonName(userMessage));
      if (target) {
        try {
          await saveToShortlist(target.userId);
          sections.push(`Saved **${target.displayName}** to your shortlist. You can undo that from Saved Profiles.`);
          citations.push({
            type: 'person',
            id: target.userId,
            label: target.displayName,
            href: personHref(target),
          });
          actions.push({
            id: newId('shortlist'),
            tool: 'shortlist_add',
            title: `Saved ${target.displayName}`,
            description: 'Already written through the Shortlist API. Open Saved Profiles to remove.',
            confirmLabel: 'Open shortlist',
            payload: { userId: target.userId, displayName: target.displayName },
            status: 'done',
            href: '/shortlist',
          });
        } catch {
          actions.push({
            id: newId('shortlist'),
            tool: 'shortlist_add',
            title: `Save ${target.displayName} to shortlist`,
            description: 'Could not save automatically. Confirm to retry via the same Shortlist API.',
            confirmLabel: 'Save',
            payload: { userId: target.userId, displayName: target.displayName },
            status: 'pending',
            href: '/shortlist',
          });
        }
      } else {
        sections.push('Name someone from Matches or Search and I will save them to your shortlist.');
      }
    }

    if (tool.name === 'send_connection') {
      const pool = people.length ? people : matches;
      const target = findPerson(pool, tool.args.name || detectPersonName(userMessage));
      if (target) {
        actions.push({
          id: newId('connect'),
          tool: 'send_connection',
          title: `Send intro to ${target.displayName}`,
          description: `This uses the same Connections API as the rest of the app. ${target.headline ?? ''}`.trim(),
          confirmLabel: 'Send intro',
          payload: {
            receiverId: target.userId,
            message: `Hi ${target.displayName.split(' ')[0]}, I'd like to connect on CoFounderBay.`,
            displayName: target.displayName,
          },
          status: 'pending',
          href: personHref(target),
        });
      } else {
        sections.push('I need a specific person before I can send an intro. Name someone from Matches or Search.');
      }
    }

    if (tool.name === 'start_or_send_message') {
      const pool = people.length ? people : matches;
      const target = findPerson(pool, tool.args.name || detectPersonName(userMessage));
      if (target) {
        actions.push({
          id: newId('msg'),
          tool: 'start_or_send_message',
          title: `Message ${target.displayName}`,
          description: 'Opens (or creates) a direct thread. The first message is not sent until you write it.',
          confirmLabel: 'Open thread',
          payload: { userId: target.userId, displayName: target.displayName },
          status: 'pending',
          href: `/messages`,
        });
      } else {
        sections.push('Tell me who to message (name from your network or search results).');
      }
    }

    if (tool.name === 'navigate') {
      const href = tool.args.href || '/dashboard';
      const label = tool.args.label || href;
      actions.push({
        id: newId('nav'),
        tool: 'navigate',
        title: `Open ${label}`,
        description: pageContext?.route ? `You are currently on ${pageContext.route}.` : 'Jump to that page.',
        confirmLabel: 'Go',
        payload: { href },
        status: 'pending',
        href,
      });
      citations.push({ type: 'route', id: href, label, href });
    }
  }

  if (people.length || matches.length) {
    const extras = (people.length ? people : matches).slice(0, 3).filter(
      (p) => !actions.some((a) => a.tool === 'send_connection' && a.payload.receiverId === p.userId),
    );
    for (const p of extras.slice(0, 2)) {
      actions.push({
        id: newId('connect'),
        tool: 'send_connection',
        title: `Connect with ${p.displayName}`,
        description: p.matchReasons?.join(' · ') || p.headline || p.role,
        confirmLabel: 'Send intro',
        payload: {
          receiverId: p.userId,
          message: `Hi ${p.displayName.split(' ')[0]}, I'd like to connect on CoFounderBay.`,
          displayName: p.displayName,
        },
        status: 'pending',
        href: personHref(p),
      });
    }
  }

  const uniqueActions = actions.filter(
    (action, index) =>
      actions.findIndex(
        (a) => a.tool === action.tool && JSON.stringify(a.payload) === JSON.stringify(action.payload),
      ) === index,
  );

  const uniqueCitations = citations.filter(
    (c, i) => citations.findIndex((x) => x.type === c.type && x.id === c.id) === i,
  );

  let message = sections.join('\n\n').trim();
  if (!message) {
    message = isPreviewDemo()
      ? 'I can search people, save them to your shortlist, read notifications, send intros, open a thread, or jump to any page. Try: “find a technical cofounder in Athens”.'
      : 'I can search the network, pull matches, save a shortlist, read alerts, send an intro, open a conversation, or navigate. What should we do?';
  }

  return {
    message,
    actions: uniqueActions.slice(0, 5),
    citations: uniqueCitations.slice(0, 8),
    usedTools,
  };
}

export async function executeCopilotAction(
  action: CopilotAction,
): Promise<{ ok: boolean; href?: string; error?: string }> {
  try {
    if (action.tool === 'navigate') {
      const href = String(action.payload.href ?? action.href ?? '/dashboard');
      return { ok: true, href };
    }
    if (action.tool === 'send_connection') {
      const receiverId = String(action.payload.receiverId ?? '');
      const message = typeof action.payload.message === 'string' ? action.payload.message : undefined;
      if (!receiverId) return { ok: false, error: 'Missing receiver' };
      await sendConnectionRequest({ receiverId, message });
      return { ok: true };
    }
    if (action.tool === 'start_or_send_message') {
      const userId = String(action.payload.userId ?? '');
      if (!userId) return { ok: false, error: 'Missing user' };
      const { conversationId } = await getOrCreateDirectConversation(userId);
      return { ok: true, href: `/messages?c=${conversationId}` };
    }
    if (action.tool === 'shortlist_add') {
      const userId = String(action.payload.userId ?? '');
      if (!userId) return { ok: false, error: 'Missing user' };
      await saveToShortlist(userId);
      return { ok: true, href: '/shortlist' };
    }
    return { ok: false, error: 'Unsupported action' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Action failed' };
  }
}
