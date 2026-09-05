'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import {
  MessageSquare,
  Bot,
  X,
  ChevronDown,
  Send,
  Loader2,
  RefreshCw,
  Trash2,
  GripVertical,
  ChevronRight,
  ArrowLeft,
  Search,
  MessageCircle,
  Maximize2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDraggable } from '@/hooks/useDraggable';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAIChat, AIMessage } from '@/hooks/useAIChat';
import { getAgentIcon } from '@/lib/ai-api';
import {
  getMe, listMessageConversations, listConversationMessages,
  getOrCreateDirectConversation,
  type ConversationSummary, type MessageItem,
} from '@/lib/api';
import { createMessagingSocket, type ServerToClientEvents } from '@/lib/messagingSocket';
import type { Conversation } from '@/components/messaging/ConversationList';

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

// ── AI sub-components ──────────────────────────────────────────────────────────

interface AgentSelectorProps {
  agents: Array<{ id: string; name: string; description: string }>;
  currentAgent: string;
  onSelect: (agentId: string) => void;
}

function AgentSelector({ agents, currentAgent, onSelect }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = agents.find((a) => a.id === currentAgent);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
      >
        <span>{getAgentIcon(currentAgent)}</span>
        <span>{current?.name || 'Assistant'}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => { onSelect(agent.id); setIsOpen(false); }}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors',
                  agent.id === currentAgent && 'bg-muted/50'
                )}
              >
                <span className="text-lg">{getAgentIcon(agent.id)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{agent.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{agent.description}</div>
                </div>
                {agent.id === currentAgent && (
                  <ChevronRight className="h-4 w-4 text-violet-500 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AIMessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-2', isUser && 'flex-row-reverse')}>
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
      )}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className={cn(
        'flex-1 rounded-2xl px-3 py-2 max-w-[85%] text-sm',
        isUser ? 'rounded-tr-sm bg-primary text-primary-foreground ml-auto' : 'rounded-tl-sm bg-muted/60'
      )}>
        {message.isStreaming && !message.content ? (
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs text-muted-foreground">Thinking...</span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {message.content.split('**').map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>
        )}
        {message.model && !message.isStreaming && (
          <div className="text-[10px] text-muted-foreground mt-1 opacity-60">{message.model}</div>
        )}
      </div>
    </div>
  );
}

function QuickActions({ questions, onSelect }: { questions: string[]; onSelect: (q: string) => void }) {
  if (!questions.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2">
      {questions.slice(0, 4).map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted transition-colors"
        >
          {q}
        </button>
      ))}
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

  // ── AI state ───────────────────────────────────────────────────────────────
  const [aiInput, setAiInput] = useState('');
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const {
    messages: aiMessages,
    isStreaming,
    agents,
    currentAgent,
    isAIAvailable,
    sendMessage: sendAIMessage,
    setAgent,
    clearMessages,
    retryLastMessage,
  } = useAIChat({ agentId: 'general' });
  const agentList = agents ?? [];

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
    pathname?.startsWith('/reset-password');

  // ── AI effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'ai') {
      setTimeout(() => aiInputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, activeTab]);

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

  const handleAISubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isStreaming) return;
    sendAIMessage(aiInput);
    setAiInput('');
  }, [aiInput, isStreaming, sendAIMessage]);

  const handleExpandToFullPage = useCallback(() => {
    const url = selected ? `/messages?c=${selected.id}` : '/messages';
    close();
    router.push(url);
  }, [selected, close, router]);

  // Derived
  const currentAgentConfig = agentList.find((a) => a.id === currentAgent);
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
            'flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-white/80 shadow-md cursor-grab',
            'hover:from-violet-500 hover:to-purple-600 transition-all',
            isDragging && 'scale-95 opacity-80 cursor-grabbing'
          )}
          style={{ width: 24, height: 24, ...dragHandleProps.style }}
        >
          <GripVertical className="h-3 w-3" />
        </div>
        <div
          className="flex items-center gap-2 cursor-pointer rounded-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg px-4 py-2.5 hover:shadow-xl transition-all"
          onClick={restore}
        >
          <Bot className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">Chat</span>
          {(totalMsgUnread > 0 || aiMessages.length > 0) && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold text-white">
              {totalMsgUnread > 0 ? totalMsgUnread : aiMessages.length}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="ml-1 rounded-full p-0.5 hover:bg-white/20 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white/80" />
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
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-gradient-to-r from-violet-500 to-purple-600 shrink-0">
        <div
          {...dragHandleProps}
          className={cn(
            'flex items-center justify-center rounded-md text-white/60 hover:text-white/90 hover:bg-white/10 transition-colors cursor-grab',
            isDragging && 'text-white/90 bg-white/10 cursor-grabbing'
          )}
          style={{ width: 24, height: 24, ...dragHandleProps.style }}
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 flex items-center gap-1 bg-white/10 rounded-full p-0.5">
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeTab === 'messages' ? 'bg-white text-violet-600' : 'text-white/80 hover:text-white hover:bg-white/10'
            )}
          >
            <MessageSquare className="h-3 w-3" />
            Messages
            {totalMsgUnread > 0 && (
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
                {totalMsgUnread > 99 ? '99+' : totalMsgUnread}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all',
              activeTab === 'ai' ? 'bg-white text-violet-600' : 'text-white/80 hover:text-white hover:bg-white/10'
            )}
          >
            <Bot className="h-3 w-3" />
            AI Assistant
            {!isAIAvailable && (
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" title="Limited mode" />
            )}
          </button>
        </div>

        <button onClick={minimize} className="rounded-full p-1.5 hover:bg-white/20 transition-colors">
          <ChevronDown className="h-4 w-4 text-white" />
        </button>
        <button onClick={close} className="rounded-full p-1.5 hover:bg-white/20 transition-colors">
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* ── AI Tab ── */}
      {activeTab === 'ai' && (
        <>
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30 shrink-0">
            <AgentSelector agents={agentList} currentAgent={currentAgent} onSelect={setAgent} />
            <div className="flex items-center gap-1">
              {aiMessages.length > 0 && (
                <>
                  <button onClick={retryLastMessage} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Retry last message">
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={clearMessages} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Clear conversation">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {aiMessages.length === 0 ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                    {getAgentIcon(currentAgent)}
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-muted/60 px-3 py-2">
                    <p className="text-sm">
                      Hi! 👋 I'm your {currentAgentConfig?.name || 'AI Assistant'}.
                      {currentAgentConfig?.description && (
                        <span className="text-muted-foreground"> {currentAgentConfig.description}</span>
                      )}
                    </p>
                  </div>
                </div>
                {currentAgentConfig?.suggestedQuestions && (
                  <QuickActions questions={currentAgentConfig.suggestedQuestions} onSelect={sendAIMessage} />
                )}
              </div>
            ) : (
              aiMessages.map((msg) => <AIMessageBubble key={msg.id} message={msg} />)
            )}
            <div ref={aiMessagesEndRef} />
          </div>

          <form onSubmit={handleAISubmit} className="border-t border-border/60 p-3 shrink-0">
            <div className="flex items-center gap-2">
              <Input
                ref={aiInputRef}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 h-10 rounded-full bg-muted/50 border-0 px-4 text-sm focus-visible:ring-1 focus-visible:ring-violet-500"
                disabled={isStreaming}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!aiInput.trim() || isStreaming}
                className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {isAIAvailable ? <>Powered by local AI • Your data stays private</> : <>AI running in limited mode</>}
            </p>
          </form>
        </>
      )}

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
                <p className="text-sm font-semibold text-foreground truncate leading-tight">{selected.recipientName}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{selected.isOnline ? 'Online' : 'Offline'}</p>
              </div>
              <button
                onClick={handleExpandToFullPage}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Open full chat"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {isInitializing ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            </div>
          ) : selected ? (
            /* Message thread */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scroll-smooth">
                {loadingMessages ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  </div>
                ) : msgMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-primary" />
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
                            <div className={cn(
                              'max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                              isMe ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted text-foreground',
                            )}>
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
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Conversation list */
            <div className="flex-1 flex flex-col min-h-0">
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

              <div className="flex-1 overflow-y-auto px-2 pb-2">
                {filteredConvos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-primary" />
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
                  <Maximize2 className="h-3.5 w-3.5" />
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
