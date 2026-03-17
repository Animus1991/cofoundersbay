'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Sparkles,
  TrendingUp,
  Target,
  Filter,
  RefreshCw,
  UserPlus,
  MessageCircle,
  Star,
  Briefcase,
  GraduationCap,
  DollarSign,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  avatarUrl: string;
  role: string;
  location: string;
  matchScore: number;
  matchReasons: string[];
  skills: string[];
  industries: string[];
  mutualConnections: number;
  recentActivity: string;
}

const DEMO_RECOMMENDATIONS: Recommendation[] = [
  {
    id: '1',
    userId: 'user1',
    displayName: 'Sarah Chen',
    headline: 'Technical Co-founder | AI/ML Expert',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    role: 'founder',
    location: 'San Francisco, CA',
    matchScore: 95,
    matchReasons: [
      'Complementary technical skills',
      'Similar startup stage',
      'Shared interest in AI/ML',
      'Located in same city',
    ],
    skills: ['Machine Learning', 'Python', 'TensorFlow', 'Cloud Architecture'],
    industries: ['AI/ML', 'SaaS', 'Enterprise'],
    mutualConnections: 12,
    recentActivity: 'Posted about seed funding 2 days ago',
  },
  {
    id: '2',
    userId: 'user2',
    displayName: 'Michael Rodriguez',
    headline: 'Product Manager | B2B SaaS',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    role: 'founder',
    location: 'New York, NY',
    matchScore: 92,
    matchReasons: [
      'Strong product background',
      'B2B SaaS experience',
      'Looking for technical co-founder',
      '3 mutual connections',
    ],
    skills: ['Product Strategy', 'User Research', 'Agile', 'Analytics'],
    industries: ['SaaS', 'B2B', 'Fintech'],
    mutualConnections: 3,
    recentActivity: 'Attended TechCrunch Disrupt last week',
  },
  {
    id: '3',
    userId: 'user3',
    displayName: 'Emily Watson',
    headline: 'Growth Marketing | 0→1 Specialist',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    role: 'founder',
    location: 'Austin, TX',
    matchScore: 88,
    matchReasons: [
      'Growth expertise',
      'Early-stage focus',
      'Proven track record',
      'Remote-friendly',
    ],
    skills: ['Growth Hacking', 'SEO', 'Content Marketing', 'Analytics'],
    industries: ['Marketing', 'SaaS', 'E-commerce'],
    mutualConnections: 8,
    recentActivity: 'Shared insights on growth strategies',
  },
];

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <Card className="card-interactive hover-lift">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={recommendation.avatarUrl}
              alt={recommendation.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
              <Star className="h-3 w-3 fill-current" />
              {recommendation.matchScore}%
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg mb-1">{recommendation.displayName}</h3>
                <p className="text-sm text-muted-foreground mb-2">{recommendation.headline}</p>
                <p className="text-xs text-muted-foreground">{recommendation.location}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {recommendation.role}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Why you match:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {recommendation.matchReasons.map((reason, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Skills:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {recommendation.skills.slice(0, 4).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {recommendation.skills.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{recommendation.skills.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {recommendation.mutualConnections > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {recommendation.mutualConnections} mutual connections
                </div>
              )}

              {recommendation.recentActivity && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {recommendation.recentActivity}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Connect
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'cofounders' | 'mentors' | 'investors'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['recommendations', activeTab, refreshKey],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return DEMO_RECOMMENDATIONS;
    },
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <AppShell
      title="Recommendations"
      description="Discover your best matches based on AI-powered analysis"
      actions={
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI-Powered Matching</h2>
                <p className="text-sm text-muted-foreground">
                  Based on your profile, skills, and preferences
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{recommendations?.length || 0}</p>
                <p className="text-xs text-muted-foreground">New matches</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">95%</p>
                <p className="text-xs text-muted-foreground">Avg. match score</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-muted-foreground">Mutual connections</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Active this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Target className="h-4 w-4" />
                All Matches
              </TabsTrigger>
              <TabsTrigger value="cofounders" className="gap-2">
                <Users className="h-4 w-4" />
                Co-founders
              </TabsTrigger>
              <TabsTrigger value="mentors" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Mentors
              </TabsTrigger>
              <TabsTrigger value="investors" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Investors
              </TabsTrigger>
            </TabsList>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          <TabsContent value={activeTab} className="mt-4 space-y-4">
            {isLoading ? (
              <RecommendationsSkeleton />
            ) : recommendations && recommendations.length > 0 ? (
              recommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete your profile to get personalized matches
                  </p>
                  <Button>Complete Profile</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
