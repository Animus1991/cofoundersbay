'use client';

import { useState } from 'react';
import { Image, Link2, Hash, AtSign, Send, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type PostType = 'update' | 'ask' | 'offer' | 'hiring' | 'milestone' | 'pitch';

type CreatePostProps = {
  user: {
    displayName: string;
    avatarUrl?: string | null;
  };
  onSubmit: (data: { type: PostType; content: string; tags: string[] }) => Promise<void>;
  placeholder?: string;
};

const postTypes: { type: PostType; label: string; emoji: string; description: string }[] = [
  { type: 'update', label: 'Update', emoji: '📢', description: 'Share news or progress' },
  { type: 'ask', label: 'Ask', emoji: '❓', description: 'Request help or advice' },
  { type: 'offer', label: 'Offer', emoji: '🎁', description: 'Offer help or resources' },
  { type: 'hiring', label: 'Hiring', emoji: '👥', description: 'Looking for team members' },
  { type: 'milestone', label: 'Milestone', emoji: '🎉', description: 'Celebrate an achievement' },
  { type: 'pitch', label: 'Pitch', emoji: '🚀', description: 'Share your startup idea' },
];

export function CreatePost({ user, onSubmit, placeholder = "What's on your mind?" }: CreatePostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('update');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ type: postType, content: content.trim(), tags });
      setContent('');
      setTags([]);
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <>
      {/* Collapsed view */}
      <Card
        className={cn(
          'cursor-pointer transition-shadow hover:shadow-md',
          isExpanded && 'hidden'
        )}
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-accessible">
                {user.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-full bg-secondary/60 px-4 py-2.5 text-sm text-muted-foreground">
              {placeholder}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/40 pt-3">
            {postTypes.slice(0, 4).map((pt) => (
              <Button key={pt.type} variant="ghost" size="sm" className="gap-1.5 text-xs">
                {pt.emoji} {pt.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expanded dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary-accessible" />
              Create Post
            </DialogTitle>
          </DialogHeader>

          {/* Post type selector */}
          <div className="grid grid-cols-3 gap-2">
            {postTypes.map((pt) => (
              <button
                key={pt.type}
                onClick={() => setPostType(pt.type)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors',
                  postType === pt.type
                    ? 'border-primary bg-primary/10'
                    : 'border-border/60 hover:border-primary/50'
                )}
              >
                <span className="text-xl">{pt.emoji}</span>
                <span className="text-xs font-medium">{pt.label}</span>
              </button>
            ))}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-accessible">
                {user.displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">Posting as {postTypes.find((p) => p.type === postType)?.label}</p>
            </div>
          </div>

          {/* Content */}
          <Textarea
            placeholder={postTypes.find((p) => p.type === postType)?.description || placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="resize-none"
            autoFocus
          />

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="w-full rounded-lg border border-border/60 bg-transparent py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <Button variant="secondary" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive-accessible">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
                <Link2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
                <AtSign className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{content.length}/1000</span>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || content.length > 1000 || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
