import {
  getMeProfile,
  getNotificationUnreadCount,
  listConnectionRequests,
  listMessageConversations,
  listNotifications,
  searchProfiles,
  getRecommendations,
  type SearchHit,
} from '@/lib/api';
import { apiRequest } from '@/lib/api';
import { executeAction } from '@/lib/action-registry';
import { isAppLocale, translate, type TranslateVars } from '@/lib/i18n/translate';
import type { AppLocale } from '@/lib/locale';
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

/**
 * Bound to the reader's locale for one turn.
 *
 * The engine is a plain async function rather than a component, so it cannot
 * read `useI18n`. It receives the locale on the page-context packet and binds
 * `translate` once, which keeps every string in this file a lookup rather than
 * a literal. English copy stays the lookup key, so an untranslated locale
 * renders exactly what it rendered before.
 */
type Translator = (source: string, vars?: TranslateVars) => string;

function translatorFor(locale?: string): Translator {
  const resolved: AppLocale = locale && isAppLocale(locale) ? locale : 'en';
  return (source, vars) => translate(resolved, source, vars);
}

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
  if (!name) return undefined;
  const needle = name.toLowerCase();
  const exact = hits.find((h) => h.displayName.toLowerCase() === needle);
  if (exact) return exact;
  const matches = hits.filter((h) => h.displayName.toLowerCase().includes(needle));
  if (matches.length === 1) return matches[0];
  return undefined;
}

function describeGraph(graph: CopilotGraph, t: Translator): string {
  // Counts get a singular and a plural key rather than an appended "s": Greek
  // inflects the noun, not just its ending, so one interpolated template
  // cannot serve both. The old singular also read "1 pending intro wait on
  // Connections", which this fixes on the way past.
  const parts = [
    graph.me.location
      ? t('You are **{name}** ({role}, {location}).', {
          name: graph.me.displayName,
          role: t(graph.me.role),
          location: graph.me.location,
        })
      : t('You are **{name}** ({role}).', { name: graph.me.displayName, role: t(graph.me.role) }),
    graph.unreadMessages
      ? t(
          graph.unreadMessages === 1
            ? 'You have **{count}** unread message.'
            : 'You have **{count}** unread messages.',
          { count: graph.unreadMessages },
        )
      : t('Inbox is caught up.'),
    graph.pendingIntros
      ? t(
          graph.pendingIntros === 1
            ? '**{count}** pending intro waits on Connections.'
            : '**{count}** pending intros wait on Connections.',
          { count: graph.pendingIntros },
        )
      : t('No pending intros.'),
    graph.unreadNotifications
      ? t(
          graph.unreadNotifications === 1
            ? '**{count}** unread notification.'
            : '**{count}** unread notifications.',
          { count: graph.unreadNotifications },
        )
      : null,
    graph.readiness
      ? graph.readiness.lowestLabel
        ? t('Venture readiness is **{score}%** (weakest: {weakest}).', {
            score: graph.readiness.overall,
            weakest: t(graph.readiness.lowestLabel),
          })
        : t('Venture readiness is **{score}%**.', { score: graph.readiness.overall })
      : null,
    graph.nextAction
      ? t('Suggested next step: **{step}**.', { step: t(graph.nextAction.label) })
      : null,
  ];
  return parts.filter(Boolean).join(' ');
}

export async function runCopilotTurn(
  userMessage: string,
  pageContext?: PageContextPacket,
): Promise<CopilotTurnResult> {
  const t = translatorFor(pageContext?.locale);
  const planned = planCopilotTools(userMessage);
  const usedTools = planned.map((t) => t.name);
  const citations: CopilotCitation[] = [];
  const actions: CopilotAction[] = [];
  const sections: string[] = [];

  let graph: CopilotGraph | null = null;
  let people: SearchHit[] = [];
  let matches: SearchHit[] = [];

  const applyShortlist = async (name?: string) => {
    const pool = people.length ? people : matches;
    const target = findPerson(pool, name || detectPersonName(userMessage));
    if (!target) return false;
    sections.push(
      t('I found **{name}**. Save them to your shortlist if you like.', { name: target.displayName }),
    );
    citations.push({
      type: 'person',
      id: target.userId,
      label: target.displayName,
      href: personHref(target),
    });
    actions.push({
      id: newId('shortlist'),
      tool: 'shortlist_add',
      title: t('Save {name} to shortlist', { name: target.displayName }),
      description: t('Add {name} to your saved profiles. This only writes when you confirm.', {
        name: target.displayName,
      }),
      confirmLabel: t('Save to shortlist'),
      payload: { userId: target.userId, displayName: target.displayName },
      status: 'pending',
      href: '/shortlist',
    });
    return true;
  };

  for (const tool of planned) {
    if (tool.name === 'get_graph') {
      graph = await fetchGraph();
      sections.push(describeGraph(graph, t));
      citations.push({
        type: 'graph',
        id: 'graph-me',
        label: t('{name} · live graph', { name: graph.me.displayName }),
        href: '/dashboard',
      });
      if (graph.nextAction) {
        actions.push({
          id: newId('nav'),
          tool: 'navigate',
          title: t(graph.nextAction.label),
          description: t('Open the surface that currently needs you.'),
          confirmLabel: t('Open'),
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
            ? t(
                'I could not find people matching “{query}” in {location}. Try Discover or broaden the location.',
                { query: tool.args?.q ?? t('your query'), location: tool.args.location },
              )
            : t('No people matched “{query}”. Try Matches or Search.', {
                query: tool.args?.q ?? t('your query'),
              }),
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
        sections.push(`${t('Here is who I found:')}\n${lines.join('\n')}`);
      }
    }

    if (tool.name === 'get_recommendations') {
      const result = await getRecommendations({ limit: 5 });
      matches = result.suggestions ?? [];
      if (matches.length === 0) {
        sections.push(t('No live recommendations yet. Complete your profile to improve matching.'));
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
        sections.push(`${t('Personalized matches:')}\n${lines.join('\n')}`);
      }
    }

    if (tool.name === 'get_notifications') {
      const result = await listNotifications({ limit: 8 });
      const items = result.notifications ?? [];
      if (items.length === 0) {
        sections.push(t('You are caught up — no notifications in the queue.'));
      } else {
        const lines = items.slice(0, 6).map((n) => {
          citations.push({
            type: 'notification',
            id: n.id,
            label: n.title || n.type || t('Notification'),
            href: '/notifications',
          });
          // The "unread" marker is part of the sentence, not a separator, so it
          // needs its own key rather than being concatenated on.
          const label = n.title || n.type || t('Notification');
          return `• ${
            n.readAt
              ? t('**{title}**', { title: label })
              : t('**{title}** · unread', { title: label })
          }`;
        });
        sections.push(`${t('Latest notifications:')}\n${lines.join('\n')}`);
      }
      actions.push({
        id: newId('nav'),
        tool: 'navigate',
        title: t('Open notifications'),
        description: t('The same inbox as the bell in the top bar.'),
        confirmLabel: t('Open'),
        payload: { href: '/notifications' },
        status: 'pending',
        href: '/notifications',
      });
    }

    if (tool.name === 'shortlist_add') {
      const ok = await applyShortlist(tool.args.name);
      if (!ok && !planned.some((t) => t.name === 'search_people' || t.name === 'get_recommendations')) {
        sections.push(t('Name someone from Matches or Search and I will save them to your shortlist.'));
      }
    }

    if (tool.name === 'send_connection') {
      const pool = people.length ? people : matches;
      const target = findPerson(pool, tool.args?.name || detectPersonName(userMessage));
      if (target) {
        actions.push({
          id: newId('connect'),
          tool: 'send_connection',
          title: t('Send intro to {name}', { name: target.displayName }),
          description: `${t('This uses the same Connections API as the rest of the app.')} ${
            target.headline ?? ''
          }`.trim(),
          confirmLabel: t('Send intro'),
          payload: {
            receiverId: target.userId,
            message: t('Hi {firstName}, I’d like to connect on CoFounderBay.', {
              firstName: target.displayName.split(' ')[0],
            }),
            displayName: target.displayName,
          },
          status: 'pending',
          href: personHref(target),
        });
      } else {
        sections.push(
          t('I need a specific person before I can send an intro. Name someone from Matches or Search.'),
        );
      }
    }

    if (tool.name === 'start_or_send_message') {
      const pool = people.length ? people : matches;
      const target = findPerson(pool, tool.args?.name || detectPersonName(userMessage));
      if (target) {
        actions.push({
          id: newId('msg'),
          tool: 'start_or_send_message',
          title: t('Message {name}', { name: target.displayName }),
          description: t(
            'Opens (or creates) a direct thread. The first message is not sent until you write it.',
          ),
          confirmLabel: t('Open thread'),
          payload: { userId: target.userId, displayName: target.displayName },
          status: 'pending',
          href: `/messages`,
        });
      } else {
        sections.push(t('Tell me who to message (name from your network or search results).'));
      }
    }

    if (tool.name === 'navigate') {
      const href = tool.args?.href || '/dashboard';
      const label = tool.args?.label || href;
      actions.push({
        id: newId('nav'),
        tool: 'navigate',
        title: t('Open {label}', { label: t(label) }),
        description: pageContext?.route
          ? t('You are currently on {route}.', { route: pageContext.route })
          : t('Jump to that page.'),
        confirmLabel: t('Go'),
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
        title: t('Connect with {name}', { name: p.displayName }),
        description: p.matchReasons?.join(' · ') || p.headline || t(p.role),
        confirmLabel: t('Send intro'),
        payload: {
          receiverId: p.userId,
          message: t('Hi {firstName}, I’d like to connect on CoFounderBay.', {
            firstName: p.displayName.split(' ')[0],
          }),
          displayName: p.displayName,
        },
        status: 'pending',
        href: personHref(p),
      });
    }
  }

  if (planned.some((t) => t.name === 'shortlist_add') && !actions.some((a) => a.tool === 'shortlist_add')) {
    const ok = await applyShortlist(detectPersonName(userMessage));
    if (!ok) {
      sections.push(t('Name someone from Matches or Search and I will save them to your shortlist.'));
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
      ? t(
          'I can search people, save them to your shortlist, read notifications, send intros, open a thread, or jump to any page. Try: “find a technical cofounder in Athens”.',
        )
      : t(
          'I can search the network, pull matches, save a shortlist, read alerts, send an intro, open a conversation, or navigate. What should we do?',
        );
  }

  return {
    message,
    actions: uniqueActions.slice(0, 5),
    citations: uniqueCitations.slice(0, 8),
    usedTools,
  };
}

/**
 * Delegates to `action-registry`, which now owns what each capability does.
 * The chain this replaced described the same four writes in a place nothing
 * else could read, so the model's tool catalogue could not be derived from it.
 *
 * `action.href` is still folded in as the default `href`: the navigate arm used
 * to read `payload.href ?? action.href ?? '/dashboard'`, and proposals built
 * before this change carry the destination in either field.
 */
export async function executeCopilotAction(
  action: CopilotAction,
): Promise<{ ok: boolean; href?: string; error?: string }> {
  const payload: Record<string, unknown> = { ...(action.payload ?? {}) };
  if (payload.href === undefined && action.href !== undefined) payload.href = action.href;
  return executeAction(action.tool, payload);
}
