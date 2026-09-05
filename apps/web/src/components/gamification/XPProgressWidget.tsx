import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Flame, Award } from 'lucide-react';
import { useMyXP, useMyStreak } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';

export function XPProgressWidget() {
  const { data: xp, isLoading: xpLoading } = useMyXP();
  const { data: streak, isLoading: streakLoading } = useMyStreak();

  if (xpLoading || streakLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Progress & XP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!xp) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Progress & XP
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Level and XP */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-lg">
                {xp.level}
              </div>
              <div>
                <div className="font-semibold text-lg">{xp.levelLabel}</div>
                <div className="text-sm text-muted-foreground">
                  {xp.totalXp.toLocaleString()} XP
                </div>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {xp.xpToNextLevel} to next
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <Progress value={xp.levelProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {xp.level}</span>
              <span>{xp.levelProgress.toFixed(0)}%</span>
              <span>Level {xp.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Streak */}
        {streak && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <Flame className="h-6 w-6 text-orange-500" />
              <div>
                <div className="font-semibold text-sm">
                  {streak.currentStreak} Day Streak
                </div>
                <div className="text-xs text-muted-foreground">
                  Best: {streak.longestStreak} days
                </div>
              </div>
            </div>
            {streak.currentStreak >= 7 && (
              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                On Fire!
              </Badge>
            )}
          </div>
        )}

        {/* Recent Activity Summary */}
        {xp.recentEvents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </div>
            <div className="space-y-1">
              {xp.recentEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                >
                  <span className="text-muted-foreground">
                    {formatEventType(event.eventType)}
                  </span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-500">
                    +{event.xpAmount} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatEventType(eventType: string): string {
  return eventType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
