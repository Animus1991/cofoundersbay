'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { ChatWindow, NoChatSelected, type Message } from '@/components/messaging/ChatWindow';
import { ReportBlockModal } from '@/components/common/ReportBlockModal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/common/RoleBadge';
import { AppShell } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/toast';
import { BilingualText } from '@/components/common/BilingualText';
import { PageContextualHelp } from '@/components/common/PageContextualHelp';
import { CfbGlyph, CfbGlyphWell } from '@/components/icons/CfbGlyph';
import { ThreadAvatar } from '@/components/messaging/ThreadAvatar';
import { messagesEn, messagesEl, useMessagesPrimaryText } from '@/lib/i18n/strings-messages';
import { bilingualAria } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import { usePopupChat } from '@/contexts/PopupChatContext';
import { ComposeMessageDialog, candidatesFromInbox } from './ComposeMessageDialog';
import {
  getOrCreateDirectConversation,
  listConversationMessages,
  listMessageConversations,
  updateConversationFlags,
  uploadMessageAttachment,
  listConnectionRequests,
  respondToConnectionRequest,
  getMe,
  ApiError,
  type ConversationSummary,
  type MessageItem,
  type ConnectionRequestItem,
} from '@/lib/api';
import { createMessagingSocket, type ServerToClientEvents } from '@/lib/messagingSocket';
import { useSession } from '@/hooks/useSession';
import { isPreviewDemo } from '@/lib/preview-demo';
import { useMessaging } from '@/contexts/MessagingContext';
import type { ConversationValidationState } from '@/components/messaging/ConversationValidation';

function mapConversation(s: ConversationSummary): Conversation {
  const lastAt = s.lastMessage?.createdAt ?? s.updatedAt;
  return {
    id: s.id,
    recipientId: s.recipient?.id ?? 'unknown',
    recipientName: s.recipient?.displayName ?? 'Unknown user',
    recipientAvatar: s.recipient?.avatarUrl ?? null,
    recipientRole: s.recipient?.role || 'founder',
    recipientHeadline: s.recipient?.headline ?? null,
    lastMessage: s.lastMessage?.body ?? '',
    lastMessageTime: new Date(lastAt),
    unreadCount: s.unreadCount ?? 0,
    isPinned: s.isPinned ?? false,
    isArchived: s.isArchived ?? false,
    isOnline: s.recipient?.isOnline ?? false,
  };
}

function mapMessage(m: MessageItem, currentUserId: string): Message {
  return {
    id: m.id,
    senderId: m.senderId,
    content: m.body,
    timestamp: new Date(m.createdAt),
    status: m.senderId === currentUserId ? 'sent' : 'read',
    attachments: m.attachments?.length
      ? m.attachments.map((a) => ({
          type: a.mimeType ?? 'file',
          url: a.url,
          name: a.fileName ?? 'attachment',
        }))
      : undefined,
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  const t = useMessagesPrimaryText();
  const { open: openAskAi } = usePopupChat();
  const { hasSession, mounted: sessionReady } = useSession();
  const canUseMessaging = sessionReady && hasSession;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'intros'>('chats');
  const [introRequests, setIntroRequests] = useState<ConnectionRequestItem[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<ConnectionRequestItem[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [introLoading, setIntroLoading] = useState(false);
  const [introResponding, setIntroResponding] = useState<Record<string, boolean>>({});
  const [reportBlockModal, setReportBlockModal] = useState<{ open: boolean; mode: 'report' | 'block' | 'both' }>({ open: false, mode: 'both' });
  const [validationStates, setValidationStates] = useState<Record<string, ConversationValidationState>>({});
  const { setActiveConversationId, markConversationRead } = useMessaging();

  useEffect(() => {
    return () => { setActiveConversationId(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const socketRef = useRef<ReturnType<typeof createMessagingSocket> | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>('');

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Bootstrap: auth, conversations, socket
  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    if (!hasSession && !isPreviewDemo()) {
      router.replace('/login');
      return;
    }

    let mounted = true;
    let socket: ReturnType<typeof createMessagingSocket> | null = null;

    const onNew: ServerToClientEvents['message:new'] = ({ message }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== message.conversationId) return c;
          const isSelected = selectedConversationIdRef.current === c.id;
          return {
            ...c,
            lastMessage: message.body,
            lastMessageTime: new Date(message.createdAt),
            unreadCount: isSelected ? 0 : (c.unreadCount ?? 0) + 1,
          };
        }),
      );

      if (selectedConversationIdRef.current === message.conversationId) {
        setMessages((prev) => [...prev, mapMessage(message, currentUserIdRef.current)]);
      }
    };

    const onAck: ServerToClientEvents['message:ack'] = ({ tempId, message }) => {
      if (!tempId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: message.id,
                timestamp: new Date(message.createdAt),
                status: 'sent',
                attachments: mapMessage(message, currentUserIdRef.current).attachments,
              }
            : m,
        ),
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversationId
            ? { ...c, lastMessage: message.body, lastMessageTime: new Date(message.createdAt), unreadCount: 0 }
            : c,
        ),
      );
    };

    const onTypingStart: ServerToClientEvents['typing:start'] = ({ conversationId }) => {
      if (selectedConversationIdRef.current === conversationId) {
        setIsRecipientTyping(true);
      }
    };

    const onTypingStop: ServerToClientEvents['typing:stop'] = ({ conversationId }) => {
      if (selectedConversationIdRef.current === conversationId) {
        setIsRecipientTyping(false);
      }
    };

    const onPresence: ServerToClientEvents['presence:update'] = ({ userId, isOnline }) => {
      setConversations((prev) =>
        prev.map((c) => (c.recipientId === userId ? { ...c, isOnline } : c))
      );
    };

    const bootstrap = async () => {
      try {
        const rawUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        let resolvedUserId = '';

        if (rawUser) {
          try {
            resolvedUserId = (JSON.parse(rawUser) as { id?: string }).id ?? '';
          } catch {
            resolvedUserId = '';
          }
        }

        if (!resolvedUserId) {
          const { user } = await getMe();
          resolvedUserId = user.id;

          if (typeof window !== 'undefined') {
            let fallbackUser: Record<string, unknown> = {};
            if (rawUser) {
              try {
                fallbackUser = JSON.parse(rawUser) as Record<string, unknown>;
              } catch {
                fallbackUser = {};
              }
            }
            localStorage.setItem('user', JSON.stringify({
              ...fallbackUser,
              id: user.id,
              email: fallbackUser.email ?? user.email,
              role: fallbackUser.role ?? user.role,
            }));
            window.dispatchEvent(new CustomEvent('cfb:user'));
          }
        }

        if (!mounted) return;
        setCurrentUserId(resolvedUserId);

        const { conversations: list } = await listMessageConversations();
        if (!mounted) return;
        setConversations(list.map(mapConversation));

        socket = createMessagingSocket();
        socketRef.current = socket;
        socket.on('message:new', onNew);
        socket.on('message:ack', onAck);
        socket.on('typing:start', onTypingStart);
        socket.on('typing:stop', onTypingStop);
        socket.on('presence:update', onPresence);
      } catch (error) {
        if (!mounted) return;
        if (error instanceof ApiError && error.status === 401 && !isPreviewDemo()) {
          router.replace('/login');
          return;
        }
        const previewDemo =
          typeof document !== 'undefined' &&
          (document.cookie.includes('cfb_preview_demo=1') ||
            window.localStorage.getItem('cfb_demo_data') === '1');
        if (!previewDemo) {
          showError('Failed to initialize messages', error instanceof Error ? error.message : 'Please try again');
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
      socket?.off('message:new', onNew);
      socket?.off('message:ack', onAck);
      socket?.off('typing:start', onTypingStart);
      socket?.off('typing:stop', onTypingStop);
      socket?.off('presence:update', onPresence);
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [hasSession, router, sessionReady, showError]);

  // Load pending intro (connection) requests
  const loadIntroRequests = useCallback(async () => {
    if (!canUseMessaging) {
      return;
    }

    setIntroLoading(true);
    try {
      const [{ connections: received }, { connections: accepted }] = await Promise.all([
        listConnectionRequests({ type: 'received', limit: 50 }),
        listConnectionRequests({ type: 'accepted', limit: 50 }),
      ]);
      setIntroRequests(received.filter((c) => c.status === 'pending'));
      setAcceptedConnections(accepted.filter((c) => c.status === 'accepted'));
    } catch {
      // silently fail
    } finally {
      setIntroLoading(false);
    }
  }, [canUseMessaging]);

  useEffect(() => {
    if (!canUseMessaging) {
      return;
    }

    loadIntroRequests();
  }, [canUseMessaging, loadIntroRequests]);

  const handleIntroRespond = async (id: string, action: 'accepted' | 'declined') => {
    setIntroResponding((prev) => ({ ...prev, [id]: true }));
    try {
      await respondToConnectionRequest(id, action);
      setIntroRequests((prev) => prev.filter((r) => r.id !== id));
      success(
        action === 'accepted'
          ? t(messagesEn('connection_accepted'), messagesEl('connection_accepted'))
          : t(messagesEn('request_declined'), messagesEl('request_declined')),
        action === 'accepted'
          ? t(messagesEn('connection_accepted_hint'), messagesEl('connection_accepted_hint'))
          : undefined,
      );
      if (action === 'accepted') {
        const { connections: updated } = await listConnectionRequests({ type: 'received', limit: 50 });
        const accepted = updated.find((c) => c.id === id);
        if (accepted) {
          const { conversationId } = await getOrCreateDirectConversation(accepted.requesterId);
          const { conversations: list } = await listMessageConversations();
          const mapped = list.map(mapConversation);
          setConversations(mapped);
          const conv = mapped.find((c) => c.id === conversationId);
          if (conv) {
            setSidebarTab('chats');
            setSelectedConversation(conv);
            setIsMobileViewingChat(true);
          }
        }
      }
    } catch (e) {
      showError('Action failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setIntroResponding((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleComposePick = async (userId: string) => {
    setComposeOpen(false);
    try {
      const { conversationId } = await getOrCreateDirectConversation(userId);
      socketRef.current?.emit('conversation:join', { conversationId });
      const { conversations: list } = await listMessageConversations();
      const mapped = list.map(mapConversation);
      setConversations(mapped);
      const conv = mapped.find((c) => c.id === conversationId);
      if (conv) {
        setSidebarTab('chats');
        setSelectedConversation(conv);
        setActiveConversationId(conv.id);
        setIsMobileViewingChat(true);
      }
    } catch (e) {
      showError(
        t(messagesEn('start_fail'), messagesEl('start_fail')),
        e instanceof Error ? e.message : t(messagesEn('try_again'), messagesEl('try_again')),
      );
    }
  };

  // Handle URL param for direct messaging
  const toUserId = searchParams?.get('to');
  const openConversationId = searchParams?.get('c');
  useEffect(() => {
    if (!canUseMessaging || !toUserId || openConversationId) return;

    let cancelled = false;
    const run = async () => {
      try {
        const { conversationId } = await getOrCreateDirectConversation(toUserId);
        socketRef.current?.emit('conversation:join', { conversationId });

        const { conversations: list } = await listMessageConversations();
        if (cancelled) return;
        const mapped = list.map(mapConversation);
        setConversations(mapped);
        const conv = mapped.find((c) => c.id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
          setIsMobileViewingChat(true);
        }
      } catch (e) {
        if (cancelled) return;
        showError('Could not start conversation', e instanceof Error ? e.message : 'Please try again');
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [canUseMessaging, toUserId, showError, openConversationId]);

  // Handle URL param for opening an existing conversation
  useEffect(() => {
    if (!canUseMessaging || !openConversationId) return;
    const conv = conversations.find((c) => c.id === openConversationId);
    if (!conv) return;
    setSelectedConversation(conv);
    setIsMobileViewingChat(true);
    socketRef.current?.emit('conversation:join', { conversationId: conv.id });
  }, [canUseMessaging, openConversationId, conversations]);

  // Reset typing indicator when conversation changes
  useEffect(() => {
    setIsRecipientTyping(false);
  }, [selectedConversation?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!canUseMessaging || !selectedConversation) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        const { messages: list } = await listConversationMessages(selectedConversation.id, 200);
        if (cancelled) return;
        setMessages(list.map((m) => mapMessage(m, currentUserId)));
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c)),
        );
        socketRef.current?.emit('conversation:join', { conversationId: selectedConversation.id });
      } catch (e) {
        if (cancelled) return;
        showError('Failed to load messages', e instanceof Error ? e.message : 'Please try again');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [canUseMessaging, selectedConversation, currentUserId, showError]);

  // Typing indicator emit
  const handleTypingStart = useCallback(() => {
    if (selectedConversation) {
      socketRef.current?.emit('typing:start', { conversationId: selectedConversation.id });
    }
  }, [selectedConversation]);

  const handleTypingStop = useCallback(() => {
    if (selectedConversation) {
      socketRef.current?.emit('typing:stop', { conversationId: selectedConversation.id });
    }
  }, [selectedConversation]);

  // Handle send message
  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!selectedConversation) return;
    const s = socketRef.current;
    if (!s || !s.connected) {
      showError('Not connected', 'Reconnect and try again');
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const newMessage: Message = {
      id: tempId,
      senderId: currentUserId,
      content,
      timestamp: new Date(),
      status: 'sending',
      attachments: attachments?.length
        ? attachments.slice(0, 5).map((f) => ({ type: f.type || 'file', url: '', name: f.name }))
        : undefined,
    };

    setMessages((prev) => [...prev, newMessage]);

    let attachmentUploadIds: string[] | undefined = undefined;
    if (attachments?.length) {
      const results = await Promise.allSettled(attachments.slice(0, 5).map((f) => uploadMessageAttachment(f)));
      const ok = results
        .map((r) => (r.status === 'fulfilled' ? r.value.upload : null))
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const failed = results.some((r) => r.status === 'rejected');
      if (failed) {
        showError('Some attachments failed', 'Message will be sent with uploaded files only');
      }

      const mapped = ok.map((u) => ({
        type: u.mimeType ?? 'file',
        url: u.url,
        name: u.originalName ?? 'attachment',
      }));

      attachmentUploadIds = ok.length ? ok.map((u) => u.id) : undefined;

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, attachments: mapped.length ? mapped : undefined } : m)),
      );
    }

    s.emit('message:send', {
      conversationId: selectedConversation.id,
      body: content,
      tempId,
      attachmentUploadIds,
    });

    // Update conversation last message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, lastMessage: content, lastMessageTime: new Date() }
          : c
      )
    );
  };

  // Handle pin
  const handlePin = async (id: string) => {
    const nextPinned = !conversations.find((c) => c.id === id)?.isPinned;
    try {
      await updateConversationFlags(id, { isPinned: nextPinned });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: nextPinned } : c)),
      );
      success('Conversation updated', nextPinned ? 'Pinned' : 'Unpinned');
    } catch (e) {
      showError('Update failed', e instanceof Error ? e.message : 'Please try again');
    }
  };

  // Handle archive
  const handleArchive = async (id: string) => {
    try {
      await updateConversationFlags(id, { isArchived: true });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isArchived: true } : c)));
      if (selectedConversation?.id === id) setSelectedConversation(null);
      success('Conversation archived', 'It will be hidden from your inbox');
    } catch (e) {
      showError('Update failed', e instanceof Error ? e.message : 'Please try again');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    // For V1 we soft-delete by archiving
    await handleArchive(id);
  };

  const pendingIntrosCount = introRequests.length;
  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const composeCandidates = candidatesFromInbox(conversations, acceptedConnections, currentUserId);

  if (!canUseMessaging) {
    return (
      <AppShell fullHeight contentClassName="min-h-0">
        <div className="flex flex-1 items-center justify-center bg-background/40">
          <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
            <BilingualText en={messagesEn('preparing')} el={messagesEl('preparing')} />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell fullHeight contentClassName="min-h-0">
      <div className="flex h-full min-h-0 flex-col p-2 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:p-3 lg:p-4 lg:pb-4">
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[0_24px_64px_-28px_hsl(var(--foreground)/0.35)]">
          <div
            className={cn(
              'flex w-full shrink-0 flex-col border-r border-border/40 bg-muted/40 md:w-[340px] lg:w-[392px]',
              isMobileViewingChat && 'hidden md:flex',
            )}
          >
            <div className="shrink-0 space-y-3 px-4 pb-3 pt-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    <BilingualText en={messagesEn('page_title')} el={messagesEl('page_title')} />
                  </h1>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    <BilingualText en={messagesEn('inbox_lead')} el={messagesEl('inbox_lead')} />
                  </p>
                </div>
                <PageContextualHelp defaultOpen={false} compact />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs shadow-sm"
                  onClick={() => setComposeOpen(true)}
                  aria-label={bilingualAria(messagesEn('new_message'), messagesEl('new_message'))}
                >
                  <CfbGlyph name="messages" className="icon-sm" />
                  {/* Inside a filled primary button the secondary line's default
                      muted colour measures 2.07:1, so it takes the button's own
                      foreground instead. */}
                  <BilingualText
                    en={messagesEn('new_message')}
                    el={messagesEl('new_message')}
                    compact
                    secondaryClassName="text-primary-foreground"
                  />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => openAskAi()}
                className="flex w-full items-center gap-2.5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background/40 to-accent/10 px-3 py-2 text-left shadow-sm transition-colors hover:border-primary/35 hover:from-primary/15"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary-accessible">
                  <CfbGlyph name="spark" className="icon-sm" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground">
                    <BilingualText en={messagesEn('ask_ai')} el={messagesEl('ask_ai')} compact />
                  </span>
                  <span className="block truncate text-2xs text-muted-foreground">
                    <BilingualText en={messagesEn('ask_ai_hint')} el={messagesEl('ask_ai_hint')} compact />
                  </span>
                </span>
              </button>
            </div>
            <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'chats' | 'intros')} className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 px-3 pb-1">
                <TabsList className="h-11 w-full rounded-full bg-background/70 p-1 shadow-sm ring-1 ring-border/40">
                  <TabsTrigger value="chats" className="flex-1 gap-1.5 rounded-full data-[state=active]:shadow-sm">
                    <CfbGlyph name="messages" className="icon-sm" />
                    <BilingualText en={messagesEn('chats')} el={messagesEl('chats')} compact />
                    {unreadTotal > 0 && (
                      <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
                        {unreadTotal > 99 ? '99+' : unreadTotal}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="intros" className="flex-1 gap-1.5 rounded-full data-[state=active]:shadow-sm">
                    <CfbGlyph name="people" className="icon-sm" />
                    <BilingualText en={messagesEn('intros')} el={messagesEl('intros')} compact />
                    {pendingIntrosCount > 0 && (
                      <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-2xs font-bold text-accent-foreground">
                        {pendingIntrosCount > 99 ? '99+' : pendingIntrosCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chats" className="mt-0 min-h-0 flex-1 overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  selectedId={selectedConversation?.id}
                  onSelect={(conv) => {
                    setSelectedConversation(conv);
                    setActiveConversationId(conv.id);
                    markConversationRead(conv.id);
                    setIsMobileViewingChat(true);
                  }}
                  onNewMessage={() => setComposeOpen(true)}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              </TabsContent>

              <TabsContent value="intros" className="mt-0 min-h-0 flex-1 overflow-y-auto">
                {introLoading ? (
                  <div className="space-y-3 p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse rounded-2xl bg-background/60 p-4 ring-1 ring-border/40">
                        <div className="flex gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-24 rounded bg-secondary" />
                            <div className="h-3 w-full rounded bg-secondary" />
                            <div className="h-3 w-3/4 rounded bg-secondary" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : introRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                    <CfbGlyphWell name="people" size="md" />
                    <p className="text-sm font-medium text-foreground">
                      <BilingualText en={messagesEn('no_pending')} el={messagesEl('no_pending')} />
                    </p>
                    <p className="max-w-[16rem] text-xs text-muted-foreground">
                      <BilingualText en={messagesEn('intro_empty_hint')} el={messagesEl('intro_empty_hint')} />
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {introRequests.map((req) => (
                      <div
                        key={req.id}
                        className="animate-fade-in rounded-2xl bg-background/80 p-4 shadow-sm ring-1 ring-border/50"
                      >
                        <div className="flex items-start gap-3">
                          <ThreadAvatar
                            name={req.requester.displayName}
                            src={req.requester?.avatarUrl}
                            seed={req.requester.id}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                {req.requester.displayName}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <RoleBadge role={req.requester?.role || 'founder'} size="sm" className="mt-0.5" />
                            {req.message && (
                              <p className="mt-2 line-clamp-3 text-xs italic leading-relaxed text-foreground/70">
                                &ldquo;{req.message}&rdquo;
                              </p>
                            )}
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="h-7 gap-1 rounded-full px-3 text-xs"
                                disabled={introResponding[req.id]}
                                onClick={() => handleIntroRespond(req.id, 'accepted')}
                              >
                                <Check className="icon-sm" />
                                <BilingualText en={messagesEn('accept')} el={messagesEl('accept')} compact />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 rounded-full px-3 text-xs"
                                disabled={introResponding[req.id]}
                                onClick={() => handleIntroRespond(req.id, 'declined')}
                              >
                                <X className="icon-sm" />
                                <BilingualText en={messagesEn('decline')} el={messagesEl('decline')} compact />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div
            className={cn(
              'flex h-full min-w-0 flex-1 flex-col',
              !isMobileViewingChat && 'hidden md:flex',
            )}
          >
            {selectedConversation ? (
              <>
                <ChatWindow
                  conversation={{
                    ...selectedConversation,
                    recipientHeadline: selectedConversation.recipientHeadline,
                    lastSeen: undefined,
                  }}
                  messages={messages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onTypingStart={handleTypingStart}
                  onTypingStop={handleTypingStop}
                  isRecipientTyping={isRecipientTyping}
                  onBack={() => {
                    setIsMobileViewingChat(false);
                  }}
                  onReport={() => setReportBlockModal({ open: true, mode: 'report' })}
                  onBlock={() => setReportBlockModal({ open: true, mode: 'block' })}
                  validationState={validationStates[selectedConversation.id] ?? {
                    mode: 'casual' as const,
                    initiatedBy: null,
                    initiatedAt: null,
                    acceptedBy: null,
                    acceptedAt: null,
                    lastValidatedAt: null,
                    validationHash: null,
                    transcriptAvailable: false,
                  }}
                  onValidationModeChange={(mode) => {
                    setValidationStates((prev) => ({
                      ...prev,
                      [selectedConversation.id]: {
                        ...(prev[selectedConversation.id] ?? {
                          mode: 'casual' as const,
                          initiatedBy: null,
                          initiatedAt: null,
                          acceptedBy: null,
                          acceptedAt: null,
                          lastValidatedAt: null,
                          validationHash: null,
                          transcriptAvailable: false,
                        }),
                        mode,
                        initiatedBy: mode !== 'casual' ? currentUserId : null,
                        initiatedAt: mode !== 'casual' ? new Date().toISOString() : null,
                        transcriptAvailable: mode !== 'casual',
                      },
                    }));
                  }}
                />
                <ReportBlockModal
                  open={reportBlockModal.open}
                  onOpenChange={(open) => setReportBlockModal((prev) => ({ ...prev, open }))}
                  userId={selectedConversation.recipientId}
                  userName={selectedConversation.recipientName}
                  mode={reportBlockModal.mode}
                  onBlocked={(blockedUserId) => {
                    setConversations((prev) => prev.filter((conversation) => conversation.recipientId !== blockedUserId));
                    setSelectedConversation((current) =>
                      current?.recipientId === blockedUserId ? null : current,
                    );
                    setMessages((prev) =>
                      selectedConversation?.recipientId === blockedUserId ? [] : prev,
                    );
                    setIsMobileViewingChat(false);
                  }}
                />
              </>
            ) : (
              <NoChatSelected onNewMessage={() => setComposeOpen(true)} />
            )}
          </div>
        </div>
      </div>

      <ComposeMessageDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        candidates={composeCandidates}
        onPick={(userId) => void handleComposePick(userId)}
      />
    </AppShell>
  );
}
