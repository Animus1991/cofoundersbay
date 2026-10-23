'use client';

import { useState, useCallback, useEffect } from 'react';
import { ReportBlockModal } from '@/components/common/ReportBlockModal';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  TrendingUp,
  Users,
  Sparkles,
  Award,
  Rocket,
  Target,
  RefreshCw,
  X,
  Flag,
  Settings,
  CalendarDays,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { PageRailSection } from '@/components/layout/PageRail';
import { RailAction, RailLink } from '@/components/layout/RailParts';
import { RailPeople } from '@/components/layout/RailPeople';
import { EmptyState } from '@/components/common/EmptyState';
import { usePageRail } from '@/components/layout/PageRailContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bilingualAria, bilingualInline } from '@/lib/i18n/format';
import { readComposedPosts } from '@/lib/feed-demo';
import { RelativeTime } from '@/components/common/RelativeTime';
import { BilingualText } from '@/components/common/BilingualText';
import { CardFoot, CardHead } from '@/components/common/CardAnatomy';
import { Button } from '@/components/ui/button';
import { WithDisabledReason } from '@/components/common/UnavailableButton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { badgeVariants } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { FeedPostComposer } from '@/components/feed/FeedPostComposer';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { cn, initialsOf } from '@/lib/utils';
import { feedEn, feedEl } from '@/lib/i18n/strings-feed';
import { isPreviewDemo } from '@/lib/preview-demo';
import { SampleDataNotice } from '@/components/common/SampleDataNotice';
import { qk } from '@/lib/query-keys';
import { choiceControl, rowOptions, settle, usePageControls, usePageList, type PageControlRunResult } from '@/lib/page-controls';
import {
  getPersonalizedFeed,
  createFeedPost,
  getFeedPreferences,
  updateFeedPreferences,
  recordFeedInteraction,
  getTrendingTopics,
  getRecommendations,
  type FeedPost,
  type FeedPreferences,
} from '@/lib/api';
import { FactLine } from '@/components/common/FactLine';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { attachDemoPhotos } from '@/lib/demo/photos';
import { useStoredUser } from '@/hooks/useStoredUser';
import { ASK } from '@/lib/page-questions';

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

const POST_TYPE_CONFIG: Record<PostType, { icon: typeof Rocket; color: string; label: string; labelEl: string }> = {
  update: { icon: Sparkles, color: 'text-primary-accessible', label: 'Update', labelEl: 'Ενημέρωση' },
  milestone: { icon: Target, color: 'text-status-success', label: 'Milestone', labelEl: 'Ορόσημο' },
  question: { icon: MessageCircle, color: 'text-status-warning', label: 'Question', labelEl: 'Ερώτηση' },
  announcement: { icon: TrendingUp, color: 'text-status-accent', label: 'Announcement', labelEl: 'Ανακοίνωση' },
  achievement: { icon: Award, color: 'text-status-accent', label: 'Achievement', labelEl: 'Επίτευγμα' },
};

const DEMO_POSTS: FeedPost[] = attachDemoPhotos([
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
      headline: 'Startup Mentor | Former product lead | 3x Founder',
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
]);

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
  // The reader's own picture beside the comment box (the demo's is Alex's).
  const me = useStoredUser();
  const sayOne = useBilingualString();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const config = POST_TYPE_CONFIG[post.type] ?? POST_TYPE_CONFIG.update;

  // Track view when component mounts
  useEffect(() => {
    onView?.();
    // Record a view once per post, not whenever the parent callback identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const initials = (post.author?.displayName ?? '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();


  // The Endorsements card: the author's mark and name, their headline under
  // it and the kind and time as a caption; the post, its tags and a foot
  // with the counts and the actions all start on the mark's left edge.
  return (
    <Card
      id={`post-${post.id}`}
      tabIndex={-1}
      className="scroll-mt-24 transition-colors hover:border-primary/20 focus:outline-none data-[linked=true]:ring-2 data-[linked=true]:ring-primary"
    >
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatarUrl} alt="" />
              <AvatarFallback className="bg-primary/10 text-primary-accessible font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          title={(
            <a href={`/profiles/${post.author?.id}`} className="transition-colors hover:text-primary-accessible">
              {post.author?.displayName}
            </a>
          )}
          subtitle={post.author?.headline || undefined}
          /* Computed in an effect, not during render: the server's "now" is
             not the browser's, and the two disagreeing is what made this page
             fail hydration on every load. */
          meta={(
            <FactLine
              items={[
                <span key="kind" className={config.color}><BilingualText en={config.label} el={config.labelEl} compact /></span>,
                <RelativeTime key="time" date={post.createdAt} />,
                post.personalizationScore ? (
                  <BilingualText key="match" en={`${Math.round(post.personalizationScore * 100)}% match`} el={`${Math.round(post.personalizationScore * 100)}% ταίριασμα`} compact />
                ) : null,
              ]}
            />
          )}
          asideStays
          aside={(
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={bilingualAria('Open post actions', 'Άνοιγμα ενεργειών δημοσίευσης')}>
                <MoreHorizontal className="icon-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* "Bookmark" and "Copy Link" were here too: the same Save and
                  Share as the buttons at the foot of this card (docs §88). */}
              <DropdownMenuItem className="text-destructive-accessible" onSelect={onReport}>
                <Flag className="icon-sm mr-2" aria-hidden="true" />
                <BilingualText en="Report" el="Αναφορά" compact />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        />
        {(post.relevanceReasons?.length ?? 0) > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium"><BilingualText en="Why you're seeing this" el="Γιατί το βλέπετε" compact />:</span> {post.relevanceReasons?.join(', ')}
          </p>
        )}

        <p className="card-body text-foreground whitespace-pre-wrap first-letter:uppercase">{post.content}</p>

        {(post.tags?.length ?? 0) > 0 && (
          <FactLine items={(post.tags ?? []).map((tag) => `#${tag}`)} />
        )}

        {/* The counts at the left of the foot, the actions at its right. */}
        <CardFoot
          meta={(
            <FactLine
              items={[
                <BilingualText key="likes" en={`${post.likes} ${post.likes === 1 ? 'like' : 'likes'}`} el={`${post.likes} μου αρέσει`} compact />,
                <BilingualText key="comments" en={`${post.comments} ${post.comments === 1 ? 'comment' : 'comments'}`} el={`${post.comments} ${post.comments === 1 ? 'σχόλιο' : 'σχόλια'}`} compact />,
                <BilingualText key="shares" en={`${post.shares} ${post.shares === 1 ? 'share' : 'shares'}`} el={`${post.shares} ${post.shares === 1 ? 'κοινοποίηση' : 'κοινοποιήσεις'}`} compact />,
              ]}
            />
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            aria-pressed={post.isLiked}
            className={cn(post.isLiked && 'text-primary-accessible')}
          >
            <Heart className={cn('icon-sm mr-1', post.isLiked && 'fill-current')} aria-hidden="true" />
            <BilingualText en="Like" el="Μου αρέσει" compact />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showComments}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="icon-sm mr-1" aria-hidden="true" />
            <BilingualText en="Comment" el="Σχόλιο" compact />
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare}>
            <Share2 className="icon-sm mr-1" aria-hidden="true" />
            <BilingualText en="Share" el="Κοινοποίηση" compact />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBookmark}
            className={cn(post.isBookmarked && 'text-primary-accessible')}
            // The name carries the word on the button ("Save"); it was
            // "Bookmark post", which a voice user saying "Save" never reached.
            aria-label={
              post.isBookmarked
                ? bilingualAria('Saved — remove from saved', 'Αποθηκευμένη — αφαίρεση από τα αποθηκευμένα')
                : bilingualAria('Save post', 'Αποθήκευση ανάρτησης')
            }
            aria-pressed={post.isBookmarked}
          >
            <Bookmark className={cn('icon-sm sm:mr-1', post.isBookmarked && 'fill-current')} aria-hidden="true" />
            <span className="hidden sm:inline"><BilingualText en="Save" el="Αποθήκευση" compact /></span>
          </Button>
        </CardFoot>

        {/* Comments Section */}
        {showComments && (
          <div className="flex gap-3 border-t border-border pt-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={me?.avatarUrl ?? undefined} alt="" />
              <AvatarFallback className="text-xs">{me?.displayName ? initialsOf(me.displayName) : 'ME'}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 gap-2">
              {/* The page passed onComment={() => {}}: Send cleared the
                  box and nothing was stored - there is no comment route
                  for feed posts. Until there is, the box says so instead
                  of swallowing what someone wrote. */}
              <Textarea
                placeholder={sayOne('Comments on feed posts are not saved yet', 'Τα σχόλια σε δημοσιεύσεις δεν αποθηκεύονται ακόμη')}
                aria-label={bilingualAria('Comment', 'Σχόλιο')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled
              />
              <WithDisabledReason reasonEn="Comments on feed posts are not saved yet" reasonEl="Τα σχόλια σε δημοσιεύσεις δεν αποθηκεύονται ακόμη">
                <Button aria-label={bilingualAria('Post comment', 'Δημοσίευση σχολίου')} size="sm" disabled>
                  <Send className="icon-sm" />
                </Button>
              </WithDisabledReason>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/*
 * The rail's own section names these two ("Trending topics", "Suggested
 * connections"), so they draw no card and no second heading of their own.
 * Neither invents rows any more: the topics were five made-up tags with
 * made-up counts whenever the API had none, and the people were three
 * invented names with invented scores, shown to every reader (docs §88).
 */
function TrendingTopics({
  topics,
  failed,
  active,
  onPick,
}: {
  topics?: Array<{ tag: string; posts: number; engagement: number; growth: number }>;
  failed: boolean;
  active: string | null;
  onPick: (tag: string) => void;
}) {
  if (!topics) {
    return failed ? (
      <p className="text-sm text-muted-foreground">
        <BilingualText en="Trending topics could not be read just now." el="Οι τάσεις δεν διαβάστηκαν αυτή τη στιγμή." wrap />
      </p>
    ) : (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }
  if (topics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        <BilingualText
          en="Nothing is trending this week. A #tag in a post starts a topic."
          el="Τίποτα δεν είναι σε τάση αυτή την εβδομάδα. Ένα #tag σε ανάρτηση ξεκινά ένα θέμα."
          wrap
        />
      </p>
    );
  }
  return (
    <ol className="space-y-0.5">
      {topics.map((topic, i) => (
        <li key={topic.tag}>
          {/* A real link (it opens in a new tab and can be copied); here it
              narrows the feed to the tag without leaving the page. */}
          <a
            href={`/feed?tag=${encodeURIComponent(topic.tag)}`}
            aria-current={active === topic.tag ? 'true' : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              onPick(topic.tag);
            }}
            className={cn(
              'group flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted/70',
              active === topic.tag && 'bg-muted',
            )}
          >
            <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium text-foreground group-hover:text-primary-accessible">#{topic.tag}</span>
                {topic.growth > 0 ? <span className="text-xs tabular-nums text-status-success">+{topic.growth}%</span> : null}
              </span>
              <span className="block text-xs text-muted-foreground">
                <BilingualText
                  en={`${topic.posts} ${topic.posts === 1 ? 'post' : 'posts'} · ${topic.engagement} ${topic.engagement === 1 ? 'interaction' : 'interactions'}`}
                  el={`${topic.posts} ${topic.posts === 1 ? 'ανάρτηση' : 'αναρτήσεις'} · ${topic.engagement} ${topic.engagement === 1 ? 'αλληλεπίδραση' : 'αλληλεπιδράσεις'}`}
                  compact
                  wrap
                />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** The best three of the reader's recommendations, from the same engine and
 * cache as Discover's "Best matches". */
function SuggestedConnections() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk('recommendations', { limit: 8 }),
    queryFn: () => getRecommendations({ limit: 8 }),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const people = [...(data?.suggestions ?? [])].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)).slice(0, 3);
  if (isLoading) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (isError && !data) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <BilingualText en="Suggestions could not be read just now." el="Οι προτάσεις δεν διαβάστηκαν αυτή τη στιγμή." wrap />
        </p>
        <RailAction icon={RefreshCw} en="Try again" el="Δοκιμάστε ξανά" onClick={() => void refetch()} />
      </div>
    );
  }
  if (people.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          <BilingualText
            en="No suggestions yet. What you are looking for, on your profile, is what matching goes on."
            el="Καμία πρόταση ακόμη. Η αντιστοίχιση βασίζεται σε ό,τι αναζητάτε, στο προφίλ σας."
            wrap
          />
        </p>
        <RailLink href="/profile/edit" icon={Target} en="Edit your profile" el="Επεξεργασία προφίλ" />
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <RailPeople people={people} />
      <RailLink href="/matches" icon={TrendingUp} en="See every match" el="Όλες οι αντιστοιχίσεις" />
    </div>
  );
}

export default function FeedPage() {
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'trending'>('all');
  const { openRailSection } = usePageRail();
  /*
   * A tag narrows the feed: /feed?tag=fundraising, which the trending
   * topics have always linked to and the page never read (docs §88). The
   * URL follows the choice so the narrowed feed can be shared.
   */
  const [tag, setTagState] = useState<string | null>(null);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tag');
    if (t) setTagState(t.trim().toLowerCase().replace(/^#/, '') || null);
  }, []);
  const setTag = useCallback((next: string | null) => {
    setTagState(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('tag', next);
    else url.searchParams.delete('tag');
    window.history.replaceState(window.history.state, '', url);
  }, []);
  const feedKey = qk('feed', 'personalized', activeTab, tag ?? '');

  // Fetch personalized feed
  // `useInfiniteQuery` was imported and never used, and "Load More" sat below a
  // fixed first page doing nothing — while the endpoint has taken an `offset`
  // and returned `hasMore` all along. This asks for the next page it advertises.
  const PAGE_SIZE = 20;
  const {
    data: feedPages,
    isLoading: feedLoading,
    isError: feedFailed,
    isFetching: feedFetching,
    refetch: refetchFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: feedKey,
    initialPageParam: 0,
    // "Following" asked for exactly what "All" asked for and showed the same
    // list; it now asks for the reader's connections' posts (docs §88).
    queryFn: ({ pageParam }) => getPersonalizedFeed({
      limit: PAGE_SIZE,
      offset: pageParam as number,
      contentTypes: activeTab === 'trending' ? undefined : ['update', 'milestone', 'question', 'announcement', 'achievement'],
      topics: tag ? [tag] : undefined,
      refresh: activeTab === 'trending',
      scope: activeTab === 'following' ? 'following' : undefined,
    }),
    retry: 1,
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
    isError: trendingFailed,
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
    // A refused change said nothing and the chip stayed as it was.
    onError: () => showError('Could not save the preferences'),
  });

  // Record interaction mutation
  const recordInteractionMutation = useMutation({
    mutationFn: recordFeedInteraction,
  });

  // The sample posts stand in for an empty feed, never for a narrowed one:
  // a tag or the Following tab with nothing in it says so.
  const narrowed = !!tag || activeTab === 'following';
  const showingSamples = !feedData?.posts?.length && isPreviewDemo() && !narrowed;
  const posts = feedData?.posts?.length
    ? feedData.posts
    : showingSamples
      ? DEMO_POSTS
      : [];

  // The API stores the post and the feed is read again; the preview demo
  // keeps it for the session (`lib/feed-demo.ts`) and says so.
  const handlePost = async (content: string, type: PostType) => {
    try {
      const { stored } = await createFeedPost({ content, type: type as FeedPost['type'] });
      if (stored) {
        await queryClient.invalidateQueries({ queryKey: qk('feed') });
        success(bilingualInline('Posted', 'Δημοσιεύτηκε'));
        return;
      }
      setComposed(readComposedPosts());
      success(
        bilingualInline('Posted', 'Δημοσιεύτηκε'),
        bilingualInline(
          'Kept for this session — this is the demo, so nothing is stored.',
          'Κρατείται για αυτή τη συνεδρία — είναι το demo, οπότε δεν αποθηκεύεται τίποτα.',
        ),
      );
    } catch {
      showError(bilingualInline('Could not post', 'Η δημοσίευση απέτυχε'));
    }
  };

  // The feed answers at once and the server catches up; the promise settles
  // with the server, so the assistant reports the like only once it is kept.
  // A failed write puts the feed back the way the server has it.
  const handleLike = async (postId: string, isCurrentlyLiked: boolean): Promise<PageControlRunResult> => {
    queryClient.setQueryData(
      feedKey,
      (old: InfiniteData<{ posts: FeedPost[]; hasMore: boolean; nextCursor?: string }, number> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    isLiked: !isCurrentlyLiked,
                    likes: isCurrentlyLiked ? p.likes - 1 : p.likes + 1
                  }
                : p
            ),
          })),
        };
      },
    );
    // The endpoint toggles: the same 'like' interaction likes and unlikes.
    const result = await settle(() => recordInteractionMutation.mutateAsync({ postId, interaction: 'like' }));
    if (result) void queryClient.invalidateQueries({ queryKey: feedKey });
    return result;
  };

  const handleBookmark = async (postId: string, isCurrentlyBookmarked: boolean): Promise<PageControlRunResult> => {
    queryClient.setQueryData(
      feedKey,
      (old: InfiniteData<{ posts: FeedPost[]; hasMore: boolean; nextCursor?: string }, number> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === postId ? { ...p, isBookmarked: !isCurrentlyBookmarked } : p
            ),
          })),
        };
    });
    // Toggles as well; the toast now waits for the server to agree.
    const result = await settle(() => recordInteractionMutation.mutateAsync({ postId, interaction: 'bookmark' }));
    if (result) {
      void queryClient.invalidateQueries({ queryKey: feedKey });
      return result;
    }
    // The button says "Save", so the toast does too.
    success(isCurrentlyBookmarked ? 'Removed from saved' : 'Post saved');
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

  // The rows on screen - `posts` above, demo posts included.
  usePageList([
    {
      id: 'posts',
      labelEn: 'Posts',
      labelEl: 'Αναρτήσεις',
      rows: feedLoading ? undefined : posts.map((p) =>
        [
          p.author?.displayName ?? 'Post',
          p.type,
          `"${p.content ?? ''}"`.slice(0, 60),
          `${p.likes ?? 0} likes${p.isLiked ? ' (liked)' : ''}${p.isBookmarked ? ' (saved)' : ''}`,
        ].join(' · '),
      ),
      sample: showingSamples,
    },
  ]);
  const byAuthor = (list: FeedPost[]) => rowOptions(list, (p) => p.id, (p) => p.author?.displayName ?? 'Post');
  usePageControls([
    choiceControl('feed_tab', 'Feed', 'Ροή', [
      { value: 'all', en: 'All', el: 'Όλα' },
      { value: 'following', en: 'Following', el: 'Ακολουθώ' },
      { value: 'trending', en: 'Trending', el: 'Τάσεις' },
    ], activeTab, (v) => setActiveTab(v as typeof activeTab)),
    { id: 'refresh', labelEn: 'Refresh the feed', labelEl: 'Ανανέωση ροής', writes: false, run: () => void refetchFeed() },
    // The trending topics' links, offered to the assistant too.
    {
      id: 'show_tag',
      labelEn: 'Show posts with a tag',
      labelEl: 'Εμφάνιση αναρτήσεων με ετικέτα',
      writes: false,
      options: rowOptions(trendingData?.topics ?? [], (t) => t.tag, (t) => `#${t.tag}`),
      run: (v) => { if (v) setTag(v); },
    },
    {
      id: 'clear_tag',
      labelEn: 'Show all posts',
      labelEl: 'Εμφάνιση όλων των αναρτήσεων',
      writes: false,
      unavailableEn: tag ? undefined : 'The feed is not narrowed to a tag.',
      unavailableEl: tag ? undefined : 'Η ροή δεν περιορίζεται σε ετικέτα.',
      run: () => setTag(null),
    },
    {
      id: 'load_more',
      labelEn: 'Load more posts',
      labelEl: 'Φόρτωση περισσότερων αναρτήσεων',
      writes: false,
      unavailableEn: hasNextPage ? undefined : 'There are no more posts to load.',
      unavailableEl: hasNextPage ? undefined : 'Δεν υπάρχουν άλλες αναρτήσεις.',
      run: () => void fetchNextPage(),
    },
    // Like and save each flip one flag on the post; the other command flips it back.
    { id: 'like_post', labelEn: 'Like post', labelEl: 'Μου αρέσει η ανάρτηση', writes: true, options: byAuthor(posts.filter((p) => !p.isLiked)), undo: (v) => ({ control: 'unlike_post', value: v }), run: (v) => (v ? handleLike(v, false) : undefined) },
    { id: 'unlike_post', labelEn: 'Unlike post', labelEl: 'Αναίρεση «μου αρέσει»', writes: true, options: byAuthor(posts.filter((p) => p.isLiked)), undo: (v) => ({ control: 'like_post', value: v }), run: (v) => (v ? handleLike(v, true) : undefined) },
    { id: 'save_post', labelEn: 'Save post', labelEl: 'Αποθήκευση ανάρτησης', writes: true, options: byAuthor(posts.filter((p) => !p.isBookmarked)), undo: (v) => ({ control: 'unsave_post', value: v }), run: (v) => (v ? handleBookmark(v, false) : undefined) },
    { id: 'unsave_post', labelEn: 'Remove post from saved', labelEl: 'Αφαίρεση από αποθηκευμένα', writes: true, options: byAuthor(posts.filter((p) => p.isBookmarked)), undo: (v) => ({ control: 'save_post', value: v }), run: (v) => (v ? handleBookmark(v, true) : undefined) },
    { id: 'share_post', labelEn: 'Copy a link to post', labelEl: 'Αντιγραφή συνδέσμου ανάρτησης', writes: false, options: byAuthor(posts), run: (v) => { if (v) handleShare(v); } },
    {
      id: 'report_author',
      labelEn: 'Report post author',
      labelEl: 'Αναφορά συντάκτη ανάρτησης',
      writes: false,
      options: rowOptions(posts, (p) => p.id, (p) => p.author?.displayName ?? 'Post'),
      run: (v) => {
        const post = posts.find((p) => p.id === v);
        if (post) setReporting({ id: post.author.id, name: post.author.displayName });
      },
    },
  ]);

  const rail: PageRailSection[] = [
    {
      id: 'trending',
      glyph: 'chart',
      labelEn: 'Trending topics',
      labelEl: 'Τάσεις',
      content: <TrendingTopics topics={trendingData?.topics} failed={trendingFailed} active={tag} onPick={setTag} />,
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
            <p id="feed-ctypes" className="text-sm font-medium mb-2 block">
              <BilingualText en={feedEn('content_types')} el={feedEl('content_types')} compact />
            </p>
            <div className="flex flex-wrap gap-1" role="group" aria-labelledby="feed-ctypes">
              {['update', 'milestone', 'question', 'announcement', 'achievement'].map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={preferences.contentTypes.includes(type)}
                  className={cn(badgeVariants({ variant: preferences.contentTypes.includes(type) ? 'default' : 'outline' }), 'border-0 shadow-none !shadow-none cursor-pointer')}
                  onClick={() => {
                    const newTypes = preferences.contentTypes.includes(type)
                      ? preferences.contentTypes.filter(t => t !== type)
                      : [...preferences.contentTypes, type];
                    handlePreferencesUpdate({ contentTypes: newTypes });
                  }}
                >
                  {/* The kind's own word, in both languages ("update" was raw). */}
                  <BilingualText en={POST_TYPE_CONFIG[type as PostType].label} el={POST_TYPE_CONFIG[type as PostType].labelEl} compact />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p id="feed-topics" className="text-sm font-medium mb-2 block">
              <BilingualText en={feedEn('topics')} el={feedEl('topics')} compact />
            </p>
            <div className="flex flex-wrap gap-1" role="group" aria-labelledby="feed-topics">
              {(preferences.topics.length > 0 ? preferences.topics : ['fundraising', 'mvp', 'hiring', 'productlaunch', 'mentorship']).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  aria-pressed={preferences.topics.includes(topic)}
                  className={cn(badgeVariants({ variant: preferences.topics.includes(topic) ? 'default' : 'outline' }), 'border-0 shadow-none !shadow-none cursor-pointer')}
                  onClick={() => {
                    const newTopics = preferences.topics.includes(topic)
                      ? preferences.topics.filter(t => t !== topic)
                      : [...preferences.topics, topic];
                    handlePreferencesUpdate({ topics: newTopics });
                  }}
                >
                  #{topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <BilingualText en="Preferences are unavailable right now." el="Οι προτιμήσεις δεν είναι διαθέσιμες αυτή τη στιγμή." compact wrap />
        </p>
      ),
    },
    {
      id: 'related',
      glyph: 'flag',
      labelEn: 'Linked pages',
      labelEl: 'Συνδεδεμένες σελίδες',
      content: (
        <div className="space-y-1">
          <RailAction icon={Sparkles} en="Open groups" el="Άνοιγμα κοινοτήτων" onClick={() => router.push('/groups')} />
          <RailAction icon={CalendarDays} en="Open events" el="Άνοιγμα εκδηλώσεων" onClick={() => router.push('/events')} />
          <RailAction icon={Users} en="Open members" el="Άνοιγμα μελών" onClick={() => router.push('/members')} />
        </div>
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
        {showingSamples && (
          <SampleDataNotice
            className="mb-6"
            surface="Feed"
            detail="Your network has not posted yet, so these posts are samples that show how the feed reads."
            askAiPrompt={ASK.feedSample}
          />
        )}
        {/* The reading column owns the feed; trending, suggested people and
            preferences live in the right rail, so below `lg` they come back as
            a sheet instead of a column the posts push off-screen. */}
        <div className="space-y-6">

            {/* Create Post */}
            <FeedPostComposer onPost={handlePost} />

            {tag && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  <BilingualText en={`Posts tagged #${tag}`} el={`Αναρτήσεις με #${tag}`} compact wrap />
                </p>
                <Button variant="ghost" size="sm" onClick={() => setTag(null)}>
                  <X className="icon-sm mr-1" aria-hidden="true" />
                  <BilingualText en="Show all posts" el="Όλες οι αναρτήσεις" compact />
                </Button>
              </div>
            )}

            {/* Posts */}
            <div className="space-y-4">
              {feedLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden shadow-sm border-border">
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
              ) : feedFailed && !feedPages && posts.length === 0 ? (
                // A failed read showed the composer and nothing under it.
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <p role="alert" className="text-sm text-muted-foreground">
                      <BilingualText en="Posts could not be read just now." el="Οι αναρτήσεις δεν διαβάστηκαν αυτή τη στιγμή." wrap />
                    </p>
                    <Button size="sm" variant="outline" onClick={() => void refetchFeed()} disabled={feedFetching}>
                      <BilingualText en="Try again" el="Δοκιμάστε ξανά" compact />
                    </Button>
                  </CardContent>
                </Card>
              ) : posts.length === 0 ? (
                tag ? (
                  <EmptyState
                    size="sm"
                    title={<BilingualText en={`No posts tagged #${tag} yet`} el={`Καμία ανάρτηση με #${tag} ακόμη`} />}
                    description={<BilingualText en={`A post with #${tag} in its text appears here.`} el={`Μια ανάρτηση με #${tag} στο κείμενό της εμφανίζεται εδώ.`} />}
                    action={(
                      <Button variant="secondary" size="sm" onClick={() => setTag(null)}>
                        <BilingualText en="Show all posts" el="Όλες οι αναρτήσεις" compact />
                      </Button>
                    )}
                  />
                ) : activeTab === 'following' ? (
                  <EmptyState
                    size="sm"
                    illustration="connection"
                    title={<BilingualText en="Nothing from your connections yet" el="Τίποτα από τις συνδέσεις σας ακόμη" />}
                    description={<BilingualText en="Posts by the people you are connected with appear here." el="Οι αναρτήσεις όσων είστε συνδεδεμένοι εμφανίζονται εδώ." />}
                    action={(
                      <Button variant="secondary" size="sm" asChild>
                        <Link href="/discover"><BilingualText en="Find people" el="Εύρεση ατόμων" compact /></Link>
                      </Button>
                    )}
                  />
                ) : (
                  <EmptyState
                    size="sm"
                    title={<BilingualText en="Nothing in your feed yet" el="Τίποτα στη ροή σας ακόμη" />}
                    description={(
                      <BilingualText
                        en="Share an update above, or connect with people and join groups to see what they post."
                        el="Μοιραστείτε μια ενημέρωση παραπάνω, ή συνδεθείτε με άτομα και μπείτε σε κοινότητες για να βλέπετε τι δημοσιεύουν."
                      />
                    )}
                    askAiPrompt={ASK.feedSample}
                    action={(
                      <Button variant="secondary" size="sm" asChild>
                        <Link href="/groups"><BilingualText en="Browse groups" el="Περιήγηση στις κοινότητες" compact /></Link>
                      </Button>
                    )}
                  />
                )
              ) : posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => void handleLike(post.id, post.isLiked)}
                  onBookmark={() => void handleBookmark(post.id, post.isBookmarked)}
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
