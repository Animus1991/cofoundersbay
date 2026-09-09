'use client';

import { useState } from 'react';
import { useDemoData } from '@/contexts/DemoDataContext';
import {
  Star, Clock, CheckCircle2, XCircle, AlertTriangle, FileText,
  Plus, ChevronRight, TrendingUp, Award, MessageCircle, Eye,
  BarChart3, Lightbulb, DollarSign, Scale, Palette, Code2,
  Target, Search, Filter, RefreshCw, ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type ReviewStatus = 'requested' | 'accepted' | 'in_progress' | 'submitted' | 'declined' | 'expired';
type ReviewType =
  | 'pitch_deck' | 'business_model' | 'financial_model' | 'legal_structure'
  | 'market_analysis' | 'go_to_market' | 'technical_architecture' | 'product_strategy' | 'general';

interface ExpertReview {
  id: string;
  expertName: string;
  expertTitle: string;
  expertAvatar?: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  requestMessage?: string;
  dueDate?: string;
  submittedAt?: string;
  scoreOverall?: number;
  summaryFeedback?: string;
  strengthsJson?: { area: string; comment: string }[];
  improvementsJson?: { area: string; recommendation: string }[];
  scoresByArea?: Record<string, number>;
  isPaid: boolean;
  agreedFee?: number;
  rating?: number;
}

interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  domains: ReviewType[];
  completedReviews: number;
  rating: number;
  bio: string;
  feeFrom?: number;
  responseTime: string;
  isVerified: boolean;
  badges?: string[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const REVIEW_TYPE_CONFIG: Record<ReviewType, { label: string; icon: React.ElementType; color: string }> = {
  pitch_deck:             { label: 'Pitch Deck',            icon: FileText,    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  business_model:         { label: 'Business Model',        icon: Target,      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  financial_model:        { label: 'Financial Model',       icon: DollarSign,  color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  legal_structure:        { label: 'Legal Structure',       icon: Scale,       color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  market_analysis:        { label: 'Market Analysis',       icon: BarChart3,   color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  go_to_market:           { label: 'Go-to-Market',          icon: TrendingUp,  color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  technical_architecture: { label: 'Tech Architecture',     icon: Code2,       color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  product_strategy:       { label: 'Product Strategy',      icon: Lightbulb,   color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  general:                { label: 'General Review',        icon: Eye,         color: 'bg-muted text-muted-foreground border-border' },
};

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: React.ElementType }> = {
  requested:   { label: 'Requested',   color: 'bg-blue-500/10 text-blue-600',    icon: Clock },
  accepted:    { label: 'Accepted',    color: 'bg-teal-500/10 text-teal-600',    icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-600',  icon: RefreshCw },
  submitted:   { label: 'Submitted',   color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle2 },
  declined:    { label: 'Declined',    color: 'bg-destructive/10 text-destructive', icon: XCircle },
  expired:     { label: 'Expired',     color: 'bg-muted text-muted-foreground',  icon: AlertTriangle },
};

// ── Mock Data ─────────────────────────────────────────────────────────────────

const DEMO_REVIEWS: ExpertReview[] = [
  {
    id: '1',
    expertName: 'Stavros Nikolaou',
    expertTitle: 'Serial Founder & Pitch Coach',
    reviewType: 'pitch_deck',
    status: 'submitted',
    requestMessage: 'Looking for feedback on our Series A deck before approaching investors.',
    submittedAt: '2026-03-20T11:00:00Z',
    scoreOverall: 7,
    summaryFeedback: 'Strong team slide and clear market opportunity. The financial projections need more realistic assumptions and the problem slide should be sharper. The "ask" slide needs more specific use of funds.',
    strengthsJson: [
      { area: 'Team', comment: 'Clear credibility signals, strong domain expertise shown.' },
      { area: 'Market Size', comment: 'Well-researched TAM/SAM/SOM breakdown with credible sources.' },
    ],
    improvementsJson: [
      { area: 'Problem Statement', recommendation: 'Lead with a single, specific customer pain — avoid generic statements.' },
      { area: 'Financial Projections', recommendation: 'Add explicit assumption breakdown: CAC, LTV, churn rate, unit economics.' },
      { area: 'Use of Funds', recommendation: 'Break down the €500K ask into milestones, not just categories.' },
    ],
    scoresByArea: { storytelling: 8, market: 9, financials: 5, team: 9, design: 7, ask: 6 },
    isPaid: true,
    agreedFee: 200,
    rating: 5,
  },
  {
    id: '2',
    expertName: 'Katerina Vassiliou',
    expertTitle: 'CFO Advisor & Financial Modelling Expert',
    reviewType: 'financial_model',
    status: 'in_progress',
    requestMessage: 'Please review our 3-year financial model for our SaaS product.',
    dueDate: '2026-03-28T23:59:00Z',
    isPaid: true,
    agreedFee: 350,
  },
  {
    id: '3',
    expertName: 'Nikos Papadakis',
    expertTitle: 'GTM Strategist',
    reviewType: 'go_to_market',
    status: 'requested',
    requestMessage: 'We need feedback on our go-to-market strategy for EU market expansion.',
    isPaid: false,
  },
];

const DEMO_EXPERTS: ExpertProfile[] = [
  {
    id: 'e1',
    name: 'Stavros Nikolaou',
    title: 'Serial Founder & Pitch Coach',
    domains: ['pitch_deck', 'business_model', 'go_to_market'],
    completedReviews: 89,
    rating: 4.9,
    bio: '3× founder, 2 exits. Has reviewed 89+ decks across pre-seed to Series B. Former pitch coach at Athens Startup Weekend.',
    feeFrom: 180,
    responseTime: '48 hrs',
    isVerified: true,
    badges: ['Top Reviewer', 'Pitch Specialist'],
  },
  {
    id: 'e2',
    name: 'Katerina Vassiliou',
    title: 'CFO Advisor & Financial Modelling Expert',
    domains: ['financial_model', 'legal_structure'],
    completedReviews: 54,
    rating: 4.8,
    bio: 'Chartered accountant with 12 years in startup finance. Specializes in SaaS unit economics, fundraising models, and financial due diligence readiness.',
    feeFrom: 300,
    responseTime: '24 hrs',
    isVerified: true,
    badges: ['Finance Expert'],
  },
  {
    id: 'e3',
    name: 'Nikos Papadakis',
    title: 'GTM Strategist & Growth Advisor',
    domains: ['go_to_market', 'market_analysis', 'product_strategy'],
    completedReviews: 37,
    rating: 4.7,
    bio: 'Former VP Growth at 2 B2B SaaS companies. Advises early-stage startups on positioning, channel strategy, and EU market expansion.',
    feeFrom: 120,
    responseTime: '72 hrs',
    isVerified: false,
    badges: [],
  },
  {
    id: 'e4',
    name: 'Alexis Petridis',
    title: 'CTO & Technical Architecture Reviewer',
    domains: ['technical_architecture', 'product_strategy'],
    completedReviews: 28,
    rating: 4.6,
    bio: 'Ex-CTO of Series A fintech. Reviews technical architecture, scalability plans, and build-vs-buy decisions for early-stage startups.',
    feeFrom: 200,
    responseTime: '48 hrs',
    isVerified: true,
    badges: ['Tech Expert'],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: ExpertReview }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[review.status];
  const type = REVIEW_TYPE_CONFIG[review.reviewType];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary-emphasis text-xs font-semibold">
              {review.expertName.split(' ').map((n) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{review.expertName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{review.expertTitle}</p>
              </div>
              <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium shrink-0', status.color)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium', type.color)}>
                <TypeIcon className="h-3 w-3" />{type.label}
              </span>
              {review.isPaid && review.agreedFee && (
                <span className="text-2xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="icon-2xs" aria-hidden="true" /> €{review.agreedFee}
                </span>
              )}
              {!review.isPaid && (
                <Badge variant="outline" className="text-2xs h-4 px-1.5">Free</Badge>
              )}
              {review.dueDate && review.status !== 'submitted' && (
                <span className="text-2xs text-amber-600 flex items-center gap-1">
                  <Clock className="icon-2xs" aria-hidden="true" />
                  Due {new Date(review.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>

            {/* Score */}
            {review.scoreOverall && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Overall score:</span>
                  <span className={cn(
                    'text-sm font-bold',
                    review.scoreOverall >= 8 ? 'text-emerald-600'
                      : review.scoreOverall >= 6 ? 'text-amber-600'
                      : 'text-destructive',
                  )}>
                    {review.scoreOverall}/10
                  </span>
                </div>
                {review.rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('h-3 w-3', i < review.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} aria-hidden="true" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {review.summaryFeedback && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">
                "{review.summaryFeedback}"
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                  <MessageCircle className="icon-2xs" aria-hidden="true" /> Message expert
                </Button>
                {review.status === 'submitted' && (
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                    <ExternalLink className="icon-2xs" aria-hidden="true" /> View full review
                  </Button>
                )}
              </div>
              {review.strengthsJson || review.improvementsJson ? (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-2xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                >
                  {expanded ? 'Collapse' : 'See feedback'}
                  <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded feedback */}
      {expanded && (review.strengthsJson || review.improvementsJson || review.scoresByArea) && (
        <div className="border-t border-border/60 bg-muted/30 p-4 space-y-4">
          {/* Scores by area */}
          {review.scoresByArea && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Scores by Area</p>
              <div className="space-y-1.5">
                {Object.entries(review.scoresByArea).map(([area, score]) => (
                  <div key={area} className="flex items-center gap-2">
                    <span className="text-2xs text-muted-foreground capitalize w-24 shrink-0">{area}</span>
                    <Progress value={score * 10} className="flex-1 h-1.5" />
                    <span className={cn('text-xs font-semibold w-8 text-right', score >= 8 ? 'text-emerald-600' : score >= 6 ? 'text-amber-600' : 'text-destructive')}>
                      {score}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {review.strengthsJson && review.strengthsJson.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-emerald-600 mb-2">✅ Strengths</p>
              <ul className="space-y-2">
                {review.strengthsJson.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="font-semibold text-foreground shrink-0">{s.area}:</span>
                    <span className="text-muted-foreground">{s.comment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {review.improvementsJson && review.improvementsJson.length > 0 && (
            <div>
              <p className="text-2xs font-semibold uppercase tracking-wider text-amber-600 mb-2">⚡ Recommendations</p>
              <ul className="space-y-2">
                {review.improvementsJson.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <span className="font-semibold text-foreground shrink-0">{s.area}:</span>
                    <span className="text-muted-foreground">{s.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExpertCard({ expert }: { expert: ExpertProfile }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 hover:shadow-sm hover:border-border transition-all">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary-emphasis text-sm font-semibold">
            {expert.name.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{expert.name}</p>
                {expert.isVerified && (
                  <Badge className="h-4 rounded-full px-1.5 text-2xs bg-primary/10 text-primary-emphasis border-primary/20">Verified</Badge>
                )}
                {expert.badges?.map((b) => (
                  <Badge key={b} variant="secondary" className="h-4 rounded-full px-1.5 text-2xs">{b}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{expert.title}</p>
            </div>
            {expert.feeFrom && (
              <p className="text-sm font-semibold text-foreground shrink-0">From €{expert.feeFrom}</p>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{expert.bio}</p>

          <div className="mt-2 flex flex-wrap gap-1">
            {expert.domains.slice(0, 3).map((d) => {
              const cfg = REVIEW_TYPE_CONFIG[d];
              return (
                <span key={d} className={cn('rounded-full border px-2 py-0.5 text-2xs font-medium', cfg.color)}>
                  {cfg.label}
                </span>
              );
            })}
          </div>

          <div className="mt-2 flex items-center gap-3 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="icon-2xs fill-amber-400 text-amber-400" aria-hidden="true" /> {expert.rating} ({expert.completedReviews} reviews)
            </span>
            <span className="flex items-center gap-1">
              <Clock className="icon-2xs" aria-hidden="true" /> Turnaround: {expert.responseTime}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <Button size="sm" className="h-7 gap-1 text-xs flex-1">
              <Plus className="icon-2xs" aria-hidden="true" /> Request review
            </Button>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
              <MessageCircle className="icon-2xs" aria-hidden="true" /> Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ExpertReviewsPage() {
  const [activeTab, setActiveTab] = useState('my-reviews');
  const [searchExperts, setSearchExperts] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<ReviewType | 'all'>('all');
  const { showDemoData } = useDemoData();

  const myReviews = showDemoData ? DEMO_REVIEWS : [];
  const submitted = myReviews.filter((r) => r.status === 'submitted');
  const pending = myReviews.filter((r) => r.status !== 'submitted' && r.status !== 'declined');

  const filteredExperts = DEMO_EXPERTS.filter((e) => {
    const q = searchExperts.toLowerCase();
    const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q) || e.bio.toLowerCase().includes(q);
    const matchesDomain = selectedDomain === 'all' || e.domains.includes(selectedDomain);
    return matchesSearch && matchesDomain;
  });

  const avgScore = submitted.length
    ? (submitted.filter((r) => r.scoreOverall).reduce((acc, r) => acc + (r.scoreOverall ?? 0), 0) / submitted.filter((r) => r.scoreOverall).length)
    : null;

  return (
    <AppShell
      title="Expert Reviews"
      description="Get structured feedback on your pitch, financials, strategy, and more from domain experts"
    >
      <div className="space-y-6 pb-10">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total reviews', value: myReviews.length, icon: FileText, color: 'text-primary-emphasis', bg: 'bg-primary/10' },
            { label: 'In progress', value: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Completed', value: submitted.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Avg score', value: avgScore ? `${avgScore.toFixed(1)}/10` : '—', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="shadow-sm border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', bg, color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-none">{value}</p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-3">
            <TabsList className="h-9">
              <TabsTrigger value="my-reviews" className="text-xs">My Reviews</TabsTrigger>
              <TabsTrigger value="find-experts" className="text-xs">Find Experts</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            </TabsList>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setActiveTab('find-experts')}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Request review
            </Button>
          </div>

          {/* My Reviews */}
          <TabsContent value="my-reviews" className="mt-4 space-y-3">
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active Requests</p>
                <div className="space-y-3">{pending.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
              </div>
            )}
            {submitted.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Completed Reviews</p>
                <div className="space-y-3">{submitted.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
              </div>
            )}
            {myReviews.length === 0 && (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/60 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-7 w-7 text-primary-emphasis" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No reviews yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Request expert feedback on your pitch, financials, or strategy.</p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('find-experts')}>Find an expert</Button>
              </div>
            )}
          </TabsContent>

          {/* Find Experts */}
          <TabsContent value="find-experts" className="mt-4 space-y-4">
            {/* Search + domain filter */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <Input placeholder="Search experts…" value={searchExperts} onChange={(e) => setSearchExperts(e.target.value)} className="pl-8 h-9 text-sm" />
              </div>
            </div>

            {/* Domain chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedDomain('all')}
                className={cn('rounded-full border px-3 py-1 text-xs transition-all', selectedDomain === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border/60 text-muted-foreground hover:border-border')}
              >
                All domains
              </button>
              {(Object.entries(REVIEW_TYPE_CONFIG) as [ReviewType, typeof REVIEW_TYPE_CONFIG[ReviewType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDomain(key)}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all',
                    selectedDomain === key ? cfg.color + ' border-current' : 'border-border/60 text-muted-foreground hover:border-border',
                  )}
                >
                  <cfg.icon className="h-3 w-3" />{cfg.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredExperts.map((e) => <ExpertCard key={e.id} expert={e} />)}
              {filteredExperts.length === 0 && (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  No experts match your search. <button className="text-primary-emphasis hover:underline" onClick={() => { setSearchExperts(''); setSelectedDomain('all'); }}>Clear filters</button>
                </div>
              )}
            </div>

            {/* CTA for becoming an expert */}
            <div className="rounded-xl border border-dashed border-border/60 bg-card/50 p-6 text-center">
              <Award className="icon-xl text-muted-foreground/50 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground mb-1">Are you a domain expert?</p>
              <p className="text-xs text-muted-foreground mb-3">Join as an expert reviewer and earn while helping founders.</p>
              <Button variant="outline" size="sm">Apply as expert</Button>
            </div>
          </TabsContent>

          {/* Insights */}
          <TabsContent value="insights" className="mt-4 space-y-4">
            {submitted.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Complete your first review to see insights.
              </div>
            ) : (
              <>
                {/* Score breakdown from completed reviews */}
                {submitted.filter((r) => r.scoresByArea).map((r) => (
                  <Card key={r.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="icon-sm text-primary-emphasis" aria-hidden="true" />
                        {REVIEW_TYPE_CONFIG[r.reviewType].label} — Detailed Scores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(r.scoresByArea!).map(([area, score]) => (
                        <div key={area} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground capitalize w-28 shrink-0">{area}</span>
                          <Progress value={score * 10} className="flex-1 h-2" />
                          <span className={cn(
                            'text-xs font-bold w-8 text-right',
                            score >= 8 ? 'text-emerald-600' : score >= 6 ? 'text-amber-600' : 'text-destructive',
                          )}>
                            {score}/10
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}

                {/* Summary recommendations */}
                {submitted.filter((r) => r.improvementsJson?.length).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="icon-sm text-amber-500" aria-hidden="true" /> Top Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {submitted.flatMap((r) => (r.improvementsJson ?? []).slice(0, 2).map((imp, i) => (
                        <div key={`${r.id}-${i}`} className="flex gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                          <AlertTriangle className="icon-sm text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{imp.area}</p>
                            <p className="text-xs text-muted-foreground">{imp.recommendation}</p>
                          </div>
                        </div>
                      )))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
