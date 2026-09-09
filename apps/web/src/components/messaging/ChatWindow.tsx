'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  Check,
  CheckCheck,
  Flag,
  Ban,
  Trash2,
  ArrowLeft,
  Search,
  X,
  Copy,
  Reply,
  MessageCircle,
  Users,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleBadge } from '@/components/common/RoleBadge';
import {
  ConversationValidationMenu,
  ConversationValidationBadge,
  TranscriptExportButton,
  ValidationHashDisplay,
  type ConversationValidationState,
  type ValidationMode,
} from '@/components/messaging/ConversationValidation';
import { cn } from '@/lib/utils';

export type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: { type: string; url: string; name: string }[];
  reactions?: { emoji: string; count: number }[];
  replyTo?: { id: string; content: string; senderName: string };
};

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

type ChatWindowProps = {
  conversation: {
    id: string;
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string | null;
    recipientRole: string;
    recipientHeadline?: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, attachments?: File[]) => void;
  onBack?: () => void;
  onReport?: () => void;
  onBlock?: () => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  isRecipientTyping?: boolean;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
  validationState?: ConversationValidationState;
  onValidationModeChange?: (mode: ValidationMode) => void;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  recipientAvatar,
  recipientName,
  onReply,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  recipientAvatar?: string | null;
  recipientName: string;
  onReply?: (msg: Message) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className={cn('group flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar placeholder for alignment */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={recipientAvatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary-emphasis text-xs">
              {recipientName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message content */}
      <div className={cn('max-w-[70%] flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {/* Reply preview */}
        {message.replyTo && (
          <div className={cn(
            'mb-1 rounded-lg border-l-2 border-primary/50 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground max-w-full',
          )}>
            <span className="font-medium text-foreground/70">{message.replyTo.senderName}: </span>
            <span className="truncate">{message.replyTo.content.slice(0, 60)}{message.replyTo.content.length > 60 ? '…' : ''}</span>
          </div>
        )}

        <div className="relative">
          {/* Hover action bar */}
          {showActions && (
            <div className={cn(
              'absolute -top-8 flex items-center gap-0.5 rounded-full border border-border/60 bg-card shadow-md px-1 py-0.5 z-10',
              isOwn ? 'right-0' : 'left-0',
            )}>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-full p-1 text-sm hover:bg-secondary/80 transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
              <div className="w-px h-4 bg-border/60 mx-0.5" />
              <button
                type="button"
                className="rounded-full p-1 hover:bg-secondary/80 transition-colors"
                title="Reply"
                onClick={() => onReply?.(message)}
              >
                <Reply className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="rounded-full p-1 hover:bg-secondary/80 transition-colors"
                title={copied ? 'Copied!' : 'Copy'}
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </button>
            </div>
          )}

          <div
            className={cn(
              'rounded-2xl px-4 py-2',
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-secondary text-foreground rounded-bl-md'
            )}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            {message.attachments?.length ? (
              <div className="mt-2 space-y-1">
                {message.attachments.map((a, idx) => (
                  <a
                    key={`${message.id}-att-${idx}`}
                    href={a.url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs',
                      isOwn ? 'bg-white/10 hover:bg-white/15' : 'bg-background/40 hover:bg-background/50',
                      a.url ? 'underline' : 'opacity-70 cursor-default'
                    )}
                    onClick={(e) => { if (!a.url) e.preventDefault(); }}
                  >
                    <Paperclip className="icon-2xs shrink-0" aria-hidden="true" />
                    {a.name}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          {/* Reactions */}
          {message.reactions?.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {message.reactions.map((r) => (
                <span key={r.emoji} className="inline-flex items-center gap-0.5 rounded-full bg-secondary/80 border border-border/50 px-1.5 py-0.5 text-xs">
                  {r.emoji} {r.count > 1 && <span className="text-muted-foreground">{r.count}</span>}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
          <span className="text-2xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          {isOwn && (
            <span className="text-muted-foreground">
              {message.status === 'sending' && <span className="text-2xs" title="Sending">•</span>}
              {message.status === 'sent' && <Check className="icon-2xs" aria-hidden="true" />}
              {message.status === 'delivered' && <CheckCheck className="icon-2xs" aria-hidden="true" />}
              {message.status === 'read' && <CheckCheck className="icon-2xs text-primary-emphasis" aria-hidden="true" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-xs text-muted-foreground">{formatDate(date)}</span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  onReport,
  onBlock,
  onTypingStart,
  onTypingStop,
  isRecipientTyping = false,
  hasMoreMessages = false,
  isLoadingMore = false,
  onLoadMore,
  className,
  validationState,
  onValidationModeChange,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator
  const handleTyping = (value: string) => {
    setInputValue(value);
    if (value.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart?.();
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingStop?.();
      }, 2000);
    } else if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  };

  // Handle send
  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim(), pendingFiles.length ? pendingFiles : undefined);
    setInputValue('');
    setPendingFiles([]);
    setReplyTo(null);
    // Stop typing on send
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingStop?.();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
    textareaRef.current?.focus();
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter by search
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  let currentDate: string | null = null;

  filteredMessages.forEach((msg) => {
    const dateStr = msg.timestamp.toDateString();
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groupedMessages.push({ date: msg.timestamp, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex flex-col border-b border-border/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button aria-label="Go back" variant="ghost" size="icon" onClick={onBack} className="md:hidden">
                <ArrowLeft className="icon-md" aria-hidden="true" />
              </Button>
            )}
            <Link href={`/profiles/${conversation.recipientId}`} className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.recipientAvatar || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary-emphasis">
                    {conversation.recipientName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {conversation.isOnline && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{conversation.recipientName}</span>
                  <RoleBadge role={conversation.recipientRole} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {conversation.isOnline
                    ? 'Online'
                    : conversation.lastSeen
                      ? `Last seen ${formatTime(conversation.lastSeen)}`
                      : 'Offline'}
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {validationState && (
              <ConversationValidationMenu
                conversationId={conversation.id}
                currentUserId={currentUserId}
                otherUserId={conversation.recipientId}
                otherUserName={conversation.recipientName}
                validationState={validationState}
                onModeChange={onValidationModeChange}
              />
            )}
            {validationState && validationState.mode !== 'casual' && (
              <TranscriptExportButton
                conversationId={conversation.id}
                validationState={validationState}
              />
            )}
            <Button aria-label="Search messages" variant="ghost" size="icon" title="Search messages" onClick={() => { setSearchOpen((v) => !v); setSearchQuery(''); }}>
              <Search className="icon-sm" aria-hidden="true" />
            </Button>
            <Button aria-label="Voice call (coming soon)" variant="ghost" size="icon" disabled title="Voice call (coming soon)">
              <Phone className="icon-md" aria-hidden="true" />
            </Button>
            <Button aria-label="Video call (coming soon)" variant="ghost" size="icon" disabled title="Video call (coming soon)">
              <Video className="icon-md" aria-hidden="true" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="More options" variant="ghost" size="icon">
                  <MoreVertical className="icon-md" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/profiles/${conversation.recipientId}`}>
                    <Info className="icon-sm mr-2" aria-hidden="true" />
                    View profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onReport}>
                  <Flag className="icon-sm mr-2" aria-hidden="true" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onBlock} className="text-destructive-emphasis">
                  <Ban className="icon-sm mr-2" aria-hidden="true" />
                  Block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Search bar */}
        {searchOpen && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages…"
                className="w-full rounded-lg border border-border/60 bg-secondary/50 pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            {searchQuery && (
              <span className="text-xs text-muted-foreground shrink-0">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
              </span>
            )}
            <Button aria-label="Close" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Load more button at top */}
        {hasMoreMessages && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-xs text-muted-foreground"
            >
              {isLoadingMore ? 'Loading...' : 'Load older messages'}
            </Button>
          </div>
        )}
        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            <DateDivider date={group.date} />
            {group.messages.map((msg, msgIndex) => {
              const isOwn = msg.senderId === currentUserId;
              const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
              const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;

              return (
                <div key={msg.id} className="mb-2">
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    recipientAvatar={conversation.recipientAvatar}
                    recipientName={conversation.recipientName}
                    onReply={(m) => { setReplyTo(m); textareaRef.current?.focus(); }}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isRecipientTyping && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={conversation.recipientAvatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary-emphasis text-xs">
                {conversation.recipientName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/60">
        {/* Reply preview */}
        {replyTo && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border-l-2 border-primary/60 bg-secondary/50 px-3 py-2">
            <Reply className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-emphasis" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground/70">
                {replyTo.senderId === currentUserId ? 'You' : conversation.recipientName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{replyTo.content.slice(0, 80)}</p>
            </div>
            <Button aria-label="Close" variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => setReplyTo(null)}>
              <X className="icon-2xs" aria-hidden="true" />
            </Button>
          </div>
        )}

        {pendingFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingFiles.map((f) => (
              <div
                key={`${f.name}-${f.size}-${f.lastModified}`}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-foreground"
              >
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="max-w-[220px] truncate">{f.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive-emphasis"
                  onClick={() =>
                    setPendingFiles((prev) =>
                      prev.filter((x) => !(x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              if (!files.length) return;
              setPendingFiles((prev) => [...prev, ...files].slice(0, 5));
            }}
          />
          <Button aria-label="Attach file"
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="icon-md" aria-hidden="true" />
          </Button>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="min-h-[44px] max-h-[120px] pr-10 resize-none"
            />
            <div className="absolute right-1 bottom-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label="Add emoji" variant="ghost" size="icon" className="h-8 w-8">
                    <Smile className="icon-sm" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-2 w-auto">
                  <div className="grid grid-cols-8 gap-0.5">
                    {['😀','😂','😍','🥰','😎','🤔','😅','🙈','👍','👎','❤️','🔥','🎉','✅','💡','🚀',
                      '💪','🙏','👏','😢','😡','🤝','💰','⭐','🌟','📈','💻','🎯'].map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded hover:bg-secondary/80 text-base transition-colors"
                        onClick={() => {
                          setInputValue((v) => v + e);
                          textareaRef.current?.focus();
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex-shrink-0"
          >
            <Send className="icon-md" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Empty state when no conversation is selected
export function NoChatSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-10 w-10 text-primary-emphasis" aria-hidden="true" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-400/20 flex items-center justify-center border-2 border-background">
          <span className="text-emerald-400 text-xs font-bold">✓</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Your Messages</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Select a conversation from the list, or start a new one by connecting with someone on Discover.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        <a
          href="/discover"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary-emphasis hover:bg-primary/20 transition-colors"
        >
          <Users className="icon-sm" aria-hidden="true" />
          Find people to message
        </a>
        <a
          href="/connections"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary/60 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
        >
          <UserCheck className="icon-sm" aria-hidden="true" />
          View connections
        </a>
      </div>
    </div>
  );
}
