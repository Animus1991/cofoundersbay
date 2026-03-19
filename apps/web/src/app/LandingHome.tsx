import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  Compass,
  GraduationCap,
  MessageCircle,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FEATURES: Array<{ icon: LucideIcon; title: string; desc: string }> = [
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

const PERSONAS: Array<{
  icon: LucideIcon;
  role: string;
  color: string;
  bg: string;
  headline: string;
  bullets: string[];
}> = [
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
      "Track founders you're following",
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

export function LandingHome() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#roles" className="transition-colors hover:text-foreground">Who it&apos;s for</a>
            <a href="#cta" className="transition-colors hover:text-foreground">Get Started</a>
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

      <section className="relative flex min-h-screen items-center overflow-hidden pt-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute inset-0 bg-hero-radial opacity-60" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              The startup ecosystem, connected
            </span>
          </div>

          <h1
            className="animate-fade-in font-display text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '100ms' }}
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
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl animate-fade-in text-lg text-muted-foreground md:text-xl"
            style={{ animationDelay: '200ms' }}
          >
            CoFounderBay connects founders, mentors, investors, and accelerators through smart
            matching, real-time messaging, and curated events.
          </p>

          <div
            className="mt-10 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: '300ms' }}
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
          </div>

          <div
            className="mt-16 grid animate-fade-in grid-cols-3 gap-4 sm:grid-cols-3"
            style={{ animationDelay: '400ms' }}
          >
            {[
              { value: '2,400+', label: 'Active members' },
              { value: '148', label: 'Matches this week' },
              { value: '60+', label: 'Events hosted' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl border border-border/50 bg-card/50 p-4 text-center backdrop-blur-sm"
              >
                <p className="font-display text-2xl font-bold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="border-t border-border/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Built for every role in the ecosystem
            </h2>
            <p className="mt-3 text-muted-foreground">
              Whether you&apos;re building, advising, investing, or supporting, CoFounderBay works for you.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAS.map(({ icon: Icon, role, color, bg, headline, bullets }, index) => (
              <div
                key={role}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Card className={`h-full border ${bg} card-interactive hover-lift`}>
                  <CardHeader className="pb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <Badge variant="outline" className={`mt-2 w-fit border-current text-xs ${color}`}>
                      {role}
                    </Badge>
                    <CardTitle className="text-base">{headline}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
                        {bullet}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border/40 bg-secondary/20 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything your startup network needs
            </h2>
            <p className="mt-3 text-muted-foreground">
              One platform. No scattered tools. From introductions to signed term sheets.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className="group flex animate-fade-in gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-glow-sm"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="px-6 py-24 text-center">
        <div className="mx-auto max-w-xl space-y-6 animate-fade-in">
          <h2 className="font-display text-4xl font-bold text-foreground">
            Ready to find your people?
          </h2>
          <p className="text-lg text-muted-foreground">
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
        </div>
      </section>
    </div>
  );
}
