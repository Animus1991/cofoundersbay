import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface CollaboratorPresence {
  odId: string;
  odName: string;
  avatarUrl?: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number; sectionKey?: string };
}

export interface BuilderSocketEvents {
  // Connection
  onConnected?: (data: { odId: string; odName: string }) => void;
  onError?: (error: { message: string }) => void;

  // Workspace events
  onMemberJoined?: (data: { odId: string; odName: string }) => void;
  onMemberLeft?: (data: { odId: string; odName: string }) => void;

  // Document events
  onCollaboratorJoined?: (data: CollaboratorPresence) => void;
  onCollaboratorLeft?: (data: { odId: string; odName: string }) => void;

  // Cursor & selection
  onCursorMoved?: (data: { odId: string; x: number; y: number }) => void;
  onSelectionChanged?: (data: { odId: string; start: number; end: number; sectionKey?: string }) => void;

  // Content updates
  onContentUpdated?: (data: {
    odId: string;
    odName: string;
    documentId: string;
    sectionKey?: string;
    operation: 'insert' | 'delete' | 'replace';
    position: number;
    content?: string;
    length?: number;
    timestamp: number;
  }) => void;
  onSectionUpdated?: (data: {
    odId: string;
    odName: string;
    sectionKey: string;
    content: Record<string, any>;
    timestamp: number;
  }) => void;

  // Comments & reviews
  onCommentAdded?: (data: {
    commentId: string;
    authorId: string;
    authorName: string;
    body: string;
    sectionKey?: string;
    parentId?: string;
    createdAt: string;
  }) => void;
  onCommentResolved?: (data: {
    commentId: string;
    resolvedById: string;
    resolvedByName: string;
    resolvedAt: string;
  }) => void;
  onReviewSubmitted?: (data: {
    reviewId: string;
    reviewerId: string;
    reviewerName: string;
    status: string;
    feedback?: string;
    submittedAt: string;
  }) => void;

  // Typing indicators
  onTypingStarted?: (data: { odId: string; odName: string; sectionKey?: string }) => void;
  onTypingStopped?: (data: { odId: string; sectionKey?: string }) => void;

  // Activity
  onActivityNew?: (data: {
    odId: string;
    odName: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
    timestamp: string;
  }) => void;
}

export function useBuilderSocket(events?: BuilderSocketEvents) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<{ odId: string; odName: string }[]>([]);

  // Initialize socket connection
  useEffect(() => {
    // Get auth token from cookie
    const getAuthToken = () => {
      if (typeof document === 'undefined') return null;
      // The token should be available via the session cookie
      // For WebSocket, we'll pass it via handshake
      return null; // Using cookie-based auth
    };

    const socket = io(`${SOCKET_URL}/builder`, {
      withCredentials: true,
      auth: {
        token: getAuthToken(),
      },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connected', (data) => {
      events?.onConnected?.(data);
    });

    socket.on('error', (error) => {
      events?.onError?.(error);
    });

    // Workspace events
    socket.on('workspace:joined', (data: { workspaceId: string; members: { odId: string; odName: string }[] }) => {
      setWorkspaceMembers(data.members);
    });

    socket.on('member:joined', (data) => {
      setWorkspaceMembers((prev) => [...prev, data]);
      events?.onMemberJoined?.(data);
    });

    socket.on('member:left', (data) => {
      setWorkspaceMembers((prev) => prev.filter((m) => m.odId !== data.odId));
      events?.onMemberLeft?.(data);
    });

    // Document events
    socket.on('document:joined', (data: { documentId: string; collaborators: CollaboratorPresence[] }) => {
      setCollaborators(data.collaborators);
    });

    socket.on('collaborator:joined', (data) => {
      setCollaborators((prev) => [...prev, data]);
      events?.onCollaboratorJoined?.(data);
    });

    socket.on('collaborator:left', (data) => {
      setCollaborators((prev) => prev.filter((c) => c.odId !== data.odId));
      events?.onCollaboratorLeft?.(data);
    });

    // Cursor & selection
    socket.on('cursor:moved', (data) => {
      setCollaborators((prev) =>
        prev.map((c) => (c.odId === data.odId ? { ...c, cursor: { x: data.x, y: data.y } } : c)),
      );
      events?.onCursorMoved?.(data);
    });

    socket.on('selection:changed', (data) => {
      setCollaborators((prev) =>
        prev.map((c) =>
          c.odId === data.odId
            ? { ...c, selection: { start: data.start, end: data.end, sectionKey: data.sectionKey } }
            : c,
        ),
      );
      events?.onSelectionChanged?.(data);
    });

    // Content updates
    socket.on('content:updated', (data) => {
      events?.onContentUpdated?.(data);
    });

    socket.on('section:updated', (data) => {
      events?.onSectionUpdated?.(data);
    });

    // Comments & reviews
    socket.on('comment:added', (data) => {
      events?.onCommentAdded?.(data);
    });

    socket.on('comment:resolved', (data) => {
      events?.onCommentResolved?.(data);
    });

    socket.on('review:submitted', (data) => {
      events?.onReviewSubmitted?.(data);
    });

    // Typing indicators
    socket.on('typing:started', (data) => {
      events?.onTypingStarted?.(data);
    });

    socket.on('typing:stopped', (data) => {
      events?.onTypingStopped?.(data);
    });

    // Activity
    socket.on('activity:new', (data) => {
      events?.onActivityNew?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Workspace actions
  const joinWorkspace = useCallback((workspaceId: string) => {
    socketRef.current?.emit('workspace:join', { workspaceId });
  }, []);

  const leaveWorkspace = useCallback((workspaceId: string) => {
    socketRef.current?.emit('workspace:leave', { workspaceId });
  }, []);

  // Document actions
  const joinDocument = useCallback((documentId: string, workspaceId: string) => {
    socketRef.current?.emit('document:join', { documentId, workspaceId });
  }, []);

  const leaveDocument = useCallback((documentId: string) => {
    socketRef.current?.emit('document:leave', { documentId });
  }, []);

  // Cursor & selection
  const moveCursor = useCallback((documentId: string, x: number, y: number) => {
    socketRef.current?.emit('cursor:move', { documentId, x, y });
  }, []);

  const changeSelection = useCallback(
    (documentId: string, start: number, end: number, sectionKey?: string) => {
      socketRef.current?.emit('selection:change', { documentId, start, end, sectionKey });
    },
    [],
  );

  // Content updates
  const updateContent = useCallback(
    (data: {
      documentId: string;
      sectionKey?: string;
      operation: 'insert' | 'delete' | 'replace';
      position: number;
      content?: string;
      length?: number;
    }) => {
      socketRef.current?.emit('content:update', { ...data, timestamp: Date.now() });
    },
    [],
  );

  const updateSection = useCallback(
    (documentId: string, sectionKey: string, content: Record<string, any>) => {
      socketRef.current?.emit('section:update', { documentId, sectionKey, content, timestamp: Date.now() });
    },
    [],
  );

  // Comments
  const addComment = useCallback(
    (data: { documentId: string; commentId: string; body: string; sectionKey?: string; parentId?: string }) => {
      socketRef.current?.emit('comment:add', data);
    },
    [],
  );

  const resolveComment = useCallback((documentId: string, commentId: string) => {
    socketRef.current?.emit('comment:resolve', { documentId, commentId });
  }, []);

  // Reviews
  const submitReview = useCallback(
    (data: { documentId: string; reviewId: string; status: string; feedback?: string }) => {
      socketRef.current?.emit('review:submit', data);
    },
    [],
  );

  // Typing indicators
  const startTyping = useCallback((documentId: string, sectionKey?: string) => {
    socketRef.current?.emit('typing:start', { documentId, sectionKey });
  }, []);

  const stopTyping = useCallback((documentId: string, sectionKey?: string) => {
    socketRef.current?.emit('typing:stop', { documentId, sectionKey });
  }, []);

  // Activity broadcast
  const broadcastActivity = useCallback(
    (data: {
      workspaceId: string;
      action: string;
      entityType: string;
      entityId: string;
      metadata?: Record<string, any>;
    }) => {
      socketRef.current?.emit('activity:broadcast', data);
    },
    [],
  );

  return {
    isConnected,
    collaborators,
    workspaceMembers,
    // Workspace
    joinWorkspace,
    leaveWorkspace,
    // Document
    joinDocument,
    leaveDocument,
    // Cursor & selection
    moveCursor,
    changeSelection,
    // Content
    updateContent,
    updateSection,
    // Comments
    addComment,
    resolveComment,
    // Reviews
    submitReview,
    // Typing
    startTyping,
    stopTyping,
    // Activity
    broadcastActivity,
  };
}

export default useBuilderSocket;
