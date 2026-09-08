'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import {
  MessageSquare,
  X,
  ChevronDown,
  Send,
  Loader2,
  GripVertical,
  ArrowLeft,
  Search,
  MessageCircle,
  Maximize2,
  Check,
  CheckCheck,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDraggable } from '@/hooks/useDraggable';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { CopilotWorkspace } from '@/components/ai/CopilotWorkspace';
import {
  getMe, listMessageConversations, listConversationMessages,
  getOrCreateDirectConversation,
  type ConversationSummary, type MessageItem,
} from '@/lib/api';
import { createMessagingSocket, type ServerToClientEvents } from '@/lib/messagingSocket';
import type { Conversation } from '@/components/messaging/ConversationList';
import { BilingualText } from '@/components/common/BilingualText';
import { bilingualAria } from '@/lib/i18n/format';

type TabType = 'messages' | 'ai';

// ── Messaging types & helpers ──────────────────────────────────────────────────

type PopupMessage = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'read';
};

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

// ── Messaging sub-components ───────────────────────────────────────────────────

function ConvoItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
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
          <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary-accessible">
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
          <span className="text-2xs text-muted-foreground shrink-0 tabular-nums">
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
            <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground shrink-0">
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

// ── Main component ─────────────────────────────────────────────────────────────

export function UnifiedChatPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasSession, mounted: sessionReady } = useSession();
  const { isOpen, isMinimized, initialUserId, close, minimize, restore } = usePopupChat();
  const { setActiveConversationId, markConversationRead } = useMessaging();

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('ai');

  // ── Messaging state ────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [msgMessages, setMsgMessages] = useState<PopupMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef<ReturnType<typeof createMessagingSocket> | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef('');
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const msgInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // ── Draggable ──────────────────────────────────────────────────────────────
  const { position, isDragging, dragHandleProps } = useDraggable({
    storageKey: 'cfb-unified-chat-position',
    initialPosition: { x: 0, y: 0 },
    boundaryPadding: 20,
  });

  // Sync refs
  useEffect(() => { selectedIdRef.current = selected?.id ?? null; }, [selected]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  // ESC key: thread open → back to list; list → minimize
  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) {
        setSelected(null);
        setActiveConversationId(null);
      } else {
        minimize();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, selected, minimize, setActiveConversationId]);

  // Focus popup container when it opens or is restored (accessibility)
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => popupRef.current?.focus(), 50);
    }
  }, [isOpen, isMinimized]);

  // Hide on messaging page and auth pages
  const shouldHide =
    pathname?.startsWith('/messages') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/onboarding') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/reset-password') ||
    pathname === '/ai' ||
    pathname?.startsWith('/ai/');

  // ── Messaging: init socket + conversations on first open ───────────────────
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
        setMsgMessages(prev => [...prev, mapMessage(message, currentUserIdRef.current)]);
      }
    };

    const onAck: ServerToClientEvents['message:ack'] = ({ tempId, message }) => {
      if (!tempId) return;
      setMsgMessages(prev => prev.map(m =>
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
        let uid = currentUserId;
        if (!uid) {
          const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (rawUser) {
            try { uid = (JSON.parse(rawUser) as { id?: string }).id ?? ''; } catch { uid = ''; }
          }
          if (!uid) {
            const { user } = await getMe();
            uid = user.id;
          }
          if (!mounted) return;
          setCurrentUserId(uid);
        }

        if (conversations.length === 0) {
          const { conversations: list } = await listMessageConversations();
          if (!mounted) return;
          setConversations(list.map(mapConversation));
        }

        const socket = createMessagingSocket();
        socketRef.current = socket;
        socket.on('message:new', onNew);
        socket.on('message:ack', onAck);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);
        socket.on('presence:update', onPresence);

        if (initialUserId) {
          const { conversationId } = await getOrCreateDirectConversation(initialUserId);
          if (!mounted) return;
          const { conversations: refreshed } = await listMessageConversations();
          const remapped = refreshed.map(mapConversation);
          if (!mounted) return;
          setConversations(remapped);
          const conv = remapped.find(c => c.id === conversationId);
          if (conv) setSelected(conv);
          setActiveTab('messages');
        }

        setInitialized(true);
      } catch {
        // silently fail — popup shows empty state
      } finally {
        if (mounted) setIsInitializing(false);
      }
    };

    void init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionReady, hasSession]);

  // Disconnect socket on close; reset so it reconnects on next open
  useEffect(() => {
    if (!isOpen && socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setInitialized(false);
    }
  }, [isOpen]);

  // Reset messaging state on logout
  useEffect(() => {
    const handleLogout = () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setInitialized(false);
      setSelected(null);
      setMsgMessages([]);
      setConversations([]);
      setCurrentUserId('');
    };
    window.addEventListener('cfb:logout', handleLogout);
    return () => window.removeEventListener('cfb:logout', handleLogout);
  }, []);

  // When initialUserId changes while popup is already open+initialized, open that DM
  useEffect(() => {
    if (!initialUserId || !isOpen || !initialized) return;
    let cancelled = false;
    const openDm = async () => {
      try {
        const { conversationId } = await getOrCreateDirectConversation(initialUserId);
        if (cancelled) return;
        const { conversations: refreshed } = await listMessageConversations();
        const remapped = refreshed.map(mapConversation);
        if (cancelled) return;
        setConversations(remapped);
        const conv = remapped.find(c => c.id === conversationId);
        if (conv) setSelected(conv);
        setActiveTab('messages');
      } catch { /* ignore */ }
    };
    void openDm();
    return () => { cancelled = true; };
  }, [initialUserId, isOpen, initialized]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selected || !currentUserId) return;
    let cancelled = false;
    setLoadingMessages(true);
    setMsgMessages([]);
    const run = async () => {
      try {
        const { messages: list } = await listConversationMessages(selected.id, 100);
        if (cancelled) return;
        setMsgMessages(list.map(m => mapMessage(m, currentUserId)));
        setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, unreadCount: 0 } : c));
        socketRef.current?.emit('conversation:join', { conversationId: selected.id });
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [selected?.id, currentUserId]);

  // Auto-scroll messages
  useEffect(() => {
    if (msgMessages.length) msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgMessages.length]);

  // Focus msg input when thread opens
  useEffect(() => {
    if (selected && !isMinimized && activeTab === 'messages') {
      setTimeout(() => msgInputRef.current?.focus(), 100);
    }
  }, [selected?.id, isMinimized, activeTab]);

  // Reset typing on conversation change
  useEffect(() => { setIsTyping(false); }, [selected?.id]);

  // Sync active conversation ID with MessagingContext (prevents double unread)
  useEffect(() => {
    if (activeTab === 'messages' && selected) {
      setActiveConversationId(selected.id);
      markConversationRead(selected.id);
    } else {
      setActiveConversationId(null);
    }
  }, [activeTab, selected?.id, setActiveConversationId, markConversationRead]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelected(conv);
    setMsgInput('');
    setActiveConversationId(conv.id);
    markConversationRead(conv.id);
  }, [setActiveConversationId, markConversationRead]);

  const handleMsgSend = useCallback(() => {
    const text = msgInput.trim();
    if (!text || !selected || !socketRef.current?.connected) return;
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setMsgMessages(prev => [...prev, {
      id: tempId, senderId: currentUserId, content: text, timestamp: new Date(), status: 'sending',
    }]);
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, lastMessage: text, lastMessageTime: new Date() } : c,
    ));
    setMsgInput('');
    socketRef.current.emit('message:send', { conversationId: selected.id, body: text, tempId });
    socketRef.current.emit('typing:stop', { conversationId: selected.id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, [msgInput, selected, currentUserId]);

  const handleMsgInputChange = useCallback((val: string) => {
    setMsgInput(val);
    if (!selected || !socketRef.current?.connected) return;
    socketRef.current.emit('typing:start', { conversationId: selected.id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { conversationId: selected.id });
    }, 2000);
  }, [selected]);

  const handleMsgKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleMsgSend(); }
  }, [handleMsgSend]);

  const handleAIExpand = useCallback(() => {
    close();
    router.push('/ai');
  }, [close, router]);

  const handleExpandToFullPage = useCallback(() => {
    const url = selected ? `/messages?c=${selected.id}` : '/messages';
    close();
    router.push(url);
  }, [selected, close, router]);

  // Derived
  const selectedId = selected?.id ?? null;
  const filteredConvos = conversations.filter(
    c => !c.isArchived && c.recipientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalMsgUnread = conversations.reduce((s, c) => s + (c.unreadCount ?? 0), 0);

  // ── Render guards ──────────────────────────────────────────────────────────
  if (!hasSession || !sessionReady || !isOpen || shouldHide) return null;

  // ── Minimized pill ─────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-1 animate-in slide-in-from-bottom-2 lg:bottom-6 lg:right-6"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center rounded-full bg-primary text-primary-foreground/80 shadow-md cursor-grab',
            'hover:bg-primary/90 transition-all',
            isDragging && 'scale-95 opacity-80 cursor-grabbing'
          )}
          style={{ width: 24, height: 24, ...dragHandleProps.style }}
        >
          <GripVertical className="icon-sm" />
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer rounded-full bg-primary shadow-lg px-4 py-2.5 hover:bg-primary/90 hover:shadow-xl transition-all"
          onClick={restore}
        >
          <Bot className="icon-sm text-primary-foreground" />
          <span className="text-sm font-medium text-primary-foreground">
            <BilingualText en="Chat" el="Συνομιλία" compact />
          </span>
          {totalMsgUnread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-2xs font-bold text-white">
              {totalMsgUnread}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors"
          >
            <X className="icon-sm text-white/80" />
          </button>
        </div>
      </div>
    );
  }

  // ── Full popup ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={popupRef}
      tabIndex={-1}
      className="fixed z-50 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200 focus:outline-none bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6"
      style={{
        width: 'min(400px, calc(100vw - 2rem))',
        height: 'min(560px, calc(100dvh - 8.5rem))',
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-primary shrink-0">
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center rounded-md text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors cursor-grab',
            isDragging && 'text-white/90 bg-white/10 cursor-grabbing'
          )}
          style={{ width: 24, height: 24, ...dragHandleProps.style }}
        >
          <GripVertical className="icon-sm" />
        </div>

        <div className="flex-1 flex items-center gap-1 bg-white/10 rounded-full p-0.5">
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeTab === 'messages' ? 'bg-white text-status-accent' : 'text-white/80 hover:text-white hover:bg-white/10'
            )}
          >
            <MessageSquare className="icon-sm" />
            <BilingualText en="Messages" el="Μηνύματα" compact />
            {totalMsgUnread > 0 && (
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 text-white text-2xs font-bold px-1">
                {totalMsgUnread > 99 ? '99+' : totalMsgUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeTab === 'ai' ? 'bg-white text-status-accent' : 'text-white/80 hover:text-white hover:bg-white/10'
            )}
          >
            <Bot className="icon-sm" />
            <BilingualText en="AI Assistant" el="Βοηθός AI" compact />
          </button>
        </div>

        <button onClick={minimize} className="rounded-full p-1.5 hover:bg-white/20 transition-colors" aria-label={bilingualAria('Minimise chat', 'Ελαχιστοποίηση συνομιλίας')} title={bilingualAria('Minimise chat', 'Ελαχιστοποίηση συνομιλίας')}>
          <ChevronDown className="icon-sm text-white" />
        </button>
        <button onClick={close} className="rounded-full p-1.5 hover:bg-white/20 transition-colors" aria-label={bilingualAria('Close chat', 'Κλείσιμο συνομιλίας')} title={bilingualAria('Close chat', 'Κλείσιμο συνομιλίας')}>
          <X className="icon-sm text-white" />
        </button>
      </div>

      {/* ── AI Tab ── */}
      {activeTab === 'ai' && <CopilotWorkspace variant="popup" onExpand={handleAIExpand} />}

      {/* ── Messages Tab ── */}
      {activeTab === 'messages' && (
        <>
          {/* Thread sub-header */}
          {selected && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-card/80 shrink-0">
              <button
                onClick={() => { setSelected(null); setActiveConversationId(null); }}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="icon-sm" />
              </button>
              <div className="relative shrink-0">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={selected.recipientAvatar ?? undefined} />
                  <AvatarFallback className="text-2xs font-semibold bg-primary/15 text-primary-accessible">
                    {selected.recipientName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {selected.isOnline && (
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">{selected.recipientName}</p>
                <p className="text-2xs text-muted-foreground leading-tight">{selected.isOnline ? 'Online' : 'Offline'}</p>
              </div>
              <button
                onClick={handleExpandToFullPage}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Open full chat"
              >
                <Maximize2 className="icon-sm" />
              </button>
            </div>
          )}

          {isInitializing ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="icon-md text-muted-foreground animate-spin" />
            </div>
          ) : selected ? (
            /* Message thread */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scroll-smooth">
                {loadingMessages ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="icon-sm text-muted-foreground animate-spin" />
                  </div>
                ) : msgMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="icon-md text-primary-accessible" />
                    </div>
                    <p className="text-sm font-medium">Say hello!</p>
                    <p className="text-xs text-muted-foreground">Start a conversation with {selected.recipientName}</p>
                  </div>
                ) : (
                  <>
                    {msgMessages.map((msg, idx) => {
                      const isMe = msg.senderId === currentUserId;
                      const prevMsg = idx > 0 ? msgMessages[idx - 1] : null;
                      const showTime = !prevMsg || msg.timestamp.getTime() - prevMsg.timestamp.getTime() > 3 * 60000;
                      return (
                        <React.Fragment key={msg.id}>
                          {showTime && (
                            <div className="text-center py-1">
                              <span className="text-2xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className={cn('flex items-end gap-1.5', isMe ? 'flex-row-reverse' : 'flex-row')}>
                            {!isMe && (
                              <Avatar className="h-6 w-6 shrink-0 mb-0.5">
                                <AvatarImage src={selected.recipientAvatar ?? undefined} />
                                <AvatarFallback className="text-2xs bg-primary/15 text-primary-accessible">
                                  {selected.recipientName[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn(
                              'max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                              isMe ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted text-foreground',
                            )}>
                              {msg.content}
                            </div>
                            {isMe && (
                              <span className="text-muted-foreground mb-0.5">
                                {msg.status === 'sending' ? (
                                  <Loader2 className="icon-sm animate-spin" />
                                ) : msg.status === 'read' ? (
                                  <CheckCheck className="icon-sm text-primary-accessible" />
                                ) : (
                                  <Check className="icon-sm" />
                                )}
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                    {isTyping && <TypingIndicator />}
                    <div ref={msgEndRef} />
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-border/60 px-3 py-2.5 bg-card/80">
                <div className="flex items-center gap-2">
                  <Input
                    ref={msgInputRef}
                    value={msgInput}
                    onChange={e => handleMsgInputChange(e.target.value)}
                    onKeyDown={handleMsgKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 h-9 text-sm rounded-xl border-border/60 bg-background focus-visible:ring-1"
                  />
                  <Button
                    onClick={handleMsgSend}
                    disabled={!msgInput.trim() || !socketRef.current?.connected}
                    size="sm"
                    className="h-9 w-9 p-0 rounded-xl shrink-0"
                  >
                    <Send className="icon-sm" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Conversation list */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-3 pt-2.5 pb-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 icon-sm text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="pl-8 h-8 text-xs rounded-lg border-border/60 bg-muted/40"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2">
                {filteredConvos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="icon-md text-primary-accessible" />
                    </div>
                    <p className="text-sm font-medium">
                      {searchQuery ? 'No results' : 'No messages yet'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {searchQuery ? `Nothing matching "${searchQuery}"` : 'Connect with founders and mentors to start chatting'}
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

              <div className="shrink-0 border-t border-border/60 px-3 py-2">
                <button
                  onClick={handleExpandToFullPage}
                  className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 rounded-lg hover:bg-muted/40"
                >
                  <Maximize2 className="icon-sm" />
                  Open full messaging view
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
