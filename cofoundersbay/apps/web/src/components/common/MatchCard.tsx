'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, X, MessageCircle, Bookmark, MapPin, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from './RoleBadge';
import { SkillChip } from './SkillChip';
import { cn } from '@/lib/utils';

type MatchReason = {
  type: 'skills' | 'location' | 'stage' | 'industry' | 'availability' | 'values';
  text: string;
  score: number; // 0-100
};

type MatchCardProps = {
  id: string;
  userId: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  role: string;
  location?: string | null;
  timezone?: string | null;
  skills: string[];
  compatibilityScore: number; // 0-100
  matchReasons: MatchReason[];
  isBookmarked?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  onBookmark?: () => void;
  className?: string;
};

function CompatibilityRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const strokeWidth = size === 'sm' ? 3 : 4;
  const radius = size === 'sm' ? 20 : size === 'md' ? 28 : 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor = score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const strokeColor = score >= 80 ? 'stroke-emerald-500 dark:stroke-emerald-400' : score >= 60 ? 'stroke-amber-500 dark:stroke-amber-400' : 'stroke-red-500 dark:stroke-red-400';

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
      <svg className="absolute transform -rotate-90" width="100%" height="100%" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-secondary"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(strokeColor, 'transition-all duration-1000 ease-out')}
        />
      </svg>
      <span className={cn('text-sm font-bold', scoreColor)}>{score}%</span>
    </div>
  );
}

export function MatchCard({
  id,
  userId,
  displayName,
  headline,
  bio,
  avatarUrl,
  role,
  location,
  timezone,
  skills,
  compatibilityScore,
  matchReasons,
  isBookmarked = false,
  onLike,
  onPass,
  onMessage,
  onBookmark,
  className,
}: MatchCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [showReasons, setShowReasons] = useState(false);

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-glow-md',
        className
      )}
    >
      {/* Compatibility score badge */}
      <div className="absolute right-4 top-4 z-10">
        <CompatibilityRing score={compatibilityScore} size="sm" />
      </div>

      <CardContent className="p-6">
        {/* Profile header */}
        <div className="flex items-start gap-4">
          <Link href={`/profiles/${userId}`}>
            <Avatar className="h-16 w-16 border-2 border-border/60 transition-transform group-hover:scale-105">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0 pr-16">
            <Link
              href={`/profiles/${userId}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {displayName}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <RoleBadge role={role} size="sm" showIcon />
            </div>
            {headline && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{headline}</p>
            )}
          </div>
        </div>

        {/* Location & timezone */}
        {(location || timezone) && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
            {timezone && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timezone}
              </span>
            )}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.slice(0, 4).map((skill) => (
              <SkillChip key={skill} label={skill} size="sm" />
            ))}
            {skills.length > 4 && (
              <span className="text-xs text-muted-foreground self-center">+{skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Match reasons toggle */}
        <button
          onClick={() => setShowReasons(!showReasons)}
          className="mt-4 flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          {showReasons ? 'Hide' : 'Why this match?'}
        </button>

        {/* Match reasons (collapsible) */}
        {showReasons && (
          <div className="mt-3 space-y-2 animate-fade-in-up">
            {matchReasons.map((reason, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-xs"
              >
                <span className="text-foreground">{reason.text}</span>
                <Badge variant="secondary" size="sm">
                  +{reason.score}%
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex items-center gap-2">
          {onPass && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onPass}
              className="h-10 w-10 rounded-full border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/50"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          {onLike && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLike}
              className="h-10 w-10 rounded-full border border-border/60 text-muted-foreground hover:text-pink-500 hover:border-pink-500/50"
            >
              <Heart className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={cn(
              'h-10 w-10 rounded-full transition-colors',
              bookmarked ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
            )}
          >
            <Bookmark className={cn('h-5 w-5', bookmarked && 'fill-current')} />
          </Button>
          {onMessage && (
            <Button onClick={onMessage} size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Swipeable Match Card for mobile
export function SwipeableMatchCard(props: MatchCardProps & { onSwipeLeft?: () => void; onSwipeRight?: () => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Note: Full swipe implementation would require a gesture library like framer-motion or react-spring
  // This is a simplified version
  return (
    <div
      className="touch-pan-y"
      style={{
        transform: `translateX(${position.x}px) rotate(${position.x * 0.05}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      <MatchCard {...props} />
    </div>
  );
}
