'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { createEndorsement } from '@/lib/api';
import { cn } from '@/lib/utils';

const RELATIONSHIP_OPTIONS = [
  'Co-founder',
  'Mentor',
  'Mentee',
  'Colleague',
  'Investor',
  'Advisor',
  'Business Partner',
  'Other',
];

type WriteEndorsementModalProps = {
  open: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    headline?: string | null;
  };
};

export function WriteEndorsementModal({
  open,
  onClose,
  targetUser,
}: WriteEndorsementModalProps) {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();

  const [content, setContent] = useState('');
  const [skill, setSkill] = useState('');
  const [relationship, setRelationship] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createEndorsement({
        toUserId: targetUser.id,
        content: content.trim(),
        skill: skill.trim() || undefined,
        relationship: relationship || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endorsements', targetUser.id] });
      success(
        'Endorsement sent!',
        `${targetUser.displayName} will be notified and can approve your endorsement.`
      );
      onClose();
      setContent('');
      setSkill('');
      setRelationship('');
    },
    onError: (err) => {
      showError(
        'Could not send endorsement',
        err instanceof Error ? err.message : 'Please try again'
      );
    },
  });

  const canSubmit = content.trim().length >= 10 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="p-0" size="md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 pr-14">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Star className="icon-sm text-amber-500" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle>Write Endorsement</DialogTitle>
              <DialogDescription className="text-xs">
                Share your experience working with {targetUser.displayName}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Target user info */}
        <div className="border-b border-border/60 px-5 py-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={targetUser.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary-emphasis">
                {targetUser.displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm text-foreground">{targetUser.displayName}</p>
              {targetUser.headline && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {targetUser.headline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Relationship */}
          <div className="space-y-1.5">
            <Label>How do you know {targetUser.displayName}?</Label>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setRelationship(relationship === opt ? '' : opt)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                    relationship === opt
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Skill (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="skill">Skill to endorse (optional)</Label>
            <Input
              id="skill"
              placeholder="e.g., Product Management, Fundraising, Leadership…"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label htmlFor="content">
              Your endorsement <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              placeholder={`What makes ${targetUser.displayName} great to work with? Share specific examples or qualities…`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/1000
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Your endorsement will be sent to {targetUser.displayName} for approval before
            appearing on their profile.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/60 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit}
            loading={mutation.isPending}
            loadingText="Sending endorsement"
            className="gap-2"
          >
            <Send className="icon-sm" aria-hidden="true" />
            Send Endorsement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
