'use client';

import { useState } from 'react';
import { Search, Edit, Archive, Pin, MoreHorizontal, Trash2, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RoleBadge } from '@/components/common/RoleBadge';
import { EmptyMessages } from '@/components/common/EmptyStates';
import { cn } from '@/lib/utils';

export type Conversation = {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string | null;
  recipientRole: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
  isOnline?: boolean;
};

type ConversationListProps = {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onNewMessage?: () => void;
  onArchive?: (id: string) => void;
  onPin?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onArchive,
  onPin,
  onDelete,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onArchive?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-conversation-id={conversation.id}
      className={cn(
        'group relative flex items-center gap-3 p-3 cursor-pointer transition-colors rounded-lg',
        isSelected ? 'bg-primary/10' : 'hover:bg-secondary/60'
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Avatar with online indicator */}
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={conversation.recipientAvatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {conversation.recipientName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {conversation.isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {conversation.isPinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
            <span className={cn(
              'text-sm font-semibold truncate',
              conversation.unreadCount > 0 ? 'text-foreground' : 'text-foreground/90'
            )}>
              {conversation.recipientName}
            </span>
            <RoleBadge role={conversation.recipientRole} size="sm" showIcon={false} className="flex-shrink-0 py-0 text-[9px] leading-tight" />
          </div>
          <span className="text-[11px] text-muted-foreground flex-shrink-0 tabular-nums">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            'text-xs truncate leading-relaxed',
            conversation.unreadCount > 0 ? 'text-foreground/80 font-medium' : 'text-muted-foreground'
          )}>
            {conversation.lastMessage || <span className="italic">No messages yet</span>}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground flex-shrink-0">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-11 w-11 opacity-100 md:right-2 md:top-2 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            aria-label="Conversation actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPin}>
            <Pin className="h-4 w-4 mr-2" />
            {conversation.isPinned ? 'Unpin' : 'Pin'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewMessage,
  onArchive,
  onPin,
  onDelete,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(
    (c) =>
      !c.isArchived &&
      c.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const regularConversations = filteredConversations.filter((c) => !c.isPinned);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border/60 p-3">
        <div className="mb-3 hidden items-center justify-between md:flex">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <Button size="icon" variant="ghost" onClick={onNewMessage} aria-label="New message" className="tap-target">
            <Edit className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-9"
            />
          </div>
          <Button size="icon" variant="ghost" className="tap-target shrink-0 md:hidden" onClick={onNewMessage} aria-label="New message">
            <Edit className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        {pinnedConversations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground px-3 mb-2">Pinned</p>
            {pinnedConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onSelect={() => onSelect(conv)}
                onArchive={() => onArchive?.(conv.id)}
                onPin={() => onPin?.(conv.id)}
                onDelete={() => onDelete?.(conv.id)}
              />
            ))}
          </div>
        )}

        {regularConversations.length > 0 && (
          <div>
            {pinnedConversations.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground px-3 mb-2">All messages</p>
            )}
            {regularConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={conv.id === selectedId}
                onSelect={() => onSelect(conv)}
                onArchive={() => onArchive?.(conv.id)}
                onPin={() => onPin?.(conv.id)}
                onDelete={() => onDelete?.(conv.id)}
              />
            ))}
          </div>
        )}

        {filteredConversations.length === 0 && (
          searchQuery ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MessageSquarePlus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No conversations found</p>
              <p className="text-xs text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          ) : (
            <EmptyMessages className="py-8" />
          )
        )}
      </div>
    </div>
  );
}
