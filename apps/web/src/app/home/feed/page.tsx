'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CoverImage } from '@/components/common/CoverImage';
import { RelativeTime } from '@/components/common/RelativeTime';
import { useTodayRows } from '@/components/dashboard/HomeToday';
import { HomeVariantSwitch } from '@/components/home/HomeVariantSwitch';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getMeProfile, getPersonalizedFeed, getRecommendations, listEvents, listPrograms, searchProfiles } from '@/lib/api';
import { listCommitmentCards } from '@/lib/commitments-api';
import { curateFeed, type FeedItem } from '@/lib/home-feed';
import { useDateFormat } from '@/lib/i18n/useDateFormat';
import { explainMatch, viewerFacts } from '@/lib/match-explain';
import { qk, queryKeys } from '@/lib/query-keys';
import { getUpdatesFeed } from '@/lib/updates-api';
import { cn, formatRelativeTime, initialsOf } from '@/lib/utils';

const DAY = 86_400_000;
const FIRST = 12;
/** Joined within this many days: after that someone is simply a member. */
const NEW_MEMBER_DAYS = 30;

/** One entry: who, why it is here, what it says, one way in. */
function FeedCard({ item }: { item: FeedItem }) {
  return (
    <article data-feed-item={item.kind}>
      <Card className="overflow-hidden">
        <CoverImage src={item.image} className="rounded-t-[inherit] sm:max-h-48" />
        <CardContent className="space-y-2">
          <div className="flex items-start gap-3">
            <Avatar className={cn('h-11 w-11 shrink-0', item.mark.square && 'rounded-xl')} data-keep-icon="">
              {item.mark.src ? <AvatarImage src={item.mark.src} alt="" className={item.mark.square ? 'rounded-xl' : undefined} /> : null}
              <AvatarFallback className={cn('bg-primary/10 font-semibold text-primary-accessible', item.mark.square && 'rounded-xl')}>{initialsOf(item.mark.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground"><BilingualText en={item.why.en} el={item.why.el} compact wrap /></p>
              <h2 className="card-title">
                <Link href={item.href} className="transition-colors hover:text-primary-accessible">{item.title}</Link>
              </h2>
              {item.subtitle ? <p className="text-sm text-muted-foreground">{item.subtitle}</p> : null}
            </div>
          </div>
          {item.body ? <p className="card-body line-clamp-3 text-muted-foreground first-letter:uppercase">{item.body}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {item.when ? <RelativeTime date={item.when} format={formatRelativeTime} /> : null}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href={item.href}><BilingualText en={item.action.en} el={item.action.el} compact /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

/**
 * The first page as a curated feed (docs §116): what is happening among the
 * people and the opportunities around the reader, one column, each entry
 * saying why it is here. Only what the platform really holds appears.
 */
export default function FeedHomePage() {
  const fmtDate = useDateFormat();
  const { rows } = useTodayRows();
  const [all, setAll] = useState(false);
  const opts = { staleTime: 60_000, retry: 0 } as const;

  const profile = useQuery({ queryKey: queryKeys.me.profile(), queryFn: getMeProfile, ...opts });
  const people = useQuery({ queryKey: queryKeys.recommendations, queryFn: () => getRecommendations({ limit: 5 }), ...opts });
  const members = useQuery({ queryKey: qk('search', 'profiles', 'newest'), queryFn: () => searchProfiles({ sortBy: 'recent', limit: 8 }), ...opts });
  const updates = useQuery({ queryKey: qk('founder-updates', 'feed'), queryFn: getUpdatesFeed, ...opts });
  const needs = useQuery({ queryKey: qk('commitments', 'cards', 'home-feed'), queryFn: () => listCommitmentCards({}), ...opts });
  const events = useQuery({ queryKey: qk('events', 'upcoming', '', 'all'), queryFn: () => listEvents({ scope: 'upcoming', limit: 4 }), ...opts });
  const programs = useQuery({ queryKey: qk('programs', 'home-feed'), queryFn: () => listPrograms({ limit: 6 }), ...opts });
  const posts = useQuery({ queryKey: qk('feed', 'home-feed'), queryFn: () => getPersonalizedFeed({ limit: 6 }), ...opts });

  const loading = [people, members, updates, needs, events, programs, posts].some((q) => q.isLoading);

  const items = useMemo(() => {
    const now = Date.now();
    const list: FeedItem[] = [];
    const viewer = viewerFacts(profile.data?.profile ?? null);

    // Someone new who also fits is told once, as new.
    const fresh = (members.data?.hits ?? [])
      .filter((m) => m?.userId && m.userId !== profile.data?.profile?.userId)
      .filter((m) => m.createdAt != null && now - m.createdAt * 1000 <= NEW_MEMBER_DAYS * DAY)
      .slice(0, 3);
    const freshIds = new Set(fresh.map((m) => m.userId));

    (people.data?.suggestions ?? []).filter((p) => p?.userId && !freshIds.has(p.userId)).slice(0, 4).forEach((p, i) => {
      const reason = explainMatch(p, viewer, { nowMs: now })[0];
      list.push({
        id: `person-${p.userId}`,
        kind: 'person',
        at: -i,
        why: reason ? { en: reason.en, el: reason.el } : { en: 'Fits what you are looking for', el: 'Ταιριάζει με όσα ψάχνετε' },
        title: p.displayName ?? '',
        subtitle: p.headline ?? undefined,
        mark: { name: p.displayName ?? '', src: p.avatarUrl },
        href: `/profiles/${p.userId}`,
        action: { en: 'See profile', el: 'Προφίλ' },
      });
    });

    fresh
      .forEach((m) => {
        const joined = (m.createdAt as number) * 1000;
        const reason = explainMatch(m, viewer, { nowMs: now })[0];
        list.push({
          id: `member-${m.userId}`,
          kind: 'member',
          at: joined,
          why: reason ? { en: `New here. ${reason.en}`, el: `Νέο μέλος. ${reason.el}` } : { en: 'New on CoFounderBay', el: 'Νέο μέλος' },
          title: m.displayName ?? '',
          subtitle: m.headline ?? undefined,
          mark: { name: m.displayName ?? '', src: m.avatarUrl },
          href: `/profiles/${m.userId}`,
          action: { en: 'See profile', el: 'Προφίλ' },
          when: new Date(joined).toISOString(),
        });
      });

    (updates.data ?? []).forEach((u) => {
      list.push({
        id: `update-${u.id}`,
        kind: 'update',
        at: Date.parse(u.createdAt) || 0,
        why: { en: 'From a founder you follow', el: 'Από ιδρυτή που ακολουθείτε' },
        title: u.title,
        subtitle: u.author.displayName,
        body: u.body,
        mark: { name: u.author.displayName, src: u.author?.logoUrl ?? u.author?.avatarUrl, square: Boolean(u.author.logoUrl) },
        href: `/updates?focus=${encodeURIComponent(u.id)}`,
        action: { en: 'Read', el: 'Ανάγνωση' },
        when: u.createdAt,
      });
    });

    (needs.data ?? []).filter((c) => !c.isMine).slice(0, 4).forEach((c) => {
      list.push({
        id: `need-${c.id}`,
        kind: 'need',
        at: Date.parse(c.updatedAt ?? c.createdAt ?? '') || 0,
        why: { en: 'Someone is looking for help', el: 'Κάποιος ζητά βοήθεια' },
        title: c.title,
        subtitle: c.owner.displayName,
        body: c.missing,
        mark: { name: c.owner.displayName, src: c.owner.avatarUrl },
        href: `/commitments/${encodeURIComponent(c.id)}`,
        action: { en: 'See the need', el: 'Δείτε την ανάγκη' },
        when: c.updatedAt ?? c.createdAt,
      });
    });

    (events.data?.events ?? []).slice(0, 3).forEach((e, i) => {
      list.push({
        id: `event-${e.id}`,
        kind: 'event',
        at: -i,
        why: { en: 'Coming up', el: 'Έρχεται' },
        title: e.title,
        subtitle: [fmtDate(e.startAt, { weekday: 'short', day: 'numeric', month: 'short' }), e.location].filter(Boolean).join(' · '),
        mark: { name: e.title, src: e.host?.avatarUrl },
        image: e.coverImageUrl,
        href: `/events/${e.id}`,
        action: { en: 'See the event', el: 'Δείτε την εκδήλωση' },
      });
    });

    (programs.data?.programs ?? [])
      .filter((p) => p.applicationDeadline && Date.parse(p.applicationDeadline) > now)
      .slice(0, 2)
      .forEach((p, i) => {
        list.push({
          id: `program-${p.id}`,
          kind: 'program',
          at: -i,
          why: { en: 'Open for applications', el: 'Δέχεται αιτήσεις' },
          title: p.title,
          subtitle: [p.organization?.name, fmtDate(p.applicationDeadline as string, { day: 'numeric', month: 'short' })].filter(Boolean).join(' · '),
          mark: { name: p.organization?.name ?? p.title, src: p.organization?.logoUrl, square: true },
          image: p.coverImageUrl,
          href: `/programs/${p.id}`,
          action: { en: 'See the programme', el: 'Δείτε το πρόγραμμα' },
        });
      });

    (posts.data?.posts ?? []).forEach((p) => {
      list.push({
        id: `post-${p.id}`,
        kind: 'post',
        at: Date.parse(p.createdAt) || 0,
        why: { en: 'From your network', el: 'Από το δίκτυό σας' },
        title: p.author.displayName,
        subtitle: p.author.headline,
        body: p.content,
        mark: { name: p.author.displayName, src: p.author.avatarUrl },
        image: p.images?.[0],
        href: '/feed',
        action: { en: 'Open the feed', el: 'Άνοιγμα ροής' },
        when: p.createdAt,
      });
    });

    return list;
  }, [profile.data, people.data, members.data, updates.data, needs.data, events.data, programs.data, posts.data, fmtDate]);

  const curated = useMemo(() => curateFeed(items, all ? items.length : FIRST), [items, all]);
  const more = items.length - curated.length;
  const waiting = rows.length;

  return (
    <AppShell
      title="Home"
      titleEl="Αρχική"
      description="What is happening around you, and why it is here."
      descriptionEl="Τι γίνεται γύρω σας, και γιατί το βλέπετε."
      askAi={false}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <HomeVariantSwitch current="feed" />
        {waiting > 0 ? (
          <Link
            href="/notifications"
            data-feed-waiting=""
            className="flex items-center justify-between gap-3 rounded-xl border border-primary-muted bg-primary-subtle px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
          >
            <BilingualText
              en={`${waiting} ${waiting === 1 ? 'thing is' : 'things are'} waiting on you`}
              el={waiting === 1 ? 'Σας περιμένει 1 πράγμα' : `Σας περιμένουν ${waiting} πράγματα`}
              compact
            />
            <span data-keep-icon=""><ArrowRight className="icon-sm shrink-0 text-muted-foreground" aria-hidden="true" /></span>
          </Link>
        ) : null}

        {loading && curated.length === 0 ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
        ) : curated.length === 0 ? (
          <Card>
            <CardContent className="space-y-3">
              <p className="card-body text-muted-foreground">
                <BilingualText en="Nothing here yet. Say who you are looking for and follow a few people, and this page fills up." el="Τίποτα ακόμη. Πείτε ποιον ψάχνετε και ακολουθήστε μερικούς ανθρώπους, και η σελίδα θα γεμίσει." wrap />
              </p>
              <Button size="sm" asChild>
                <Link href="/profile/edit"><BilingualText en="Say who you are looking for" el="Πείτε ποιον ψάχνετε" compact /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          curated.map((item) => <FeedCard key={item.id} item={item} />)
        )}

        {more > 0 ? (
          <div className="flex justify-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setAll(true)} data-feed-more="">
              <BilingualText en={`Show ${more} more`} el={`Δείτε ${more} ακόμη`} compact />
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
