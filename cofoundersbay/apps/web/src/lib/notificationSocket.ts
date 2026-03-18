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

/**
 * Returns (or creates) a singleton notification socket authenticated via
 * HttpOnly cfb_access cookie. withCredentials ensures cookies are sent on
 * the WebSocket handshake — no token should be passed from client JS.
 */
export function getNotificationSocket(): Socket<NotificationSocketEvents, Record<string, never>> {
  if (_socket && _socket.connected) return _socket;
  if (_socket) _socket.disconnect();
  _socket = io(`${getApiBase()}/notifications`, {
    withCredentials: true,
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
