'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Users,
  Compass,
  GraduationCap,
  TrendingUp,
  Building2,
  MessageCircle,
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DashboardHero,
  DashboardStats,
  DashboardJobs,
  DashboardMembers,
  DashboardPoll,
  DashboardCalendar,
  DashboardActivity,
  DashboardNewsletter,
} from '@/components/dashboard';
import { AnimatedCard } from '@/components/common/AnimatedCard';
import type { ActiveMember } from '@/components/dashboard';
import type { CalendarEvent } from '@/components/dashboard';
import {
  getRecommendations,
  listEvents,
  getDashboardStats,
  getDashboardActivity,
  getMeProfile,
  getActivePoll,
  listJobs,
} from '@/lib/api';

const FEATURES = [
  {
    icon: Compass,
    title: 'Smart matchmaking',
    desc: 'AI-powered discovery surfaces the right co-founders, mentors, and investors based on role, skills, and stage.',
  },
  {
    icon: MessageCircle,
    title: 'Real-time messaging',
    desc: 'Chat directly with anyone in the network. Threads are persistent, searchable, and support file attachments.',
  },
  {
    icon: GraduationCap,
    title: 'Mentoring & sessions',
    desc: 'Book 1:1 sessions with verified mentors. Integrated scheduling, video links, and session notes.',
  },
  {
    icon: Calendar,
    title: 'Events & networking',
    desc: 'Discover meetups, webinars, and demo days. RSVP in one click and add them to your calendar.',
  },
  {
    icon: Briefcase,
    title: 'Jobs & opportunities',
    desc: 'Startups post roles and equity opportunities. Apply directly through your profile.',
  },
  {
    icon: Shield,
    title: 'Trust & safety',
    desc: 'Verified profiles, moderation tools, and privacy controls to keep the community quality high.',
  },
];

const PERSONAS = [
  {
    icon: Briefcase,
    role: 'Founder',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    headline: 'Find your co-founder',
    bullets: [
      'Get matched with complementary skill sets',
      'Showcase traction, vision, and stage',
      'Access mentors and investors in one place',
    ],
  },
  {
    icon: GraduationCap,
    role: 'Mentor',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    headline: 'Scale your impact',
    bullets: [
      'Set availability and get booked instantly',
      'Help vetted founders with real challenges',
      'Build your advisory portfolio',
    ],
  },
  {
    icon: TrendingUp,
    role: 'Investor',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    headline: 'Source deals smarter',
    bullets: [
      'Filter by stage, sector, and geography',
      'See warm intros through shared connections',
      'Track founders you\'re following',
    ],
  },
  {
    icon: Building2,
    role: 'Accelerator',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    headline: 'Run your cohort',
    bullets: [
      'Organize events and office hours at scale',
      'Connect portfolio founders with mentors',
      'Manage your community in one workspace',
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

function LandingContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav bar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <span className="font-display text-lg font-bold text-foreground tracking-tight">
            CoFounderBay
          </span>
          <div className="hidden items-center gap-7 md:flex text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#roles" className="hover:text-foreground transition-colors">Who it&apos;s for</a>
            <a href="#cta" className="hover:text-foreground transition-colors">Get Started</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">Join free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-96 w-96 translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute inset-0 bg-hero-radial opacity-60" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              The startup ecosystem, connected
            </span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Find your{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              co-founder,
            </span>
            <br />
            mentor, or{' '}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              investor
            </span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
          >
            CoFounderBay connects founders, mentors, investors, and accelerators through smart
            matching, real-time messaging, and curated events.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 py-6 text-base">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="outline" size="lg" className="px-8 py-6 text-base">
                Explore profiles
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="mt-16 grid grid-cols-3 gap-4 sm:grid-cols-3"
          >
            {[
              { value: '2,400+', label: 'Active members' },
              { value: '148', label: 'Matches this week' },
              { value: '60+', label: 'Events hosted' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm text-center"
              >
                <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Personas */}
      <section id="roles" className="border-t border-border/40 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="mb-12 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Built for every role in the ecosystem
            </h2>
            <p className="mt-3 text-muted-foreground">
              Whether you&apos;re building, advising, investing, or supporting — CoFounderBay works for you.
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAS.map(({ icon: Icon, role, color, bg, headline, bullets }, i) => (
              <motion.div
                key={role}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className={`border ${bg} hover-lift card-interactive h-full`}>
                  <CardHeader className="pb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <Badge variant="outline" className={`mt-2 w-fit text-xs ${color} border-current`}>
                      {role}
                    </Badge>
                    <CardTitle className="text-base">{headline}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
                        {b}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/40 bg-secondary/20 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
            className="mb-12 text-center"
          >
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything your startup network needs
            </h2>
            <p className="mt-3 text-muted-foreground">
              One platform. No scattered tools. From introductions to signed term sheets.
            </p>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="group flex gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-300"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-24 px-6 text-center">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="mx-auto max-w-xl space-y-6"
        >
          <h2 className="font-display text-4xl font-bold text-foreground">
            Ready to find your people?
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of founders, mentors, and investors already building meaningful
            connections on CoFounderBay.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 py-6 text-base">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="outline" size="lg" className="gap-2 px-8 py-6 text-base">
                <Users className="h-4 w-4" />
                Browse profiles
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function mapSuggestionsToMembers(
  suggestions: { id: string; userId: string; displayName: string; avatarUrl?: string | null }[],
): ActiveMember[] {
  return suggestions.map((s) => ({
    id: s.userId || s.id,
    displayName: s.displayName,
    initials: s.displayName.slice(0, 2).toUpperCase(),
    avatarUrl: s.avatarUrl ?? null,
    isOnline: true,
  }));
}

function mapEventsToCalendar(
  events: { id: string; title: string; startAt: string }[],
): CalendarEvent[] {
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

function mapActivityItems(
  items: { id: string; type: string; title: string; author?: string; timeAgo: string; href: string }[],
) {
  return items.map((a) => ({
    id: a.id,
    type: (a.type === 'connection' ? 'connection' : 'discussion') as 'discussion' | 'connection' | 'event',
    title: a.title,
    author: a.author,
    timeAgo: a.timeAgo,
    href: a.href,
  }));
}

function DashboardContent() {
  const { data: profileData } = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: getMeProfile,
  });
  const displayName = profileData?.profile?.displayName ?? 'there';

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  });

  const { data: membersData } = useQuery({
    queryKey: ['recommendations', { limit: 5 }],
    queryFn: () => getRecommendations({ limit: 5 }),
  });
  const members = membersData?.suggestions
    ? mapSuggestionsToMembers(membersData.suggestions)
    : null;

  const { data: eventsData } = useQuery({
    queryKey: ['events', { scope: 'upcoming', limit: 4 }],
    queryFn: () => listEvents({ scope: 'upcoming', limit: 4 }),
  });
  const events = eventsData?.events
    ? mapEventsToCalendar(eventsData.events)
    : null;

  const { data: activityData } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => getDashboardActivity({ limit: 5 }),
  });
  const activityItems = activityData ? mapActivityItems(activityData) : null;

  const { data: pollData } = useQuery({
    queryKey: ['polls', 'active'],
    queryFn: getActivePoll,
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', { limit: 4 }],
    queryFn: () => listJobs({ limit: 4 }),
  });
  const jobs = jobsData?.jobs ?? null;

  const stats = statsData
    ? {
        activeProfiles: statsData.activeProfiles,
        matchesThisWeek: statsData.matchesThisWeek,
        trendPercent: statsData.trendPercent,
        chartData: statsData.chartData,
      }
    : null;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-glow-sm backdrop-blur">
          <h1 className="font-display text-xl font-semibold text-foreground">
            Welcome back, {displayName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in your network today.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <AnimatedCard index={0}>
              <DashboardHero />
            </AnimatedCard>
            <AnimatedCard index={1}>
              <DashboardActivity items={activityItems} />
            </AnimatedCard>
            <AnimatedCard index={2}>
              <DashboardNewsletter />
            </AnimatedCard>
          </div>
          <div className="space-y-6">
            <AnimatedCard index={3}>
              <DashboardStats data={stats} isLoading={statsLoading} />
            </AnimatedCard>
            <AnimatedCard index={4}>
              <DashboardJobs jobs={jobs} />
            </AnimatedCard>
          </div>
          <div className="space-y-6">
            <AnimatedCard index={5}>
              <DashboardMembers members={members} />
            </AnimatedCard>
            <AnimatedCard index={6}>
              <DashboardPoll poll={pollData?.poll ?? null} />
            </AnimatedCard>
            <AnimatedCard index={7}>
              <DashboardCalendar events={events} />
            </AnimatedCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('accessToken');
    return !!token;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    setIsLoggedIn(checkAuth());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === null) {
        setIsLoggedIn(checkAuth());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [checkAuth]);

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
