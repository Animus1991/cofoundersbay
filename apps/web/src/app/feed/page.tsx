'use client';

import { useState, useCallback, useEffect } from 'react';
import { ReportBlockModal } from '@/components/common/ReportBlockModal';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Send, Image as ImageIcon, Link2, Smile, TrendingUp,
  Users, Sparkles, Filter, Clock, Flame, ThumbsUp,
  Award, Rocket, Target, Briefcase, GraduationCap,
  Plus, RefreshCw, ChevronDown, X, Flag, Settings,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { usePageRail } from '@/components/layout/PageRailContext';
import Link from 'next/link';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { addComposedPost, readComposedPosts } from '@/lib/feed-demo';
import { RelativeTime } from '@/components/common/RelativeTime';
import { BilingualText } from '@/components/common/BilingualText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { cn, initialsOf } from '@/lib/utils';
import { feedEn, feedEl } from '@/lib/i18n/strings-feed';
import { isPreviewDemo } from '@/lib/preview-demo';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { qk } from '@/lib/query-keys';
import {
  getPersonalizedFeed,
  getFeedPreferences,
  updateFeedPreferences,
  recordFeedInteraction,
  getTrendingTopics,
  type FeedPost,
  type FeedPreferences,
} from '@/lib/api';

type PostType = 'update' | 'milestone' | 'question' | 'announcement' | 'achievement';

type FeedComment = {
  id: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
};

const POST_TYPE_CONFIG: Record<PostType, { icon: typeof Rocket; color: string; label: string }> = {
  update: { icon: Sparkles, color: 'text-status-info', label: 'Update' },
  milestone: { icon: Target, color: 'text-status-success', label: 'Milestone' },
  question: { icon: MessageCircle, color: 'text-status-warning', label: 'Question' },
  announcement: { icon: TrendingUp, color: 'text-status-accent', label: 'Announcement' },
  achievement: { icon: Award, color: 'text-status-accent', label: 'Achievement' },
};

const DEMO_POSTS: FeedPost[] = [
  {
    id: '1',
    author: {
      id: 'u1',
      displayName: 'Elena Papadopoulos',
      avatarUrl: undefined,
      headline: 'Founder & CEO at TechStart',
      role: 'founder',
    },
    type: 'milestone',
    content: '🎉 Excited to announce we just closed our pre-seed round! €250K from amazing angels who believe in our vision. Next stop: building the MVP and getting our first 100 users. Thank you to everyone who supported us on this journey!',
    likes: 47,
    comments: 12,
    shares: 5,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-03-26T10:30:00Z',
    tags: ['fundraising', 'preseed', 'startup'],
  },
  {
    id: '2',
    author: {
      id: 'u2',
      displayName: 'Marcus Chen',
      avatarUrl: undefined,
      headline: 'Technical Co-founder | Full-stack Developer',
      role: 'cofounder',
    },
    type: 'question',
    content: 'Fellow founders: What\'s your go-to stack for building MVPs in 2026? We\'re debating between Next.js + Supabase vs. Remix + PlanetScale. Would love to hear your experiences!',
    likes: 23,
    comments: 31,
    shares: 2,
    isLiked: true,
    isBookmarked: true,
    createdAt: '2026-03-26T08:15:00Z',
    tags: ['tech', 'mvp', 'webdev'],
  },
  {
    id: '3',
    author: {
      id: 'u3',
      displayName: 'Dr. Sarah Kim',
      avatarUrl: undefined,
      headline: 'Startup Mentor | Ex-Google | 3x Founder',
      role: 'mentor',
    },
    type: 'update',
    content: 'Just wrapped up an amazing mentoring session with @TechStart team. Their pivot strategy is solid and I\'m confident they\'ll nail product-market fit. Remember: the best founders aren\'t afraid to change direction when the data tells them to.',
    likes: 89,
    comments: 7,
    shares: 15,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-03-25T16:45:00Z',
  },
  {
    id: '4',
    author: {
      id: 'u4',
      displayName: 'CoFounderBay',
      avatarUrl: undefined,
      headline: 'Official Platform Account',
      role: 'admin',
    },
    type: 'announcement',
    content: '📢 New Feature Alert: Introducing Profile Comparison! Now you can compare up to 4 profiles side-by-side to find your perfect co-founder match. Check it out in the Matches section.',
    likes: 156,
    comments: 24,
    shares: 42,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-03-25T09:00:00Z',
    tags: ['feature', 'update', 'matching'],
  },
  {
    id: '5',
    author: {
      id: 'u5',
      displayName: 'Alex Dimitriou',
      avatarUrl: undefined,
      headline: 'Angel Investor | Fintech Focus',
      role: 'investor',
    },
    type: 'achievement',
    content: '🏆 Proud to share that our portfolio company @PayFlow just hit 10,000 active users! From a pitch deck to a thriving product in 8 months. This is why I love early-stage investing.',
    likes: 234,
    comments: 18,
    shares: 28,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2026-03-24T14:20:00Z',
    tags: ['portfolio', 'fintech', 'growth'],
  },
];

function CreatePostCard({ onPost }: { onPost: (content: string, type: PostType) => void }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('update');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onPost(content, postType);
    setContent('');
    setIsExpanded(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Share an update, ask a question, or celebrate a milestone..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className={cn(
                'resize-none border-0 p-0 focus-visible:ring-0 bg-transparent',
                isExpanded ? 'min-h-[100px]' : 'min-h-[40px]'
              )}
            />

            {isExpanded && (
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex gap-2">
                  {(Object.entries(POST_TYPE_CONFIG) as [PostType, typeof POST_TYPE_CONFIG.update][]).map(
                    ([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <Button
                          key={type}
                          variant={postType === type ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setPostType(type)}
                          aria-label={config.label}
                          aria-pressed={postType === type}
                          className="gap-1"
                        >
                          <Icon className={cn('icon-sm', config.color)} aria-hidden="true" />
                          <span className="hidden sm:inline">{config.label}</span>
                        </Button>
                      );
                    }
                  )}
                </div>
                <div className="flex gap-2">
                  {/* An image and a link need somewhere to upload to, and the
                      feed has no server yet. Disabled and labelled, rather
                      than looking available and doing nothing. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    aria-label={bilingualAria('Attach an image — not available yet', 'Επισύναψη εικόνας — μη διαθέσιμο ακόμη')}
                    title={bilingualAria('Attach an image — not available yet', 'Επισύναψη εικόνας — μη διαθέσιμο ακόμη')}
                  >
                    <ImageIcon className="icon-sm" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    aria-label={bilingualAria('Attach a link — not available yet', 'Επισύναψη συνδέσμου — μη διαθέσιμο ακόμη')}
                    title={bilingualAria('Attach a link — not available yet', 'Επισύναψη συνδέσμου — μη διαθέσιμο ακόμη')}
                  >
                    <Link2 className="icon-sm" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                  >
                    <Send className="icon-sm mr-1" />
                    Post
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({
  post,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onView,
  onReport,
}: {
  post: FeedPost;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onView?: () => void;
  /** Opens the report dialog for the post's author. */
  onReport: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const config = POST_TYPE_CONFIG[post.type];
  const TypeIcon = config.icon;

  // Track view when component mounts
  useEffect(() => {
    onView?.();
    // Record a view once per post, not whenever the parent callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const initials = post.author.displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();


  return (
    <Card
      id={`post-${post.id}`}
      tabIndex={-1}
      className="overflow-hidden shadow-sm border-border/50 hover:shadow-md transition-shadow scroll-mt-24 focus:outline-none data-[linked=true]:ring-2 data-[linked=true]:ring-primary"
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <a
                  href={`/profiles/${post.author.id}`}
                  className="font-semibold text-foreground hover:underline"
                >
                  {post.author.displayName}
                </a>
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  <TypeIcon className="icon-sm mr-1" />
                  {config.label}
                </Badge>
                {post.personalizationScore && (
                  <Badge variant="secondary" className="text-xs bg-status-info-bg text-status-info border-status-info-border">
                    <Sparkles className="icon-sm mr-1" />
                    {Math.round(post.personalizationScore * 100)}% match
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{post.author.headline}</p>
              {/* Computed in an effect, not during render: the server's
                  "now" is not the browser's, and the two disagreeing is
                  what made this page fail hydration on every load. */}
              <p className="text-xs text-muted-foreground mt-0.5">
                <RelativeTime date={post.createdAt} />
              </p>
              {post.relevanceReasons && post.relevanceReasons.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Why you're seeing this:</span> {post.relevanceReasons.join(', ')}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={bilingualAria('Open post actions', 'Άνοιγμα ενεργειών δημοσίευσης')}>
                <MoreHorizontal className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onBookmark}>
                <Bookmark className="icon-sm mr-2" />
                {post.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
              </DropdownMenuItem>
              {/* Copy Link and Report had no handler. */}
              <DropdownMenuItem onSelect={onShare}>
                <Link2 className="icon-sm mr-2" aria-hidden="true" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive-accessible" onSelect={onReport}>
                <Flag className="icon-sm mr-2" aria-hidden="true" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t text-sm text-muted-foreground">
          <span>{post.likes} likes</span>
          <span>{post.comments} comments</span>
          <span>{post.shares} shares</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={cn(post.isLiked && 'text-primary-accessible')}
          >
            <Heart className={cn('icon-sm mr-1', post.isLiked && 'fill-current')} />
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="icon-sm mr-1" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="icon-sm mr-1" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBookmark}
            className={cn(post.isBookmarked && 'text-primary-accessible')}
            aria-label={
              post.isBookmarked
                ? bilingualAria('Remove bookmark', 'Αφαίρεση σελιδοδείκτη')
                : bilingualAria('Bookmark post', 'Σελιδοδείκτης δημοσίευσης')
            }
            aria-pressed={post.isBookmarked}
          >
            <Bookmark className={cn('icon-sm', post.isBookmarked && 'fill-current')} aria-hidden="true" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">ME</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                {/* The page passed onComment={() => {}}: Send cleared the
                    box and nothing was stored - there is no comment route
                    for feed posts. Until there is, the box says so instead
                    of swallowing what someone wrote. */}
                <Textarea
                  placeholder={bilingualInline('Comments on feed posts are not saved yet', 'Τα σχόλια σε δημοσιεύσεις δεν αποθηκεύονται ακόμη')}
                  aria-label={bilingualAria('Comment', 'Σχόλιο')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] resize-none"
                  disabled
                />
                <Button aria-label={bilingualAria('Post comment', 'Δημοσίευση σχολίου')}
                  size="sm"
                  disabled
                  onClick={() => {
                    onComment();
                    setCommentText('');
                  }}
                >
                  <Send className="icon-sm" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrendingTopics({ topics }: { topics?: Array<{ tag: string; posts: number; engagement: number; growth: number }> }) {
  const defaultTopics = [
    { tag: 'fundraising', posts: 234, engagement: 89, growth: 12 },
    { tag: 'mvp', posts: 189, engagement: 76, growth: 8 },
    { tag: 'hiring', posts: 156, engagement: 65, growth: -2 },
    { tag: 'productlaunch', posts: 142, engagement: 82, growth: 15 },
    { tag: 'mentorship', posts: 98, engagement: 71, growth: 5 },
  ];

  const topicsToShow = topics || defaultTopics;

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2">
          <Flame className="icon-sm text-orange-500" />
          Trending Topics
        </h3>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {topicsToShow.map((topic, i) => (
            <a
              key={topic.tag}
              href={`/feed?tag=${topic.tag}`}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-4">{i + 1}</span>
                <span className="font-medium text-foreground group-hover:text-primary-accessible transition-colors">
                  #{topic.tag}
                </span>
                {topic.growth > 0 && (
                  <Badge variant="secondary" className="text-xs bg-status-success-bg text-status-success border-green-200">
                    +{topic.growth}%
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">{topic.posts} posts</span>
                <div className="text-xs text-muted-foreground">{topic.engagement} engagement</div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestedConnections() {
  const suggestions = [
    { id: '1', name: 'Anna Kowalski', role: 'UX Designer', match: 85 },
    { id: '2', name: 'James Wilson', role: 'Backend Developer', match: 78 },
    { id: '3', name: 'Maria Santos', role: 'Growth Marketer', match: 72 },
  ];

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="pb-3 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="icon-sm text-primary-accessible" />
          Suggested Connections
        </h3>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {suggestions.map((person) => (
            <div key={person.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs bg-primary/10 text-primary-accessible">
                  {initialsOf(person.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{person.name}</p>
                <p className="text-xs text-muted-foreground truncate">{person.role}</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {person.match}%
              </Badge>
            </div>
          ))}
        </div>
        <Button asChild variant="ghost" size="sm" className="w-full mt-3">
          <Link href="/discover">
            <BilingualText en="View All" el="Προβολή όλων" compact />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FeedPage() {
  const { success } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'trending'>('all');
  const { openRailSection } = usePageRail();

  // Fetch personalized feed
  // `useInfiniteQuery` was imported and never used, and "Load More" sat below a
  // fixed first page doing nothing — while the endpoint has taken an `offset`
  // and returned `hasMore` all along. This asks for the next page it advertises.
  const PAGE_SIZE = 20;
  const {
    data: feedPages,
    isLoading: feedLoading,
    error: feedError,
    refetch: refetchFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: qk('feed', 'personalized', activeTab),
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getPersonalizedFeed({
      limit: PAGE_SIZE,
      offset: pageParam as number,
      contentTypes: activeTab === 'trending' ? undefined : ['update', 'milestone', 'question', 'announcement', 'achievement'],
      refresh: activeTab === 'trending',
    }),
    getNextPageParam: (last, all) =>
      last?.hasMore ? all.reduce((n, page) => n + (page?.posts?.length ?? 0), 0) : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Whatever the reader composed this session leads; the feed follows.
  const [composed, setComposed] = useState<FeedPost[]>([]);
  useEffect(() => {
    setComposed(readComposedPosts());
  }, []);

  const feedData = feedPages
    ? { posts: [...composed, ...feedPages.pages.flatMap((page) => page?.posts ?? [])] }
    : composed.length
      ? { posts: composed }
      : undefined;

  // Fetch feed preferences
  const {
    data: preferences,
    isLoading: prefsLoading,
  } = useQuery({
    queryKey: qk('feed', 'preferences'),
    queryFn: getFeedPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch trending topics
  const {
    data: trendingData,
  } = useQuery({
    queryKey: qk('feed', 'trending-topics'),
    queryFn: () => getTrendingTopics(10),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: updateFeedPreferences,
    onSuccess: () => {
      success('Feed preferences updated');
      queryClient.invalidateQueries({ queryKey: qk('feed', 'preferences') });
      refetchFeed(); // Refresh feed with new preferences
    },
  });

  // Record interaction mutation
  const recordInteractionMutation = useMutation({
    mutationFn: recordFeedInteraction,
  });

  const posts = feedData?.posts?.length
    ? feedData.posts
    : isPreviewDemo()
      ? DEMO_POSTS
      : [];

  const handlePost = (content: string, type: PostType) => {
    // There is no feed module in the API — `/api/feed/*` is served by the
    // browser's demo shim alone — so this used to toast "Post published!" over
    // a post that went nowhere. It now goes somewhere the reader can see, for
    // the session, the way the fundraising and readiness demos already work.
    setComposed(addComposedPost({
      content,
      type: type as FeedPost['type'],
      author: {
        id: 'me',
        displayName: 'You',
        headline: undefined,
      },
    }));
    success(
      bilingualInline('Posted', 'Δημοσιεύτηκε'),
      bilingualInline(
        'Kept for this session — the feed has no server to store it yet.',
        'Κρατείται για αυτή τη συνεδρία — το feed δεν έχει ακόμη διακομιστή να το αποθηκεύσει.',
      ),
    );
  };

  const handleLike = (postId: string, isCurrentlyLiked: boolean) => {
    // Record interaction
    recordInteractionMutation.mutate({
      postId,
      interaction: isCurrentlyLiked ? 'like' : 'like', // Toggle like
    });

    // Update UI optimistically
    queryClient.setQueryData(qk('feed', 'personalized', activeTab), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        posts: old.posts.map((p: FeedPost) =>
          p.id === postId
            ? { 
                ...p, 
                isLiked: !isCurrentlyLiked, 
                likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1 
              }
            : p
        ),
      };
    });
  };

  const handleBookmark = (postId: string, isCurrentlyBookmarked: boolean) => {
    // Record interaction
    recordInteractionMutation.mutate({
      postId,
      interaction: isCurrentlyBookmarked ? 'bookmark' : 'bookmark',
    });

    // Update UI optimistically
    queryClient.setQueryData(qk('feed', 'personalized', activeTab), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        posts: old.posts.map((p: FeedPost) =>
          p.id === postId ? { ...p, isBookmarked: !isCurrentlyBookmarked } : p
        ),
      };
    });

    success('Bookmark updated');
  };

  const [reporting, setReporting] = useState<{ id: string; name: string } | null>(null);

  // A shared link is /feed?post=<id>: bring that post into view and mark it,
  // once it is in the list.
  const [linkedPost, setLinkedPost] = useState<string | null>(null);
  useEffect(() => {
    setLinkedPost(new URLSearchParams(window.location.search).get('post'));
  }, []);
  useEffect(() => {
    if (!linkedPost) return;
    const el = document.getElementById(`post-${linkedPost}`);
    if (!el) return;
    el.setAttribute('data-linked', 'true');
    el.scrollIntoView({ block: 'start' });
    el.focus({ preventScroll: true });
  });

  const handleShare = (postId: string) => {
    // Was /feed/post/:id, which does not exist. The feed scrolls to ?post=.
    navigator.clipboard.writeText(`${window.location.origin}/feed?post=${encodeURIComponent(postId)}`);
    success('Link copied to clipboard!');
    
    // Record interaction
    recordInteractionMutation.mutate({
      postId,
      interaction: 'share',
    });
  };

  const handlePostView = (postId: string) => {
    // Record view interaction
    recordInteractionMutation.mutate({
      postId,
      interaction: 'view',
    });
  };

  const handlePreferencesUpdate = (newPrefs: Partial<FeedPreferences>) => {
    updatePrefsMutation.mutate(newPrefs);
  };

  const rail: PageRailSection[] = [
    {
      id: 'trending',
      glyph: 'chart',
      labelEn: 'Trending topics',
      labelEl: 'Τάσεις',
      content: <TrendingTopics topics={trendingData?.topics} />,
    },
    {
      id: 'suggested',
      glyph: 'people',
      labelEn: 'Suggested connections',
      labelEl: 'Προτάσεις συνδέσεων',
      content: <SuggestedConnections />,
    },
    {
      id: 'preferences',
      glyph: 'sliders',
      labelEn: 'Feed preferences',
      labelEl: 'Προτιμήσεις ροής',
      content: preferences ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              <BilingualText en={feedEn('content_types')} el={feedEl('content_types')} compact />
            </label>
            <div className="flex flex-wrap gap-1">
              {['update', 'milestone', 'question', 'announcement', 'achievement'].map((type) => (
                <Badge
                  key={type}
                  variant={preferences.contentTypes.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const newTypes = preferences.contentTypes.includes(type)
                      ? preferences.contentTypes.filter(t => t !== type)
                      : [...preferences.contentTypes, type];
                    handlePreferencesUpdate({ contentTypes: newTypes });
                  }}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              <BilingualText en={feedEn('topics')} el={feedEl('topics')} compact />
            </label>
            <div className="flex flex-wrap gap-1">
              {(preferences.topics.length > 0 ? preferences.topics : ['fundraising', 'mvp', 'hiring', 'productlaunch', 'mentorship']).map((topic) => (
                <Badge
                  key={topic}
                  variant={preferences.topics.includes(topic) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const newTopics = preferences.topics.includes(topic)
                      ? preferences.topics.filter(t => t !== topic)
                      : [...preferences.topics, topic];
                    handlePreferencesUpdate({ topics: newTopics });
                  }}
                >
                  #{topic}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <BilingualText en="Preferences are unavailable right now." el="Οι προτιμήσεις δεν είναι διαθέσιμες αυτή τη στιγμή." compact />
        </p>
      ),
    },
  ];

  return (
    <AppShell
      showHelp
      rail={rail}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="all"><BilingualText en="All" el="Όλα" compact /></TabsTrigger>
              <TabsTrigger value="following"><BilingualText en="Following" el="Ακολουθώ" compact /></TabsTrigger>
              <TabsTrigger value="trending"><BilingualText en="Trending" el="Τάσεις" compact /></TabsTrigger>
            </TabsList>
          </Tabs>
          {/* The label is `hidden sm:inline`, so below 640px this button had
              no accessible name — named on desktop, anonymous on a phone,
              which is why mobile /feed failed button-name (critical). A
              responsive class can hide text from the screen; it must not be
              the only thing naming the control. */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openRailSection('preferences')}
            aria-label={bilingualAria('Preferences', 'Προτιμήσεις')}
            className="gap-1"
          >
            <Settings className="icon-sm" aria-hidden="true" />
            <span className="hidden sm:inline"><BilingualText en="Preferences" el="Προτιμήσεις" compact /></span>
          </Button>
        </div>
      }
    >
      <div className="pb-10">
        {isPreviewDemo() && (!feedData?.posts?.length) && (
          <SampleDataNotice
            className="mb-6"
            surface="Feed"
            detail="There is no live Feed module yet. These posts are sample network activity so you can review the layout."
            askAiPrompt="The feed is showing sample posts. What should I do next on Discover, Matches, or Messages instead?"
          />
        )}
        {/* The reading column owns the feed; trending, suggested people and
            preferences live in the right rail, so below `lg` they come back as
            a sheet instead of a column the posts push off-screen. */}
        <div className="space-y-6">

            {/* Create Post */}
            <CreatePostCard onPost={handlePost} />

            {/* Posts */}
            <div className="space-y-4">
              {feedLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden shadow-sm border-border/50">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <Skeleton className="h-20 w-full mb-3" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id, post.isLiked)}
                  onBookmark={() => handleBookmark(post.id, post.isBookmarked)}
                  onComment={() => {}}
                  onShare={() => handleShare(post.id)}
                  onView={() => handlePostView(post.id)}
                  onReport={() => setReporting({ id: post.author.id, name: post.author.displayName })}
                />
              ))}
            </div>

            {/* Load More — shown only when the endpoint says there is more,
                so it never promises a page that does not exist. */}
            {hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  <RefreshCw className={cn('icon-sm mr-2', isFetchingNextPage && 'animate-spin')} />
                  <BilingualText
                    en={isFetchingNextPage ? 'Loading…' : 'Load More'}
                    el={isFetchingNextPage ? 'Φόρτωση…' : 'Περισσότερα'}
                    compact
                  />
                </Button>
              </div>
            )}
        </div>
      </div>
      {reporting && (
        <ReportBlockModal
          open
          onOpenChange={(open) => { if (!open) setReporting(null); }}
          userId={reporting.id}
          userName={reporting.name}
          mode="report"
        />
      )}
    </AppShell>
  );
}
