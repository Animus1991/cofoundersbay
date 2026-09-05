import { io, type Socket } from 'socket.io-client';
import type { MessageItem } from './api';
import { isApiCircuitOpen } from './api';
import { getSocketOrigin } from './api-origin';

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
  const circuitOpen = isApiCircuitOpen();
  return io(getSocketOrigin(), {
    auth: accessToken ? { token: accessToken } : undefined,
    withCredentials: true,
    transports: ['websocket'],
    autoConnect: !circuitOpen,
    reconnection: true,
    reconnectionAttempts: circuitOpen ? 0 : 8,
    reconnectionDelay: 3_000,
    reconnectionDelayMax: 60_000,
    randomizationFactor: 0.4,
    timeout: 10_000,
  });
}
