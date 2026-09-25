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
import { BilingualText } from '@/components/common/BilingualText';
import { useLanguagePreference } from '@/lib/i18n/LanguagePreferenceContext';
import { REFERRALS_STRINGS, referralsEn, referralsEl } from '@/lib/i18n/strings-referrals';

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

type ReferralKey = keyof typeof REFERRALS_STRINGS;

/** A perk is a key plus, where the copy has one, the number it carries. */
type Perk = { key: ReferralKey; n?: number };

type ReferralTier = {
  key: ReferralKey;
  icon: typeof Crown;
  minReferrals: number;
  rewardMultiplier: number;
  perks: Perk[];
  color: string;
};

function fill(key: ReferralKey, vars: Record<string, string | number>): { en: string; el: string } {
  let en = referralsEn(key);
  let el = referralsEl(key);
  for (const [k, v] of Object.entries(vars)) {
    en = en.replace(`{${k}}`, String(v));
    el = el.replace(`{${k}}`, String(v));
  }
  return { en, el };
}

const REFERRAL_TIERS: ReferralTier[] = [
  {
    key: 'tier_starter',
    icon: Star,
    minReferrals: 0,
    rewardMultiplier: 1,
    perks: [{ key: 'perk_credit', n: 10 }],
    color: 'text-muted-foreground',
  },
  {
    key: 'tier_connector',
    icon: Zap,
    minReferrals: 5,
    rewardMultiplier: 1.5,
    perks: [{ key: 'perk_credit', n: 15 }, { key: 'perk_priority_support' }],
    color: 'text-status-info',
  },
  {
    key: 'tier_ambassador',
    icon: Trophy,
    minReferrals: 15,
    rewardMultiplier: 2,
    perks: [{ key: 'perk_credit', n: 20 }, { key: 'perk_priority_support' }, { key: 'perk_exclusive_events' }],
    color: 'text-status-warning',
  },
  {
    key: 'tier_champion',
    icon: Crown,
    minReferrals: 30,
    rewardMultiplier: 2.5,
    perks: [{ key: 'perk_credit', n: 25 }, { key: 'perk_priority_support' }, { key: 'perk_exclusive_events' }, { key: 'perk_featured_profile' }],
    color: 'text-status-accent',
  },
];

const STATUS_CONFIG: Record<ReferralStatus, { key: ReferralKey; color: string; icon: typeof Clock }> = {
  pending: { key: 'status_pending', color: 'bg-status-warning-bg text-status-warning', icon: Clock },
  signed_up: { key: 'status_signed_up', color: 'bg-status-info-bg text-status-info', icon: CheckCircle },
  active: { key: 'status_active', color: 'bg-status-success-bg text-status-success', icon: Users },
  rewarded: { key: 'status_rewarded', color: 'bg-status-accent-bg text-status-accent', icon: Gift },
  expired: { key: 'status_expired', color: 'bg-slate-500/10 text-muted-foreground', icon: XCircle },
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
  const { primary } = useLanguagePreference();
  const referralUrl = `https://cofounderbay.com/join?ref=${code}`;
  /* The toast and the share body are written *by* the reader to someone else,
     so they go out in one language — theirs — rather than as a bilingual pair
     the recipient would have to read twice. */
  const t = (key: ReferralKey) => (primary === 'el' ? referralsEl(key) : referralsEn(key));

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    success(t('copied'));
  };

  const shareVia = (platform: 'email' | 'twitter' | 'linkedin') => {
    const text = t('share_text');
    const urls: Record<string, string> = {
      email: `mailto:?subject=${encodeURIComponent(t('share_subject'))}&body=${encodeURIComponent(text + '\n\n' + referralUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
    };
    window.open(urls[platform], '_blank');
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center gap-2">
          <Share2 className="icon-md shrink-0 text-primary-accessible" />
          <BilingualText en={referralsEn('link_title')} el={referralsEl('link_title')} compact wrap />
        </CardTitle>
        <CardDescription>
          <BilingualText en={referralsEn('link_description')} el={referralsEl('link_description')} />
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
            <Copy className="icon-sm mr-1 shrink-0" aria-hidden="true" />
            <BilingualText en={referralsEn('copy')} el={referralsEl('copy')} compact wrap />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => shareVia('email')}>
            <Mail className="icon-sm mr-1 shrink-0" aria-hidden="true" />
            {referralsEn('share_email')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareVia('twitter')}>
            <ExternalLink className="icon-sm mr-1" />
            Twitter
          </Button>
          <Button variant="outline" size="sm" onClick={() => shareVia('linkedin')}>
            <ExternalLink className="icon-sm mr-1" />
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
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center gap-2">
          <Award className="icon-md shrink-0 text-primary-accessible" />
          <BilingualText en={referralsEn('tier_title')} el={referralsEl('tier_title')} compact wrap />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={cn('rounded-full p-3', currentTier.color.replace('text-', 'bg-').replace('500', '500/10'))}>
            <CurrentIcon className={cn('icon-xl', currentTier.color)} />
          </div>
          <div>
            <h3 className={cn('text-xl font-bold leading-snug', currentTier.color)}>
              <BilingualText en={referralsEn(currentTier.key)} el={referralsEl(currentTier.key)} compact />
            </h3>
            <p className="text-sm leading-snug text-muted-foreground">
              <BilingualText {...fill('multiplier', { n: currentTier.rewardMultiplier })} compact wrap />
            </p>
          </div>
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="min-w-0 text-muted-foreground">
                <BilingualText
                  en={fill('progress_to', { tier: referralsEn(nextTier.key) }).en}
                  el={fill('progress_to', { tier: referralsEl(nextTier.key) }).el}
                  compact
                  wrap
                />
              </span>
              <span className="font-medium">{referrals}/{nextTier.minReferrals}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs leading-snug text-muted-foreground">
              <BilingualText
                en={fill('more_to_unlock', { n: nextTier.minReferrals - referrals, tier: referralsEn(nextTier.key) }).en}
                el={fill('more_to_unlock', { n: nextTier.minReferrals - referrals, tier: referralsEl(nextTier.key) }).el}
                compact
                wrap
              />
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="mb-2 text-sm font-medium"><BilingualText en={referralsEn('perks_title')} el={referralsEl('perks_title')} compact wrap /></p>
          <ul className="space-y-1">
            {currentTier.perks.map((perk) => (
              <li key={perk.key} className="flex items-start gap-2 text-sm leading-snug text-muted-foreground">
                <CheckCircle className="mt-0.5 icon-sm shrink-0 text-status-success" />
                <BilingualText {...fill(perk.key, perk.n === undefined ? {} : { n: perk.n })} compact wrap />
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
        <AvatarFallback className="bg-primary/10 text-primary-accessible text-sm">
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
          <Badge variant="secondary" className="bg-status-success-bg text-status-success">
            +€{referral.rewardAmount}
          </Badge>
        )}
        <Badge className={cn('gap-1', config.color)}>
          <StatusIcon className="icon-sm shrink-0" aria-hidden="true" />
          <BilingualText en={referralsEn(config.key)} el={referralsEl(config.key)} compact />
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
          <div className="rounded-lg bg-status-info-bg p-2">
            <Users className="icon-md text-status-info" />
          </div>
          <div>
            <p className="text-xl font-bold">{totalInvited}</p>
            <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={referralsEn('stat_invited')} el={referralsEl('stat_invited')} compact wrap /></p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-status-success-bg p-2">
            <CheckCircle className="icon-md text-status-success" />
          </div>
          <div>
            <p className="text-xl font-bold">{signedUp}</p>
            <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={referralsEn('stat_signed_up')} el={referralsEl('stat_signed_up')} compact wrap /></p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-status-accent-bg p-2">
            <Gift className="icon-md text-status-accent" />
          </div>
          <div>
            <p className="text-xl font-bold">{rewarded}</p>
            <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={referralsEn('stat_rewarded')} el={referralsEl('stat_rewarded')} compact wrap /></p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-status-warning-bg p-2">
            <TrendingUp className="icon-md text-status-warning" />
          </div>
          <div>
            <p className="text-xl font-bold">€{totalEarned}</p>
            <p className="text-xs leading-snug text-muted-foreground"><BilingualText en={referralsEn('stat_earned')} el={referralsEl('stat_earned')} compact wrap /></p>
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
      <div className="space-y-6 pb-10">

        {/* Stats */}
        <StatsCards referrals={referrals} />

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          <div className="space-y-6">
            {/* Referral Link */}
            <ReferralLink code={referralCode} />

            {/* Referrals List */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle><BilingualText en={referralsEn('list_title')} el={referralsEl('list_title')} compact wrap /></CardTitle>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs"><BilingualText en={referralsEn('tab_all')} el={referralsEl('tab_all')} compact /></TabsTrigger>
                      <TabsTrigger value="pending" className="text-xs"><BilingualText en={referralsEn('tab_pending')} el={referralsEl('tab_pending')} compact /></TabsTrigger>
                      <TabsTrigger value="rewarded" className="text-xs"><BilingualText en={referralsEn('tab_rewarded')} el={referralsEl('tab_rewarded')} compact /></TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {filteredReferrals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p><BilingualText en={referralsEn('empty_list')} el={referralsEl('empty_list')} compact /></p>
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
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="icon-md shrink-0 text-primary-accessible" />
                  <BilingualText en={referralsEn('how_title')} el={referralsEl('how_title')} compact wrap />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  <li className="flex min-w-0 gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary-accessible text-sm font-bold flex items-center justify-center">
                      1
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium leading-snug"><BilingualText en={referralsEn('step1_title')} el={referralsEl('step1_title')} compact wrap /></p>
                      <p className="text-sm leading-snug text-muted-foreground">
                        <BilingualText en={referralsEn('step1_body')} el={referralsEl('step1_body')} compact wrap />
                      </p>
                    </div>
                  </li>
                  <li className="flex min-w-0 gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary-accessible text-sm font-bold flex items-center justify-center">
                      2
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium leading-snug"><BilingualText en={referralsEn('step2_title')} el={referralsEl('step2_title')} compact wrap /></p>
                      <p className="text-sm leading-snug text-muted-foreground">
                        <BilingualText en={referralsEn('step2_body')} el={referralsEl('step2_body')} compact wrap />
                      </p>
                    </div>
                  </li>
                  <li className="flex min-w-0 gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary-accessible text-sm font-bold flex items-center justify-center">
                      3
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium leading-snug"><BilingualText en={referralsEn('step3_title')} el={referralsEl('step3_title')} compact wrap /></p>
                      <p className="text-sm leading-snug text-muted-foreground">
                        <BilingualText en={referralsEn('step3_body')} el={referralsEl('step3_body')} compact wrap />
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
