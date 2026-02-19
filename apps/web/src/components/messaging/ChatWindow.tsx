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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleBadge } from '@/components/common/RoleBadge';
import { cn } from '@/lib/utils';

export type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: { type: string; url: string; name: string }[];
};

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
  className?: string;
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
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  recipientAvatar?: string | null;
  recipientName: string;
}) {
  return (
    <div className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar placeholder for alignment */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={recipientAvatar || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {recipientName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message content */}
      <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-secondary text-foreground rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.attachments?.length ? (
            <div className="mt-2 space-y-1">
              {message.attachments.map((a, idx) => (
                <a
                  key={`${message.id}-att-${idx}`}
                  href={a.url || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'block rounded-lg px-2 py-1 text-xs',
                    isOwn ? 'bg-white/10 hover:bg-white/15' : 'bg-background/40 hover:bg-background/50',
                    a.url ? 'underline' : 'opacity-70 cursor-default'
                  )}
                  onClick={(e) => {
                    if (!a.url) e.preventDefault();
                  }}
                >
                  {a.name}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div className={cn('flex items-center gap-1 mt-1', isOwn ? 'justify-end' : 'justify-start')}>
          <span className="text-[10px] text-muted-foreground">{formatTime(message.timestamp)}</span>
          {isOwn && (
            <span className="text-muted-foreground">
              {message.status === 'sending' && <span className="text-[10px]">•</span>}
              {message.status === 'sent' && <Check className="h-3 w-3" />}
              {message.status === 'delivered' && <CheckCheck className="h-3 w-3" />}
              {message.status === 'read' && <CheckCheck className="h-3 w-3 text-primary" />}
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
  className,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send
  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim(), pendingFiles.length ? pendingFiles : undefined);
    setInputValue('');
    setPendingFiles([]);
    textareaRef.current?.focus();
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: Date; messages: Message[] }[] = [];
  let currentDate: string | null = null;

  messages.forEach((msg) => {
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
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link href={`/profiles/${conversation.recipientId}`} className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversation.recipientAvatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
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
          <Button variant="ghost" size="icon" disabled>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/profiles/${conversation.recipientId}`}>
                  <Info className="h-4 w-4 mr-2" />
                  View profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onReport}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBlock} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
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
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={conversation.recipientAvatar || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
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
        {pendingFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {pendingFiles.map((f) => (
              <div
                key={`${f.name}-${f.size}-${f.lastModified}`}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-foreground"
              >
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="max-w-[220px] truncate">{f.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setPendingFiles((prev) =>
                      prev.filter((x) => !(x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)),
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="min-h-[44px] max-h-[120px] pr-10 resize-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 bottom-1"
              disabled
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Empty state when no conversation is selected
export function NoChatSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Send className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Your Messages</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Select a conversation or start a new one to connect with founders, mentors, and investors.
      </p>
    </div>
  );
}
