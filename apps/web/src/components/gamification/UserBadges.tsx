'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyBadges, type GamificationBadgeSummary } from '@/lib/api';
import { 
  Award, 
  Star, 
  Trophy, 
  Target, 
  Zap, 
  Heart, 
  MessageCircle, 
  Users, 
  Briefcase,
  Sparkles,
  Crown,
  Shield,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'engagement' | 'achievement' | 'social' | 'professional';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  requirement?: number;
}

const badgeIcons = {
  engagement: MessageCircle,
  achievement: Trophy,
  social: Users,
  professional: Briefcase,
};

const tierColors = {
  bronze: 'text-status-warning ',
  silver: 'text-muted-foreground ',
  gold: 'text-status-warning ',
  platinum: 'text-status-info ',
};

const tierBgColors = {
  bronze: 'bg-status-warning-bg ',
  silver: 'bg-muted ',
  gold: 'bg-status-warning-bg ',
  platinum: 'bg-status-info-bg ',
};

function rarityToTier(rarity: string): BadgeItem['tier'] {
  if (rarity === 'legendary') return 'platinum';
  if (rarity === 'epic') return 'gold';
  if (rarity === 'rare') return 'silver';
  return 'bronze';
}

function categoryToDisplay(cat: string): BadgeItem['category'] {
  if (cat === 'progress' || cat === 'execution') return 'achievement';
  if (cat === 'consistency' || cat === 'learning') return 'engagement';
  if (cat === 'collaboration') return 'social';
  if (cat === 'quality') return 'professional';
  return 'achievement';
}

function iconNameToComponent(iconName: string | null): React.ElementType {
  const map: Record<string, React.ElementType> = {
    Trophy, Award, Star, Flame, Shield, Sparkles, Crown, Zap, Target, TrendingUp,
    Users, Briefcase, MessageCircle, Heart,
  };
  return (iconName != null ? map[iconName] : undefined) ?? Trophy;
}

function apiBadgeToBadgeItem(b: GamificationBadgeSummary): BadgeItem {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    icon: iconNameToComponent(b.iconName),
    category: categoryToDisplay(b.category),
    tier: rarityToTier(b.rarity),
    earned: true,
    earnedAt: b.awardedAt,
  };
}

const demoUserBadges: BadgeItem[] = [
  {
    id: '1',
    name: 'Early Adopter',
    description: 'Joined during the beta phase',
    icon: Star,
    category: 'achievement',
    tier: 'gold',
    earned: true,
    earnedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Conversation Starter',
    description: 'Started 50 conversations',
    icon: MessageCircle,
    category: 'engagement',
    tier: 'silver',
    earned: true,
    earnedAt: '2024-02-10',
  },
  {
    id: '3',
    name: 'Networker',
    description: 'Connected with 100 members',
    icon: Users,
    category: 'social',
    tier: 'gold',
    earned: true,
    earnedAt: '2024-02-20',
    progress: 100,
    requirement: 100,
  },
  {
    id: '4',
    name: 'Rising Star',
    description: 'Received 500 profile views',
    icon: TrendingUp,
    category: 'professional',
    tier: 'silver',
    earned: false,
    progress: 342,
    requirement: 500,
  },
  {
    id: '5',
    name: 'Community Champion',
    description: 'Helped 25 members with introductions',
    icon: Heart,
    category: 'social',
    tier: 'platinum',
    earned: false,
    progress: 18,
    requirement: 25,
  },
  {
    id: '6',
    name: 'Deal Maker',
    description: 'Closed 10 partnerships',
    icon: Briefcase,
    category: 'professional',
    tier: 'platinum',
    earned: false,
    progress: 3,
    requirement: 10,
  },
  {
    id: '7',
    name: 'On Fire',
    description: '30-day activity streak',
    icon: Flame,
    category: 'engagement',
    tier: 'gold',
    earned: false,
    progress: 12,
    requirement: 30,
  },
  {
    id: '8',
    name: 'Mentor',
    description: 'Mentored 5 founders',
    icon: Shield,
    category: 'professional',
    tier: 'gold',
    earned: true,
    earnedAt: '2024-03-01',
  },
];

interface UserBadgesProps {
  /** If true, fetches from API; otherwise uses demo data */
  live?: boolean;
}

export function UserBadges({ live = true }: UserBadgesProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: apiBadges, isLoading } = useQuery({
    queryKey: ['my-badges'],
    queryFn: getMyBadges,
    staleTime: 5 * 60_000,
    enabled: live,
  });

  const resolvedBadges: BadgeItem[] = live
    ? (apiBadges?.map(apiBadgeToBadgeItem) ?? [])
    : demoUserBadges;

  const filteredBadges = selectedCategory === 'all'
    ? resolvedBadges
    : resolvedBadges.filter(b => b.category === selectedCategory);

  if (live && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      </div>
    );
  }

  const earnedCount = resolvedBadges.filter(b => b.earned).length;
  const totalCount = resolvedBadges.length;
  const completionPercentage = (earnedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="icon-md text-primary-accessible" />
                Achievements & Badges
              </CardTitle>
              <CardDescription>
                Unlock badges by engaging with the community
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{earnedCount}/{totalCount}</div>
              <div className="text-sm text-muted-foreground">Badges Earned</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{completionPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Badges Grid */}
      <Tabs defaultValue="all" onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="engagement">
            <MessageCircle className="icon-sm mr-1" />
            Engage
          </TabsTrigger>
          <TabsTrigger value="achievement">
            <Trophy className="icon-sm mr-1" />
            Achieve
          </TabsTrigger>
          <TabsTrigger value="social">
            <Users className="icon-sm mr-1" />
            Social
          </TabsTrigger>
          <TabsTrigger value="professional">
            <Briefcase className="icon-sm mr-1" />
            Pro
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBadges.map((badge) => {
              const Icon = badge.icon;
              const hasProgress = typeof badge.progress === 'number' && typeof badge.requirement === 'number';
              const progressPercentage = hasProgress 
                ? (badge.progress! / badge.requirement!) * 100 
                : 0;

              return (
                <Card 
                  key={badge.id} 
                  className={cn(
                    'relative overflow-hidden transition-all hover:shadow-lg',
                    badge.earned && 'border-primary/50',
                    !badge.earned && 'opacity-75'
                  )}
                >
                  {badge.earned && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="gap-1">
                        <Award className="icon-sm" />
                        Earned
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center mb-3',
                      tierBgColors[badge.tier]
                    )}>
                      <Icon className={cn('icon-xl', tierColors[badge.tier])} />
                    </div>
                    
                    <CardTitle className="text-lg flex items-center gap-2">
                      {badge.name}
                      {badge.tier === 'platinum' && <Crown className="icon-sm text-cyan-400" />}
                      {badge.tier === 'gold' && <Sparkles className="icon-sm text-status-warning" />}
                    </CardTitle>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {badge.earned ? (
                      <div className="text-sm text-muted-foreground">
                        Earned on {new Date(badge.earnedAt!).toLocaleDateString('en-GB', { timeZone: 'UTC' })}
                      </div>
                    ) : hasProgress ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {badge.progress}/{badge.requirement}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Not yet earned
                      </div>
                    )}

                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)} Tier
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
