'use client';

import { useState } from 'react';
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
  bronze: 'text-orange-600 dark:text-orange-400',
  silver: 'text-gray-400 dark:text-gray-300',
  gold: 'text-yellow-500 dark:text-yellow-400',
  platinum: 'text-cyan-400 dark:text-cyan-300',
};

const tierBgColors = {
  bronze: 'bg-orange-100 dark:bg-orange-950',
  silver: 'bg-gray-100 dark:bg-gray-800',
  gold: 'bg-yellow-100 dark:bg-yellow-950',
  platinum: 'bg-cyan-100 dark:bg-cyan-950',
};

// Demo badges data
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

export function UserBadges() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredBadges = selectedCategory === 'all' 
    ? demoUserBadges 
    : demoUserBadges.filter(b => b.category === selectedCategory);

  const earnedCount = demoUserBadges.filter(b => b.earned).length;
  const totalCount = demoUserBadges.length;
  const completionPercentage = (earnedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Achievements & Badges
              </CardTitle>
              <CardDescription>
                Unlock badges by engaging with the community
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{earnedCount}/{totalCount}</div>
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
            <MessageCircle className="h-4 w-4 mr-1" />
            Engage
          </TabsTrigger>
          <TabsTrigger value="achievement">
            <Trophy className="h-4 w-4 mr-1" />
            Achieve
          </TabsTrigger>
          <TabsTrigger value="social">
            <Users className="h-4 w-4 mr-1" />
            Social
          </TabsTrigger>
          <TabsTrigger value="professional">
            <Briefcase className="h-4 w-4 mr-1" />
            Pro
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        <Award className="h-3 w-3" />
                        Earned
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center mb-3',
                      tierBgColors[badge.tier]
                    )}>
                      <Icon className={cn('h-8 w-8', tierColors[badge.tier])} />
                    </div>
                    
                    <CardTitle className="text-lg flex items-center gap-2">
                      {badge.name}
                      {badge.tier === 'platinum' && <Crown className="h-4 w-4 text-cyan-400" />}
                      {badge.tier === 'gold' && <Sparkles className="h-4 w-4 text-yellow-500" />}
                    </CardTitle>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    {badge.earned ? (
                      <div className="text-sm text-muted-foreground">
                        Earned on {new Date(badge.earnedAt!).toLocaleDateString()}
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
