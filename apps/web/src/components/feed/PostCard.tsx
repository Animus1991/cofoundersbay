'use client';

import { useEffect, useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  Send,
  TrendingUp,
  Sparkles,
  Award,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CardHead, CardFoot } from '@/components/common/CardAnatomy';
import { FactLine } from '@/components/common/FactLine';
import { RelativeTime } from '@/components/common/RelativeTime';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WithDisabledReason } from '@/components/common/UnavailableButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { roleRing, roleTone } from '@/lib/role-tone';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';
import { cn, initialsOf } from '@/lib/utils';
import { useBilingualString } from '@/lib/i18n/LanguagePreferenceContext';
import { useStoredUser } from '@/hooks/useStoredUser';
import type { FeedPost } from '@/lib/api';

type PostType = FeedPost['type'];

export const POST_TYPE_CONFIG: Record<PostType, { icon: typeof Target; color: string; label: string; labelEl: string }> = {
  update: { icon: Sparkles, color: 'text-primary-accessible', label: 'Update', labelEl: 'Ενημέρωση' },
  milestone: { icon: Target, color: 'text-status-success', label: 'Milestone', labelEl: 'Ορόσημο' },
  question: { icon: MessageCircle, color: 'text-status-warning', label: 'Question', labelEl: 'Ερώτηση' },
  announcement: { icon: TrendingUp, color: 'text-status-accent', label: 'Announcement', labelEl: 'Ανακοίνωση' },
  achievement: { icon: Award, color: 'text-status-accent', label: 'Achievement', labelEl: 'Επίτευγμα' },
};

/**
 * The one post card (docs §138): the feed's card, now shared. The page owns
 * the post's state and every action; the card draws the post and asks for
 * the action.
 *
 * The anatomy is the card pattern (CardHead/CardFoot): the author's mark and
 * name, their headline under it and the kind and time as a caption; the
 * post, its tags and a foot with the counts and the actions all start on
 * the mark's left edge. `id`/`tabIndex`/`data-linked` let a permalink land
 * on the card and ring it.
 *
 * Commenting is not wired to the API yet, so the box explains itself
 * instead of swallowing what someone wrote.
 */
export function PostCard({
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

  return (
    <Card
      id={`post-${post.id}`}
      tabIndex={-1}
      className="card-interactive scroll-mt-24 transition-colors hover:border-primary/20 focus:outline-none data-[linked=true]:ring-2 data-[linked=true]:ring-primary"
    >
      <CardContent className="space-y-3">
        <CardHead
          mark={(
            /* The author's ring and tint name their role's family (B2.2). */
            <Avatar className={cn('h-10 w-10', roleRing(post.author?.role))}>
              <AvatarImage src={post.author?.avatarUrl} alt="" />
              <AvatarFallback className={cn('font-semibold', roleTone(post.author?.role))}>
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
              <DropdownMenuItem className="text-status-danger" onSelect={onReport}>
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
          {/* Each verb's own quiet tint on hover (docs §137, B2.2). */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            aria-pressed={post.isLiked}
            className={cn('rounded-full hover:bg-status-accent-bg hover:text-status-accent', post.isLiked && 'text-status-accent')}
          >
            <Heart className={cn('icon-sm mr-1', post.isLiked && 'fill-current')} aria-hidden="true" />
            <BilingualText en="Like" el="Μου αρέσει" compact />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={showComments}
            onClick={() => setShowComments(!showComments)}
            className="rounded-full hover:bg-status-info-bg hover:text-status-info"
          >
            <MessageCircle className="icon-sm mr-1" aria-hidden="true" />
            <BilingualText en="Comment" el="Σχόλιο" compact />
          </Button>
          <Button variant="ghost" size="sm" onClick={onShare} className="rounded-full hover:bg-status-neutral-bg hover:text-status-neutral">
            <Share2 className="icon-sm mr-1" aria-hidden="true" />
            <BilingualText en="Share" el="Κοινοποίηση" compact />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBookmark}
            className={cn('rounded-full hover:bg-status-warning-bg hover:text-status-warning', post.isBookmarked && 'text-status-warning')}
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
        <div className="mt-4 pt-3 border-t border-border flex gap-4">
          <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
          <div className="h-8 w-16 bg-secondary rounded animate-pulse" />
          <div className="h-8 w-12 bg-secondary rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
