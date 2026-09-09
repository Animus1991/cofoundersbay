'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Mail,
  ExternalLink,
  Eye,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Globe,
  Lightbulb,
  BarChart2,
  CheckCircle2,
  ArrowRight,
  Twitter,
  Linkedin,
  Link2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getPublicPitchDeck, recordPitchView, submitPitchContactRequest, type PublicPitchDeck } from '@/lib/api';

// ─── Demo data (used when API returns no result or in dev) ────────────────────
const DEMO_DECK: PublicPitchDeck = {
  id: 'demo',
  title: 'TechStart - Series A Pitch',
  companyName: 'TechStart',
  tagline: 'AI-powered co-founder matching for the next generation of founders',
  slides: [
    {
      id: 's1',
      type: 'cover',
      title: 'TechStart',
      order: 0,
      content: {
        tagline: 'AI-powered co-founder matching for the next generation of founders',
        founded: '2024',
        stage: 'Series A',
        raising: '$5M',
      },
    },
    {
      id: 's2',
      type: 'problem',
      title: 'The Problem',
      order: 1,
      content: {
        headline: '90% of startups fail due to team problems',
        points: [
          'Finding the right co-founder takes 6–18 months on average',
          'Existing networks are limited by geography and social circles',
          'No data-driven way to evaluate co-founder compatibility',
        ],
        stat: '$2.3T',
        statLabel: 'lost to failed startups annually',
      },
    },
    {
      id: 's3',
      type: 'solution',
      title: 'Our Solution',
      order: 2,
      content: {
        headline: 'Intelligent matching meets proven methodology',
        points: [
          'AI-powered compatibility scoring across 40+ dimensions',
          'Verified profiles with skill assessments and references',
          'Structured intro process with conversation guides',
        ],
      },
    },
    {
      id: 's4',
      type: 'traction',
      title: 'Traction',
      order: 3,
      content: {
        metrics: [
          { label: 'Registered Users', value: '12,400', growth: '+240%' },
          { label: 'Successful Matches', value: '1,850', growth: '+180%' },
          { label: 'Active Startups', value: '640', growth: '+160%' },
          { label: 'Monthly Revenue', value: '$48K', growth: '+95%' },
        ],
      },
    },
    {
      id: 's5',
      type: 'market',
      title: 'Market Opportunity',
      order: 4,
      content: {
        tam: '$12B',
        sam: '$3.2B',
        som: '$480M',
        tamLabel: 'Total Addressable Market',
        samLabel: 'Serviceable Market',
        somLabel: 'Obtainable Market (5yr)',
      },
    },
    {
      id: 's6',
      type: 'business_model',
      title: 'Business Model',
      order: 5,
      content: {
        streams: [
          { name: 'Premium Subscriptions', percent: 60, amount: '$29–$99/mo' },
          { name: 'Accelerator Partnerships', percent: 25, amount: 'Revenue share' },
          { name: 'Enterprise Licenses', percent: 15, amount: '$5K–$50K/yr' },
        ],
      },
    },
    {
      id: 's7',
      type: 'team',
      title: 'The Team',
      order: 6,
      content: {
        members: [
          { name: 'Elena Papadopoulos', role: 'CEO & Co-founder', background: 'Ex-Google, 2x founder' },
          { name: 'Marcus Chen', role: 'CTO & Co-founder', background: 'Ex-Meta, MIT CS' },
          { name: 'Dr. Sarah Kim', role: 'Head of AI', background: 'PhD Stanford, Ex-DeepMind' },
        ],
      },
    },
    {
      id: 's8',
      type: 'ask',
      title: 'The Ask',
      order: 7,
      content: {
        amount: '$5M',
        valuation: '$20M pre-money',
        use: [
          { label: 'Product & Engineering', percent: 45 },
          { label: 'Sales & Marketing', percent: 30 },
          { label: 'Operations', percent: 15 },
          { label: 'Legal & Admin', percent: 10 },
        ],
      },
    },
  ],
  author: {
    id: 'author1',
    name: 'Elena Papadopoulos',
    headline: 'CEO & Co-founder at TechStart',
    avatarUrl: undefined,
  },
  stats: { views: 284, shares: 47, contactRequests: 12 },
  isPublic: true,
  allowContact: true,
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-25T14:00:00Z',
};

// ─── Slide renderers ──────────────────────────────────────────────────────────
function CoverSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium">
        {c.stage} • Raising {c.raising}
      </div>
      <h1 className="text-5xl font-bold text-foreground mb-4">{slide.title}</h1>
      <p className="text-xl text-muted-foreground max-w-2xl">{c.tagline}</p>
      <p className="text-sm text-muted-foreground mt-8">Founded {c.founded}</p>
    </div>
  );
}

function ProblemSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
          <Target className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>
      <p className="text-2xl font-semibold text-foreground mb-8">{c.headline}</p>
      <div className="space-y-4 mb-10">
        {(c.points as string[]).map((point, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-1 h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-red-600">{i + 1}</span>
            </div>
            <p className="text-lg text-muted-foreground">{point}</p>
          </div>
        ))}
      </div>
      {c.stat && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 inline-block">
          <p className="text-4xl font-bold text-red-600">{c.stat}</p>
          <p className="text-muted-foreground mt-1">{c.statLabel}</p>
        </div>
      )}
    </div>
  );
}

function SolutionSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Lightbulb className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>
      <p className="text-2xl font-semibold text-foreground mb-8">{c.headline}</p>
      <div className="space-y-4">
        {(c.points as string[]).map((point, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-lg text-muted-foreground">{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TractionSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <TrendingUp className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {(c.metrics as any[]).map((m, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6">
            <p className="text-4xl font-bold text-foreground">{m.value}</p>
            <p className="text-muted-foreground mt-1">{m.label}</p>
            <Badge className="mt-3 bg-green-100 text-green-800 border-green-200">{m.growth} YoY</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
          <Globe className="h-6 w-6 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>
      <div className="flex items-end gap-6 justify-center">
        {[
          { val: c.tam, label: c.tamLabel, size: 'h-48', color: 'bg-purple-200 dark:bg-purple-900/40' },
          { val: c.sam, label: c.samLabel, size: 'h-36', color: 'bg-purple-300 dark:bg-purple-800/50' },
          { val: c.som, label: c.somLabel, size: 'h-24', color: 'bg-purple-500 dark:bg-purple-600' },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <p className="text-3xl font-bold">{item.val}</p>
            <div className={cn('w-full rounded-t-2xl flex items-end justify-center pb-4', item.size, item.color)}>
            </div>
            <p className="text-sm text-muted-foreground text-center">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusinessModelSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <DollarSign className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>
      <div className="space-y-5">
        {(c.streams as any[]).map((stream, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{stream.name}</span>
              <span className="text-muted-foreground text-sm">{stream.amount}</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={stream.percent} className="flex-1 h-3" />
              <span className="text-sm font-semibold w-10 text-right">{stream.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
          <Users className="h-6 w-6 text-teal-600" />
        </div>
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {(c.members as any[]).map((member, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 text-center">
            <Avatar className="h-16 w-16 mx-auto mb-4">
              <AvatarFallback className="text-xl">
                {member.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold">{member.name}</p>
            <p className="text-sm text-primary mt-1">{member.role}</p>
            <p className="text-xs text-muted-foreground mt-2">{member.background}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AskSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  const c = slide.content as any;
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <BarChart2 className="h-6 w-6 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>
      <div className="flex items-center gap-8 mb-8">
        <div>
          <p className="text-5xl font-bold text-primary">{c.amount}</p>
          <p className="text-muted-foreground mt-1">Raising</p>
        </div>
        <ArrowRight className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="text-2xl font-semibold">{c.valuation}</p>
          <p className="text-muted-foreground mt-1">Pre-money valuation</p>
        </div>
      </div>
      <p className="text-lg font-medium mb-4">Use of Funds</p>
      <div className="space-y-3">
        {(c.use as any[]).map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span>{item.label}</span>
              <span className="font-medium">{item.percent}%</span>
            </div>
            <Progress value={item.percent} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericSlide({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  return (
    <div className="flex flex-col justify-center h-full px-12 py-8">
      <h2 className="text-3xl font-bold mb-6">{slide.title}</h2>
      <pre className="text-muted-foreground text-sm whitespace-pre-wrap">
        {JSON.stringify(slide.content, null, 2)}
      </pre>
    </div>
  );
}

function SlideRenderer({ slide }: { slide: (typeof DEMO_DECK.slides)[0] }) {
  switch (slide.type) {
    case 'cover': return <CoverSlide slide={slide} />;
    case 'problem': return <ProblemSlide slide={slide} />;
    case 'solution': return <SolutionSlide slide={slide} />;
    case 'traction': return <TractionSlide slide={slide} />;
    case 'market': return <MarketSlide slide={slide} />;
    case 'business_model': return <BusinessModelSlide slide={slide} />;
    case 'team': return <TeamSlide slide={slide} />;
    case 'ask': return <AskSlide slide={slide} />;
    default: return <GenericSlide slide={slide} />;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PitchDeckPage() {
  const params = useParams();
  const deckId = params?.id as string;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [copied, setCopied] = useState(false);

  // Fetch deck (falls back to demo if API unavailable)
  const { data } = useQuery({
    queryKey: ['pitch-deck', deckId],
    queryFn: () => getPublicPitchDeck(deckId),
    retry: false,
  });

  const deck = data?.deck ?? DEMO_DECK;
  const slides = [...deck.slides].sort((a, b) => a.order - b.order);

  // Record view once on mount
  const viewMutation = useMutation({ mutationFn: () => recordPitchView(deckId) });
  useEffect(() => { viewMutation.mutate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contactMutation = useMutation({
    mutationFn: (data: { name: string; email: string; message?: string }) =>
      submitPitchContactRequest(deckId, data),
    onSuccess: () => setShowContact(false),
  });

  // Keyboard navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      setCurrentSlide((s) => Math.min(s + 1, slides.length - 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      setCurrentSlide((s) => Math.max(s - 1, 0));
    }
  }, [slides.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {deck.logoUrl ? (
              <img src={deck.logoUrl} alt={deck.companyName} className="h-7 w-auto" />
            ) : (
              <div className="h-7 w-7 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {deck.companyName[0]}
              </div>
            )}
            <span className="font-semibold">{deck.companyName}</span>
            <Badge variant="outline" className="text-xs">{deck.title}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-2">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{deck.stats.views}</span>
              <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{deck.stats.shares}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
              <Share2 className="h-4 w-4 mr-1.5" />Share
            </Button>
            {deck.allowContact && (
              <Button size="sm" onClick={() => setShowContact(true)}>
                <Mail className="h-4 w-4 mr-1.5" />Contact
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Slide thumbnails sidebar */}
        <aside className="hidden lg:flex flex-col gap-2 w-36 flex-shrink-0">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                'rounded-lg border text-left p-2 text-xs transition-all hover:border-primary',
                i === currentSlide
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card'
              )}
            >
              <div className="text-[10px] text-muted-foreground mb-0.5">{i + 1}/{slides.length}</div>
              <div className="font-medium truncate">{slide.title}</div>
            </button>
          ))}
        </aside>

        {/* Main slide area */}
        <main className="flex-1 flex flex-col">
          <div className="rounded-2xl border bg-card shadow-lg flex-1 min-h-[520px] relative overflow-hidden">
            <SlideRenderer slide={slides[currentSlide]} />
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentSlide((s) => Math.max(s - 1, 0))}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />Previous
            </Button>

            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    'rounded-full transition-all',
                    i === currentSlide
                      ? 'bg-primary w-6 h-2'
                      : 'bg-muted hover:bg-muted-foreground/30 w-2 h-2'
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentSlide((s) => Math.min(s + 1, slides.length - 1))}
              disabled={currentSlide === slides.length - 1}
            >
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Slide counter */}
          <p className="text-center text-sm text-muted-foreground mt-2">
            {currentSlide + 1} / {slides.length}
          </p>
        </main>

        {/* Author sidebar */}
        <aside className="hidden xl:flex flex-col gap-4 w-56 flex-shrink-0">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={deck.author.avatarUrl} />
                <AvatarFallback>
                  {deck.author.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{deck.author.name}</p>
                <p className="text-xs text-muted-foreground">{deck.author.headline}</p>
              </div>
            </div>
            {deck.allowContact && (
              <Button size="sm" className="w-full" onClick={() => setShowContact(true)}>
                <Mail className="h-4 w-4 mr-2" />Get in Touch
              </Button>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deck Stats</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Views</span><span className="font-medium">{deck.stats.views}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shares</span><span className="font-medium">{deck.stats.shares}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Contacts</span><span className="font-medium">{deck.stats.contactRequests}</span></div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Share</p>
            <div className="flex gap-2">
              <Button aria-label="Share on X" variant="outline" size="icon" className="h-8 w-8" asChild>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(deck.title)}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button aria-label="Share on LinkedIn" variant="outline" size="icon" className="h-8 w-8" asChild>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button aria-label="Confirm" variant="outline" size="icon" className="h-8 w-8" onClick={copyLink}>
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Link2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact {deck.author.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cname">Your Name</Label>
              <Input
                id="cname"
                value={contactForm.name}
                onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="cemail">Email Address</Label>
              <Input
                id="cemail"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@firm.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="cmsg">Message (optional)</Label>
              <Textarea
                id="cmsg"
                value={contactForm.message}
                onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Hi, I'd love to learn more about your company..."
                className="mt-1.5 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContact(false)}>Cancel</Button>
            <Button
              onClick={() => contactMutation.mutate(contactForm)}
              disabled={!contactForm.name || !contactForm.email || contactMutation.isPending}
            >
              {contactMutation.isPending ? 'Sending…' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Pitch Deck</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Link</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={typeof window !== 'undefined' ? window.location.href : ''} readOnly />
                <Button variant="outline" onClick={copyLink}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 mr-2" />Twitter
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4 mr-2" />LinkedIn
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
