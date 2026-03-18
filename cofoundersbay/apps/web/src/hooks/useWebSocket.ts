import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
  });

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setState((prev) => ({ ...prev, connecting: true, error: null }));

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setState({ connected: false, connecting: false, error: new Error('No auth token') });
      return;
    }

    const socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setState({ connected: true, connecting: false, error: null });
      onConnect?.();
    });

    socket.on('disconnect', () => {
      setState({ connected: false, connecting: false, error: null });
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      setState({ connected: false, connecting: false, error });
      onError?.(error);
    });

    socketRef.current = socket;
  }, [url, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState({ connected: false, connecting: false, error: null });
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    ...state,
    connect,
    disconnect,
    emit,
    on,
  };
}
