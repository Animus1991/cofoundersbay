'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, X, MessageCircle, Bookmark, MapPin, Clock, Sparkles, TrendingUp, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  onBreakdown?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  className?: string;
};

// ── Score tier helpers ────────────────────────────────────────────────────────

function getScoreTier(score: number) {
  if (score >= 80) return { label: 'EXCELLENT', color: '#4ADE80', glow: 'rgba(74,222,128,0.12)' };
  if (score >= 65) return { label: 'STRONG',    color: '#22D3EE', glow: 'rgba(34,211,238,0.12)' };
  if (score >= 45) return { label: 'GOOD',      color: '#FB923C', glow: 'rgba(251,146,60,0.10)' };
  return              { label: 'LOW',       color: '#F87171', glow: 'rgba(248,113,113,0.08)' };
}

// ── Score Badge (top-right) ───────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const { label, color } = getScoreTier(score);
  const r = 18, cx = 22, cy = 22;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
        <svg width={44} height={44} viewBox="0 0 44 44">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(107,114,128,0.2)" strokeWidth={4} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeDashoffset={circ / 4}
            strokeLinecap="round"
            style={{ transformOrigin: '22px 22px', transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className="absolute text-[11px] font-black tabular-nums"
          style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
          {score}%
        </span>
      </div>
      <span className="text-[8px] font-bold tracking-wider"
        style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
        {label}
      </span>
    </div>
  );
}

function MatchCardInner({
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
  onBreakdown,
  onClick,
  isSelected,
  onSelect,
  className,
}: MatchCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [showReasons, setShowReasons] = useState(false);
  const { color, glow } = getScoreTier(compatibilityScore);

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'hover:shadow-lg',
        isSelected && 'ring-2 ring-primary ring-offset-1',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ '--hover-glow': glow } as React.CSSProperties}
      onClick={(e) => {
        if (onClick && !(e.target as HTMLElement).closest('button, a')) {
          onClick();
        }
      }}
    >
      {/* Left score-color border strip */}
      <div
        className="absolute left-0 inset-y-0 w-0.5 transition-all duration-200 group-hover:w-1"
        style={{ background: color }}
      />

      {/* Selection checkbox */}
      {onSelect && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="absolute left-3 top-3 z-20"
          aria-label={isSelected ? 'Deselect' : 'Select'}
        >
          <div className={cn(
            'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
            isSelected ? 'bg-primary border-primary' : 'bg-background/80 border-border/60 hover:border-primary'
          )}>
            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
          </div>
        </button>
      )}

      {/* Score badge top-right */}
      <div className="absolute right-3 top-3 z-10">
        <ScoreBadge score={compatibilityScore} />
      </div>

      <CardContent className="pl-5 pr-4 py-5">
        {/* Profile header */}
        <div className="flex items-start gap-3">
          <Link href={`/profiles/${userId}`}>
            <Avatar className="h-11 w-11 rounded-lg border border-border/60 transition-transform group-hover:scale-105 shrink-0">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="rounded-lg bg-muted text-foreground text-sm font-semibold">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0 pr-14">
            <Link
              href={`/profiles/${userId}`}
              className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {displayName}
            </Link>
            <div className="mt-0.5 flex items-center gap-2">
              <RoleBadge role={role} size="sm" showIcon />
            </div>
            {headline && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{headline}</p>
            )}
          </div>
        </div>

        {/* Location & timezone */}
        {(location || timezone) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {location}
              </span>
            )}
            {timezone && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {timezone}
              </span>
            )}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((skill) => (
              <SkillChip key={skill} label={skill} size="sm" />
            ))}
            {skills.length > 4 && (
              <span className="text-xs text-muted-foreground self-center font-mono">+{skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Match reasons toggle */}
        <button
          onClick={() => setShowReasons(!showReasons)}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color }}
        >
          <Sparkles className="h-3 w-3" />
          {showReasons ? 'Hide reasons' : 'Why this match?'}
          {showReasons ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Match reasons (collapsible) */}
        {showReasons && (
          <div className="mt-2 space-y-1.5">
            {matchReasons.map((reason, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs bg-muted/60">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-foreground flex-1">{reason.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="mt-4 border-t border-border/50" />

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-1.5">
          {onPass && (
            <button
              onClick={onPass}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {onLike && (
            <button
              onClick={onLike}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-pink-500 hover:border-pink-400/40 transition-colors"
            >
              <Heart className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleBookmark}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-full transition-colors',
              bookmarked ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
            )}
          >
            <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
          </button>

          <div className="flex-1" />

          {/* Compatibility breakdown / analysis */}
          {onBreakdown ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs font-medium px-2.5"
              style={{ borderColor: `${color}40`, color }}
              onClick={onBreakdown}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Breakdown
            </Button>
          ) : (
            <Link href={`/matches/${userId}`}>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-medium px-2.5"
                style={{ borderColor: `${color}40`, color }}>
                <TrendingUp className="h-3.5 w-3.5" />
                Compatibility
              </Button>
            </Link>
          )}

          {onMessage && (
            <Button onClick={onMessage} size="sm" className="gap-1.5 h-8 text-xs px-2.5">
              <MessageCircle className="h-3.5 w-3.5" />
              Message
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const MatchCard = React.memo(MatchCardInner);

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
