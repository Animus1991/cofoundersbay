'use client';

import { useState, useRef, useEffect } from 'react';
import { errorMessage } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Users, Globe, Lock, MessageCircle, Send, Loader2,
  MoreHorizontal, Trash2, Pin, Heart, ThumbsUp, Smile, RefreshCw,
  Settings, UserPlus, LogOut, CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  getGroup,
  joinGroup,
  leaveGroup,
  listGroupPosts,
  createGroupPost,
  deleteGroupPost,
  reactToGroupPost,
  listGroupComments,
  createGroupComment,
  type GroupPost,
  type GroupComment,
} from '@/lib/api';

const REACTIONS = ['👍', '❤️', '🔥', '🎉', '💡'];

function PostCard({
  post,
  groupId,
  isMember,
  currentUserId,
  onDelete,
  onReact,
}: {
  post: GroupPost;
  groupId: string;
  isMember: boolean;
  currentUserId: string | null;
  onDelete: (postId: string) => void;
  onReact: (postId: string, emoji: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const { error: toastError } = useToast();

  const commentsQuery = useQuery({
    queryKey: ['group-comments', post.id],
    queryFn: () => listGroupComments(groupId, post.id, { limit: 20 }),
    enabled: showComments,
    staleTime: 30_000,
  });

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await createGroupComment(groupId, post.id, newComment.trim());
      setNewComment('');
      commentsQuery.refetch();
    } catch (e: unknown) {
      toastError('Error', errorMessage(e, 'Failed to add comment'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const isOwn = currentUserId && post.author.id === currentUserId;

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-3 backdrop-blur">
      {post.isPinned && (
        <div className="flex items-center gap-1.5 text-xs text-primary-emphasis font-medium">
          <Pin className="icon-2xs" aria-hidden="true" />
          Pinned post
        </div>
      )}

      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={post.author.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">{post.author.displayName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-semibold">{post.author.displayName}</span>
              <span className="ml-2 text-xs text-muted-foreground">{formatRelativeTime(post.createdAt)}</span>
            </div>
            {isOwn && (
              <button
                onClick={() => onDelete(post.id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive-emphasis transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>
      </div>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <div className={cn('grid gap-2', post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
          {post.mediaUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="rounded-lg object-cover max-h-64 w-full" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          ))}
        </div>
      )}

      {/* Reactions & stats row */}
      <div className="flex items-center gap-3 pt-1 border-t border-border/30">
        <div className="relative">
          <button
            onClick={() => setShowReactions((p) => !p)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
              post.myReaction
                ? 'bg-primary/15 text-primary-emphasis'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )}
          >
            {post.myReaction ?? <Heart className="h-3.5 w-3.5" aria-hidden="true" />}
            {post.reactionCount > 0 && <span>{post.reactionCount}</span>}
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl z-10">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(post.id, emoji);
                    setShowReactions(false);
                  }}
                  className="rounded-lg p-1.5 text-base hover:bg-secondary/60 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments((p) => !p)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
          {showComments ? 'Hide' : 'Comment'}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-3 pt-1">
          {commentsQuery.isLoading && (
            <div className="flex justify-center py-4"><Loader2 className="icon-md animate-spin text-primary-emphasis/50" aria-hidden="true" /></div>
          )}
          {(commentsQuery.data?.comments ?? []).map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={c.author.avatarUrl ?? undefined} />
                <AvatarFallback className="text-2xs">{c.author.displayName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-xl bg-secondary/40 px-3 py-2">
                <span className="text-xs font-semibold">{c.author.displayName}</span>
                <span className="ml-2 text-2xs text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>
                <p className="mt-0.5 text-xs text-foreground/90">{c.content}</p>
              </div>
            </div>
          ))}
          {isMember && (
            <div className="flex items-center gap-2 pl-9">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                placeholder="Write a comment..."
                className="flex-1 rounded-xl border border-input bg-secondary/40 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50"
              />
              <Button aria-label="Send"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={submittingComment || !newComment.trim()}
                onClick={handleAddComment}
              >
                {submittingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [newPost, setNewPost] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [togglingMembership, setTogglingMembership] = useState(false);
  const [activeSection, setActiveSection] = useState<'feed' | 'members'>('feed');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const user = JSON.parse(localStorage.getItem('user') ?? '{}');
        setCurrentUserId(user?.id ?? null);
      } catch {}
    }
  }, []);

  const groupQuery = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => getGroup(groupId!),
    staleTime: 60_000,
    enabled: !!groupId,
  });

  const postsQuery = useQuery({
    queryKey: ['group-posts', groupId],
    queryFn: () => listGroupPosts(groupId!, { limit: 20 }),
    staleTime: 30_000,
    enabled: !!groupId,
  });

  const group = groupQuery.data?.group;
  const isMember = groupQuery.data?.isMember ?? false;
  const memberRole = groupQuery.data?.memberRole;

  const handleToggleMembership = async () => {
    if (!group) return;
    setTogglingMembership(true);
    try {
      if (isMember) {
        await leaveGroup(group.id);
        success('Left group', `You've left ${group.name}.`);
      } else {
        await joinGroup(group.id);
        success('Joined!', `Welcome to ${group.name}!`);
      }
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    } catch (e: unknown) {
      toastError('Error', errorMessage(e, 'Something went wrong.'));
    } finally {
      setTogglingMembership(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !group) return;
    setSubmittingPost(true);
    try {
      await createGroupPost(group.id, { content: newPost.trim() });
      setNewPost('');
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
    } catch (e: unknown) {
      toastError('Error', errorMessage(e, 'Failed to create post.'));
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!group) return;
    try {
      await deleteGroupPost(group.id, postId);
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
      success('Post deleted', '');
    } catch (e: unknown) {
      toastError('Error', errorMessage(e, 'Failed to delete post.'));
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    if (!group) return;
    try {
      await reactToGroupPost(group.id, postId, emoji);
      queryClient.invalidateQueries({ queryKey: ['group-posts', groupId] });
    } catch {}
  };

  if (groupQuery.isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="icon-xl animate-spin text-primary-emphasis/50" aria-hidden="true" />
        </div>
      </AppShell>
    );
  }

  if (groupQuery.isError || !group) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">Group not found</p>
          <Button variant="outline" onClick={() => router.push('/groups')}>Back to Groups</Button>
        </div>
      </AppShell>
    );
  }

  const posts = postsQuery.data?.posts ?? [];

  return (
    <AppShell>
      {/* Cover / Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/groups')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back to Groups
        </button>

        <div className="rounded-2xl border border-border/60 bg-card/70 overflow-hidden">
          {group.coverImageUrl ? (
            <div
              className="h-40 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${group.coverImageUrl})` }}
            />
          ) : (
            <div className="h-32 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          )}

          <div className="px-6 pb-5 -mt-8 relative">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-card bg-gradient-to-br from-primary/30 to-primary/10 shadow-lg">
                  {group.avatarUrl ? (
                    <img src={group.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  ) : (
                    <Users className="h-7 w-7 text-primary-emphasis" aria-hidden="true" />
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="font-display text-xl sm:text-2xl xl:text-3xl font-bold">{group.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {group.privacy === 'public' ? <Globe className="icon-2xs" aria-hidden="true" /> : <Lock className="icon-2xs" aria-hidden="true" />}
                      <span className="capitalize">{group.privacy}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="icon-2xs" aria-hidden="true" />
                      {group.memberCount.toLocaleString()} members
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageCircle className="icon-2xs" aria-hidden="true" />
                      {group.postCount.toLocaleString()} posts
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant={isMember ? 'outline' : 'default'}
                className="gap-2 shrink-0"
                disabled={togglingMembership}
                onClick={handleToggleMembership}
              >
                {togglingMembership ? (
                  <Loader2 className="icon-sm animate-spin" aria-hidden="true" />
                ) : isMember ? (
                  <><CheckCircle2 className="icon-sm text-emerald-500" aria-hidden="true" /> Joined</>
                ) : (
                  <><UserPlus className="icon-sm" aria-hidden="true" /> Join Group</>
                )}
              </Button>
            </div>

            {group.description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-2xl">{group.description}</p>
            )}

            {group.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {group.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-xs text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {group.category && (
              <div className="mt-3">
                <Badge variant="secondary">{group.category}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/70 p-1 w-fit">
          {(['feed', 'members'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
                activeSection === s
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s}
              {s === 'members' && (
                <span className="ml-1.5 text-xs opacity-70">({group.memberCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Feed section */}
        {activeSection === 'feed' && (
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              {/* Create post */}
              {isMember && (
                <div className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-3">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share something with the group..."
                    className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      className="gap-2"
                      disabled={submittingPost || !newPost.trim()}
                      onClick={handleCreatePost}
                    >
                      {submittingPost ? <Loader2 className="icon-sm animate-spin" aria-hidden="true" /> : <Send className="icon-sm" aria-hidden="true" />}
                      Post
                    </Button>
                  </div>
                </div>
              )}

              {/* Posts */}
              {postsQuery.isLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="icon-lg animate-spin text-primary-emphasis/50" aria-hidden="true" />
                </div>
              )}

              {postsQuery.isError && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <p className="text-sm text-muted-foreground">Failed to load posts</p>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => postsQuery.refetch()}>
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                  </Button>
                </div>
              )}

              {!postsQuery.isLoading && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="h-10 w-10 mb-3 text-muted-foreground/20" aria-hidden="true" />
                  <p className="text-sm font-medium">No posts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMember ? 'Be the first to post in this group!' : 'Join to start posting.'}
                  </p>
                </div>
              )}

              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  groupId={group.id}
                  isMember={isMember}
                  currentUserId={currentUserId}
                  onDelete={handleDeletePost}
                  onReact={handleReact}
                />
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Rules */}
              {group.rules.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Group Rules</h3>
                  <ol className="space-y-2">
                    {group.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-emphasis text-2xs font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{rule.title}</p>
                          {rule.description && <p className="mt-0.5">{rule.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Recent members */}
              {group.members.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Members ({group.memberCount})</h3>
                  <div className="space-y-2">
                    {group.members.slice(0, 6).map((m) => (
                      <div key={m.userId} className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={m.user?.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-2xs">{m.user?.displayName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{m.user?.displayName ?? 'Member'}</p>
                          {m.role !== 'member' && (
                            <p className="text-2xs text-primary-emphasis capitalize">{m.role}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {group.memberCount > 6 && (
                    <button
                      onClick={() => setActiveSection('members')}
                      className="text-xs text-primary-emphasis hover:underline"
                    >
                      View all {group.memberCount} members →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members section */}
        {activeSection === 'members' && (
          <div className="rounded-xl border border-border/60 bg-card/70 p-4">
            <h3 className="text-sm font-semibold mb-4">All Members ({group.memberCount})</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 rounded-xl border border-border/40 p-3 hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/profiles/${m.userId}`)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={m.user?.avatarUrl ?? undefined} />
                    <AvatarFallback>{m.user?.displayName?.[0]?.toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.user?.displayName ?? 'Member'}</p>
                    {m.user?.headline && (
                      <p className="text-xs text-muted-foreground truncate">{m.user.headline}</p>
                    )}
                    {m.role !== 'member' && (
                      <span className="text-2xs text-primary-emphasis capitalize font-medium">{m.role}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
