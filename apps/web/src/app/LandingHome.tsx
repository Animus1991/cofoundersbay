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
  Star,
  Zap,
  Target,
  UserCheck,
  Rocket,
  Network,
  Globe,
  Twitter,
  Linkedin,
  Github,
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

const HOW_IT_WORKS: Array<{ step: number; icon: LucideIcon; title: string; desc: string; color: string }> = [
  {
    step: 1,
    icon: UserCheck,
    title: 'Build your profile',
    desc: 'Complete your guided onboarding. Define your role, expertise, startup stage, work style, and what you\'re looking for in a co-founder or collaborator.',
    color: 'text-indigo-400 bg-indigo-500/10',
  },
  {
    step: 2,
    icon: Target,
    title: 'Get matched intelligently',
    desc: 'Our multi-dimension matching engine scores compatibility across skills, stage, industry, location, values, and goals — with full transparency on why each match appears.',
    color: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    step: 3,
    icon: Rocket,
    title: 'Start building together',
    desc: 'Send a connection request, open a private conversation, set shared milestones, and access mentors, investors, and communities — all in one workspace.',
    color: 'text-primary bg-primary/10',
  },
];

const PLATFORM_STATS: Array<{ value: string; label: string; sub?: string }> = [
  { value: '12,400+', label: 'Registered Members',    sub: 'founders, mentors & investors' },
  { value: '3,200+',  label: 'Successful Connections', sub: 'meaningful introductions made' },
  { value: '820+',    label: 'Mentors Available',      sub: 'across 40+ industries'          },
  { value: '95%',     label: 'Profile Match Accuracy', sub: 'reported by users'              },
  { value: '240+',    label: 'Events Hosted',          sub: 'online & in-person'             },
  { value: '60+',     label: 'Partner Organizations',  sub: 'incubators & accelerators'      },
];

const TESTIMONIALS: Array<{
  name: string; role: string; company: string; avatar: string;
  quote: string; rating: number; tag: string;
}> = [
  {
    name: 'Alexandros Papadopoulos',
    role: 'Founder & CEO',
    company: 'NovaSense.io',
    avatar: 'AP',
    quote: 'I found my technical co-founder within two weeks of joining. The compatibility score wasn\'t just accurate — it explained *why* we\'d work well together. We\'ve been building for 8 months now.',
    rating: 5,
    tag: 'Co-founder Match',
  },
  {
    name: 'Maria Stavridou',
    role: 'Mentor & Angel Investor',
    company: 'Former VP, Workday',
    avatar: 'MS',
    quote: 'CoFounderBay lets me set availability, filter by stage and sector, and only see founders who are genuinely a fit for my expertise. The session booking flow is the smoothest I\'ve used.',
    rating: 5,
    tag: 'Mentor Experience',
  },
  {
    name: 'James Okafor',
    role: 'CTO & Co-founder',
    company: 'GreenLoop Tech',
    avatar: 'JO',
    quote: 'As a technical co-founder looking for a mission-driven startup, the values-based matching was a game changer. I joined a CleanTech company I\'d never have found on LinkedIn.',
    rating: 5,
    tag: 'Co-founder Seeker',
  },
  {
    name: 'Priya Krishnamurthy',
    role: 'Program Director',
    company: 'Athens Innovation Center',
    avatar: 'PK',
    quote: 'We migrated our entire cohort management to CoFounderBay. The tenant workspace, mentor pool, and event system save us hours every week. Our founders love the community features.',
    rating: 5,
    tag: 'Accelerator',
  },
  {
    name: 'Dimitris Lekkas',
    role: 'Seed Investor',
    company: 'Aegean Ventures',
    avatar: 'DL',
    quote: 'The scouting dashboard surfaces early-stage deals I would have completely missed. Pipeline tracking, watchlists, and warm intro paths — everything I need in one clean interface.',
    rating: 5,
    tag: 'Investor Tools',
  },
  {
    name: 'Sofia Hartmann',
    role: 'Founder',
    company: 'Medly Health',
    avatar: 'SH',
    quote: 'From fundraising tracker to pitch deck builder to investor scouting — CoFounderBay replaced four separate tools for me. The profile completion prompts alone helped me land my first VC call.',
    rating: 5,
    tag: 'All-in-one Platform',
  },
];

const PRICING_PLANS: Array<{
  name: string; price: string; period: string; highlight: boolean;
  badge?: string; desc: string; features: string[]; cta: string; href: string;
}> = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    highlight: false,
    desc: 'Everything you need to get started and explore the ecosystem.',
    features: [
      'Full profile with skills & preferences',
      'Up to 10 connection requests/month',
      'Access to mentor directory',
      'Join up to 3 communities',
      'Basic match discovery',
      'Milestone tracker (5 milestones)',
    ],
    cta: 'Start for free',
    href: '/register',
  },
  {
    name: 'Pro',
    price: '€19',
    period: 'per month',
    highlight: true,
    badge: 'Most popular',
    desc: 'For founders and co-founders actively building their startup team.',
    features: [
      'Unlimited connection requests',
      'Priority match placement',
      'Full fundraising toolkit',
      'Unlimited communities & milestones',
      'Startup Builder & Pitch Deck tool',
      'Direct messaging with read receipts',
      'Analytics dashboard',
      'AI Assistant (50 requests/month)',
    ],
    cta: 'Start Pro trial',
    href: '/register?plan=pro',
  },
  {
    name: 'Organization',
    price: 'Custom',
    period: 'per cohort/year',
    highlight: false,
    desc: 'For incubators, accelerators, universities, and innovation hubs.',
    features: [
      'Branded tenant workspace',
      'Program & cohort management',
      'Mentor pool with scheduling',
      'Event management at scale',
      'Advanced analytics & reporting',
      'SSO & domain mapping',
      'API access & webhooks',
      'Dedicated success manager',
    ],
    cta: 'Contact us',
    href: '/contact',
  },
];

const TRUSTED_BY: Array<{ name: string; abbr: string; color: string }> = [
  { name: 'Y Combinator',    abbr: 'YC',  color: 'text-orange-500' },
  { name: 'Techstars',       abbr: 'TS',  color: 'text-blue-500'   },
  { name: 'EIT Digital',     abbr: 'EIT', color: 'text-cyan-500'   },
  { name: 'Innovate UK',     abbr: 'IUK', color: 'text-green-500'  },
  { name: 'Google for Startups', abbr: 'GfS', color: 'text-primary' },
  { name: 'MIT Delta v',     abbr: 'MIT', color: 'text-red-500'    },
];

export function LandingHome() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#roles" className="transition-colors hover:text-foreground">Who it&apos;s for</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">Join free <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
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
            matching, real-time messaging, and curated events. No noise — just quality connections.
          </p>

          <div
            className="mt-10 flex animate-fade-in flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ animationDelay: '300ms' }}
          >
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 py-6 text-base shadow-lg shadow-primary/25">
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
            className="mt-16 grid animate-fade-in grid-cols-3 gap-4"
            style={{ animationDelay: '400ms' }}
          >
            {[
              { value: '12,400+', label: 'Active members' },
              { value: '3,200+',  label: 'Connections made' },
              { value: '240+',    label: 'Events hosted' },
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

      {/* ── Trusted By ─────────────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-secondary/10 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
            Trusted by founders from leading programs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {TRUSTED_BY.map(({ name, abbr, color }) => (
              <div key={name} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <span className={`font-bold text-lg font-display ${color}`}>{abbr}</span>
                <span className="text-sm text-muted-foreground hidden sm:block">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="border-t border-border/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">How it works</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              From profile to co-founder in 3 steps
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              CoFounderBay removes the guesswork from founder matching with structured profiles,
              explainable scores, and end-to-end collaboration tools.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }, index) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center gap-5 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${color} ring-4 ring-background`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow">
                    {step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Personas ───────────────────────────────────────────────────────── */}
      <section id="roles" className="border-t border-border/40 bg-secondary/20 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">Roles</Badge>
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

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="border-t border-border/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">Platform</Badge>
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

      {/* ── Platform Statistics ────────────────────────────────────────────── */}
      <section className="border-t border-border/40 bg-gradient-to-br from-primary/5 via-background to-accent/5 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">By the numbers</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              A thriving ecosystem
            </h2>
            <p className="mt-3 text-muted-foreground">
              Real impact, real connections, real outcomes — across the global startup community.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_STATS.map(({ value, label, sub }, index) => (
              <div
                key={label}
                className="animate-fade-in rounded-2xl border border-border/60 bg-card/80 p-6 text-center backdrop-blur-sm"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <p className="font-display text-4xl font-bold text-primary">{value}</p>
                <p className="mt-2 font-semibold text-foreground">{label}</p>
                {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/40 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">Testimonials</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Loved by founders, mentors & investors
            </h2>
            <p className="mt-3 text-muted-foreground">
              Real stories from real members of the CoFounderBay community.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, company, avatar, quote, rating, tag }, index) => (
              <div
                key={name}
                className="animate-fade-in flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-md"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Badge variant="secondary" className="text-xs">{tag}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-border/40 pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role} · {company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="border-t border-border/40 bg-secondary/20 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center animate-fade-in">
            <Badge variant="outline" className="mb-3 text-primary border-primary/30">Pricing</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade when you need more firepower. No hidden fees.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_PLANS.map(({ name, price, period, highlight, badge, desc, features, cta, href }, index) => (
              <div
                key={name}
                className={`animate-fade-in relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  highlight
                    ? 'border-primary/60 bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]'
                    : 'border-border/60 bg-card/80 hover:border-primary/20'
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-sm">
                    {badge}
                  </Badge>
                )}
                <div className="mb-5">
                  <h3 className="font-bold text-lg text-foreground">{name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-foreground">{price}</span>
                    <span className="text-sm text-muted-foreground">/{period}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={href}>
                  <Button
                    variant={highlight ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {cta}
                    {highlight && <ArrowRight className="ml-1.5 h-4 w-4" />}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            All plans include a 14-day free trial of Pro features. No credit card required.
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section id="cta" className="border-t border-border/40 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Network className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h2 className="font-display text-4xl font-bold text-foreground">
            Ready to find your people?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Join thousands of founders, mentors, and investors already building meaningful
            connections on CoFounderBay. Free to start, no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-10 py-6 text-base shadow-lg shadow-primary/25">
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
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-secondary/10 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 mb-10">
            <div className="lg:col-span-2 space-y-4">
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                The startup ecosystem platform connecting founders, mentors, investors,
                and accelerators through intelligent matching and real-time collaboration.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Twitter className="h-3.5 w-3.5" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a href="https://globe.app" target="_blank" rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                  <Globe className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground">Product</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '#features',    label: 'Features' },
                  { href: '#how-it-works',label: 'How it works' },
                  { href: '#pricing',     label: 'Pricing' },
                  { href: '/discover',    label: 'Discover' },
                  { href: '/events',      label: 'Events' },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground">Community</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '/mentoring',   label: 'Find a Mentor' },
                  { href: '/groups',      label: 'Communities' },
                  { href: '/jobs',        label: 'Startup Jobs' },
                  { href: '/marketplace', label: 'Service Marketplace' },
                  { href: '/learning',    label: 'Learning Hub' },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground">Company</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { href: '/about',   label: 'About us' },
                  { href: '/blog',    label: 'Blog' },
                  { href: '/contact', label: 'Contact' },
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms',   label: 'Terms of Service' },
                ].map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} CoFounderBay. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              Built for founders, by founders
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
