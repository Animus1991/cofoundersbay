import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { Award, Trophy, Star, Sparkles } from 'lucide-react';
import { useMyBadges } from '@/hooks/useGamification';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function BadgesWidget() {
  const { data: badges, isLoading } = useMyBadges();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="icon-md" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!badges || badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="icon-md" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No badges earned yet</p>
            <p className="text-xs mt-1">Keep building to unlock achievements!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unseenCount = badges.filter((b) => !b.seenAt).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="icon-md text-status-accent" />
            Badges
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {badges.length} earned
            </span>
            {unseenCount > 0 && (
              <BadgeUI variant="secondary" className="gap-1">
                <Sparkles className="icon-sm" />
                {unseenCount} new
              </BadgeUI>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                'relative flex flex-col items-center p-3 rounded-lg border transition-all hover:shadow-md',
                getRarityStyles(badge.rarity),
                !badge.seenAt && 'ring-2 ring-purple-500 ring-offset-2'
              )}
            >
              {!badge.seenAt && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              )}
              <div className={cn('text-2xl mb-1', getRarityIconColor(badge.rarity))}>
                {getBadgeIcon(badge.iconName || badge.category)}
              </div>
              <div className="text-xs font-medium text-center line-clamp-2">
                {badge.name}
              </div>
              <div className="text-2xs text-muted-foreground mt-1 capitalize">
                {badge.rarity}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getRarityStyles(rarity: string): string {
  switch (rarity) {
    case 'legendary':
      return 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-400';
    case 'epic':
      return 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-400';
    case 'rare':
      return 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-400';
    case 'uncommon':
      return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-400';
    default:
      return 'bg-muted/50 border-border';
  }
}

function getRarityIconColor(rarity: string): string {
  switch (rarity) {
    case 'legendary':
      return 'text-status-warning';
    case 'epic':
      return 'text-status-accent';
    case 'rare':
      return 'text-status-info';
    case 'uncommon':
      return 'text-status-success';
    default:
      return 'text-muted-foreground';
  }
}

function getBadgeIcon(iconName: string): string {
  const iconMap: Record<string, string> = {
    trophy: '🏆',
    star: '⭐',
    medal: '🥇',
    fire: '🔥',
    rocket: '🚀',
    target: '🎯',
    crown: '👑',
    gem: '💎',
    progress: '📈',
    consistency: '🔥',
    collaboration: '🤝',
    quality: '✨',
    learning: '📚',
    execution: '⚡',
  };
  return iconMap[iconName.toLowerCase()] || '🏅';
}
