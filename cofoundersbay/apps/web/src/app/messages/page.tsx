'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, UserPlus, MessageSquare } from 'lucide-react';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { ChatWindow, NoChatSelected, type Message } from '@/components/messaging/ChatWindow';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/common/RoleBadge';
import { AppShell } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  getOrCreateDirectConversation,
  listConversationMessages,
  listMessageConversations,
  updateConversationFlags,
  uploadMessageAttachment,
  listConnectionRequests,
  respondToConnectionRequest,
  type ConversationSummary,
  type MessageItem,
  type ConnectionRequestItem,
} from '@/lib/api';
import { createMessagingSocket, type ServerToClientEvents } from '@/lib/messagingSocket';

function mapConversation(s: ConversationSummary): Conversation {
  const lastAt = s.lastMessage?.createdAt ?? s.updatedAt;
  return {
    id: s.id,
    recipientId: s.recipient?.id ?? 'unknown',
    recipientName: s.recipient?.displayName ?? 'Unknown user',
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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'intros'>('chats');
  const [introRequests, setIntroRequests] = useState<ConnectionRequestItem[]>([]);
  const [introLoading, setIntroLoading] = useState(false);
  const [introResponding, setIntroResponding] = useState<Record<string, boolean>>({});

  const socketRef = useRef<ReturnType<typeof createMessagingSocket> | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string>('');

  const accessToken = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }, []);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversation?.id ?? null;
  }, [selectedConversation]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Bootstrap: auth, conversations, socket
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawUser = localStorage.getItem('user');
    if (!rawUser || !accessToken) {
      router.replace('/login');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as { id?: string };
      if (parsed?.id) setCurrentUserId(parsed.id);
    } catch {
      router.replace('/login');
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const { conversations: list } = await listMessageConversations();
        if (!mounted) return;
        setConversations(list.map(mapConversation));
      } catch (e) {
        if (!mounted) return;
        showError('Failed to load conversations', e instanceof Error ? e.message : 'Please try again');
      }
    };

    load();

    // Socket
    const s = createMessagingSocket(accessToken);
    socketRef.current = s;

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

    s.on('message:new', onNew);
    s.on('message:ack', onAck);
    s.on('typing:start', onTypingStart);
    s.on('typing:stop', onTypingStop);
    s.on('presence:update', onPresence);

    return () => {
      mounted = false;
      s.off('message:new', onNew);
      s.off('message:ack', onAck);
      s.off('typing:start', onTypingStart);
      s.off('typing:stop', onTypingStop);
      s.off('presence:update', onPresence);
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load pending intro (connection) requests
  const loadIntroRequests = useCallback(async () => {
    setIntroLoading(true);
    try {
      const { connections } = await listConnectionRequests({ type: 'received', limit: 50 });
      setIntroRequests(connections.filter((c) => c.status === 'pending'));
    } catch {
      // silently fail
    } finally {
      setIntroLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntroRequests();
  }, [loadIntroRequests]);

  const handleIntroRespond = async (id: string, action: 'accepted' | 'declined') => {
    setIntroResponding((prev) => ({ ...prev, [id]: true }));
    try {
      await respondToConnectionRequest(id, action);
      setIntroRequests((prev) => prev.filter((r) => r.id !== id));
      success(
        action === 'accepted' ? 'Connection accepted!' : 'Request declined',
        action === 'accepted' ? 'You can now message this person.' : undefined,
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

  // Handle URL param for direct messaging
  const toUserId = searchParams.get('to');
  const openConversationId = searchParams.get('c');
  useEffect(() => {
    if (!toUserId || !accessToken || openConversationId) return;

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
  }, [toUserId, accessToken, showError, openConversationId]);

  // Handle URL param for opening an existing conversation
  useEffect(() => {
    if (!openConversationId) return;
    const conv = conversations.find((c) => c.id === openConversationId);
    if (!conv) return;
    setSelectedConversation(conv);
    setIsMobileViewingChat(true);
    socketRef.current?.emit('conversation:join', { conversationId: conv.id });
  }, [openConversationId, conversations]);

  // Reset typing indicator when conversation changes
  useEffect(() => {
    setIsRecipientTyping(false);
  }, [selectedConversation?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
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
    }
  }, [selectedConversation, currentUserId, showError]);

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

  return (
    <AppShell fullHeight>
    <div className="flex h-full bg-background">
      {/* Messenger sidebar — conversations + intros */}
      <div
        className={cn(
          'w-full md:w-[320px] lg:w-[360px] border-r border-border/60 flex-shrink-0 flex flex-col bg-card',
          isMobileViewingChat && 'hidden md:flex'
        )}
      >
        <Tabs value={sidebarTab} onValueChange={(v) => setSidebarTab(v as 'chats' | 'intros')} className="flex flex-col h-full">
          <div className="px-4 pt-4 pb-0 border-b border-border/40 flex-shrink-0">
            <TabsList className="w-full">
              <TabsTrigger value="chats" className="flex-1 gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Chats
                {conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="intros" className="flex-1 gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Intros
                {pendingIntrosCount > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                    {pendingIntrosCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chats" className="flex-1 overflow-hidden mt-0">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?.id}
              onSelect={(conv) => {
                setSelectedConversation(conv);
                setIsMobileViewingChat(true);
              }}
              onNewMessage={() => {}}
              onPin={handlePin}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="intros" className="flex-1 overflow-y-auto mt-0">
            {introLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/40 bg-card/40 p-4 animate-pulse">
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
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="rounded-full bg-secondary p-3">
                  <UserPlus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No pending intros</p>
                <p className="text-xs text-muted-foreground">When someone sends you a connection request, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {introRequests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-border/50 bg-card/60 p-4 animate-fade-in"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={req.requester.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                          {req.requester.displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {req.requester.displayName}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <RoleBadge role={req.requester.role} size="sm" className="mt-0.5" />
                        {req.message && (
                          <p className="mt-2 text-xs text-foreground/70 leading-relaxed line-clamp-3 italic">
                            &ldquo;{req.message}&rdquo;
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 gap-1 text-xs px-3"
                            disabled={introResponding[req.id]}
                            onClick={() => handleIntroRespond(req.id, 'accepted')}
                          >
                            <Check className="h-3 w-3" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs px-3"
                            disabled={introResponding[req.id]}
                            onClick={() => handleIntroRespond(req.id, 'declined')}
                          >
                            <X className="h-3 w-3" />
                            Decline
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

      {/* Chat window */}
      <div
        className={cn(
          'flex-1 min-w-0',
          !isMobileViewingChat && 'hidden md:flex md:flex-col'
        )}
      >
        {selectedConversation ? (
          <ChatWindow
            conversation={{
              ...selectedConversation,
              recipientHeadline: undefined,
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
            onReport={() => showError('Report submitted', 'We will review this conversation')}
            onBlock={() => showError('User blocked', 'You will no longer receive messages from this user')}
          />
        ) : (
          <NoChatSelected />
        )}
      </div>
    </div>
    </AppShell>
  );
}
