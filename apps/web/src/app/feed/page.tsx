'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  Send, Image as ImageIcon, Link2, Smile, TrendingUp,
  Users, Sparkles, Filter, Clock, Flame, ThumbsUp,
  Award, Rocket, Target, Briefcase, GraduationCap,
  Plus, RefreshCw, ChevronDown, X, Flag,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
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

type PostType = 'update' | 'milestone' | 'question' | 'announcement' | 'achievement';

type FeedPost = {
  id: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    headline?: string;
    role?: string;
  };
  type: PostType;
  content: string;
  images?: string[];
  link?: { url: string; title: string; thumbnail?: string };
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  tags?: string[];
};

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
}: {
  post: FeedPost;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const config = POST_TYPE_CONFIG[post.type];
  const TypeIcon = config.icon;

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
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
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
              </div>
              <p className="text-sm text-muted-foreground">{post.author.headline}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
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

function TrendingTopics() {
  const topics = [
    { tag: 'fundraising', posts: 234 },
    { tag: 'mvp', posts: 189 },
    { tag: 'hiring', posts: 156 },
    { tag: 'productlaunch', posts: 142 },
    { tag: 'mentorship', posts: 98 },
  ];

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
          {topics.map((topic, i) => (
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
              </div>
              <span className="text-xs text-muted-foreground">{topic.posts} posts</span>
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
  const [posts, setPosts] = useState<FeedPost[]>(DEMO_POSTS);
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'trending'>('all');

  const handlePost = (content: string, type: PostType) => {
    const newPost: FeedPost = {
      id: `new-${Date.now()}`,
      author: {
        id: 'me',
        displayName: 'You',
        headline: 'Founder',
        role: 'founder',
      },
      type,
      content,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
    };
    setPosts([newPost, ...posts]);
    success('Post published!');
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      )
    );
    success('Bookmark updated');
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/feed/post/${postId}`);
    success('Link copied to clipboard!');
  };

  return (
    <AppShell
      title="Feed"
      description="Stay updated with your network"
      actions={
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
        </Tabs>
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
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                  onComment={() => {}}
                  onShare={() => handleShare(post.id)}
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
          <div className="space-y-6 hidden lg:block sticky top-6 self-start">
            <TrendingTopics />
            <SuggestedConnections />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
