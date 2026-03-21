'use client';

import React, {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  X, Minus, Maximize2, Send, ArrowLeft, MessageCircle,
  Search, Loader2, Check, CheckCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useSession } from '@/hooks/useSession';
import {
  getMe, listMessageConversations, listConversationMessages,
  getOrCreateDirectConversation,
  type ConversationSummary, type MessageItem,
} from '@/lib/api';
import { createMessagingSocket, type ServerToClientEvents } from '@/lib/messagingSocket';
import type { Conversation } from '@/components/messaging/ConversationList';

// ── local Message type ────────────────────────────────────────────────────────

type PopupMessage = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'read';
};

// ── helpers ───────────────────────────────────────────────────────────────────

function mapConversation(s: ConversationSummary): Conversation {
  const lastAt = s.lastMessage?.createdAt ?? s.updatedAt;
  return {
    id: s.id,
    recipientId: s.recipient?.id ?? 'unknown',
    recipientName: s.recipient?.displayName ?? 'Unknown',
    recipientAvatar: s.recipient?.avatarUrl ?? null,
    recipientRole: s.recipient?.role ?? 'founder',
    lastMessage: s.lastMessage?.body ?? '',
    lastMessageTime: new Date(lastAt),
    unreadCount: s.unreadCount ?? 0,
    isPinned: s.isPinned ?? false,
    isArchived: s.isArchived ?? false,
    isOnline: s.recipient?.isOnline ?? false,
  };
}

function mapMessage(m: MessageItem, myId: string): PopupMessage {
  return {
    id: m.id,
    senderId: m.senderId,
    content: m.body,
    timestamp: new Date(m.createdAt),
    status: m.senderId === myId ? 'sent' : 'read',
  };
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(d: Date) {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return formatTime(d);
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConvoItem({
  conv, selected, onClick,
}: { conv: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-colors',
        selected ? 'bg-primary/10' : 'hover:bg-muted/60',
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={conv.recipientAvatar ?? undefined} />
          <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary">
            {conv.recipientName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {conv.isOnline && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            'text-sm truncate',
            conv.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/90',
          )}>
            {conv.recipientName}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
            {formatRelativeTime(conv.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={cn(
            'text-xs truncate',
            conv.unreadCount > 0 ? 'text-foreground/75 font-medium' : 'text-muted-foreground',
          )}>
            {conv.lastMessage || <span className="italic">No messages yet</span>}
          </p>
          {conv.unreadCount > 0 && (
            <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shrink-0">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main ChatPopup ────────────────────────────────────────────────────────────

export function ChatPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, isMinimized, initialUserId, close, minimize, restore } = usePopupChat();
  const { hasSession, mounted: sessionReady } = useSession();

  // Core state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<PopupMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef<ReturnType<typeof createMessagingSocket> | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync refs
  useEffect(() => { selectedIdRef.current = selected?.id ?? null; }, [selected]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  // Don't show on messages page or auth pages
  const shouldHide =
    pathname?.startsWith('/messages') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password');

  // ── initialize on first open ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !sessionReady || !hasSession || initialized || isInitializing) return;

    let mounted = true;
    setIsInitializing(true);

    const onNew: ServerToClientEvents['message:new'] = ({ message }) => {
      setConversations(prev => prev.map(c => {
        if (c.id !== message.conversationId) return c;
        const isSelected = selectedIdRef.current === c.id;
        return {
          ...c,
          lastMessage: message.body,
          lastMessageTime: new Date(message.createdAt),
          unreadCount: isSelected ? 0 : (c.unreadCount ?? 0) + 1,
        };
      }));
      if (selectedIdRef.current === message.conversationId) {
        setMessages(prev => [...prev, mapMessage(message, currentUserIdRef.current)]);
      }
    };

    const onAck: ServerToClientEvents['message:ack'] = ({ tempId, message }) => {
      if (!tempId) return;
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? { ...m, id: message.id, timestamp: new Date(message.createdAt), status: 'sent' }
          : m,
      ));
      setConversations(prev => prev.map(c =>
        c.id === message.conversationId
          ? { ...c, lastMessage: message.body, lastMessageTime: new Date(message.createdAt) }
          : c,
      ));
    };

    const onTypingStart: ServerToClientEvents['typing:start'] = ({ conversationId }) => {
      if (selectedIdRef.current === conversationId) setIsTyping(true);
    };

    const onTypingStop: ServerToClientEvents['typing:stop'] = ({ conversationId }) => {
      if (selectedIdRef.current === conversationId) setIsTyping(false);
    };

    const onPresence: ServerToClientEvents['presence:update'] = ({ userId, isOnline }) => {
      setConversations(prev => prev.map(c => c.recipientId === userId ? { ...c, isOnline } : c));
    };

    const init = async () => {
      try {
        // get current user id
        const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        let uid = '';
        if (rawUser) {
          try { uid = (JSON.parse(rawUser) as { id?: string }).id ?? ''; } catch { uid = ''; }
        }
        if (!uid) {
          const { user } = await getMe();
          uid = user.id;
        }
        if (!mounted) return;
        setCurrentUserId(uid);

        const { conversations: list } = await listMessageConversations();
        if (!mounted) return;
        const mapped = list.map(mapConversation);
        setConversations(mapped);

        // Connect socket
        const socket = createMessagingSocket();
        socketRef.current = socket;
        socket.on('message:new', onNew);
        socket.on('message:ack', onAck);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);
        socket.on('presence:update', onPresence);

        // If initialUserId, open that DM
        if (initialUserId) {
          const { conversationId } = await getOrCreateDirectConversation(initialUserId);
          if (!mounted) return;
          const { conversations: refreshed } = await listMessageConversations();
          const remapped = refreshed.map(mapConversation);
          if (!mounted) return;
          setConversations(remapped);
          const conv = remapped.find(c => c.id === conversationId);
          if (conv) setSelected(conv);
        }

        setInitialized(true);
      } catch {
        // silently fail — popup simply shows empty state
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    void init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionReady, hasSession]);

  // ── disconnect on close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setInitialized(false);
      setSelected(null);
      setMessages([]);
      setConversations([]);
      setCurrentUserId('');
    }
  }, [isOpen]);

  // ── load messages when conversation selected ────────────────────────────────
  useEffect(() => {
    if (!selected || !currentUserId) return;
    let cancelled = false;
    setLoadingMessages(true);
    setMessages([]);

    const run = async () => {
      try {
        const { messages: list } = await listConversationMessages(selected.id, 100);
        if (cancelled) return;
        setMessages(list.map(m => mapMessage(m, currentUserId)));
        setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, unreadCount: 0 } : c));
        socketRef.current?.emit('conversation:join', { conversationId: selected.id });
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [selected?.id, currentUserId]);

  // ── auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // ── focus input when thread opens ───────────────────────────────────────────
  useEffect(() => {
    if (selected && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selected?.id, isMinimized]);

  // ── reset typing indicator ──────────────────────────────────────────────────
  useEffect(() => { setIsTyping(false); }, [selected?.id]);

  // ── handlers ────────────────────────────────────────────────────────────────

  const { setActiveConversationId, markConversationRead } = useMessaging();

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelected(conv);
    setInputValue('');
    setActiveConversationId(conv.id);
    markConversationRead(conv.id);
  }, []);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || !selected || !socketRef.current?.connected) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setMessages(prev => [...prev, {
      id: tempId, senderId: currentUserId, content: text, timestamp: new Date(), status: 'sending',
    }]);
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, lastMessage: text, lastMessageTime: new Date() } : c,
    ));
    setInputValue('');

    socketRef.current.emit('message:send', { conversationId: selected.id, body: text, tempId });
    // stop typing
    socketRef.current.emit('typing:stop', { conversationId: selected.id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [inputValue, selected, currentUserId]);

  const handleInputChange = useCallback((val: string) => {
    setInputValue(val);
    if (!selected || !socketRef.current?.connected) return;
    socketRef.current.emit('typing:start', { conversationId: selected.id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { conversationId: selected.id });
    }, 2000);
  }, [selected]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleExpandToFullPage = useCallback(() => {
    const url = selected ? `/messages?c=${selected.id}` : '/messages';
    close();
    router.push(url);
  }, [selected, close, router]);

  // Compute outside the ternary so TypeScript doesn't narrow to null inside else-branch
  const selectedId = selected?.id ?? null;

  // ── render guard ────────────────────────────────────────────────────────────
  if (!isOpen || shouldHide) return null;

  const filteredConvos = conversations.filter(
    c => !c.isArchived && c.recipientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── minimized pill ──────────────────────────────────────────────────────────
  if (isMinimized) {
    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount ?? 0), 0);
    return (
      <div
        className="fixed bottom-28 right-6 z-40 flex items-center gap-2.5 cursor-pointer
          rounded-full bg-card border border-border shadow-lg px-4 py-2.5
          hover:shadow-xl transition-all duration-150 animate-in slide-in-from-bottom-2"
        onClick={restore}
      >
        <MessageCircle className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Messages</span>
        {totalUnread > 0 && (
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); close(); }}
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // ── full popup ──────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed bottom-28 right-6 z-40 flex flex-col rounded-2xl border border-border
        bg-card shadow-2xl overflow-hidden
        animate-in slide-in-from-bottom-4 fade-in duration-200"
      style={{ width: 380, height: 540 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-card/80 backdrop-blur shrink-0">
        {selected ? (
          <>
            <button
              onClick={() => setSelected(null)}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative shrink-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src={selected.recipientAvatar ?? undefined} />
                <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                  {selected.recipientName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {selected.isOnline && (
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">
                {selected.recipientName}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {selected.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 text-sm font-semibold text-foreground">Messages</span>
          </>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleExpandToFullPage}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Open full chat"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={minimize}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {isInitializing ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        </div>
      ) : selected ? (
        /* ── Message Thread ── */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages scroll */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scroll-smooth">
            {loadingMessages ? (
              <div className="flex justify-center pt-8">
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Say hello!</p>
                <p className="text-xs text-muted-foreground">Start a conversation with {selected.recipientName}</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showTime = !prevMsg ||
                    msg.timestamp.getTime() - prevMsg.timestamp.getTime() > 3 * 60000;

                  return (
                    <React.Fragment key={msg.id}>
                      {showTime && (
                        <div className="text-center py-1">
                          <span className="text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={cn('flex items-end gap-1.5', isMe ? 'flex-row-reverse' : 'flex-row')}>
                        {!isMe && (
                          <Avatar className="h-6 w-6 shrink-0 mb-0.5">
                            <AvatarImage src={selected.recipientAvatar ?? undefined} />
                            <AvatarFallback className="text-[9px] bg-primary/15 text-primary">
                              {selected.recipientName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                            isMe
                              ? 'rounded-br-sm bg-primary text-primary-foreground'
                              : 'rounded-bl-sm bg-muted text-foreground',
                          )}
                        >
                          {msg.content}
                        </div>
                        {isMe && (
                          <span className="text-muted-foreground mb-0.5">
                            {msg.status === 'sending' ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : msg.status === 'read' ? (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border/60 px-3 py-2.5 bg-card/80">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 h-9 text-sm rounded-xl border-border/60 bg-background focus-visible:ring-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || !socketRef.current?.connected}
                size="sm"
                className="h-9 w-9 p-0 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Conversation List ── */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search */}
          <div className="px-3 pt-2.5 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-8 h-8 text-xs rounded-lg border-border/60 bg-muted/40"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {filteredConvos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {searchQuery ? 'No results' : 'No messages yet'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? `Nothing matching "${searchQuery}"`
                    : 'Connect with founders and mentors to start chatting'}
                </p>
              </div>
            ) : (
              filteredConvos.map(conv => (
                <ConvoItem
                  key={conv.id}
                  conv={conv}
                  selected={selectedId === conv.id}
                  onClick={() => handleSelectConversation(conv)}
                />
              ))
            )}
          </div>

          {/* Expand CTA */}
          <div className="shrink-0 border-t border-border/60 px-3 py-2">
            <button
              onClick={handleExpandToFullPage}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 rounded-lg hover:bg-muted/40"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Open full messaging view
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
