import { io, type Socket } from 'socket.io-client';
import type { MessageItem } from './api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ServerToClientEvents = {
  'message:new': (payload: { message: MessageItem }) => void;
  'message:ack': (payload: { tempId: string | null; message: MessageItem }) => void;
};

export type ClientToServerEvents = {
  'message:send': (payload: {
    conversationId: string;
    body: string;
    tempId?: string;
    attachmentUploadIds?: string[];
  }) => void;
  'conversation:join': (payload: { conversationId: string }) => void;
};

export function createMessagingSocket(accessToken: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(API_BASE, {
    auth: { token: accessToken },
    transports: ['websocket'],
  });
}

