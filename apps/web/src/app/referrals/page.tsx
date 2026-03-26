'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Gift, Users, Copy, Share2, Mail, MessageCircle,
  CheckCircle, Clock, XCircle, TrendingUp, Award,
  Sparkles, ChevronRight, ExternalLink, Trophy,
  Zap, Target, Star, Crown,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

type ReferralStatus = 'pending' | 'signed_up' | 'active' | 'rewarded' | 'expired';

type Referral = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  status: ReferralStatus;
  invitedAt: string;
  signedUpAt?: string;
  rewardedAt?: string;
  rewardAmount?: number;
};

type ReferralTier = {
  name: string;
  icon: typeof Crown;
  minReferrals: number;
  rewardMultiplier: number;
  perks: string[];
  color: string;
};

const REFERRAL_TIERS: ReferralTier[] = [
  {
    name: 'Starter',
    icon: Star,
    minReferrals: 0,
    rewardMultiplier: 1,
    perks: ['€10 credit per referral'],
    color: 'text-slate-500',
  },
  {
    name: 'Connector',
    icon: Zap,
    minReferrals: 5,
    rewardMultiplier: 1.5,
    perks: ['€15 credit per referral', 'Priority support'],
    color: 'text-blue-500',
  },
  {
    name: 'Ambassador',
    icon: Trophy,
    minReferrals: 15,
    rewardMultiplier: 2,
    perks: ['€20 credit per referral', 'Priority support', 'Exclusive events'],
    color: 'text-amber-500',
  },
  {
    name: 'Champion',
    icon: Crown,
    minReferrals: 30,
    rewardMultiplier: 2.5,
    perks: ['€25 credit per referral', 'Priority support', 'Exclusive events', 'Featured profile'],
    color: 'text-purple-500',
  },
];

const STATUS_CONFIG: Record<ReferralStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-500', icon: Clock },
  signed_up: { label: 'Signed Up', color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle },
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-500', icon: Users },
  rewarded: { label: 'Rewarded', color: 'bg-purple-500/10 text-purple-500', icon: Gift },
  expired: { label: 'Expired', color: 'bg-slate-500/10 text-slate-500', icon: XCircle },
};

const DEMO_REFERRALS: Referral[] = [
  {
    id: '1',
    email: 'maria@example.com',
    name: 'Maria Santos',
    status: 'rewarded',
    invitedAt: '2026-02-15T10:00:00Z',
    signedUpAt: '2026-02-16T14:30:00Z',
    rewardedAt: '2026-03-01T00:00:00Z',
    rewardAmount: 10,
  },
  {
    id: '2',
    email: 'james@startup.io',
    name: 'James Wilson',
    status: 'active',
    invitedAt: '2026-03-01T09:00:00Z',
    signedUpAt: '2026-03-02T11:00:00Z',
  },
  {
    id: '3',
    email: 'anna@tech.co',
    name: 'Anna Kowalski',
    status: 'signed_up',
    invitedAt: '2026-03-20T15:00:00Z',
    signedUpAt: '2026-03-21T10:00:00Z',
  },
  {
    id: '4',
    email: 'pending@example.com',
    status: 'pending',
    invitedAt: '2026-03-25T12:00:00Z',
  },
  {
    id: '5',
    email: 'expired@old.com',
    status: 'expired',
    invitedAt: '2026-01-01T00:00:00Z',
  },
];

function ReferralLink({ code }: { code: string }) {
  const { success } = useToast();
  const referralUrl = `https://cofounderbay.com/join?ref=${code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    success('Referral link copied!');
  };

  const shareVia = (platform: 'email' | 'twitter' | 'linkedin') => {
    const text = "Join me on CoFounderBay - the platform to find your perfect co-founder!";
    const urls: Record<string, string> = {
      email: `mailto:?subject=Join CoFounderBay&body=${encodeURIComponent(text + '\n\n' + referralUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
    };
    window.open(urls[platform], '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Your Referral Link
        </CardTitle>
        <CardDescription>
          Share this link with friends and earn rewards when they join
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={referralUrl}
            readOnly
            className="font-mono text-sm"
          />
          <Button onClick={copyLink}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => shareVia('email')}>
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareVia('twitter')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareVia('linkedin')}>
            <ExternalLink className="h-4 w-4 mr-1" />
            LinkedIn
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TierProgress({ referrals, currentTier }: { referrals: number; currentTier: ReferralTier }) {
  const nextTierIndex = REFERRAL_TIERS.findIndex((t) => t.minReferrals > referrals);
  const nextTier = nextTierIndex >= 0 ? REFERRAL_TIERS[nextTierIndex] : null;
  const progress = nextTier
    ? ((referrals - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100
    : 100;

  const CurrentIcon = currentTier.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Your Tier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={cn('rounded-full p-3', currentTier.color.replace('text-', 'bg-').replace('500', '500/10'))}>
            <CurrentIcon className={cn('h-8 w-8', currentTier.color)} />
          </div>
          <div>
            <h3 className={cn('text-xl font-bold', currentTier.color)}>{currentTier.name}</h3>
            <p className="text-sm text-muted-foreground">
              {currentTier.rewardMultiplier}x reward multiplier
            </p>
          </div>
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextTier.name}</span>
              <span className="font-medium">{referrals}/{nextTier.minReferrals}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {nextTier.minReferrals - referrals} more referrals to unlock {nextTier.name}
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">Your Perks</p>
          <ul className="space-y-1">
            {currentTier.perks.map((perk) => (
              <li key={perk} className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralCard({ referral }: { referral: Referral }) {
  const config = STATUS_CONFIG[referral.status];
  const StatusIcon = config.icon;
  const initials = referral.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || referral.email[0].toUpperCase();

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <Avatar className="h-10 w-10">
        <AvatarImage src={referral.avatarUrl} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{referral.name || referral.email}</p>
        {referral.name && (
          <p className="text-sm text-muted-foreground truncate">{referral.email}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {referral.rewardAmount && (
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">
            +€{referral.rewardAmount}
          </Badge>
        )}
        <Badge className={cn('gap-1', config.color)}>
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>
    </div>
  );
}

function StatsCards({ referrals }: { referrals: Referral[] }) {
  const totalInvited = referrals.length;
  const signedUp = referrals.filter((r) => r.status !== 'pending' && r.status !== 'expired').length;
  const rewarded = referrals.filter((r) => r.status === 'rewarded').length;
  const totalEarned = referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalInvited}</p>
            <p className="text-xs text-muted-foreground">Invited</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{signedUp}</p>
            <p className="text-xs text-muted-foreground">Signed Up</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2">
            <Gift className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{rewarded}</p>
            <p className="text-xs text-muted-foreground">Rewarded</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">€{totalEarned}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ReferralsPage() {
  const [referrals] = useState<Referral[]>(DEMO_REFERRALS);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'rewarded'>('all');

  const referralCode = 'FOUNDER2026';
  const successfulReferrals = referrals.filter(
    (r) => r.status === 'active' || r.status === 'rewarded'
  ).length;

  const currentTier = [...REFERRAL_TIERS]
    .reverse()
    .find((t) => successfulReferrals >= t.minReferrals) || REFERRAL_TIERS[0];

  const filteredReferrals = referrals.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'rewarded') return r.status === 'rewarded';
    return true;
  });

  return (
    <AppShell>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Referral Program
          </h1>
          <p className="text-muted-foreground mt-1">
            Invite friends and earn rewards when they join CoFounderBay
          </p>
        </div>

        {/* Stats */}
        <StatsCards referrals={referrals} />

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            {/* Referral Link */}
            <ReferralLink code={referralCode} />

            {/* Referrals List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Referrals</CardTitle>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                      <TabsTrigger value="rewarded" className="text-xs">Rewarded</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals in this category</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReferrals.map((referral) => (
                      <ReferralCard key={referral.id} referral={referral} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TierProgress referrals={successfulReferrals} currentTier={currentTier} />

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Share your link</p>
                      <p className="text-sm text-muted-foreground">
                        Send your unique referral link to friends
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                      2
                    </div>
                    <div>
                      <p className="font-medium">They sign up</p>
                      <p className="text-sm text-muted-foreground">
                        Your friend creates an account using your link
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Both get rewarded</p>
                      <p className="text-sm text-muted-foreground">
                        You both receive credits when they become active
                      </p>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
