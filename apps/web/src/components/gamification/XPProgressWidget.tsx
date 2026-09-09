'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMyXP, useMyStreak } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';
import { BilingualText } from '@/components/common/BilingualText';
import { CfbGlyph } from '@/components/icons/CfbGlyph';

export function XPProgressWidget() {
  const { data: xp, isLoading: xpLoading } = useMyXP();
  const { data: streakData, isLoading: streakLoading } = useMyStreak();

  // Render the streak only when the response actually carries the numbers.
  // A truthy object with missing fields used to reach the copy verbatim, and the
  // dashboard showed "undefined day streak · Best: undefined days". Treat a
  // malformed payload as "no streak" rather than interpolating it into a string.
  const currentStreak = Number.isFinite(streakData?.currentStreak as number)
    ? (streakData!.currentStreak as number)
    : null;
  const longestStreak = Number.isFinite(streakData?.longestStreak as number)
    ? (streakData!.longestStreak as number)
    : null;
  const streak = currentStreak === null ? null : { currentStreak, longestStreak: longestStreak ?? currentStreak };

  if (xpLoading || streakLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CfbGlyph name="award" className="icon-md text-primary-accessible" />
            <BilingualText en="Progress & XP" el="Πρόοδος & XP" compact />
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
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CfbGlyph name="award" className="icon-md text-primary-accessible" />
          <BilingualText en="Progress & XP" el="Πρόοδος & XP" compact />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary-accessible">
                {xp.level}
              </div>
              <div>
                <div className="text-lg font-semibold">{xp.levelLabel}</div>
                <div className="text-sm text-muted-foreground">
                  {xp.totalXp.toLocaleString()} XP
                </div>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <CfbGlyph name="target" className="icon-sm" />
              <BilingualText
                en={`${xp.xpToNextLevel} to next`}
                el={`${xp.xpToNextLevel} έως το επόμενο`}
                compact
              />
            </Badge>
          </div>

          <div className="space-y-1">
            <Progress value={xp.levelProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                <BilingualText en={`Level ${xp.level}`} el={`Επίπεδο ${xp.level}`} compact />
              </span>
              <span>{xp.levelProgress.toFixed(0)}%</span>
              <span>
                <BilingualText en={`Level ${xp.level + 1}`} el={`Επίπεδο ${xp.level + 1}`} compact />
              </span>
            </div>
          </div>
        </div>

        {streak && (
          <div className="flex items-center justify-between rounded-xl border border-status-warning-border bg-status-warning-bg p-3">
            <div className="flex items-center gap-3">
              <CfbGlyph name="spark" className="icon-lg text-status-warning" />
              <div>
                <div className="text-sm font-semibold">
                  <BilingualText
                    en={`${streak.currentStreak} day streak`}
                    el={`${streak.currentStreak} ημέρες σε σειρά`}
                    compact
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  <BilingualText
                    en={`Best: ${streak.longestStreak} days`}
                    el={`Καλύτερο: ${streak.longestStreak} ημέρες`}
                    compact
                  />
                </div>
              </div>
            </div>
            {streak.currentStreak >= 7 && (
              <Badge variant="secondary" className="gap-1">
                <CfbGlyph name="award" className="icon-sm" />
                <BilingualText en="On fire" el="Σε φόρμα" compact />
              </Badge>
            )}
          </div>
        )}

        {xp.recentEvents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              <BilingualText en="Recent activity" el="Πρόσφατη δραστηριότητα" compact />
            </div>
            <div className="space-y-1">
              {xp.recentEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-xs"
                >
                  <span className="text-muted-foreground">
                    {formatEventType(event.eventType)}
                  </span>
                  <span className="font-medium text-status-warning">
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
