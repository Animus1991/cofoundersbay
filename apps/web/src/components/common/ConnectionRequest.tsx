'use client';

import { useState } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RoleBadge } from './RoleBadge';
import { cn } from '@/lib/utils';
import { STATUS } from '@/lib/semantic-colors';

type ConnectionRequestProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
    role: string;
    headline?: string | null;
  };
  onSend: (message: string) => Promise<void>;
  suggestedMessages?: string[];
};

const defaultSuggestions = [
  "Hi! I came across your profile and I think we could be a great match. Would love to connect and discuss potential collaboration.",
  "Hello! Your background in {industry} really caught my attention. I'm working on something similar and would love to chat.",
  "Hi there! I noticed we share some common interests. Would you be open to a quick intro call?",
];

export function ConnectionRequestDialog({
  open,
  onOpenChange,
  recipient,
  onSend,
  suggestedMessages = defaultSuggestions,
}: ConnectionRequestProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (message.length < 20) {
      setError('Message is too short. Add more context to increase your chances of a response.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await onSend(message);
      setMessage('');
      onOpenChange(false);
    } catch (err) {
      setError('Failed to send request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setMessage(suggestion);
    setError(null);
  };

  const charCount = message.length;
  const isValid = charCount >= 20 && charCount <= 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary-accessible" />
            Request Connection
          </DialogTitle>
          <DialogDescription>
            Send a personalized message to introduce yourself
          </DialogDescription>
        </DialogHeader>

        {/* Recipient preview */}
        <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={recipient.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary-accessible">
              {recipient.displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{recipient.displayName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <RoleBadge role={recipient.role} size="sm" />
              {recipient.headline && (
                <span className="text-xs text-muted-foreground truncate">
                  {recipient.headline}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Suggested messages */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary-accessible" />
            Quick suggestions
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedMessages.slice(0, 3).map((suggestion, i) => (
              <button
                key={i}
                onClick={() => applySuggestion(suggestion)}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {suggestion.substring(0, 40)}...
              </button>
            ))}
          </div>
        </div>

        {/* Message input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Write a personalized message explaining why you'd like to connect..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            rows={5}
            className={cn(
              'resize-none',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              'text-muted-foreground',
              charCount > 500 && 'text-destructive-accessible'
            )}>
              {charCount}/500 characters
            </span>
            {charCount < 20 && charCount > 0 && (
              <span className={STATUS.warning.icon}>
                {20 - charCount} more characters needed
              </span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive-accessible animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Tips */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Tips for a great intro:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Mention specific interests or skills you share</li>
            <li>Explain why you think you'd be a good match</li>
            <li>Keep it concise but personal</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!isValid || sending}>
            {sending ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Connection status badge
type ConnectionStatus = 'none' | 'pending' | 'connected' | 'declined';

export function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const config: Record<ConnectionStatus, { label: string; chip: string }> = {
    none: { label: 'Not connected', chip: STATUS.neutral.chip },
    pending: { label: 'Request pending', chip: STATUS.warning.chip },
    connected: { label: 'Connected', chip: STATUS.success.chip },
    declined: { label: 'Request declined', chip: STATUS.danger.chip },
  };

  const { label, chip } = config[status];

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      chip
    )}>
      {label}
    </span>
  );
}
