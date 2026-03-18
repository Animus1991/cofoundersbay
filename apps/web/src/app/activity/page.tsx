'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Sparkles } from 'lucide-react';
import { getDashboardActivity, type DashboardActivityItem } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

function ActivitySkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItemCard({ item }: { item: DashboardActivityItem }) {
  const isConnection = item.type === 'connection';
  return (
    <Card className="card-interactive">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          isConnection ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
        )}>
          {isConnection ? <Users className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {item.author && (
            <p className="text-xs text-muted-foreground mt-0.5">by {item.author}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{item.timeAgo}</p>
        </div>
        {item.href && (
          <a href={item.href} className="shrink-0 text-xs text-primary hover:underline">View →</a>
        )}
      </CardContent>
    </Card>
  );
}

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'trending'>('all');

  const { data: activityItems, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-activity', 20],
    queryFn: () => getDashboardActivity({ limit: 20 }),
    staleTime: 30_000,
    retry: 1,
  });

  return (
    <AppShell
      title="Activity Feed"
      description="Stay updated with the latest from your network"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Network Activity
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <Users className="h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {isError ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">Failed to load activity feed.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
            </CardContent></Card>
          ) : isLoading
            ? Array.from({ length: 5 }).map((_, i) => <ActivitySkeleton key={i} />)
            : activityItems && activityItems.length > 0
              ? activityItems.map((item) => <ActivityItemCard key={item.id} item={item} />)
              : <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">
                  No network activity yet. Connect with more people to see updates here.
                </CardContent></Card>}
        </TabsContent>

        <TabsContent value="following" className="mt-4 space-y-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <ActivitySkeleton key={i} />)
            : (activityItems ?? []).filter((i) => i.type === 'connection').map((item) => (
                <ActivityItemCard key={item.id} item={item} />
              ))}
          {!isLoading && (activityItems ?? []).filter((i) => i.type === 'connection').length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              No connection activity yet
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-4 space-y-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <ActivitySkeleton key={i} />)
            : (activityItems ?? []).filter((i) => i.type === 'event').map((item) => (
                <ActivityItemCard key={item.id} item={item} />
              ))}
          {!isLoading && (activityItems ?? []).filter((i) => i.type === 'event').length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              No upcoming events
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
