'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

export type PopupChatTab = 'messages' | 'ai';

interface PopupChatContextValue {
  isOpen: boolean;
  isMinimized: boolean;
  /** userId to open a DM with when popup opens */
  initialUserId: string | null;
  /** Tab to show on the next open; null keeps the last used tab. */
  preferredTab: PopupChatTab | null;
  open: (targetUserId?: string, tab?: PopupChatTab) => void;
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
  const [preferredTab, setPreferredTab] = useState<PopupChatTab | null>(null);

  const open = useCallback((targetUserId?: string, tab?: PopupChatTab) => {
    setInitialUserId(targetUserId ?? null);
    setPreferredTab(tab ?? (targetUserId ? 'messages' : null));
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setInitialUserId(null);
    setPreferredTab(null);
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
    <PopupChatContext.Provider value={{ isOpen, isMinimized, initialUserId, preferredTab, open, close, toggle, minimize, restore }}>
      {children}
    </PopupChatContext.Provider>
  );
}

export function usePopupChat() {
  const ctx = useContext(PopupChatContext);
  if (!ctx) throw new Error('usePopupChat must be used within PopupChatProvider');
  return ctx;
}
