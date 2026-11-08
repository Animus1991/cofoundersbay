'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react';
import { BilingualText } from '@/components/common/BilingualText';
import { HomeToday } from '@/components/dashboard/HomeToday';
import { HomeContinue } from '@/components/home/HomeContinue';
import { HomePeople } from '@/components/home/HomePeople';
import { HomeVariantSwitch } from '@/components/home/HomeVariantSwitch';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useConnectionWith } from '@/hooks/useConnectionWith';
import { useStoredUser } from '@/hooks/useStoredUser';
import { getMeProfile, getRecommendations } from '@/lib/api';
import { saysLookingFor, viewerFacts } from '@/lib/match-explain';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

/**
 * The first page as people to meet (docs §116).
 *
 * Someone new sees one sentence on what the platform is for, three people who
 * fit, and at most three steps. Someone who has started sees what waits on
 * them, a few people, and the one thing in progress. Everything else is a
 * page of its own in the menu.
 */
function PeopleHome() {
  const params = useSearchParams();
  const myId = useStoredUser()?.id ?? null;
  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: queryKeys.me.profile(), queryFn: getMeProfile, staleTime: 60_000, retry: 0 });
  const { data: recommendations, isLoading: peopleLoading } = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: () => getRecommendations({ limit: 5 }),
    staleTime: 60_000,
    retry: 0,
  });
  const { connectionWith } = useConnectionWith(Boolean(myId), myId);

  const me = profile?.profile;
  const steps = [
    { key: 'looking', done: saysLookingFor(me), en: 'Say who you are looking for', el: 'Πείτε ποιον ψάχνετε', href: '/profile/edit' },
    { key: 'profile', done: Boolean(me?.displayName && me?.headline && me?.avatarUrl), en: 'Add your photo and what you do', el: 'Βάλτε φωτογραφία και τι κάνετε', href: '/profile/edit' },
    { key: 'connect', done: [...connectionWith.values()].some((link) => link.state === 'connected'), en: 'Connect with one person', el: 'Συνδεθείτε με έναν άνθρωπο', href: '/matches' },
  ];
  const doneCount = steps.filter((step) => step.done).length;
  // The comparison can ask for either state; otherwise the account decides.
  const asked = params?.get('first');
  const firstVisit = asked === '1' ? true : asked === '0' ? false : !profileLoading && doneCount < steps.length;

  const people = recommendations?.suggestions ?? [];
  const viewer = viewerFacts(profile?.profile ?? null);
  const loading = profileLoading || peopleLoading;
  const peopleBlock = loading ? (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
    </div>
  ) : people.length > 0 ? (
    <HomePeople matches={people} viewer={viewer} myId={myId} />
  ) : (
    <Card>
      <CardContent className="space-y-3">
        <p className="card-body text-muted-foreground">
          <BilingualText en="Say who you are looking for, and the people who fit will appear here." el="Πείτε ποιον ψάχνετε και εδώ θα εμφανιστούν οι άνθρωποι που ταιριάζουν." wrap />
        </p>
        <Button size="sm" asChild>
          <Link href="/profile/edit"><BilingualText en="Say who you are looking for" el="Πείτε ποιον ψάχνετε" compact /></Link>
        </Button>
      </CardContent>
    </Card>
  );

  if (firstVisit) {
    return (
      <AppShell
        title="Find who you will build your company with"
        titleEl="Βρείτε με ποιον θα χτίσετε την εταιρεία σας"
        description="People who fit what you are looking for, and a way to start working with them."
        descriptionEl="Άνθρωποι που ταιριάζουν με όσα ψάχνετε, και ένας τρόπος να ξεκινήσετε μαζί τους."
        askAi={false}
      >
        <div className="space-y-6">
          <HomeVariantSwitch current="people" firstVisit={asked === '1'} />
          <section className="space-y-3" aria-labelledby="home-first-people">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="home-first-people" className="card-title"><BilingualText en="People who fit" el="Άνθρωποι που ταιριάζουν" compact /></h2>
              <Link href="/matches" className="tap-extend-y text-sm font-medium text-primary-accessible hover:underline">
                <BilingualText en="See everyone" el="Δείτε όλους" compact />
              </Link>
            </div>
            {peopleBlock}
          </section>
          <section aria-labelledby="home-first-steps">
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 id="home-first-steps" className="card-title"><BilingualText en="To begin" el="Για να ξεκινήσετε" compact /></h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    <BilingualText en={`${doneCount} of ${steps.length}`} el={`${doneCount} από ${steps.length}`} compact />
                  </span>
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
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Home" titleEl="Αρχική" askAi={false}>
      <div className="space-y-6">
        <HomeVariantSwitch current="people" />
        <HomeToday />
        <section className="space-y-3" aria-labelledby="home-for-you">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="home-for-you" className="card-title"><BilingualText en="For you" el="Για εσάς" compact /></h2>
            <Link href="/matches" className="tap-extend-y text-sm font-medium text-primary-accessible hover:underline">
              <BilingualText en="See everyone" el="Δείτε όλους" compact />
            </Link>
          </div>
          {peopleBlock}
        </section>
        <HomeContinue />
      </div>
    </AppShell>
  );
}

export default function PeopleHomePage() {
  return (
    <Suspense fallback={null}>
      <PeopleHome />
    </Suspense>
  );
}
