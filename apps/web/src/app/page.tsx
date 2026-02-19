'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Users, Zap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import {
  DashboardHero,
  DashboardStats,
  DashboardJobs,
  DashboardMembers,
  DashboardPoll,
  DashboardCalendar,
  DashboardActivity,
} from '@/components/dashboard';
import type { ActiveMember } from '@/components/dashboard';
import type { CalendarEvent } from '@/components/dashboard';
import type { DashboardStatsData } from '@/components/dashboard';
import { getRecommendations, listEvents, searchProfiles } from '@/lib/api';

function LandingContent() {
  return (
    <AppShell
      title="Connect, build, and ship with the right co-founders"
      description="Curated profiles, smart matching, and a modern workspace for founders, mentors, and investors."
      actions={
        <>
          <Link href="/register">
            <Button size="lg">Get started</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Sign in
            </Button>
          </Link>
        </>
      }
    >
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-hero-radial">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Alias-style social networking for startups
            </div>
            <CardTitle className="font-display text-2xl">
              Build your founder story with a standout profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Showcase traction, skills, and vision. Connect with talent that
              aligns to your mission and timeline.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Founder', 'Mentor', 'Investor', 'Org'].map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/discover">
                <Button variant="outline">Explore Discover</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost">View profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <StatCard label="Active profiles" value="2,430" icon={<Users className="h-5 w-5" />} />
          <StatCard label="Matches this week" value="148" icon={<Zap className="h-5 w-5" />} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Momentum highlights</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Launch your profile in minutes, sync your skills, and let the
              recommendations flow.
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function mapSuggestionsToMembers(suggestions: { id: string; userId: string; displayName: string; avatarUrl?: string | null }[]): ActiveMember[] {
  return suggestions.map((s) => ({
    id: s.userId || s.id,
    displayName: s.displayName,
    initials: s.displayName.slice(0, 2).toUpperCase(),
    avatarUrl: s.avatarUrl ?? null,
    isOnline: true,
  }));
}

function mapEventsToCalendar(events: { id: string; title: string; startAt: string }[]): CalendarEvent[] {
  return events.map((e) => {
    const d = new Date(e.startAt);
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return {
      id: e.id,
      title: e.title,
      date: e.startAt.slice(0, 10),
      time,
      href: '/events',
    };
  });
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [members, setMembers] = useState<ActiveMember[] | null>(null);
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [recRes, eventsRes, searchRes] = await Promise.all([
          getRecommendations({ limit: 5 }),
          listEvents({ scope: 'upcoming', limit: 4 }),
          searchProfiles({ limit: 1 }),
        ]);
        if (cancelled) return;
        setMembers(mapSuggestionsToMembers(recRes.suggestions));
        setEvents(mapEventsToCalendar(eventsRes.events));
        setStats({
          activeProfiles: searchRes.total,
          matchesThisWeek: 148,
          trendPercent: 12,
        });
      } catch {
        if (!cancelled) {
          setStats(null);
          setMembers(null);
          setEvents(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Activity + Hero / From the blog */}
        <div className="space-y-6">
          <DashboardHero />
          <DashboardActivity />
        </div>
        {/* Column 2: Stats + Jobs */}
        <div className="space-y-6">
          <DashboardStats data={stats} />
          <DashboardJobs />
        </div>
        {/* Column 3: Members + Poll + Calendar */}
        <div className="space-y-6">
          <DashboardMembers members={members} />
          <DashboardPoll />
          <DashboardCalendar events={events} />
        </div>
      </div>
    </AppShell>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    setIsLoggedIn(!!localStorage.getItem('accessToken'));
  }, []);

  if (!mounted) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-border/60 bg-card/70">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </AppShell>
    );
  }

  return isLoggedIn ? <DashboardContent /> : <LandingContent />;
}
