import { io, type Socket } from 'socket.io-client';
import type { MessageItem } from './api';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export type ServerToClientEvents = {
  'message:new': (payload: { message: MessageItem }) => void;
  'message:ack': (payload: { tempId: string | null; message: MessageItem }) => void;
  'typing:start': (payload: { conversationId: string; userId: string }) => void;
  'typing:stop': (payload: { conversationId: string; userId: string }) => void;
  'presence:update': (payload: { userId: string; isOnline: boolean }) => void;
};

export type ClientToServerEvents = {
  'message:send': (payload: {
    conversationId: string;
    body: string;
    tempId?: string;
    attachmentUploadIds?: string[];
  }) => void;
  'conversation:join': (payload: { conversationId: string }) => void;
  'typing:start': (payload: { conversationId: string }) => void;
  'typing:stop': (payload: { conversationId: string }) => void;
};

export function createMessagingSocket(accessToken?: string | null): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(getApiBase(), {
    auth: accessToken ? { token: accessToken } : undefined,
    withCredentials: true,
    transports: ['websocket'],
    // Reconnection: exponential backoff, give up after 8 attempts (~6 min total)
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 3_000,      // 3 s initial delay
    reconnectionDelayMax: 60_000,  // 60 s maximum delay
    randomizationFactor: 0.4,      // ±40% jitter prevents thundering herd
    timeout: 10_000,
  });
}

