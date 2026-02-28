'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Lightbulb,
  Flame,
  Trophy,
  Send,
  Image as ImageIcon,
  Video,
  FileText,
  ExternalLink,
  TrendingUp,
  Users,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ReactionType = 'like' | 'love' | 'insightful' | 'celebrate' | 'support';

interface Reaction {
  type: ReactionType;
  count: number;
  userReacted: boolean;
}

interface Comment {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  content: string;
  createdAt: Date;
  likes: number;
  userLiked: boolean;
}

interface ActivityPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
    headline: string;
  };
  content: string;
  media?: {
    type: 'image' | 'video' | 'link' | 'document';
    url: string;
    thumbnail?: string;
    title?: string;
    description?: string;
  };
  reactions: Reaction[];
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  isBookmarked: boolean;
  tags?: string[];
}

const REACTION_ICONS: Record<ReactionType, { icon: typeof Heart; label: string; color: string }> = {
  like: { icon: ThumbsUp, label: 'Like', color: 'text-blue-500' },
  love: { icon: Heart, label: 'Love', color: 'text-red-500' },
  insightful: { icon: Lightbulb, label: 'Insightful', color: 'text-amber-500' },
  celebrate: { icon: Trophy, label: 'Celebrate', color: 'text-purple-500' },
  support: { icon: Flame, label: 'Support', color: 'text-orange-500' },
};

const DEMO_POSTS: ActivityPost[] = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'Sarah Chen',
      avatar: null,
      role: 'Founder',
      headline: 'Building the future of AI-powered education',
    },
    content: 'Excited to announce that we just closed our seed round! 🎉 Huge thanks to our investors and everyone who believed in our vision. This is just the beginning. #startup #funding #AI',
    reactions: [
      { type: 'celebrate', count: 24, userReacted: false },
      { type: 'like', count: 156, userReacted: true },
      { type: 'love', count: 45, userReacted: false },
    ],
    commentCount: 23,
    shareCount: 12,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isBookmarked: false,
    tags: ['startup', 'funding', 'AI'],
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'Alex Kumar',
      avatar: null,
      role: 'Investor',
      headline: 'Angel Investor | 3x Founder | Helping startups scale',
    },
    content: 'Looking for B2B SaaS founders in the early stage. If you\'re building something interesting in the enterprise space, let\'s connect!',
    media: {
      type: 'link',
      url: 'https://example.com',
      thumbnail: undefined,
      title: 'What I Look for in Early-Stage Startups',
      description: 'A comprehensive guide to my investment thesis and what makes a great founding team.',
    },
    reactions: [
      { type: 'like', count: 89, userReacted: false },
      { type: 'insightful', count: 34, userReacted: false },
    ],
    commentCount: 15,
    shareCount: 8,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isBookmarked: true,
    tags: ['investing', 'B2B', 'SaaS'],
  },
];

function ReactionButton({
  reaction,
  onReact,
}: {
  reaction: Reaction;
  onReact: (type: ReactionType) => void;
}) {
  const config = REACTION_ICONS[reaction.type];
  const Icon = config.icon;

  return (
    <button
      onClick={() => onReact(reaction.type)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        reaction.userReacted
          ? 'bg-primary/20 text-primary'
          : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className={cn('h-4 w-4', reaction.userReacted && config.color)} />
      {reaction.count > 0 && <span>{reaction.count}</span>}
    </button>
  );
}

function ActivityPostCard({ post }: { post: ActivityPost }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(false);

  const totalReactions = post.reactions.reduce((sum, r) => sum + r.count, 0);
  const userReaction = post.reactions.find((r) => r.userReacted);

  const handleReact = (type: ReactionType) => {
    console.log('React:', type, post.id);
  };

  const handleComment = () => {
    console.log('Comment:', commentText, post.id);
    setCommentText('');
  };

  const handleShare = () => {
    console.log('Share:', post.id);
  };

  const handleBookmark = () => {
    console.log('Bookmark:', post.id);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  return (
    <Card className="card-interactive">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href={`/profiles/${post.author.id}`}>
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={post.author.avatar ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                {post.author.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/profiles/${post.author.id}`}
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              {post.author.name}
            </Link>
            <Badge variant="secondary" className="ml-2 text-xs">
              {post.author.role}
            </Badge>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {post.author.headline}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save post</DropdownMenuItem>
              <DropdownMenuItem>Hide post</DropdownMenuItem>
              <DropdownMenuItem>Report post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Media */}
          {post.media && post.media.type === 'link' && (
            <a
              href={post.media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border/60 p-4 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                    {post.media.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {post.media.description}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </a>
          )}
        </div>

        {/* Reactions Summary */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <div className="flex -space-x-1">
              {post.reactions
                .filter((r) => r.count > 0)
                .slice(0, 3)
                .map((r) => {
                  const Icon = REACTION_ICONS[r.type].icon;
                  return (
                    <div
                      key={r.type}
                      className={cn(
                        'h-5 w-5 rounded-full bg-background border border-border/60 flex items-center justify-center',
                        REACTION_ICONS[r.type].color
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  );
                })}
            </div>
            <span>{totalReactions} reactions</span>
            <span>•</span>
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {post.commentCount} comments
            </button>
            <span>•</span>
            <span>{post.shareCount} shares</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-border/40">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReactions(!showReactions)}
              className={cn(
                'gap-2',
                userReaction && 'text-primary'
              )}
            >
              {userReaction ? (
                <>
                  {(() => {
                    const Icon = REACTION_ICONS[userReaction.type].icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  {REACTION_ICONS[userReaction.type].label}
                </>
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4" />
                  Like
                </>
              )}
            </Button>

            {showReactions && (
              <div className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-background border border-border/60 rounded-lg shadow-lg z-10">
                {Object.entries(REACTION_ICONS).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        handleReact(type as ReactionType);
                        setShowReactions(false);
                      }}
                      className="p-2 hover:bg-secondary/60 rounded-lg transition-colors group"
                      title={config.label}
                    >
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </Button>

          <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={cn('gap-2 ml-auto', post.isBookmarked && 'text-primary')}
          >
            <Bookmark className={cn('h-4 w-4', post.isBookmarked && 'fill-current')} />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  You
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'trending'>('all');

  return (
    <AppShell
      title="Activity Feed"
      description="Stay updated with the latest from your network"
    >
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="gap-2">
            <Sparkles className="h-4 w-4" />
            All Posts
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <Users className="h-4 w-4" />
            Following
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {DEMO_POSTS.map((post) => (
            <ActivityPostCard key={post.id} post={post} />
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
