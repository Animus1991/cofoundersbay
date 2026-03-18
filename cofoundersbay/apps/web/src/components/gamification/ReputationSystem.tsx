'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  Award, 
  Star, 
  Zap, 
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  Calendar,
  Users,
  MessageCircle,
  Handshake,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ReputationActivity {
  id: string;
  type: 'earned' | 'spent';
  action: string;
  points: number;
  timestamp: string;
  icon: React.ElementType;
}

interface ReputationLevel {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  perks: string[];
}

const reputationLevels: ReputationLevel[] = [
  {
    level: 1,
    name: 'Newcomer',
    minPoints: 0,
    maxPoints: 99,
    perks: ['Basic profile', 'Join groups', 'Send messages'],
  },
  {
    level: 2,
    name: 'Member',
    minPoints: 100,
    maxPoints: 499,
    perks: ['Create events', 'Post opportunities', 'Enhanced visibility'],
  },
  {
    level: 3,
    name: 'Contributor',
    minPoints: 500,
    maxPoints: 1499,
    perks: ['Priority support', 'Featured profile', 'Advanced analytics'],
  },
  {
    level: 4,
    name: 'Expert',
    minPoints: 1500,
    maxPoints: 4999,
    perks: ['Verified badge', 'Mentor status', 'Premium features'],
  },
  {
    level: 5,
    name: 'Leader',
    minPoints: 5000,
    maxPoints: Infinity,
    perks: ['VIP access', 'Custom branding', 'API access', 'Priority matching'],
  },
];

// Demo data
const currentPoints = 1247;
const currentLevel = reputationLevels.find(
  (level) => currentPoints >= level.minPoints && currentPoints <= level.maxPoints
) || reputationLevels[0];
const nextLevel = reputationLevels[currentLevel.level] || null;

const recentActivities: ReputationActivity[] = [
  {
    id: '1',
    type: 'earned',
    action: 'Completed profile',
    points: 50,
    timestamp: '2024-03-15T10:30:00Z',
    icon: Star,
  },
  {
    id: '2',
    type: 'earned',
    action: 'Made a connection',
    points: 10,
    timestamp: '2024-03-15T09:15:00Z',
    icon: Users,
  },
  {
    id: '3',
    type: 'earned',
    action: 'Posted an opportunity',
    points: 25,
    timestamp: '2024-03-14T16:45:00Z',
    icon: Lightbulb,
  },
  {
    id: '4',
    type: 'earned',
    action: 'Sent 10 messages',
    points: 15,
    timestamp: '2024-03-14T14:20:00Z',
    icon: MessageCircle,
  },
  {
    id: '5',
    type: 'spent',
    action: 'Boosted profile visibility',
    points: -100,
    timestamp: '2024-03-13T11:00:00Z',
    icon: TrendingUp,
  },
  {
    id: '6',
    type: 'earned',
    action: 'Accepted partnership',
    points: 50,
    timestamp: '2024-03-12T15:30:00Z',
    icon: Handshake,
  },
];

const pointsEarningGuide = [
  { action: 'Complete your profile', points: 50, icon: Star },
  { action: 'Make a connection', points: 10, icon: Users },
  { action: 'Send a message', points: 2, icon: MessageCircle },
  { action: 'Post an opportunity', points: 25, icon: Lightbulb },
  { action: 'Attend an event', points: 20, icon: Calendar },
  { action: 'Accept a partnership', points: 50, icon: Handshake },
  { action: 'Daily login streak (7 days)', points: 35, icon: Activity },
  { action: 'Refer a new member', points: 100, icon: TrendingUp },
];

export function ReputationSystem() {
  const [activeTab, setActiveTab] = useState('overview');

  const pointsToNextLevel = nextLevel ? nextLevel.minPoints - currentPoints : 0;
  const levelProgress = nextLevel
    ? ((currentPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Current Level Card */}
      <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Level {currentLevel.level}: {currentLevel.name}</CardTitle>
                <CardDescription className="text-base">
                  {currentPoints.toLocaleString()} reputation points
                </CardDescription>
              </div>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              <Zap className="h-4 w-4 mr-1" />
              {currentPoints}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextLevel && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
                  <span className="font-medium">
                    {pointsToNextLevel.toLocaleString()} points needed
                  </span>
                </div>
                <Progress value={levelProgress} className="h-3" />
              </div>
            </>
          )}
          
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {currentLevel.perks.map((perk, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                  <Star className="h-3 w-3 text-primary" />
                </div>
                <span>{perk}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="earn">How to Earn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Level Progression */}
          <Card>
            <CardHeader>
              <CardTitle>Level Progression</CardTitle>
              <CardDescription>Your journey through the ranks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reputationLevels.map((level) => {
                  const isCurrentLevel = level.level === currentLevel.level;
                  const isPastLevel = currentPoints >= level.minPoints;
                  const isFutureLevel = currentPoints < level.minPoints;

                  return (
                    <div
                      key={level.level}
                      className={cn(
                        'flex items-center gap-4 rounded-lg border p-4 transition-all',
                        isCurrentLevel && 'border-primary bg-primary/5',
                        isPastLevel && !isCurrentLevel && 'opacity-60',
                        isFutureLevel && 'opacity-40'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          isCurrentLevel ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}
                      >
                        <span className="font-bold">{level.level}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{level.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {level.minPoints.toLocaleString()} - {level.maxPoints === Infinity ? '∞' : level.maxPoints.toLocaleString()} points
                        </div>
                      </div>
                      {isCurrentLevel && (
                        <Badge variant="default">Current</Badge>
                      )}
                      {isPastLevel && !isCurrentLevel && (
                        <Badge variant="outline">Completed</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest reputation changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  const isEarned = activity.type === 'earned';

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          isEarned ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                        )}>
                          <Icon className={cn(
                            'h-5 w-5',
                            isEarned ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          )} />
                        </div>
                        <div>
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        'flex items-center gap-1 font-bold',
                        isEarned ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {isEarned ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        {Math.abs(activity.points)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ways to Earn Points</CardTitle>
              <CardDescription>Complete these actions to increase your reputation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {pointsEarningGuide.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{item.action}</span>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        +{item.points}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
