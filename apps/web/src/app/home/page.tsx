'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Circle } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbFigure, type CfbFigureId } from '@/components/illustrations/CfbCast';
import { SectionSticker, glyphStickerTint } from '@/components/dashboard/SectionSticker';
import { EmptyIllustration } from '@/components/common/EmptyIllustration';
import { HomeAskHero } from '@/components/dashboard/HomeAskHero';
import { HomeContinue } from '@/components/home/HomeContinue';
import { HomeEventStrip } from '@/components/home/HomeEventStrip';
import { HomeAssistantSuggestion } from '@/components/home/HomeAssistantSuggestion';
import { useTodayRows } from '@/components/dashboard/HomeToday';
import { listMilestones } from '@/lib/api';
import { dedupeWaitingRows } from '@/lib/home-waiting';
import { orderMilestones } from '@/lib/milestone-order';
import { HomeFeedSection } from '@/components/home/HomeFeedSection';
import { HomePeople } from '@/components/home/HomePeople';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRoleOptional } from '@/contexts/RoleContext';
import { useConnectionWith } from '@/hooks/useConnectionWith';
import { useStoredUser } from '@/hooks/useStoredUser';
import { getMeProfile, getRecommendations } from '@/lib/api';
import { viewerFacts } from '@/lib/match-explain';
import { usePageControls, usePageList } from '@/lib/page-controls';
import { qk, queryKeys } from '@/lib/query-keys';
import { HOME_COPY, homeAudience, homeOrder, memberRole, overviewPathFor, saysWhatTheyWant } from '@/lib/role-home';
import { cn } from '@/lib/utils';

/* The cast's own member for each audience — provider and org read as the
   builder. */
const AUDIENCE_FIGURE: Record<string, CfbFigureId> = {
  founder: 'founder',
  mentor: 'mentor',
  provider: 'mentor',
  investor: 'investor',
  org: 'builder',
};

const PEOPLE_ON_TOP = 3;
const WAITING_ON_TOP = 3;

/**
 * The first page (docs §118-119), the same shape for every member: one sentence
 * on what they came for, a line with what waits on them, three people who fit,
 * the steps while any are left, then what is happening around them. One card to
 * a row, across the whole column. The working detail is on Overview.
 */
function Home() {
  const params = useSearchParams();
  const router = useRouter();
  const storedUser = useStoredUser();
  const myId = storedUser?.id ?? null;
  const roleContext = useRoleOptional();
  const role = memberRole(roleContext?.primaryRole, storedUser?.role);
  const audience = homeAudience(role);
  const copy = HOME_COPY[audience];
  const { rows: waitingRows } = useTodayRows();
  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: queryKeys.me.profile(), queryFn: getMeProfile, staleTime: 60_000, retry: 0 });
  // The key /matches and the founder dashboard read, so the three lists agree.
  const { data: recommendations, isLoading: peopleLoading } = useQuery({
    queryKey: qk('recommendations', 'matches', { limit: 50 }),
    queryFn: () => getRecommendations({ limit: 50 }),
    staleTime: 3 * 60_000,
    retry: 0,
  });
  const { connectionWith, connectionOf, settled } = useConnectionWith(Boolean(myId), myId);

  // The same read HomeContinue makes: when the next open milestone is its row,
  // the waiting list must not repeat it (dedupe by what the row is about).
  const { data: milestonesData } = useQuery({
    queryKey: qk('milestones', 'all', 'all'),
    queryFn: () => listMilestones({ limit: 100 }),
    staleTime: 60_000,
    retry: 0,
  });
  const nextMilestone = orderMilestones(milestonesData?.milestones ?? []).find((m) => m.status !== 'completed' && m.status !== 'cancelled');

  const me = profile?.profile;
  const steps = [
    { key: 'looking', done: saysWhatTheyWant(audience, me), en: copy.want.en, el: copy.want.el, href: '/profile/edit' },
    { key: 'profile', done: Boolean(me?.displayName && me?.headline && me?.avatarUrl), en: 'Add your photo and what you do', el: 'Βάλτε φωτογραφία και τι κάνετε', href: '/profile/edit' },
    { key: 'connect', done: [...connectionWith.values()].some((link) => link.state === 'connected'), en: 'Connect with one person', el: 'Συνδεθείτε με έναν άνθρωπο', href: '/matches' },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  // Finished steps go, once the account is known: a founder who has done them
  // must not see them flash. `?first=1` shows them anyway, as a new account does.
  const showSteps = params?.get('first') === '1' || (!profileLoading && settled && doneCount < steps.length);

  // A brand-new account's welcome notice is not something waiting on them.
  const waiting = waitingRows.length;
  const showWaiting = waitingRows.some((row) => row.key !== 'now-notifications') || (waiting > 0 && !showSteps);

  // What waits, as Overview's Today lists it, and the way there.
  usePageList([
    {
      id: 'waiting_on_you',
      labelEn: 'Waiting on you',
      labelEl: 'Σας περιμένουν',
      rows: waitingRows.map((row) => `${row.en}${row.count ? ` ${row.count}` : ''}`),
      rowsEl: waitingRows.map((row) => `${row.el}${row.count ? ` ${row.count}` : ''}`),
    },
  ]);
  usePageControls([
    {
      id: 'open_waiting',
      labelEn: 'Open what is waiting on you',
      labelEl: 'Άνοιγμα όσων σας περιμένουν',
      writes: false,
      unavailableEn: waiting > 0 ? undefined : 'Nothing is waiting on you.',
      unavailableEl: waiting > 0 ? undefined : 'Δεν σας περιμένει τίποτα.',
      run: () => router.push(overviewPathFor(role)),
    },
  ]);

  const people = useMemo(() => recommendations?.suggestions ?? [], [recommendations]);
  const shownAbove = useMemo(
    () => new Set(people.filter((person) => person?.userId).slice(0, PEOPLE_ON_TOP).map((person) => person.userId)),
    [people],
  );
  const viewer = viewerFacts(profile?.profile ?? null);
  const loading = profileLoading || peopleLoading;
  const { stepsFirst, peopleEmptyButton } = homeOrder({ loading, peopleCount: people.length, showSteps });
  const peopleBlock = loading ? (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
    </div>
  ) : people.length > 0 ? (
    <HomePeople matches={people} viewer={viewer} myId={myId} limit={PEOPLE_ON_TOP} />
  ) : (
    <Card>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* The same mark the empty states carry — this card is one. */}
          <div data-keep-icon="" className="h-14 w-14 shrink-0 text-muted-foreground">
            <EmptyIllustration type="connection" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="card-body text-muted-foreground">
              <BilingualText en={`${copy.want.en}, and the people who fit will appear here.`} el={`${copy.want.el} και εδώ θα εμφανιστούν οι άνθρωποι που ταιριάζουν.`} wrap />
            </p>
            {peopleEmptyButton ? (
              <Button size="sm" asChild>
                <Link href="/profile/edit"><BilingualText en={copy.want.en} el={copy.want.el} compact /></Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const peopleSection = (
    <section className="space-y-3" aria-labelledby="home-people">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SectionSticker glyph="people" tint="accent" />
          <h2 id="home-people" className="card-title"><BilingualText en="People who fit" el="Άνθρωποι που ταιριάζουν" compact /></h2>
        </div>
        <Link href="/matches" className="tap-extend-y text-sm font-medium text-primary-accessible hover:underline">
          <BilingualText en="See everyone" el="Δείτε όλους" compact />
        </Link>
      </div>
      {/* Many names on one page: medium weight, so the section titles lead. */}
      <div data-home-quiet="">{peopleBlock}</div>
    </section>
  );

  const stepsSection = showSteps ? (
    <section aria-labelledby="home-steps">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <SectionSticker glyph="flag" tint="success" />
              <h2 id="home-steps" className="card-title"><BilingualText en="To begin" el="Για να ξεκινήσετε" compact /></h2>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs tabular-nums text-muted-foreground">
                <BilingualText en={`${doneCount} of ${steps.length}`} el={`${doneCount} από ${steps.length}`} compact />
              </span>
              {/* The member's own figure — an org reads as the builder. */}
              <span data-keep-icon="" className="self-center text-muted-foreground">
                <CfbFigure id={AUDIENCE_FIGURE[audience] ?? 'builder'} className="h-16 w-14" />
              </span>
            </div>
          </div>
          <ol className="divide-y divide-border">
            {steps.map((step) => (
              <li key={step.key}>
                <Link href={step.href} className="flex items-center gap-3 py-2.5 text-sm transition-colors hover:text-primary-accessible" data-home-step={step.done ? 'done' : 'open'}>
                  <span data-keep-icon="" className={cn('shrink-0', step.done ? 'text-status-success' : 'text-muted-foreground')}>
                    {step.done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Circle className="h-4 w-4" aria-hidden="true" />}
                  </span>
                  <span className={cn('min-w-0', step.done && 'text-muted-foreground')}>
                    <BilingualText en={step.en} el={step.el} compact wrap />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  ) : null;

  // The sentence is the role's: wait for it rather than show a founder's to a mentor.
  if (roleContext?.isLoading) {
    return (
      <AppShell askAi={false}>
        <div className="space-y-6">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={copy.title.en}
      titleEl={copy.title.el}
      description={copy.description.en}
      descriptionEl={copy.description.el}
      titleSrOnly
      askAi={false}
    >
      {/* Two columns from xl (docs §131.2, §142): the hero, the event strip,
          the people rail and the feed on the left; what is in progress, what
          waits and the steps on the right. The right column is one stack of
          its own, so a short card there no longer stretches or pushes the
          row beside it (a 140px gap under "Continue" and an empty band under
          the strip at 1440). On a phone that stack is `display: contents`
          and the order utilities keep the one-column priority order. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* The greeting leads the brand card: one «Καλημέρα, …», the one-line
            purpose, the question field and three starting points (docs §131.2). */}
        <div className="order-1 min-w-0 xl:col-span-2 xl:col-start-1">
          <HomeAskHero
            role={audience === 'org' ? 'incubator' : audience}
            hero
            plain
            name={me?.displayName?.split(' ')[0] ?? null}
            purposeEn={copy.description.en}
            purposeEl={copy.description.el}
          />
        </div>
        <div className="contents xl:col-start-3 xl:row-span-4 xl:row-start-1 xl:flex xl:flex-col xl:gap-6 xl:self-start" data-home-side="">
          {/* The one thing in progress, straight under the hero on a phone.
              One row, one verb. */}
          <div className="order-2 min-w-0">
            <HomeContinue />
          </div>
          {/* What waits, here and not one page away: the first three in Today's
              order (a person first), each row its own way in; the rest on Overview. */}
          {showWaiting ? (
            <section aria-labelledby="home-waiting" data-home-waiting="" className="order-3 min-w-0">
              <Card>
                <CardContent className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <SectionSticker glyph="bell" tint="warning" />
                      <h2 id="home-waiting" className="card-title">
                      <BilingualText
                        en={`${waiting} ${waiting === 1 ? 'thing is' : 'things are'} waiting on you`}
                        el={waiting === 1 ? 'Σας περιμένει 1 πράγμα' : `Σας περιμένουν ${waiting} πράγματα`}
                        compact
                        wrap
                      />
                      </h2>
                    </div>
                    {waiting > WAITING_ON_TOP ? (
                      <Link href={overviewPathFor(role)} className="tap-extend-y shrink-0 text-sm font-medium text-primary-accessible hover:underline" data-home-waiting-all="">
                        <BilingualText en={`All ${waiting}`} el={`Όλα (${waiting})`} compact />
                      </Link>
                    ) : null}
                  </div>
                  <ul className="divide-y divide-border">
                    {dedupeWaitingRows(waitingRows, nextMilestone).slice(0, WAITING_ON_TOP).map((row) => (
                      <li key={row.key}>
                        <Link href={row.href} className="group flex items-center gap-3 py-2.5 text-sm text-foreground transition-colors hover:text-primary-accessible" data-home-waiting-row={row.key}>
                          <SectionSticker glyph={row.glyph} tint={glyphStickerTint(row.glyph)} />
                          <span className="min-w-0 flex-1">
                            <BilingualText en={row.en} el={row.el} compact wrap />
                            {row.count ? <span className="ml-1.5 tabular-nums text-muted-foreground">{row.count}</span> : null}
                          </span>
                          <span data-keep-icon=""><ArrowRight className="icon-sm shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          ) : null}
          {/* The assistant's one offer, after what waits (docs §142). */}
          <HomeAssistantSuggestion people={people} shownAbove={shownAbove} connectionOf={connectionOf} className="order-3 min-w-0" />
          {stepsSection ? <div className={cn('min-w-0', stepsFirst ? 'order-5' : 'order-6')}>{stepsSection}</div> : null}
        </div>
        {/* The photo strip: small covers with the date badge, before the
            people rail (docs §131.2). */}
        <div className="order-4 min-w-0 xl:col-span-2 xl:col-start-1">
          <HomeEventStrip />
        </div>
        <div className={cn('min-w-0 xl:col-span-2 xl:col-start-1', stepsFirst ? 'order-6' : 'order-5')}>{peopleSection}</div>
        <div className="order-7 min-w-0 xl:col-span-2 xl:col-start-1">
          <HomeFeedSection people={people} shownAbove={shownAbove} connectionOf={connectionOf} />
        </div>
      </div>
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}
