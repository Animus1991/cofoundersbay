'use client';

import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  href?: string;
};

const defaultEvents: CalendarEvent[] = [
  { id: '1', title: 'Community call', date: '2025-02-18', time: '18:00', href: '/events' },
  { id: '2', title: 'Office hours with mentors', date: '2025-02-20', time: '14:00', href: '/events' },
  { id: '3', title: 'Pitch practice', date: '2025-02-22', time: '17:00', href: '/events' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
}

type DashboardCalendarProps = {
  events?: CalendarEvent[] | null;
  className?: string;
};

export function DashboardCalendar({ events = defaultEvents, className }: DashboardCalendarProps) {
  const list = events ?? defaultEvents;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Calendar className="icon-sm text-muted-foreground" />
          Upcoming events
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/events">
            All <ChevronRight className="icon-sm" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {list.slice(0, 4).map((ev) => (
            <li key={ev.id}>
              <Link
                href={ev.href ?? '/events'}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3 text-sm transition-colors hover:bg-secondary/60"
              >
                <span className="flex shrink-0 rounded bg-primary/15 px-2 py-1 text-xs font-medium text-primary-accessible">
                  {formatDate(ev.date)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{ev.title}</p>
                  {ev.time && <p className="text-xs text-muted-foreground">{ev.time}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
