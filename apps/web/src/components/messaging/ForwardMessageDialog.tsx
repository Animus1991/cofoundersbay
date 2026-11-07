'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BilingualText } from '@/components/common/BilingualText';
import { ThreadAvatar } from '@/components/messaging/ThreadAvatar';
import { messagesEl, messagesEn } from '@/lib/i18n/strings-messages';
import { bilingualAria } from '@/lib/i18n/format';

export type ForwardTarget = { id: string; recipientName: string; recipientAvatar?: string | null };

/** Where a message goes: the reader's other conversations, newest first as in the inbox. */
export function ForwardMessageDialog({
  open,
  preview,
  targets,
  onClose,
  onForward,
}: {
  open: boolean;
  preview: string;
  targets: ForwardTarget[];
  onClose: () => void;
  onForward: (conversationId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? targets.filter((target) => target.recipientName.toLowerCase().includes(q)) : targets;
  }, [query, targets]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle><BilingualText en={messagesEn('forward_title')} el={messagesEl('forward_title')} compact /></DialogTitle>
          <DialogDescription className="line-clamp-2">{preview}</DialogDescription>
        </DialogHeader>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={bilingualAria(messagesEn('forward_search'), messagesEl('forward_search'))}
          placeholder={messagesEl('forward_search')}
        />
        {shown.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            <BilingualText en={messagesEn('forward_none')} el={messagesEl('forward_none')} wrap />
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto" data-forward-targets="">
            {shown.map((target) => (
              <li key={target.id}>
                <button
                  type="button"
                  onClick={() => onForward(target.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary/70"
                >
                  <ThreadAvatar name={target.recipientName} src={target.recipientAvatar} size="sm" />
                  <span className="min-w-0 truncate">{target.recipientName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
