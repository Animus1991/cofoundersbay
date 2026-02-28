import { io, type Socket } from 'socket.io-client';

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export type NotificationSocketEvents = {
  'notification:new': (payload: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    createdAt: string;
    readAt: string | null;
  }) => void;
};

let _socket: Socket<NotificationSocketEvents, Record<string, never>> | null = null;

export function getNotificationSocket(accessToken: string): Socket<NotificationSocketEvents, Record<string, never>> {
  if (_socket && _socket.connected) return _socket;
  if (_socket) _socket.disconnect();
  _socket = io(`${getApiBase()}/notifications`, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
  return _socket;
}

export function disconnectNotificationSocket() {
  _socket?.disconnect();
  _socket = null;
}
