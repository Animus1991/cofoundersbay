'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConversationList, type Conversation } from '@/components/messaging/ConversationList';
import { ChatWindow, NoChatSelected, type Message } from '@/components/messaging/ChatWindow';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  getOrCreateDirectConversation,
  listConversationMessages,
  listMessageConversations,
  updateConversationFlags,
  uploadMessageAttachment,
  type ConversationSummary,
  type MessageItem,
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

    s.on('message:new', onNew);
    s.on('message:ack', onAck);

    return () => {
      mounted = false;
      s.off('message:new', onNew);
      s.off('message:ack', onAck);
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="flex h-screen bg-background">
      {/* Conversation list - hidden on mobile when viewing chat */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 border-r border-border/60 flex-shrink-0',
          isMobileViewingChat && 'hidden md:block'
        )}
      >
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
      </div>

      {/* Chat window */}
      <div
        className={cn(
          'flex-1',
          !isMobileViewingChat && 'hidden md:block'
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
  );
}
