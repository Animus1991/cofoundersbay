'use client';

import * as React from 'react';
import { createContext, useContext, useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

type ToastOptions = {
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string, options?: ToastOptions) => void;
  error: (title: string, description?: string, options?: ToastOptions) => void;
  warning: (title: string, description?: string, options?: ToastOptions) => void;
  info: (title: string, description?: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/** More than this on screen at once is noise; the oldest are dropped. */
const MAX_VISIBLE_TOASTS = 4;

const toastIcons: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

/** Prefix read out before the toast body so the type is not conveyed by colour alone. */
const toastRoleLabel: Record<ToastType, string> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = toastIcons[toast.type];
  const [paused, setPaused] = useState(false);
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  // Auto-dismiss, paused while the pointer or keyboard focus is inside the
  // toast so a user reading it (or reaching its action button) is not cut off.
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration <= 0 || paused) return;
    const timer = setTimeout(() => onRemoveRef.current(), duration);
    return () => clearTimeout(timer);
  }, [toast.duration, paused]);

  return (
    <div
      // Errors and warnings interrupt; success/info wait for a pause.
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
      aria-atomic="true"
      className={cn(
        'pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-lg backdrop-blur-xl animate-slide-in-right',
        toastStyles[toast.type],
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Icon className="icon-md mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">
          <span className="sr-only">{toastRoleLabel[toast.type]}: </span>
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-sm text-muted-foreground">{toast.description}</p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="focus-ring mt-2 rounded-sm text-sm font-medium underline-offset-2 hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Dismiss ${toastRoleLabel[toast.type].toLowerCase()} notification`}
        className="focus-ring rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="icon-sm" aria-hidden="true" />
      </button>
    </div>
  );
}

function ToastPortal({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.body);
  }, []);

  if (!container) return null;

  return createPortal(
    // The live region must exist in the DOM before a toast is inserted into it,
    // otherwise screen readers do not announce the insertion — so this wrapper
    // renders unconditionally, empty, for the life of the app.
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>,
    container,
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    // Monotonic ids — Math.random() collides, and a collision silently drops a
    // toast because React reuses the keyed element.
    idRef.current += 1;
    const id = `toast-${idRef.current}`;
    setToasts((prev) => [...prev, { ...toast, id }].slice(-MAX_VISIBLE_TOASTS));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string, options?: ToastOptions) =>
      addToast({ type: 'success', title, description, ...options }),
    [addToast],
  );

  const error = useCallback(
    (title: string, description?: string, options?: ToastOptions) =>
      addToast({ type: 'error', title, description, ...options }),
    [addToast],
  );

  const warning = useCallback(
    (title: string, description?: string, options?: ToastOptions) =>
      addToast({ type: 'warning', title, description, ...options }),
    [addToast],
  );

  const info = useCallback(
    (title: string, description?: string, options?: ToastOptions) =>
      addToast({ type: 'info', title, description, ...options }),
    [addToast],
  );

  // Memoised: this context sits above the whole tree, so an unstable value
  // re-rendered every consumer on every toast.
  const value = useMemo<ToastContextType>(
    () => ({ toasts, addToast, removeToast, success, error, warning, info }),
    [toasts, addToast, removeToast, success, error, warning, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastPortal toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}
