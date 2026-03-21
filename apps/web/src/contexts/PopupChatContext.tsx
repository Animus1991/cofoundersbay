'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

interface PopupChatContextValue {
  isOpen: boolean;
  isMinimized: boolean;
  /** userId to open a DM with when popup opens */
  initialUserId: string | null;
  open: (targetUserId?: string) => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  restore: () => void;
}

const PopupChatContext = createContext<PopupChatContextValue | null>(null);

export function PopupChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [initialUserId, setInitialUserId] = useState<string | null>(null);

  const open = useCallback((targetUserId?: string) => {
    setInitialUserId(targetUserId ?? null);
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setInitialUserId(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setIsMinimized(false);
      return !prev;
    });
  }, []);

  const minimize = useCallback(() => setIsMinimized(true), []);
  const restore  = useCallback(() => setIsMinimized(false), []);

  return (
    <PopupChatContext.Provider value={{ isOpen, isMinimized, initialUserId, open, close, toggle, minimize, restore }}>
      {children}
    </PopupChatContext.Provider>
  );
}

export function usePopupChat() {
  const ctx = useContext(PopupChatContext);
  if (!ctx) throw new Error('usePopupChat must be used within PopupChatProvider');
  return ctx;
}
