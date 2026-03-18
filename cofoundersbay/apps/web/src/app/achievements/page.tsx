'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsAchievements, getDashboardStats, type AnalyticsAchievement } from '@/lib/api';
import {
  Award,
  Trophy,
  Star,
  Zap,
  Target,
  TrendingUp,
  Users,
  MessageCircle,
  Eye,
  Heart,
  Calendar,
  Flame,
  Crown,
  Medal,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'networking' | 'engagement' | 'profile' | 'activity' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: typeof Award;
  points: number;
  progress: number;
  total: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: number;
}

interface UserStats {
  totalPoints: number;
  level: number;
  nextLevelPoints: number;
  currentLevelPoints: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  rank: string;
  percentile: number;
}

const TIER_COLORS = {
  bronze: 'text-orange-600',
  silver: 'text-gray-400',
  gold: 'text-yellow-500',
  platinum: 'text-cyan-400',
};

const TIER_BG = {
  bronze: 'bg-orange-500/10',
  silver: 'bg-gray-400/10',
  gold: 'bg-yellow-500/10',
  platinum: 'bg-cyan-400/10',
};

const CATEGORY_ICONS = {
  networking: Users,
  engagement: Heart,
  profile: Star,
  activity: Zap,
  special: Crown,
};

const ICON_MAP: Record<string, typeof Award> = {
  trophy: Trophy, star: Star, zap: Zap, users: Users, eye: Eye,
  heart: Heart, calendar: Calendar, flame: Flame, crown: Crown,
  target: Target, medal: Medal, award: Award,
};

function apiToAchievement(a: AnalyticsAchievement, index: number): Achievement {
  const tiers: Achievement['tier'][] = ['bronze', 'silver', 'gold', 'platinum'];
  const categories: Achievement['category'][] = ['networking', 'engagement', 'profile', 'activity', 'special'];
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: categories[index % categories.length],
    tier: tiers[index % tiers.length],
    icon: ICON_MAP[a.icon.toLowerCase()] ?? Award,
    points: (index + 1) * 100,
    progress: a.unlocked ? 1 : 0,
    total: 1,
    unlocked: a.unlocked,
    unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
    rarity: Math.max(2, 50 - index * 4),
  };
}

const DEMO_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'Early Adopter',
    description: 'Joined CoFounderBay in the first month',
    category: 'special',
    tier: 'gold',
    icon: Trophy,
    points: 500,
    progress: 1,
    total: 1,
    unlocked: true,
    unlockedAt: new Date('2024-01-15'),
    rarity: 5,
  },
  {
    id: '2',
    title: 'Networker',
    description: 'Connect with 50 members',
    category: 'networking',
    tier: 'silver',
    icon: Users,
    points: 200,
    progress: 34,
    total: 50,
    unlocked: false,
    rarity: 25,
  },
  {
    id: '3',
    title: 'Super Networker',
    description: 'Connect with 100 members',
    category: 'networking',
    tier: 'gold',
    icon: Users,
    points: 500,
    progress: 34,
    total: 100,
    unlocked: false,
    rarity: 10,
  },
  {
    id: '4',
    title: 'Influencer',
    description: 'Reach 1,000 profile views',
    category: 'profile',
    tier: 'gold',
    icon: Eye,
    points: 400,
    progress: 1247,
    total: 1000,
    unlocked: true,
    unlockedAt: new Date('2024-02-20'),
    rarity: 15,
  },
  {
    id: '5',
    title: 'Conversation Starter',
    description: 'Send 100 messages',
    category: 'engagement',
    tier: 'bronze',
    icon: MessageCircle,
    points: 100,
    progress: 156,
    total: 100,
    unlocked: true,
    unlockedAt: new Date('2024-02-10'),
    rarity: 40,
  },
  {
    id: '6',
    title: 'Active Contributor',
    description: 'Post 50 updates',
    category: 'activity',
    tier: 'silver',
    icon: Zap,
    points: 250,
    progress: 23,
    total: 50,
    unlocked: false,
    rarity: 30,
  },
  {
    id: '7',
    title: 'Engagement Master',
    description: 'Receive 500 reactions on your posts',
    category: 'engagement',
    tier: 'platinum',
    icon: Heart,
    points: 1000,
    progress: 289,
    total: 500,
    unlocked: false,
    rarity: 5,
  },
  {
    id: '8',
    title: 'Consistent',
    description: 'Log in for 30 consecutive days',
    category: 'activity',
    tier: 'silver',
    icon: Calendar,
    points: 300,
    progress: 12,
    total: 30,
    unlocked: false,
    rarity: 20,
  },
  {
    id: '9',
    title: 'On Fire',
    description: 'Log in for 100 consecutive days',
    category: 'activity',
    tier: 'platinum',
    icon: Flame,
    points: 1500,
    progress: 12,
    total: 100,
    unlocked: false,
    rarity: 2,
  },
  {
    id: '10',
    title: 'Profile Perfectionist',
    description: 'Complete your profile 100%',
    category: 'profile',
    tier: 'bronze',
    icon: Star,
    points: 150,
    progress: 85,
    total: 100,
    unlocked: false,
    rarity: 35,
  },
];


function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievement.icon;
  const CategoryIcon = CATEGORY_ICONS[achievement.category];
  const progressPercentage = (achievement.progress / achievement.total) * 100;

  return (
    <Card
      className={cn(
        'card-interactive transition-all',
        achievement.unlocked ? 'hover-lift' : 'opacity-75'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'relative p-3 rounded-xl shrink-0',
              TIER_BG[achievement.tier],
              achievement.unlocked ? 'ring-2 ring-primary/20' : ''
            )}
          >
            <Icon className={cn('h-8 w-8', TIER_COLORS[achievement.tier])} />
            {achievement.unlocked && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            )}
            {!achievement.unlocked && achievement.progress === 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary flex items-center justify-center">
                <Lock className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-base mb-1">{achievement.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {achievement.description}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {achievement.points} pts
              </Badge>
            </div>

            {!achievement.unlocked && (
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>
                    {achievement.progress} / {achievement.total}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}

            <div className="flex items-center gap-3 text-xs">
              <Badge variant="outline" className="gap-1">
                <CategoryIcon className="h-3 w-3" />
                {achievement.category}
              </Badge>
              <Badge
                variant="outline"
                className={cn('gap-1', TIER_COLORS[achievement.tier])}
              >
                <Medal className="h-3 w-3" />
                {achievement.tier}
              </Badge>
              <span className="text-muted-foreground">
                {achievement.rarity}% have this
              </span>
              {achievement.unlocked && achievement.unlockedAt && (
                <span className="text-muted-foreground ml-auto">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserStatsCard({ stats }: { stats: UserStats }) {
  const levelProgress =
    ((stats.totalPoints - stats.currentLevelPoints) /
      (stats.nextLevelPoints - stats.currentLevelPoints)) *
    100;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Level</p>
                <h2 className="text-3xl font-bold">Level {stats.level}</h2>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to Level {stats.level + 1}</span>
                <span className="font-medium">
                  {stats.totalPoints} / {stats.nextLevelPoints} pts
                </span>
              </div>
              <Progress value={levelProgress} className="h-3" />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Crown className="h-3 w-3" />
                {stats.rank}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Top {100 - stats.percentile}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Achievements</p>
              <p className="text-2xl font-bold">
                {stats.achievementsUnlocked}/{stats.totalAchievements}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completion</p>
              <p className="text-2xl font-bold">
                {Math.round((stats.achievementsUnlocked / stats.totalAchievements) * 100)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Rank</p>
              <p className="text-2xl font-bold">#{stats.percentile}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: rawAchievements, isLoading, isError, refetch } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => getAnalyticsAchievements(),
    staleTime: 120_000,
    retry: 1,
  });

  const achievements = useMemo(() => {
    const list = isError || !rawAchievements ? DEMO_ACHIEVEMENTS : rawAchievements;
    return (list ?? []).map((a, i) =>
      'tier' in a && 'points' in a && 'rarity' in a
        ? (a as unknown as Achievement)
        : apiToAchievement(a as AnalyticsAchievement, i),
    );
  }, [rawAchievements, isError]);

  const stats: UserStats = useMemo(() => {
    const unlocked = achievements.filter((a) => a.unlocked).length;
    const total = achievements.length || 1;
    const totalPoints = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.points, 0);
    const level = Math.max(1, Math.floor(totalPoints / 200));
    return {
      totalPoints,
      level,
      nextLevelPoints: (level + 1) * 200,
      currentLevelPoints: level * 200,
      achievementsUnlocked: unlocked,
      totalAchievements: total,
      rank: level >= 10 ? 'Legend' : level >= 7 ? 'Expert' : level >= 4 ? 'Rising Star' : 'Newcomer',
      percentile: Math.min(99, Math.round((unlocked / total) * 100)),
    };
  }, [achievements]);

  const filteredAchievements = achievements?.filter((achievement) => {
    if (activeTab === 'unlocked' && !achievement.unlocked) return false;
    if (activeTab === 'locked' && achievement.unlocked) return false;
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    return true;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'networking', label: 'Networking', icon: Users },
    { value: 'engagement', label: 'Engagement', icon: Heart },
    { value: 'profile', label: 'Profile', icon: Star },
    { value: 'activity', label: 'Activity', icon: Zap },
    { value: 'special', label: 'Special', icon: Crown },
  ];

  return (
    <AppShell
      title="Achievements & Badges"
      description="Track your progress and unlock achievements"
    >
      <div className="space-y-4">
        {isLoading ? (
          <AchievementsSkeleton />
        ) : (
          <>
            {stats && <UserStatsCard stats={stats} />}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    <Award className="h-4 w-4" />
                    All ({achievements?.length})
                  </TabsTrigger>
                  <TabsTrigger value="unlocked" className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Unlocked ({achievements?.filter((a) => a.unlocked).length})
                  </TabsTrigger>
                  <TabsTrigger value="locked" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Locked ({achievements?.filter((a) => !a.unlocked).length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Badge
                        key={category.value}
                        variant={categoryFilter === category.value ? 'default' : 'outline'}
                        className="cursor-pointer gap-1.5"
                        onClick={() => setCategoryFilter(category.value)}
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        {category.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <TabsContent value={activeTab} className="mt-4 space-y-4">
                {filteredAchievements && filteredAchievements.length > 0 ? (
                  filteredAchievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Award className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  );
}
