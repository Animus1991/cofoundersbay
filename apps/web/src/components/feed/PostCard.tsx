'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  UserMinus,
  Copy,
  Trash2,
  Edit,
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
import { cn } from '@/lib/utils';

type PostType = 'update' | 'ask' | 'offer' | 'hiring' | 'milestone' | 'pitch';

type Author = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  role: string;
  headline?: string | null;
};

type PostCardProps = {
  id: string;
  type: PostType;
  author: Author;
  content: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isMine?: boolean;
  tags?: string[];
  attachments?: { type: 'image' | 'link'; url: string; title?: string }[];
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
};

const postTypeConfig: Record<PostType, { label: string; color: string; emoji: string }> = {
  update: { label: 'Update', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30', emoji: '📢' },
  ask: { label: 'Ask', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30', emoji: '❓' },
  offer: { label: 'Offer', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', emoji: '🎁' },
  hiring: { label: 'Hiring', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', emoji: '👥' },
  milestone: { label: 'Milestone', color: 'bg-pink-500/15 text-pink-700 dark:text-pink-400 border-pink-500/30', emoji: '🎉' },
  pitch: { label: 'Pitch', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30', emoji: '🚀' },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

export function PostCard({
  id,
  type,
  author,
  content,
  createdAt,
  likesCount,
  commentsCount,
  isLiked = false,
  isBookmarked = false,
  isMine = false,
  tags = [],
  attachments = [],
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
  onEdit,
  onReport,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);

  const typeConfig = postTypeConfig[type];

  const handleLike = () => {
    setLiked(!liked);
    setLocalLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link href={`/profiles/${author.id}`}>
              <Avatar className="h-11 w-11 ring-2 ring-border/40">
                <AvatarImage src={author.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary-emphasis font-semibold">
                  {author.displayName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/profiles/${author.id}`}
                  className="font-semibold text-foreground hover:text-primary-emphasis transition-colors"
                >
                  {author.displayName}
                </Link>
                <RoleBadge role={author.role} size="sm" />
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(createdAt)}</span>
              </div>
              {author.headline && (
                <p className="text-xs text-muted-foreground truncate">{author.headline}</p>
              )}
            </div>
          </div>

          {/* Post type badge & menu */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', typeConfig.color)}>
              {typeConfig.emoji} {typeConfig.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="More options" variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="icon-sm" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.origin + `/post/${id}`)}>
                  <Copy className="icon-sm mr-2" aria-hidden="true" />
                  Copy link
                </DropdownMenuItem>
                {isMine ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="icon-sm mr-2" aria-hidden="true" />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="icon-sm mr-2" aria-hidden="true" />
                      Delete post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onReport}>
                      <Flag className="icon-sm mr-2" aria-hidden="true" />
                      Report post
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserMinus className="icon-sm mr-2" aria-hidden="true" />
                      Unfollow {author.displayName}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4">
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/discover?tag=${encodeURIComponent(tag)}`}
                className="text-xs text-primary-emphasis hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((attachment, i) => (
              attachment.type === 'image' ? (
                <img
                  key={i}
                  src={attachment.url}
                  alt=""
                  className="rounded-xl max-h-96 w-full object-cover"
                />
              ) : (
                <a
                  key={i}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-border/60 p-3 hover:bg-secondary/40 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {attachment.title || attachment.url}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{attachment.url}</p>
                </a>
              )
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                'gap-1.5 h-8',
                liked ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-500'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} aria-hidden="true" />
              <span className="text-xs">{localLikesCount > 0 ? localLikesCount : ''}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="gap-1.5 h-8 text-muted-foreground hover:text-primary-emphasis"
            >
              <MessageCircle className="icon-sm" aria-hidden="true" />
              <span className="text-xs">{commentsCount > 0 ? commentsCount : ''}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="gap-1.5 h-8 text-muted-foreground hover:text-primary-emphasis"
            >
              <Share2 className="icon-sm" aria-hidden="true" />
            </Button>
          </div>
          <Button aria-label="Save"
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            className={cn(
              'h-8 w-8',
              bookmarked ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground hover:text-amber-500 dark:hover:text-amber-400'
            )}
          >
            <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Post skeleton for loading
export function PostCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-full bg-secondary animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
            <div className="h-3 w-48 bg-secondary rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-secondary rounded-full animate-pulse" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full bg-secondary rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-secondary rounded animate-pulse" />
        </div>
        <div className="mt-4 pt-3 border-t border-border/40 flex gap-4">
          <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
          <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
          <div className="h-8 w-12 bg-secondary rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
