'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Send, Image as ImageIcon, Link2, Smile, TrendingUp,
  Users, Sparkles, Filter, Clock, Flame, ThumbsUp,
  Award, Rocket, Target, Briefcase, GraduationCap,
  Plus, RefreshCw, ChevronDown, X, Flag, Settings,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
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
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { isPreviewDemo } from '@/lib/preview-demo';
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
  update: { icon: Sparkles, color: 'text-blue-500', label: 'Update' },
  milestone: { icon: Target, color: 'text-emerald-500', label: 'Milestone' },
  question: { icon: MessageCircle, color: 'text-amber-500', label: 'Question' },
  announcement: { icon: TrendingUp, color: 'text-purple-500', label: 'Announcement' },
  achievement: { icon: Award, color: 'text-pink-500', label: 'Achievement' },
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
                          className="gap-1"
                        >
                          <Icon className={cn('h-4 w-4', config.color)} />
                          <span className="hidden sm:inline">{config.label}</span>
                        </Button>
                      );
                    }
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Link2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
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
}: {
  post: FeedPost;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onView?: () => void;
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

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <Card className="overflow-hidden shadow-sm border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
                {post.personalizationScore && (
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {Math.round(post.personalizationScore * 100)}% match
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{post.author.headline}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
              {post.relevanceReasons && post.relevanceReasons.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Why you're seeing this:</span> {post.relevanceReasons.join(', ')}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onBookmark}>
                <Bookmark className="h-4 w-4 mr-2" />
                {post.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link2 className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
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
            className={cn(post.isLiked && 'text-primary')}
          >
            <Heart className={cn('h-4 w-4 mr-1', post.isLiked && 'fill-current')} />
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBookmark}
            className={cn(post.isBookmarked && 'text-primary')}
          >
            <Bookmark className={cn('h-4 w-4', post.isBookmarked && 'fill-current')} />
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
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <Button
                  size="sm"
                  disabled={!commentText.trim()}
                  onClick={() => {
                    onComment();
                    setCommentText('');
                  }}
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
          <Flame className="h-4 w-4 text-orange-500" />
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
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  #{topic.tag}
                </span>
                {topic.growth > 0 && (
                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
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
          <Users className="h-4 w-4 text-primary" />
          Suggested Connections
        </h3>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {suggestions.map((person) => (
            <div key={person.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {person.name.split(' ').map((n) => n[0]).join('')}
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
        <Button variant="ghost" size="sm" className="w-full mt-3">
          View All
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FeedPage() {
  const { success } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'trending'>('all');
  const [showPreferences, setShowPreferences] = useState(false);

  // Fetch personalized feed
  const {
    data: feedData,
    isLoading: feedLoading,
    error: feedError,
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ['feed', 'personalized', activeTab],
    queryFn: () => getPersonalizedFeed({
      limit: 20,
      contentTypes: activeTab === 'trending' ? undefined : ['update', 'milestone', 'question', 'announcement', 'achievement'],
      refresh: activeTab === 'trending',
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch feed preferences
  const {
    data: preferences,
    isLoading: prefsLoading,
  } = useQuery({
    queryKey: ['feed', 'preferences'],
    queryFn: getFeedPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch trending topics
  const {
    data: trendingData,
  } = useQuery({
    queryKey: ['feed', 'trending-topics'],
    queryFn: () => getTrendingTopics(10),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: updateFeedPreferences,
    onSuccess: () => {
      success('Feed preferences updated');
      queryClient.invalidateQueries({ queryKey: ['feed', 'preferences'] });
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
    // In a real implementation, this would create a new post via API
    success('Post published!');
    refetchFeed();
  };

  const handleLike = (postId: string, isCurrentlyLiked: boolean) => {
    // Record interaction
    recordInteractionMutation.mutate({
      postId,
      interaction: isCurrentlyLiked ? 'like' : 'like', // Toggle like
    });

    // Update UI optimistically
    queryClient.setQueryData(['feed', 'personalized', activeTab], (old: any) => {
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
    queryClient.setQueryData(['feed', 'personalized', activeTab], (old: any) => {
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

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feed/post/${postId}`);
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

  return (
    <AppShell
      title="Feed"
      description="Stay updated with your network"
      actions={
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="all"><BilingualText en="All" el="Όλα" compact /></TabsTrigger>
              <TabsTrigger value="following"><BilingualText en="Following" el="Ακολουθώ" compact /></TabsTrigger>
              <TabsTrigger value="trending"><BilingualText en="Trending" el="Τάσεις" compact /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreferences(!showPreferences)}
            className="gap-1"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline"><BilingualText en="Preferences" el="Προτιμήσεις" compact /></span>
          </Button>
        </div>
      }
    >
      <div className="pb-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main Feed */}
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
                />
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Load More
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <TrendingTopics topics={trendingData?.topics} />
            <SuggestedConnections />
            
            {/* Feed Preferences */}
            {showPreferences && preferences && (
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Feed Preferences
                  </h3>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Content Types</label>
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
                      <label className="text-sm font-medium mb-2 block">Topics of Interest</label>
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
