'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  /** Storage key for persisting position */
  storageKey?: string;
  /** Initial position if no stored position exists */
  initialPosition?: Position;
  /** Boundary padding from screen edges */
  boundaryPadding?: number;
}

interface UseDraggableReturn {
  position: Position;
  isDragging: boolean;
  dragHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    style: React.CSSProperties;
  };
  resetPosition: () => void;
}

/** Arrow-key step, and the larger step Shift asks for. */
const KEYBOARD_STEP = 10;
const KEYBOARD_STEP_LARGE = 50;

/**
 * Hook to make an element draggable with position persistence
 */
export function useDraggable(options: UseDraggableOptions = {}): UseDraggableReturn {
  const {
    storageKey,
    initialPosition = { x: 0, y: 0 },
    boundaryPadding = 10,
  } = options;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Load saved position on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPosition(parsed);
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [storageKey]);

  // Save position when it changes
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined' && (position.x !== 0 || position.y !== 0)) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(position));
      } catch {
        // Ignore storage errors
      }
    }
  }, [storageKey, position]);

  const constrainPosition = useCallback((x: number, y: number): Position => {
    if (typeof window === 'undefined') return { x, y };
    
    const maxX = window.innerWidth - boundaryPadding - 60; // 60px for element width
    const maxY = window.innerHeight - boundaryPadding - 60; // 60px for element height
    
    return {
      x: Math.max(-maxX + 100, Math.min(maxX - 100, x)),
      y: Math.max(-maxY + 100, Math.min(maxY - 100, y)),
    };
  }, [boundaryPadding]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    const newPos = constrainPosition(
      dragStartRef.current.posX + deltaX,
      dragStartRef.current.posY + deltaY
    );
    
    setPosition(newPos);
  }, [constrainPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  }, [position]);

  const resetPosition = useCallback(() => {
    setPosition(initialPosition);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  }, [initialPosition, storageKey]);

  /**
   * Moves the element with the arrow keys, and returns it home with Home or
   * Escape.
   *
   * The handle this belongs to is rendered with `role="button"` and
   * `tabIndex={0}`, so a keyboard user can already reach it — it simply did
   * nothing once they got there, which is worse than not being focusable at
   * all. Mouse and touch both had a way to move it; this is the third.
   *
   * Shift multiplies the step, the way a keyboard-resizable control usually
   * behaves, and the same `constrainPosition` keeps it on screen.
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
    const move = (dx: number, dy: number) => {
      e.preventDefault();
      setPosition((current) => constrainPosition(current.x + dx, current.y + dy));
    };

    switch (e.key) {
      case 'ArrowLeft': return move(-step, 0);
      case 'ArrowRight': return move(step, 0);
      case 'ArrowUp': return move(0, -step);
      case 'ArrowDown': return move(0, step);
      case 'Home':
      case 'Escape':
        e.preventDefault();
        return resetPosition();
      default:
        return undefined;
    }
  }, [constrainPosition, resetPosition]);

  return {
    position,
    isDragging,
    dragHandleProps: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
      onKeyDown: handleKeyDown,
      style: {
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as const,
        touchAction: 'none' as const,
      },
    },
    resetPosition,
  };
}
