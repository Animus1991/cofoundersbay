'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Bookmark,
  MapPin,
  Clock,
  ExternalLink,
  MoreHorizontal,
  UserPlus,
  Flag,
  Share2,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleBadge } from '@/components/common/RoleBadge';
import { SkillChip } from '@/components/common/SkillChip';
import { cn } from '@/lib/utils';

export type ProfileCardData = {
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
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  isVerified?: boolean;
  lastActive?: Date;
  matchScore?: number;
  lookingFor?: string | null;
  availability?: string | null;
};

type ProfileCardProps = {
  profile: ProfileCardData;
  variant?: 'default' | 'compact' | 'featured';
  isBookmarked?: boolean;
  onBookmark?: () => void;
  onConnect?: () => void;
  onMessage?: () => void;
  className?: string;
};

function formatLastActive(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 1) return 'Active now';
  if (hours < 24) return `Active ${hours}h ago`;
  if (days < 7) return `Active ${days}d ago`;
  return `Active ${Math.floor(days / 7)}w ago`;
}

export function ProfileCard({
  profile,
  variant = 'default',
  isBookmarked = false,
  onBookmark,
  onConnect,
  onMessage,
  className,
}: ProfileCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  if (variant === 'compact') {
    return (
      <Card className={cn('group hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Link href={`/profiles/${profile.userId}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                  {profile.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/profiles/${profile.userId}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                >
                  {profile.displayName}
                </Link>
                <RoleBadge role={profile.role} size="sm" />
              </div>
              {profile.headline && (
                <p className="text-xs text-muted-foreground truncate">{profile.headline}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={onConnect}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className={cn('group relative overflow-hidden', className)}>
        {/* Featured gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {profile.matchScore && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              {profile.matchScore}% match
            </Badge>
          </div>
        )}

        <CardContent className="relative pt-6 pb-4">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Link href={`/profiles/${profile.userId}`}>
              <Avatar className="h-16 w-16 ring-2 ring-border/40 group-hover:ring-primary/40 transition-all">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                  {profile.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/profiles/${profile.userId}`}
                  className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {profile.displayName}
                </Link>
                {profile.isVerified && (
                  <Badge variant="secondary" size="sm" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <RoleBadge role={profile.role} showIcon />
              </div>
              {profile.headline && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{profile.headline}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-sm text-foreground/80 line-clamp-3">{profile.bio}</p>
          )}

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            )}
            {profile.lastActive && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatLastActive(profile.lastActive)}
              </span>
            )}
          </div>

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.slice(0, 5).map((skill) => (
                <SkillChip key={skill} label={skill} size="sm" />
              ))}
              {profile.skills.length > 5 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{profile.skills.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Looking for / availability */}
          {(profile.lookingFor || profile.availability) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.lookingFor && (
                <div className="rounded-lg bg-secondary/60 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">Looking for: </span>
                  <span className="font-medium text-foreground">{profile.lookingFor}</span>
                </div>
              )}
              {profile.availability && (
                <div className="rounded-lg bg-secondary/60 px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">Availability: </span>
                  <span className="font-medium text-foreground">{profile.availability}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/40">
            <div className="flex items-center gap-2">
              <Button onClick={onConnect} size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Connect
              </Button>
              <Button onClick={onMessage} size="sm" variant="secondary" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                className={cn(
                  'h-8 w-8',
                  bookmarked ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
                )}
              >
                <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share profile
                  </DropdownMenuItem>
                  {profile.linkedinUrl && (
                    <DropdownMenuItem asChild>
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        LinkedIn
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className={cn('group hover:shadow-md transition-all hover:-translate-y-0.5', className)}>
      <CardContent className="pt-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href={`/profiles/${profile.userId}`}>
            <Avatar className="h-12 w-12 ring-2 ring-border/40">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {profile.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Link
                  href={`/profiles/${profile.userId}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                >
                  {profile.displayName}
                </Link>
                <RoleBadge role={profile.role} size="sm" />
              </div>
              {profile.matchScore && profile.matchScore > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary shrink-0 ml-1">
                  <Star className="h-3 w-3 fill-current" />
                  {profile.matchScore}%
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                className={cn(
                  'h-8 w-8 flex-shrink-0',
                  bookmarked ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'
                )}
              >
                <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
              </Button>
            </div>
            {profile.headline && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{profile.headline}</p>
            )}
          </div>
        </div>

        {/* Location */}
        {profile.location && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {profile.location}
          </div>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 4).map((skill) => (
              <SkillChip key={skill} label={skill} size="sm" />
            ))}
            {profile.skills.length > 4 && (
              <span className="text-xs text-muted-foreground self-center">+{profile.skills.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={onConnect} size="sm" variant="secondary" className="flex-1 gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Connect
          </Button>
          <Button onClick={onMessage} size="sm" variant="ghost" className="gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for loading
export function ProfileCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
              <div className="h-3 w-48 bg-secondary rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-secondary animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
            <div className="h-3 w-48 bg-secondary rounded animate-pulse" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 bg-secondary rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-secondary rounded-full animate-pulse" />
          <div className="h-6 w-14 bg-secondary rounded-full animate-pulse" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 flex-1 bg-secondary rounded animate-pulse" />
          <div className="h-8 w-10 bg-secondary rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
