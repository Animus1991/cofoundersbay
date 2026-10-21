'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HomeNextStep } from '@/components/dashboard/HomeNextStep';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FactLine } from '@/components/common/FactLine';
import { StatusText } from '@/components/common/StatusText';
import { BilingualText } from '@/components/common/BilingualText';
import { useToast } from '@/components/ui/toast';
import {
  listEvents,
  listResearchBoards,
  sendConnectionRequest,
  type EventItem,
  type SearchHit,
} from '@/lib/api';
import { qk } from '@/lib/query-keys';
import { dashboardEl, dashboardEn } from '@/lib/i18n/strings-dashboard';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { isPreviewDemo } from '@/lib/preview-demo';
import { STATUS } from '@/lib/semantic-colors';
import { cn, initialsOf } from '@/lib/utils';
import { matchReasonCopy } from '@/lib/match-reason';
import { calendarDaysUntil } from '@/lib/calendar-days';

type PhoneActivity = {
  id: string;
  href: string;
  textEn: string;
  textEl: string;
  timeEn: string;
  timeEl: string;
};

type PhoneMilestone = {
  id: string;
  titleEn: string;
  titleEl: string;
  progress: number;
  dueDate: string;
};

type DemoEvent = {
  id: string;
  titleEn: string;
  titleEl: string;
  type: string;
  time: string;
  date: string;
};

const SAMPLE_CONNECT = bilingualInline(
  'Sample profile: a connection request has nobody to reach',
  'Δείγμα προφίλ: το αίτημα σύνδεσης δεν έχει παραλήπτη',
);

function calendarDay(iso: string): { en: string; el: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { en: '', el: '' };
  const today = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const offset = Math.round((start(date) - start(today)) / 86_400_000);
  if (offset === 0) return { en: dashboardEn('today'), el: dashboardEl('today') };
  if (offset === 1) return { en: dashboardEn('tomorrow'), el: dashboardEl('tomorrow') };
  return {
    en: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
    el: new Intl.DateTimeFormat('el', { weekday: 'short' }).format(date),
  };
}

function clock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
}

function daysUntil(isoDate: string): number | null {
  return calendarDaysUntil(isoDate.slice(0, 10));
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const titled = parts.length > 1 && /^(dr|mr|ms|mrs)\.?$/i.test(parts[0] ?? '');
  return (titled ? parts[1] : parts[0]) || name;
}

function seenToday(lastSeenAt?: number | null): boolean {
  if (lastSeenAt == null || !Number.isFinite(lastSeenAt)) return false;
  const seen = new Date(lastSeenAt > 1e12 ? lastSeenAt : lastSeenAt * 1000);
  const now = new Date();
  return seen.getFullYear() === now.getFullYear()
    && seen.getMonth() === now.getMonth()
    && seen.getDate() === now.getDate();
}

/**
 * The founder's first glance.
 *
 * The unfinished thing and the next people lead at every width. What just
 * happened, the first person to answer, the milestone bar and the calendar
 * stay under 640px, where the column below is folded. Every control opens a
 * page that already exists. The wider column still holds the full lists.
 */
export function FounderPhoneHome({
  showResume,
  matches,
  activity,
  milestone,
  demoEvents,
  showDemoEvents,
}: {
  showResume: boolean;
  matches: SearchHit[];
  activity: PhoneActivity[];
  milestone: PhoneMilestone | null;
  demoEvents: DemoEvent[];
  showDemoEvents: boolean;
}) {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const sample = isPreviewDemo();
  const people = matches.filter((person) => person?.userId).slice(0, 8);
  const first = people[0];

  const boards = useQuery({
    queryKey: qk('research-boards', false),
    queryFn: () => listResearchBoards({ archived: false }),
    staleTime: 60_000,
    retry: 0,
  });
  const events = useQuery({
    queryKey: qk('events', 'upcoming', '', 'all'),
    queryFn: () => listEvents({ scope: 'upcoming', limit: 4 }),
    staleTime: 60_000,
    retry: 0,
  });

  const latestBoard = [...(boards.data?.boards ?? [])]
    .filter((board) => board && !board.isArchived)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))[0];

  const connect = useMutation({
    mutationFn: (receiverId: string) => sendConnectionRequest({ receiverId }),
    onSuccess: (_result, receiverId) => {
      setSentTo(receiverId);
      success('Connection request sent successfully');
      void queryClient.invalidateQueries({ queryKey: qk('connections') });
    },
    onError: () => showError('Could not send request'),
  });

  const liveEvents = events.data?.events ?? [];
  const eventRows = liveEvents.length > 0
    ? liveEvents.slice(0, 4)
    : !events.isLoading && showDemoEvents
      ? demoEvents.slice(0, 4)
      : [];

  const days = milestone?.dueDate ? daysUntil(milestone.dueDate) : null;
  const firstReason = first?.matchReasons?.[0] ? matchReasonCopy(first.matchReasons[0]) : null;
  const resumeIsMilestone = showResume && !boards.isLoading && !latestBoard && !!milestone;

  const hasResume = Boolean(
    (showResume && latestBoard) || (showResume && !latestBoard && !boards.isLoading && milestone),
  );
  const hasLead = hasResume || people.length > 0;

  return (
    <>
    {hasLead ? (
    <div className="min-w-0 space-y-6">
      {showResume && latestBoard ? (
        <HomeNextStep
          kickerEn="Research"
          kickerEl="Έρευνα"
          title={latestBoard.title}
          href={`/research/${latestBoard.id}`}
          actionEn="Continue"
          actionEl="Συνέχεια"
        />
      ) : null}

      {showResume && !latestBoard && !boards.isLoading && milestone ? (
        <HomeNextStep
          kickerEn="Next milestone"
          kickerEl="Επόμενο ορόσημο"
          titleEn={milestone.titleEn}
          titleEl={milestone.titleEl}
          href="/milestones"
          actionEn="Continue"
          actionEl="Συνέχεια"
          actionVariant="outline"
        />
      ) : null}

      {people.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              <BilingualText en={dashboardEn('top_matches')} el={dashboardEl('top_matches')} compact wrap />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex min-w-0 gap-3 overflow-x-auto pb-1">
              {people.map((person) => (
                <Link
                  key={person.userId}
                  href={`/profiles/${person.userId}`}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-md focus-ring"
                >
                  <Avatar>
                    <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>{initialsOf(person.displayName)}</AvatarFallback>
                  </Avatar>
                  <span className="line-clamp-2 w-full text-center text-xs text-foreground">
                    {shortName(person.displayName ?? '')}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
    ) : null}

    <div className="min-w-0 space-y-6 sm:hidden">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              <BilingualText en={dashboardEn('recent_activity')} el={dashboardEl('recent_activity')} compact wrap />
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2" data-actions="">
              <Button asChild variant="outline" size="sm">
                <Link href="/updates">
                  <BilingualText en="Log an update" el="Καταχώριση ενημέρωσης" compact />
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/feed">
                  <BilingualText en="Write a post" el="Νέα δημοσίευση" compact />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <BilingualText en={dashboardEn('no_recent_activity')} el={dashboardEl('no_recent_activity')} wrap />
            </p>
          ) : (
            activity.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="axis-row block rounded-md py-2 transition-colors hover:bg-accent"
              >
                <p className="text-sm text-foreground">
                  <BilingualText en={item.textEn} el={item.textEl} stacked wrap />
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <BilingualText en={item.timeEn} el={item.timeEl} compact />
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {first ? (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={first.avatarUrl ?? undefined} alt="" />
                <AvatarFallback>{initialsOf(first.displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium text-foreground">{first.displayName}</p>
                  {(first.matchScore ?? 0) > 0 ? (
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{first.matchScore}%</p>
                  ) : null}
                </div>
                {first.headline ? (
                  <p className="text-xs text-muted-foreground">{first.headline}</p>
                ) : seenToday(first.lastSeenAt) ? (
                  <p className="text-xs text-muted-foreground">
                    <BilingualText en="Active today" el="Ενεργός σήμερα" compact />
                  </p>
                ) : null}
                {firstReason ? (
                  <p className="text-xs text-muted-foreground">
                    <BilingualText en={firstReason.en} el={firstReason.el} compact wrap />
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2" data-actions="">
              <Button
                type="button"
                size="sm"
                className="min-w-0 flex-1"
                disabled={sample || sentTo === first.userId || connect.isPending}
                title={sample ? SAMPLE_CONNECT : undefined}
                onClick={() => {
                  if (!sample && first.userId) connect.mutate(first.userId);
                }}
              >
                <BilingualText
                  en={sentTo === first.userId ? 'Request sent' : 'Connect'}
                  el={sentTo === first.userId ? 'Το αίτημα εστάλη' : 'Σύνδεση'}
                  compact
                />
              </Button>
              <Button asChild variant="outline" size="sm" className="min-w-0 flex-1">
                <Link href={`/profiles/${first.userId}`}>
                  <BilingualText en="See profile" el="Δείτε το προφίλ" compact />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {milestone && !resumeIsMilestone && !(showResume && boards.isLoading) ? (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  <BilingualText en="Next milestone" el="Επόμενο ορόσημο" compact />
                </p>
                <p className="text-sm font-medium text-foreground">
                  <BilingualText en={milestone.titleEn} el={milestone.titleEl} compact wrap />
                </p>
              </div>
              {days !== null ? (
                <p className={cn('shrink-0 text-xs tabular-nums', days < 0 ? STATUS.danger.icon : 'text-muted-foreground')}>
                  {days < 0 ? (
                    <BilingualText en="Overdue" el="Εκπρόθεσμο" compact />
                  ) : days === 0 ? (
                    <BilingualText en={dashboardEn('today')} el={dashboardEl('today')} compact />
                  ) : days === 1 ? (
                    <BilingualText en={dashboardEn('tomorrow')} el={dashboardEl('tomorrow')} compact />
                  ) : (
                    <BilingualText en={`${days}d left`} el={`${days} ημ. απομένουν`} compact />
                  )}
                </p>
              ) : null}
            </div>
            <Progress
              value={milestone.progress}
              label={bilingualAria(
                `${milestone.titleEn}: ${milestone.progress}%`,
                `${milestone.titleEl}: ${milestone.progress}%`,
              )}
              className="h-2.5"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <BilingualText en={dashboardEn('upcoming')} el={dashboardEl('upcoming')} compact wrap />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventRows.map((event) => {
            const real = 'startAt' in event;
            const item = event as EventItem;
            const demo = event as DemoEvent;
            const when = real ? item.startAt : demo.date;
            const day = calendarDay(when);
            const time = real ? clock(item.startAt) : demo.time;
            const title = real ? item.title : demo.titleEn;
            const titleEl = real ? item.title : demo.titleEl;
            return (
              <Link
                key={real ? item.id : demo.id}
                href="/events"
                className="flex items-start gap-3 rounded-md transition-colors hover:bg-accent"
              >
                <div className="w-20 shrink-0 rounded-xl border border-border px-2 py-2">
                  <p className="text-xs text-muted-foreground">
                    <BilingualText en={day.en} el={day.el} compact />
                  </p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">{time}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {real ? title : <BilingualText en={demo.titleEn} el={titleEl} compact wrap />}
                  </p>
                  <FactLine
                    items={[
                      <StatusText key="type" value={real ? item.eventType : demo.type} />,
                      real ? item.location : null,
                      real && item.attendeesCount > 0 ? (
                        <BilingualText
                          key="going"
                          en={`${item.attendeesCount} going`}
                          el={`${item.attendeesCount} συμμετοχές`}
                          compact
                        />
                      ) : null,
                    ]}
                  />
                </div>
              </Link>
            );
          })}
          {eventRows.length === 0 && !events.isLoading ? (
            <p className="text-sm text-muted-foreground">
              <BilingualText en="No events this week" el="Δεν υπάρχουν εκδηλώσεις αυτή την εβδομάδα" wrap />
            </p>
          ) : null}
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/events">
              <BilingualText en="Full calendar" el="Πλήρες ημερολόγιο" compact />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
