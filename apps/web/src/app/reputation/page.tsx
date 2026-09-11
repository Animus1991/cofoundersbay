'use client';

import { useState } from 'react';
import {
  Shield, Star, TrendingUp, Award, CheckCircle, Users,
  MessageCircle, Briefcase, Target, Zap, Clock, Calendar,
  ChevronRight, Info, Lock, Eye, ThumbsUp, Heart,
  Sparkles, Trophy, Medal, Crown, Gem,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ReputationCategory = {
  id: string;
  name: string;
  icon: typeof Star;
  score: number;
  maxScore: number;
  color: string;
  description: string;
  factors: { name: string; value: number; max: number }[];
};

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  earnedAt?: string;
  progress?: number;
  requirement?: string;
};

type ReputationEvent = {
  id: string;
  type: 'increase' | 'decrease';
  category: string;
  points: number;
  reason: string;
  date: string;
};

const REPUTATION_CATEGORIES: ReputationCategory[] = [
  {
    id: 'profile',
    name: 'Profile Completeness',
    icon: Users,
    score: 85,
    maxScore: 100,
    color: 'text-status-info',
    description: 'How complete and detailed your profile is',
    factors: [
      { name: 'Basic Info', value: 100, max: 100 },
      { name: 'Skills', value: 90, max: 100 },
      { name: 'Experience', value: 80, max: 100 },
      { name: 'Portfolio', value: 70, max: 100 },
    ],
  },
  {
    id: 'engagement',
    name: 'Community Engagement',
    icon: MessageCircle,
    score: 72,
    maxScore: 100,
    color: 'text-status-success',
    description: 'Your activity and contributions to the community',
    factors: [
      { name: 'Posts & Comments', value: 65, max: 100 },
      { name: 'Helpful Answers', value: 80, max: 100 },
      { name: 'Event Participation', value: 70, max: 100 },
      { name: 'Group Activity', value: 75, max: 100 },
    ],
  },
  {
    id: 'reliability',
    name: 'Reliability',
    icon: Shield,
    score: 90,
    maxScore: 100,
    color: 'text-status-accent',
    description: 'How reliable and trustworthy you are',
    factors: [
      { name: 'Response Rate', value: 95, max: 100 },
      { name: 'Meeting Attendance', value: 88, max: 100 },
      { name: 'Commitment Follow-through', value: 90, max: 100 },
      { name: 'Deadline Adherence', value: 85, max: 100 },
    ],
  },
  {
    id: 'endorsements',
    name: 'Endorsements',
    icon: ThumbsUp,
    score: 68,
    maxScore: 100,
    color: 'text-status-warning',
    description: 'Endorsements and recommendations from others',
    factors: [
      { name: 'Skill Endorsements', value: 75, max: 100 },
      { name: 'Recommendations', value: 60, max: 100 },
      { name: 'Mentor Reviews', value: 70, max: 100 },
      { name: 'Peer Feedback', value: 65, max: 100 },
    ],
  },
  {
    id: 'achievements',
    name: 'Achievements',
    icon: Trophy,
    score: 55,
    maxScore: 100,
    color: 'text-status-accent',
    description: 'Badges and milestones you have earned',
    factors: [
      { name: 'Badges Earned', value: 60, max: 100 },
      { name: 'Milestones Completed', value: 50, max: 100 },
      { name: 'Challenges Won', value: 45, max: 100 },
      { name: 'Special Recognition', value: 65, max: 100 },
    ],
  },
];

const BADGES: Badge[] = [
  {
    id: 'verified',
    name: 'Verified Member',
    description: 'Completed identity verification',
    icon: CheckCircle,
    color: 'text-status-success',
    earnedAt: '2026-01-15',
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during beta phase',
    icon: Sparkles,
    color: 'text-status-accent',
    earnedAt: '2026-01-01',
  },
  {
    id: 'connector',
    name: 'Super Connector',
    description: 'Made 25+ successful connections',
    icon: Users,
    color: 'text-status-info',
    earnedAt: '2026-03-10',
  },
  {
    id: 'mentor',
    name: 'Helpful Mentor',
    description: 'Completed 10+ mentoring sessions',
    icon: Award,
    color: 'text-status-warning',
    progress: 70,
    requirement: '7/10 sessions',
  },
  {
    id: 'builder',
    name: 'Master Builder',
    description: 'Created 5 complete startup documents',
    icon: Briefcase,
    color: 'text-status-info',
    progress: 40,
    requirement: '2/5 documents',
  },
  {
    id: 'influencer',
    name: 'Community Influencer',
    description: 'Posts received 100+ total likes',
    icon: Heart,
    color: 'text-status-accent',
    progress: 85,
    requirement: '85/100 likes',
  },
];

const REPUTATION_HISTORY: ReputationEvent[] = [
  {
    id: '1',
    type: 'increase',
    category: 'engagement',
    points: 5,
    reason: 'Your post received 10 likes',
    date: '2026-03-26T10:00:00Z',
  },
  {
    id: '2',
    type: 'increase',
    category: 'reliability',
    points: 10,
    reason: 'Attended scheduled mentoring session',
    date: '2026-03-25T14:00:00Z',
  },
  {
    id: '3',
    type: 'increase',
    category: 'endorsements',
    points: 15,
    reason: 'Received skill endorsement from Maria Santos',
    date: '2026-03-24T09:00:00Z',
  },
  {
    id: '4',
    type: 'decrease',
    category: 'reliability',
    points: -5,
    reason: 'Missed scheduled call',
    date: '2026-03-20T11:00:00Z',
  },
  {
    id: '5',
    type: 'increase',
    category: 'achievements',
    points: 25,
    reason: 'Earned "Super Connector" badge',
    date: '2026-03-10T16:00:00Z',
  },
];

function ScoreRing({ score, maxScore, size = 'lg' }: { score: number; maxScore: number; size?: 'sm' | 'lg' }) {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-status-success';
    if (pct >= 60) return 'text-status-info';
    if (pct >= 40) return 'text-status-warning';
    return 'text-status-danger';
  };

  const dimensions = size === 'lg' ? 'w-32 h-32' : 'w-20 h-20';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={cn('relative', dimensions)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-secondary"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={getScoreColor(percentage)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textSize, getScoreColor(percentage))}>
          {score}
        </span>
        {size === 'lg' && (
          <span className="text-xs text-muted-foreground">/ {maxScore}</span>
        )}
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: ReputationCategory }) {
  const Icon = category.icon;
  const percentage = (category.score / category.maxScore) * 100;

  return (
    <Card className="overflow-hidden shadow-sm border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-lg p-2', category.color.replace('text-', 'bg-').replace('500', '500/10'))}>
              <Icon className={cn('icon-md', category.color)} />
            </div>
            <div>
              <CardTitle className="text-base">{category.name}</CardTitle>
              <CardDescription className="text-xs">{category.description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <span className={cn('text-xl font-bold', category.color)}>{category.score}</span>
            <span className="text-sm text-muted-foreground">/{category.maxScore}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className="h-2 mb-4" />
        <div className="space-y-2">
          {category.factors.map((factor) => (
            <div key={factor.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{factor.name}</span>
              <div className="flex items-center gap-2">
                <Progress value={(factor.value / factor.max) * 100} className="w-20 h-1.5" />
                <span className="w-8 text-right font-medium">{factor.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const Icon = badge.icon;
  const isEarned = !!badge.earnedAt;

  return (
    <div
      className={cn(
        'relative rounded-xl border p-4 transition-all',
        isEarned
          ? 'bg-card hover:shadow-md'
          : 'bg-secondary/30 opacity-75'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-full p-3',
            isEarned
              ? badge.color.replace('text-', 'bg-').replace('500', '500/10')
              : 'bg-secondary'
          )}
        >
          <Icon
            className={cn(
              'icon-lg',
              isEarned ? badge.color : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{badge.name}</h4>
            {isEarned && (
              <CheckCircle className="icon-sm text-status-success" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{badge.description}</p>

          {!isEarned && badge.progress !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span>{badge.requirement}</span>
              </div>
              <Progress value={badge.progress} className="h-1.5" />
            </div>
          )}

          {isEarned && badge.earnedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Earned {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {!isEarned && (
        <div className="absolute top-2 right-2">
          <Lock className="icon-sm text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function HistoryItem({ event }: { event: ReputationEvent }) {
  const isPositive = event.type === 'increase';

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-0">
      <div
        className={cn(
          'rounded-full p-2',
          isPositive ? 'bg-status-success-bg' : 'bg-status-danger-bg'
        )}
      >
        {isPositive ? (
          <TrendingUp className="icon-sm text-status-success" />
        ) : (
          <TrendingUp className="icon-sm text-status-danger rotate-180" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.reason}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(event.date).toLocaleDateString()} • {event.category}
        </p>
      </div>
      <Badge
        variant="secondary"
        className={cn(
          isPositive
            ? 'bg-status-success-bg text-status-success'
            : 'bg-status-danger-bg text-status-danger'
        )}
      >
        {isPositive ? '+' : ''}{event.points}
      </Badge>
    </div>
  );
}

export default function ReputationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'history'>('overview');

  const totalScore = Math.round(
    REPUTATION_CATEGORIES.reduce((sum, cat) => sum + cat.score, 0) / REPUTATION_CATEGORIES.length
  );

  const earnedBadges = BADGES.filter((b) => b.earnedAt).length;
  const totalBadges = BADGES.length;

  return (
    <AppShell
      title="Reputation Score"
      description="Your trust and credibility on CoFounderBay"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" className="sm:hidden" aria-label="My Profile" asChild>
            <Link href="/profile">
              <Shield className="icon-sm" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="hidden gap-2 sm:flex" asChild>
            <Link href="/profile">
              <Shield className="icon-sm" />
              My Profile
            </Link>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="icon-sm" />
                  Public View
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>See how others view your reputation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      }
    >
      <div className="space-y-6 pb-10">

        {/* Main Score Card */}
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary shadow-sm border-border/50 animate-fade-in">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <ScoreRing score={totalScore} maxScore={100} size="lg" />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  {totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Building'}
                </h2>
                <p className="text-muted-foreground mt-1">
                  Your reputation score is based on {REPUTATION_CATEGORIES.length} categories
                </p>
                <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 bg-card/80 border border-border/40 rounded-lg px-3 py-1.5">
                    <Trophy className="icon-sm text-status-warning" />
                    <span className="text-sm font-medium">
                      {earnedBadges}/{totalBadges} badges
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-card/80 border border-border/40 rounded-lg px-3 py-1.5">
                    <TrendingUp className="icon-sm text-status-success" />
                    <span className="text-sm font-medium">+15 this month</span>
                  </div>
                  <div className="flex items-center gap-2 bg-card/80 border border-border/40 rounded-lg px-3 py-1.5">
                    <Users className="icon-sm text-status-info" />
                    <span className="text-sm font-medium">Top 20%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
            <TabsTrigger value="overview" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              <Shield className="icon-sm" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              <Award className="icon-sm" />
              Badges ({earnedBadges}/{totalBadges})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              <TrendingUp className="icon-sm" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 md:grid-cols-2">
              {REPUTATION_CATEGORIES.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="badges" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BADGES.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Changes to your reputation score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {REPUTATION_HISTORY.map((event) => (
                  <HistoryItem key={event.id} event={event} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tips Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="icon-md text-primary-accessible" />
              Tips to Improve Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, color: 'text-status-info', bg: 'bg-status-info-bg', title: 'Complete your profile', desc: 'Add portfolio items and experience', href: '/profile/edit' },
                { icon: MessageCircle, color: 'text-status-success', bg: 'bg-status-success-bg', title: 'Engage with community', desc: 'Post updates and help others', href: '/feed' },
                { icon: ThumbsUp, color: 'text-status-accent', bg: 'bg-status-accent-bg', title: 'Get endorsements', desc: 'Ask connections to endorse your skills', href: '/connections' },
              ].map((tip) => {
                const TipIcon = tip.icon;
                return (
                  <Link key={tip.title} href={tip.href}>
                    <div className="flex gap-3 rounded-xl border border-border/40 p-3 hover:bg-muted/40 hover:border-primary/30 transition-all cursor-pointer">
                      <div className={cn('rounded-lg p-2 h-fit', tip.bg)}>
                        <TipIcon className={cn('icon-sm', tip.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tip.title}</p>
                        <p className="text-xs text-muted-foreground">{tip.desc}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
